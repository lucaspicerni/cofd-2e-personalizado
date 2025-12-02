import {
  DiceRollerDialogue
} from "./dialogue-diceRoller.js";
import { MTA } from "./config.js";

export class ImprovisedSpellDialogue extends FormApplication {
  constructor(spell, actor) {
    super(spell, { submitOnChange: true, closeOnSubmit: false });
    console.log("OBJECT", this.object)
    this.actor = actor;
    this.valueChange = {
      dicePool: false
    };

    this.options.title = this.actor.name + (this.object.name === game.i18n.localize('MTA.NewActiveSpell') ? " - " + game.i18n.localize('MTA.ImprovisedSpellcasting') : " - " + this.object.name);
    this.paradoxRolled = false;

    Handlebars.registerHelper('getParadoxSleeperDiceQuality', function (value) {
      if (value === "A few") return "9-again";
      else if (value === "Large group") return "8-again";
      else if (value === "Full crowd") return "Rote quality";
      else return ""
    });

    // CÓDIGOS GPT

    if (!Handlebars.helpers.ptPrimary) {
      Handlebars.registerHelper('ptPrimary', function (raw) {
        const key = String(raw || "").trim().toLowerCase();
        if (key === "potency") return "Potência";
        if (key === "duration") return "Duração";
        return raw;
      });
    }

    if (!Handlebars.helpers.ptDuration) {
      Handlebars.registerHelper('ptDuration', function (raw) {
        if (!raw) return "";
        const s = String(raw).trim();
        if (s.toLowerCase() === "indefinite") return "Indefinida";
        if (s.toLowerCase() === "1 scene/hour") return "1 cena/hora";
        const m = s.match(/^(\d+)\s+([A-Za-z/]+)s?$/i);
        if (!m) return s;
        const n = parseInt(m[1], 10);
        let unit = m[2].toLowerCase().replace(/s$/, "");
        const toPT = (u) => {
          switch (u) {
            case "turn": return n === 1 ? "turno" : "turnos";
            case "day": return n === 1 ? "dia" : "dias";
            case "week": return n === 1 ? "semana" : "semanas";
            case "month": return n === 1 ? "mês" : "meses";
            case "year": return n === 1 ? "ano" : "anos";
            case "scene": return n === 1 ? "cena" : "cenas";
            default: return u;
          }
        };
        return `${n} ${toPT(unit)}`;
      });
    }

    if (!Handlebars.helpers.ptCondDuration) {
      Handlebars.registerHelper('ptCondDuration', function (raw) {
        const key = String(raw || "").trim().toLowerCase();
        const map = new Map([
          ["no condition", "Nenhuma condição"],
          ["improbable condition", "Condição improvável"],
          ["infrequent condition", "Condição incomum"],
          ["common condition", "Condição comum"],
        ]);
        return map.get(key) || raw;
      });
    }

    if (!Handlebars.helpers.ptScale) {
      Handlebars.registerHelper('ptScale', function (raw) {
        if (!raw) return "";
        const str = String(raw).trim();
        const parts = str.split(",");
        if (parts.length < 3) return str;
        const part0 = parts[0].trim();
        const part1 = parts[1].trim();
        const part2 = parts.slice(2).join(",").trim();
        const m0 = part0.match(/^(\d+)\s+Subject(s)?$/i);
        const nSub = m0 ? parseInt(m0[1], 10) : null;
        const pt0 = m0 ? `${nSub} ${nSub === 1 ? "alvo" : "alvos"}` : part0;
        const m1 = part1.match(/^Size\s+(\d+)$/i);
        const pt1 = m1 ? `tamanho ${m1[1]}` : part1;
        const areaMap = {
          "arm's reach": "alcance do braço",
          "small room": "cômodo pequeno",
          "large room": "cômodo grande",
          "single floor": "um andar",
          "small house": "casa pequena",
          "large house": "casa grande",
          "small warehouse": "galpão pequeno",
          "supermarket": "supermercado",
          "shopping mall": "shopping",
          "city block": "quarteirão",
          "small neighborhood": "bairro pequeno"
        };
        const pt2 = areaMap[part2.toLowerCase()] || part2;
        return `${pt0}, ${pt1}, ${pt2}`;
      });
    }

    if (!Handlebars.helpers.ptRange) {
      Handlebars.registerHelper('ptRange', function (raw) {
        const key = String(raw || "").trim().toLowerCase();
        if (key === "self/touch or aimed" || key === "self / touch or aimed" || key === "self/touch (or aimed)") {
          return "Pessoal, toque ou dirigido";
        }
        if (key === "sensory") {
          return "Sensorial";
        }
        if (key === "remote view" || key === "remote-view") {
          return "Visualização remota";
        }
        return raw;
      });
    }

    if (!Handlebars.helpers.ptWitnesses) {
      Handlebars.registerHelper('ptWitnesses', function (raw) {
        const key = String(raw || "").trim();
        switch (key) {
          case "None": return "Nenhuma";
          case "One": return "Uma";
          case "A few": return "Algumas";
          case "Large group": return "Grupo grande";
          case "Full crowd": return "Multidão";
          default: return key;
        }
      });
    }

    if (!Handlebars.helpers.ptCastTime) {
      Handlebars.registerHelper('ptCastTime', function (raw) {
        if (!raw) return "";
        const str = String(raw).trim();
        const parts = str.split(" ");
        const n = parseInt(parts[0], 10);
        if (isNaN(n)) return str;
        const unit = parts.slice(1).join(" ").toLowerCase();
        const toPT = (uni, qty) => {
          if (uni.startsWith("hour")) return qty === 1 ? "hora" : "horas";
          if (uni.startsWith("minute")) return qty === 1 ? "minuto" : "minutos";
          if (uni.startsWith("turn")) return qty === 1 ? "turno" : "turnos";
          return uni;
        };
        return `${n} ${toPT(unit, n)}`;
      });
    }

    // FIM DOS CÓDIGOS GPT

    this.effects = spell.system?.effects;

    // Get Yantras
    const custom_yantras = this.actor.items.contents
      .filter((i) => i.type == "yantra")
      .map((y) => ({ name: y.name, value: y.system.diceBonus, custom: true }));

    this.yantraOptions = [...CONFIG.MTA.yantras, ...custom_yantras];

    // A hacky way to get the rote skill value
    // I did this because I was to lazy to change 
    // and migrate the roteSkill field on spell items
    const skillName = this.object.system.roteSkill;
    if (skillName) {
      const getKeyAndCategory = (traitValue) => {
        for (let category of ["skills_physical", "skills_social", "skills_mental"]) {
          for (let key in CONFIG.MTA[category]) {
            console.log("D", category, key, CONFIG.MTA[category][key])
            if (CONFIG.MTA[category][key] === traitValue) {
              return [category, key];
            }
          }
        }
        return null;
      }

      let sk = getKeyAndCategory(skillName)

      if (sk) {
        console.log("FOUND", sk)

        const value = this.actor.system[sk[0]]?.[sk[1]];
        console.log("ff", value.final)


        if (value || value?.isRote) {
          let roteValue = Math.min(5, value.final);
          if (value.isRote) roteValue++;
          this.yantraOptions.push(
            { name: "mudra", value: roteValue }
          );
        }
      }
    }

    // Shadow Name & Cabal Theme
    let shadowName = this.actor.getSpecialEffect("shadowName");
    let cabalTheme = this.actor.getSpecialEffect("cabalTheme");
    let highSpeech = this.actor.getSpecialEffect("highSpeech");
    let shadowNameValue = 0;

    if (shadowName) shadowNameValue += shadowName.rating;
    if (cabalTheme) shadowNameValue += cabalTheme.rating;

    if (shadowName) {
      this.yantraOptions.push(
        { name: "persona", value: shadowNameValue }
      );
    }

    this.yantraOptions.push(
      { name: "resonance", value: 1 }
    );

    if (highSpeech) {
      this.yantraOptions.push(
        { name: "highSpeech", value: 2 }
      );
    }

    for (const yantra of this.yantraOptions) {
      if (yantra.custom) {
        yantra.localised = yantra.name;
      } else {
        yantra.localised = game.i18n.localize("MTA.YantraEntries." + yantra.name);
      }

    }

    this.originalAddons = foundry.utils.deepClone(spell.system.addons);
    for (const addon of this.originalAddons) {
      addon.active = false;
      addon.stacks = 0;
    }

    this.combinedSpellOptions = this.actor.items.filter(item => item.type === "spell");
  }

  /* -------------------------------------------- */

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["mta-sheet", "dialogue"],
      template: "systems/mta/templates/dialogues/dialogue-improvisedSpell.html",
      width: 840,
      resizable: true
    });
  }

  getData() {
    const data = super.getData();
    //Object.assign(data.object, data.object.system)
    data.object = this.object.system;

    data.yantraOptions = this.yantraOptions;
    data.spellName = this.object.system.description ? this.object.name : null;

    // Define basic values
    data.config = CONFIG.MTA;
    const actorData = this.actor.system;
    const objectData = data.object;
    const conf = CONFIG.MTA.spell_casting;
    data.valueChange = this.valueChange;

    objectData.addons = [];
    for (const addon of this.originalAddons) {
      objectData.addons.push(addon)
    }
    for (const combSpell of objectData.combinedSpells) {
      for (const addon of combSpell.addons) {
        addon.combinedSpell = combSpell.name;
        objectData.addons.push(addon);
      }
    }

    data.combinedSpellOptions = this.combinedSpellOptions;

    const isAnyMage = actorData.characterType === "Mage" || actorData.characterType === "Scelesti" || this.actor.type === "ephemeral";
    const isEphemeral = this.actor.type === "ephemeral";
    if (actorData.characterType === "Scelesti") data.scelestiRank = actorData.scelestiRank;

    const arcanumName = objectData.arcanum;
    const arcanum = actorData.arcana_gross.hasOwnProperty(arcanumName) ? actorData.arcana_gross[arcanumName] : actorData.arcana_subtle[arcanumName];
    const gnosis = isEphemeral ? actorData.eph_physical.power.final : actorData.mage_traits.gnosis.final;

    // Initialise values
    ["bonusDice", "withstandRating", "additionalReach", "yantraBonus", "manaMod"].forEach(val => objectData[val] = objectData[val] ? objectData[val] : 0);
    objectData.paradox.previous_rolls ||= 0;
    objectData.paradox.bonus ||= 0;
    if (objectData.paradox_tenAgain === undefined) objectData.paradox_tenAgain = true;
    if (this.actor.type === "ephemeral") objectData.paradox_roteQuality = true;
    if (objectData.spell_tenAgain === undefined) objectData.spell_tenAgain = true;
    if (!objectData.condition) objectData.condition = "No condition";
    //if(objectData.paradox_tenAgain === undefined) objectData.paradox_tenAgain = true;

    // Calculate base reach & mana cost
    const activeSpells = this.actor.items.filter(item => item.type === "activeSpell" && !item.system.isRelinquishedSafely && !item.system.isRelinquished);
    let activeSpellLimit = actorData.mage_traits.activeSpellMaximum.final;
    if (activeSpells?.length >= activeSpellLimit) data.activeSpellReach = activeSpells.length - activeSpellLimit + 1;

    // Get the smallest difference for combined spells
    let lowestFreeReach = arcanum.final - objectData.level;
    for (const combSpell of objectData.combinedSpells) {
      const curArc = actorData.arcana_gross.hasOwnProperty(combSpell.arcanum) ? actorData.arcana_gross[combSpell.arcanum] : actorData.arcana_subtle[combSpell.arcanum];
      if (curArc.final - combSpell.level < lowestFreeReach) lowestFreeReach = curArc.final - combSpell.level;
    }


    let lowestArcanumRating = arcanum.final;
    for (const combSpell of objectData.combinedSpells) {
      const curArc = actorData.arcana_gross.hasOwnProperty(combSpell.arcanum) ? actorData.arcana_gross[combSpell.arcanum] : actorData.arcana_subtle[combSpell.arcanum];
      if (curArc.final < lowestArcanumRating) lowestArcanumRating = curArc.final;
    }

    objectData.reachFree = isEphemeral ? 99 :
      (isAnyMage ? (objectData.castRote || objectData.castGrimoire || objectData.castRoteOwn) ? 5 - objectData.level + 1 : lowestFreeReach + 1 : 1);



    objectData.reach = objectData.additionalReach + (data.activeSpellReach ? data.activeSpellReach : 0);

    objectData.manaCost = objectData.paradox.mana_spent + objectData.manaMod;

    objectData.willpowerCost = 0;

    // Spell factor and attainment increases to Reach & Mana
    if (objectData.potency.isAdvanced) objectData.reach++;
    if (objectData.attainment_permanence) objectData.manaCost++;
    else if (objectData.duration.isAdvanced) objectData.reach++;
    if (objectData.attainment_everywhere) objectData.manaCost++;
    else if (objectData.scale.isAdvanced) objectData.reach++;
    if (objectData.attainment_timeInABottle) objectData.manaCost++;
    else if (objectData.casting_time.isAdvanced) objectData.reach++;
    if (objectData.range.isAdvanced) objectData.reach++;
    if (objectData.range.value === "Remote View") objectData.reach++;
    if (objectData.duration.value === "Indefinite") {
      objectData.reach++;
      objectData.manaCost++;
    }
    if (!arcanum.isRuling && !objectData.castPraxis && !objectData.castRote && !objectData.castRoteOwn && !objectData.castGrimoire && isAnyMage) objectData.manaCost++;
    if (objectData.attainment_sympatheticRange) objectData.manaCost++;
    if (objectData.attainment_temporalSympathy) objectData.manaCost++;
    if (objectData.condition !== "No condition") objectData.manaCost++;

    if (objectData.isBefouled && !objectData.castRote) {
      if (MTA.scelestiRanks.indexOf(actorData.scelestiRank) >= MTA.scelestiRanks.indexOf("Nasnas")) {
        if (!objectData.castPraxis) objectData.manaCost++;
      }
      else {
        if (objectData.castPraxis) objectData.manaCost++;
        else objectData.manaCost += objectData.level;
      }
    }

    for (const addon of objectData.addons) {
      if (addon.active) {
        if (addon.reachCost) objectData.reach += addon.reachCost;
        if (addon.manaCost) objectData.manaCost += addon.manaCost;
        if (addon.willpowerCost) objectData.willpowerCost += addon.willpowerCost;
      }
      else if (addon.stacks > 0) {
        if (addon.reachCost) objectData.reach += addon.reachCost * addon.stacks;
        if (addon.manaCost) objectData.manaCost += addon.manaCost * addon.stacks;
        if (addon.willpowerCost) objectData.willpowerCost += addon.willpowerCost * addon.stacks;
      }
    }

    // Combined spell mana cost
    if (!objectData.castPraxis) { // all combined spells are praxes
      for (const combSpell of objectData.combinedSpells) {
        const curArc = actorData.arcana_gross.hasOwnProperty(combSpell.arcanum) ? actorData.arcana_gross[combSpell.arcanum] : actorData.arcana_subtle[combSpell.arcanum];
        if (!curArc.isRuling) objectData.manaCost++;
      }
    }

    // Calculate casting time
    data.ritualCastingTime = isAnyMage ? conf.casting_time.standard[
      Math.clamp(Math.floor((gnosis - 1) / 2), 0, conf.casting_time.standard.length - 1)
    ] : "5 hours";

    data.casting_time = [];
    let baseCastingTime = data.ritualCastingTime.split(" ");
    if (objectData.castGrimoire) baseCastingTime[0] *= 2;
    for (let i = 0; i < 6; i++) {
      data.casting_time[i] = baseCastingTime[0] * (i + 1) + " " + (i > 0 ? (baseCastingTime[1].charAt(baseCastingTime[1].length - 1) != "s" ? baseCastingTime[1] + 's' : baseCastingTime[1]) : baseCastingTime[1]);
    }
    if (!objectData.casting_time.value) objectData.casting_time.value = data.casting_time[0];


    // Calculate free spell factors
    let durBonus = 0;
    if (objectData.condition === "Improbable condition") durBonus += 1;
    else if (objectData.condition === "Infrequent condition") durBonus += 2;
    else if (objectData.condition === "Common condition") durBonus += 3;

    let primaryFactor = objectData.primaryFactor.toLowerCase();

    objectData.potency.primaryFactor = primaryFactor === "potency" ? true : false;
    if (isAnyMage) objectData.potency.freeFactor = objectData.potency.primaryFactor ? (objectData.potency.isAdvanced ? conf.potency.advanced[Math.min(lowestArcanumRating - 1, conf.potency.advanced.length - 1)] : conf.potency.standard[Math.min(lowestArcanumRating - 1, conf.potency.standard.length - 1)]) : 0;
    objectData.duration.primaryFactor = primaryFactor === "duration" ? true : false;
    if (isAnyMage) objectData.duration.freeFactor = objectData.duration.primaryFactor ? (objectData.duration.isAdvanced ? conf.duration.advanced[Math.min(lowestArcanumRating - 1 + durBonus, conf.duration.advanced.length - 1)] : conf.duration.standard[Math.min(lowestArcanumRating - 1 + durBonus, conf.duration.standard.length - 1)]) : durBonus ? (objectData.duration.isAdvanced ? conf.duration.advanced[Math.min(durBonus, conf.duration.advanced.length - 1)] : conf.duration.standard[Math.min(durBonus, conf.duration.standard.length - 1)]) : 0;

    // Calculate dice penalties from spell factors
    data.potencyPenalty = this._calculateFactorPenalty("potency", primaryFactor === "potency", lowestArcanumRating, objectData);
    data.durationPenalty = this._calculateFactorPenalty("duration", primaryFactor === "duration", lowestArcanumRating, objectData, durBonus);
    data.scalePenalty = this._calculateFactorPenalty("scale", false, lowestArcanumRating, objectData);
    data.castingTimePenalty = this._calculateCastingTimePenalty(lowestArcanumRating, objectData, data);
    const yantrasAcc = objectData.yantras.reduce((acc, cur) => acc + cur.value, 0);
    data.yantraCount = objectData.yantras.length;

    const effGnosisLevel = Math.clamp(gnosis, 1, CONFIG.MTA.gnosis_levels.length);

    data.yantraMax = isAnyMage ? CONFIG.MTA.gnosis_levels[effGnosisLevel - 1].yantraMax : 0;

    data.combinedSpellCount = objectData.combinedSpells.length;
    data.combinedSpellMax = isAnyMage ? CONFIG.MTA.gnosis_levels[effGnosisLevel - 1].combinedSpellMax : 0;

    // Calculate spellcasting dice pool
    data.yantraBonusFinal = Math.min(5, objectData.yantraBonus + yantrasAcc - data.potencyPenalty - data.durationPenalty - data.scalePenalty);

    objectData.woundPenalty = this.actor.getWoundPenalties();

    // Get lowest arcanum rating for combined spells
    const combinedSpellsPenalty = data.combinedSpellCount * 2;

    objectData.diceBase = isEphemeral ? gnosis + actorData.eph_social.finesse.final :
      (isAnyMage ? gnosis + lowestArcanumRating :
        actorData.willpower.max);

    objectData.spellcastingDice = objectData.diceBase + objectData.bonusDice + data.castingTimePenalty + data.yantraBonusFinal - objectData.woundPenalty - combinedSpellsPenalty;

    if (objectData.spellcastingDice < 1) objectData.chance_die = true;
    else objectData.chance_die = false;

    data.spellImpossible = objectData.spellcastingDice < -5 ? true : false;

    // Calculate paradox dice
    const rF = isAnyMage ? Math.floor((gnosis + 1) / 2) * (objectData.reach - objectData.reachFree) : objectData.reach - objectData.reachFree;
    let paradoxReachBonus = objectData.reach > objectData.reachFree ? rF : 0;
    if (objectData.isBefouled) paradoxReachBonus += Math.floor((gnosis + 1) / 2);
    let paradoxSleeperBonus = objectData.paradox.sleeper_witnesses === "None" ? 0 : 1;
    let paradoxInuredBonus = objectData.isInured ? 2 : 0;
    let paradoxToolPenalty = objectData.paradox.magical_tool_used ? 2 : 0;
    let paradoxPattern = actorData.patternParadox ?? 0;

    objectData.paradox.value = Math.max(0, objectData.paradox.previous_rolls + paradoxReachBonus + paradoxSleeperBonus + paradoxInuredBonus + objectData.paradox.bonus + paradoxPattern - paradoxToolPenalty - objectData.paradox.mana_spent);
    if (objectData.paradox.bonus >= 0) {
      if (objectData.paradox.value < 1 && objectData.paradox.previous_rolls + paradoxReachBonus + paradoxSleeperBonus + paradoxInuredBonus + objectData.paradox.bonus > 0) objectData.paradox.chance_die = true;
      else objectData.paradox.chance_die = false;
    }
    else {
      if (objectData.paradox.value < 1 && objectData.paradox.previous_rolls + paradoxReachBonus + paradoxSleeperBonus + paradoxInuredBonus > 0) objectData.paradox.chance_die = true;
      else objectData.paradox.chance_die = false;
    }

    // Define available Attainments
    data.attainment_conditionalDuration = actorData.arcana_subtle.fate.final >= 2 ? true : false;
    data.attainment_preciseForce = actorData.arcana_gross.forces.final >= 2 ? true : false;
    data.attainment_permanence = (actorData.arcana_gross.matter.final >= 2) && (arcanumName === "matter") ? true : false;
    data.attainment_sympatheticRange = actorData.arcana_gross.space.final >= 2 ? true : false;
    data.attainment_temporalSympathy = actorData.arcana_gross.time.final >= 2 ? true : false;
    data.attainment_everywhere = actorData.arcana_gross.space.final >= 4 ? true : false;
    data.attainment_timeInABottle = actorData.arcana_gross.time.final >= 4 ? true : false;

    // addon display
    data.reachArcanaOpts = { ...{ any: game.i18n.localize('MTA.spell.addons.optionAny') }, ...CONFIG.MTA.arcana_gross, ...CONFIG.MTA.arcana_subtle }
    if (objectData.addons) {
      for (let addonIndex in objectData.addons) {
        objectData.addons[addonIndex].isDisabled = false;

        if (objectData.addons[addonIndex].prereq) {
          if (actorData.arcana_gross[objectData.addons[addonIndex].prereq.key]
            && actorData.arcana_gross[objectData.addons[addonIndex].prereq.key].value < objectData.addons[addonIndex].prereq.dots
          ) {
            objectData.addons[addonIndex].isDisabled = true;
          }
          if (actorData.arcana_subtle[objectData.addons[addonIndex].prereq.key]
            && actorData.arcana_subtle[objectData.addons[addonIndex].prereq.key].value < objectData.addons[addonIndex].prereq.dots
          ) {
            objectData.addons[addonIndex].isDisabled = true;
          }
        }
      }
    }

    return data;
  }

  _saveAsTemplate() {
    const data = this.getData();
    const systemData = foundry.utils.deepClone(data.object);

    const spellData = {
      name: this.object.name,
      img: this.object.img,
      system: systemData
    }

    if (!spellData.img || spellData.img === "icons/svg/item-bag.svg" || spellData.img.startsWith('systems/mta/icons/placeholders')) {
      let img = CONFIG.MTA.placeholders.get(spellData.system.arcanum);
      if (!img) img = CONFIG.MTA.placeholders.get("magic");
      if (img) spellData.img = img;
    }

    if (!spellData.system.description) spellData.system.description = "";

    // Combined spells descriptions and name
    /*     for(const combSpell of spellData.system.combinedSpells) {
          spellData.system.description += " <hr> " + combSpell.description;
          spellData.name += " & " + combSpell.name;
        } */

    spellData.system.addons = this.originalAddons;

    const templateData = foundry.utils.mergeObject(spellData, { type: "spellTemplate" }, { insertKeys: true, overwrite: true, inplace: false, enforceTypes: true });

    this.actor.createEmbeddedDocuments("Item", [templateData]);

    ui.notifications.warn("Template criado em " + this.actor.name);
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.rollParadox').click(ev => {
      const data = this.getData();
      this._rollParadox(data.object);
    });

    html.find('.castSpell').click(ev => {
      const data = this.getData();
      this._castSpell(data.object);
    });

    html.find('.spellTemplate').click(ev => {
      this._saveAsTemplate();
    });
    html.find('.addYantra').change(ev => {
      this._addYantra(ev);
    });

    html.find('.yantraButton').click(ev => {
      this._removeYantra(ev);
    });

    html.find('.addCombinedSpell').change(ev => {
      this._addCombinedSpell(ev);
    });

    html.find('.combinedSpellButton').click(ev => {
      this._removeCombinedSpell(ev);
    });
  }

  _addCombinedSpell(event) {
    event.preventDefault();
    console.log("cspells", event.target.value, event.target, this.object);

    const spell = this.combinedSpellOptions[event.target.value];
    const combinedSpells = this.object.system.combinedSpells || [];

    const addons = [];
    for (const addon of spell.system.addons) {
      addons.push(foundry.utils.deepClone(addon));
    }

    combinedSpells.push({
      name: spell.name,
      description: spell.system?.description,
      arcanum: spell.system?.arcanum,
      isInured: spell.system?.isInured,
      isPraxis: spell.system?.isPraxis,
      isRote: spell.system?.isRote,
      practice: spell.system?.practice,
      level: spell.system?.level,
      primaryFactor: spell.system?.primaryFactor,
      withstand: spell.system?.withstand,
      addons
    });

    if (!spell.system.isPraxis) {
      this.object.system.castPraxis = false;
    }
    this.object.system.castRote = false;
    this.object.system.castGrimoire = false;
    this.object.system.castRoteOwn = false;

    this.render();
  }

  _removeCombinedSpell(event) {
    event.preventDefault();
    console.log("Removing", event.target.dataset, event.target)
    const index = +event.target.dataset.value;
    console.log("INDEX", index)
    const combinedSpells = this.object.system.combinedSpells || [];
    combinedSpells.splice(index, 1);
    this.render();
  }

  _removeYantra(event) {
    event.preventDefault();
    console.log("Removing", event.target.dataset, event.target)
    const index = +event.target.dataset.value;
    console.log("INDEX", index)
    const yantras = this.object.system.yantras || [];
    yantras.splice(index, 1);
    this.render();
  }

  _addYantra(event) {
    event.preventDefault();
    console.log("Yantras", event.target.value, event.target, this.object);

    const yantra = this.yantraOptions[event.target.value];
    const yantras = this.object.system.yantras || [];
    yantras.push({ name: yantra.name, value: yantra.value, localised: yantra.localised });
    this.render();
    /*     const yantras = this.object.system.yantras || [];
        yantras.push({name: 'Tool', value: 1});
        this.render(); */
  }

  async _updateObject(event, formData) {
    event.preventDefault();
    const actorData = this.actor.system;
    const formElement = $(event.target).closest('form');

    console.log("UPDATE", event, formData)

    // 1. Get old data
    let data = this.getData().object;

    const dicePool_old = data.spellcastingDice;
    const reach_old = data.reach;
    const reachFree_old = data.reachFree;
    const mana_old = data.manaCost;
    const willpower_old = data.willpowerCost;
    const paradox_old = data.paradox.value;
    const sleeper_old = data.paradox.sleeper_witnesses;
    const grimoire_old = data.castGrimoire || data.castRoteOwn;
    const isAnyMage = actorData.characterType === "Mage" || actorData.characterType === "Scelesti" || this.actor.type === "ephemeral";
    const gnosis = this.actor.type === "ephemeral" ? actorData.eph_physical.power.final : actorData.mage_traits.gnosis.final;

    // 2. Correct form data
    formData = Object.keys(formData).reduce((a, key) => { a[key.split('.').slice(1).join('.')] = formData[key]; return a; }, {});

    const arcanumName = formData["arcanum"];
    let arcanum = actorData.arcana_gross.hasOwnProperty(arcanumName) ? actorData.arcana_gross[arcanumName].final : actorData.arcana_subtle[arcanumName].final;

    formData["reachFree"] = isAnyMage ? arcanum - formData["level"] + 1 : 1;
    if (formData["castGrimoire"]) {
      formData["casting_time.isAdvanced"] = false;
    }

    if (formData["attainment_permanence"]) formData["duration.isAdvanced"] = true;
    if (formData["attainment_everywhere"]) formData["scale.isAdvanced"] = true;
    if (formData["attainment_timeInABottle"]) formData["casting_time.isAdvanced"] = true;
    if (formData["attainment_sympatheticRange"] || formData["attainment_temporalSympathy"]) formData["range.isAdvanced"] = true;

    ["potency", "duration", "scale", "casting_time", "range"].forEach(factor => {
      //let index = $('select[name ="object.data.'  + factor + '.value"]')[0].selectedIndex;
      let ele = $(formElement).find('select[name ="object.' + factor + '.value"]')[0];
      let index = ele ? ele.selectedIndex : 0;
      let value = undefined;
      const configData = CONFIG.MTA.spell_casting[factor];
      if (formData[factor + '.isAdvanced']) {
        value = index >= configData.advanced.length ? configData.advanced[configData.advanced.length - 1] : configData.advanced[index];
      }
      else if (factor === "casting_time") {
        let castArray = [];

        let baseCastingTime = isAnyMage ? CONFIG.MTA.spell_casting.casting_time.standard[
          Math.clamp(Math.floor((gnosis - 1) / 2), 0, CONFIG.MTA.spell_casting.casting_time.standard.length - 1)
        ] : "5 hours";

        baseCastingTime = baseCastingTime.split(" ");
        if (formData["castGrimoire"]) baseCastingTime[0] *= 2;
        for (let i = 0; i < 6; i++) {
          castArray[i] = baseCastingTime[0] * (i + 1) + " " + (i > 0 ? (baseCastingTime[1].charAt(baseCastingTime[1].length - 1) != "s" ? baseCastingTime[1] + 's' : baseCastingTime[1]) : baseCastingTime[1]);
        }
        value = index >= castArray.length ? castArray[data.casting_time.length - 1] : castArray[index];
      }
      else value = index >= configData.standard.length ? configData.standard[configData.standard.length - 1] : configData.standard[index];
      formData[factor + '.value'] = value;
    });

    if (formData["potency.value"] < formData["withstandRating"] + 1) this.valueChange.potency = true;
    else this.valueChange.potency = false;
    formData["potency.value"] = Math.max(formData["potency.value"], formData["withstandRating"] + 1);

    if (sleeper_old !== formData["paradox.sleeper_witnesses"]) { //Only change dice qualities when values change, so they're not unchangeable
      const sleepers = formData["paradox.sleeper_witnesses"];

      if (sleepers === "One" || sleepers === "None") {
        formData["paradox_eightAgain"] = false;
        formData["paradox_nineAgain"] = false;
        formData["paradox_tenAgain"] = true;
        formData["paradox_roteQuality"] = false;
      }
      else if (sleepers === "A few") {
        formData["paradox_eightAgain"] = false;
        formData["paradox_nineAgain"] = true;
        formData["paradox_tenAgain"] = false;
        formData["paradox_roteQuality"] = false;
      }
      else if (sleepers === "Large group") {
        formData["paradox_eightAgain"] = true;
        formData["paradox_nineAgain"] = false;
        formData["paradox_tenAgain"] = false;
        formData["paradox_roteQuality"] = false;
      }
      else if (sleepers === "Full crowd") {
        formData["paradox_eightAgain"] = true;
        formData["paradox_nineAgain"] = false;
        formData["paradox_tenAgain"] = false;
        formData["paradox_roteQuality"] = true;
      }
    }

    if (formData["paradox.value"] < 1) formData["paradox_tenAgain"] = false;
    else formData["paradox_tenAgain"] = true;

    if (grimoire_old !== (formData["castGrimoire"] || formData["castRoteOwn"])) {
      if (!(formData["castGrimoire"] || formData["castRoteOwn"])) formData["spell_roteQuality"] = false;
      else formData["spell_roteQuality"] = true;
    }

    const expandedFormData = foundry.utils.expandObject(formData, 5);

    // A bit of a hack, but basically transferring the data from object addons onto the form data
    // and also setting object addons to active
    if (expandedFormData.addons) {
      //expandedFormData.addons = Object.values(expandedFormData.addons);
      const newAddons = [];
      for (const index in this.object.system.addons) {
        const addon = this.object.system.addons[index];
        if (expandedFormData.addons[index]) {
          addon.active = expandedFormData.addons[index].active;
          addon.stacks = expandedFormData.addons[index].stacks;
        }
        newAddons.push(addon);
      }
      expandedFormData.addons = newAddons;
    }

    //console.log("DATA2", this.object, data.addons, formData, expandedFormData)


    // 3. Update data with form data
    foundry.utils.mergeObject(this.object.system, expandedFormData, { inplace: true, insertValues: true, insertKeys: true, recursive: true, overwrite: true });

    this.object.system.addons = data.addons;

    // 4. Get dependant data to find differences
    data = this.getData().object;

    if (data.spellcastingDice < 1) this.object.spell_tenAgain = false;
    else this.object.spell_tenAgain = true;

    if (dicePool_old !== data.spellcastingDice) this.valueChange.dicePool = true;
    else this.valueChange.dicePool = false;
    if (reach_old !== data.reach) this.valueChange.reach = true;
    else this.valueChange.reach = false;
    if (reachFree_old !== data.reachFree) this.valueChange.reachFree = true;
    else this.valueChange.reachFree = false;
    if (mana_old !== data.manaCost) this.valueChange.manaCost = true;
    else this.valueChange.manaCost = false;
    if (paradox_old !== data.paradox.value || sleeper_old !== data.paradox.sleeper_witnesses) this.valueChange.paradox = true;
    else this.valueChange.paradox = false;
    if (willpower_old !== data.willpowerCost) this.valueChange.willpowerCost = true;
    else this.valueChange.willpowerCost = false;

    this.render();
  }

  /* Chat and Roll functions */

  /* Rolls the paradox roll separately if the user wishes. */
  async _rollParadox(spell) {
    const gnosis = this.actor.type === "ephemeral" ? this.actor.system.eph_physical.power.final : this.actor.system.mage_traits.gnosis.final;
    if (spell.paradox.value > 0 || spell.paradox.chance_die) {
      //Paradox roll  
      this.paradoxRolled = true;
      DiceRollerDialogue.rollToChat({ dicePool: spell.paradox.value, tenAgain: spell.paradox_tenAgain, nineAgain: spell.paradox_nineAgain, eightAgain: spell.paradox_eightAgain, roteAction: spell.paradox_roteQuality, flavor: game.i18n.localize('MTA.ParadoxRoll') });
    }
    if (spell.isBefouled) {
      DiceRollerDialogue.rollToChat({ dicePool: gnosis, tenAgain: true, nineAgain: false, eightAgain: false, roteAction: false, flavor: "Paradoxo controlado" });
    }
  }

  /* Rolls the spell and sends the result to chat. */
  async _castSpell(spell) {
    const spellData = foundry.utils.deepClone(spell);
    //spell = this.object; // FIXME: Lazy..

    spellData.img = this.object.img;
    spellData.name = this.object.name;
    spellData.id = this.object.id;

    //Use Mana
    const actorData = this.actor.system;
    let manaDiff = actorData.mana.value - spellData.manaCost;
    if (manaDiff >= 0) {
      this.actor.update({ "system.mana.value": actorData.mana.value - spellData.manaCost });
      ui.notifications.warn(`Você gastou Mana! O valor será reduzido automaticamente.`);
    } else {
      ui.notifications.warn("Mana insuficiente!");
      return;
    }
    let willDiff = actorData.willpower.value - spellData.willpowerCost;
    if (willDiff >= 0) this.actor.update({ "system.willpower.value": willDiff });
    else {
      ui.notifications.warn(game.i18n.localize('MTA.spell.errorWillpowerDeficit'));
      return;
    }
    if (spellData.spellcastingDice < -4) {
      ui.notifications.warn("A magia falhou!");
      return;
    }

    // Basic template rendering data
    const token = this.actor.token;
    if (!spellData.img || spellData.img === "icons/svg/item-bag.svg" || spellData.img.startsWith('systems/mta/icons/placeholders')) {
      let img = CONFIG.MTA.placeholders.get(spellData.arcanum);
      if (!img) img = CONFIG.MTA.placeholders.get("magic");
      if (img) spellData.img = img;
    }
    if (!spellData.description) spellData.description = "";

    // Combined spells descriptions and name
    for (const combSpell of spellData.combinedSpells) {
      spellData.description += " <hr> " + combSpell.description;
      spellData.name += " & " + combSpell.name;
    }

    /*     const tokenObj = token.object ? token.object : token; */
    const templateData = {
      item: spellData,
      actor: this.actor,
      /*       tokenId: tokenObj ? (tokenObj.scene ? `${tokenObj.scene.id}.${tokenObj.id}` : `${tokenObj.id}`) : null, */
      isSpell: true,
      spellInstanceId: foundry.utils.randomID(), // Generate a random id to later tie a condition to this spell effect
      data: await this.getChatData(spellData)
    };

    // Render the chat card template
    const template = `systems/mta/templates/chat/item-card.html`;
    const html = await renderTemplate(template, templateData);
    let rolls = templateData.data.rolls.map(a => a.rollReturn.roll);
    const pool = PoolTerm.fromRolls(rolls);
    let roll = Roll.fromTerms([pool]);

    // ===== PT-BR: rótulos curtos para Arcano/Prática no flavor do chat =====
    const ARCANA_PT = {
      death: "Morte",
      fate: "Destino",
      forces: "Força",
      life: "Vida",
      matter: "Matéria",
      mind: "Mente",
      prime: "Primórdio",
      space: "Espaço",
      spirit: "Espírito",
      time: "Tempo",
    };

    const PRACTICE_PT = {
      Compelling: "Impelir",
      Knowing: "Conhecer",
      Unveiling: "Desvelar",
      Ruling: "Reger",
      Shielding: "Resguardar",
      Veiling: "Velar",
      Fraying: "Desfiar",
      Perfecting: "Aperfeiçoar",
      Weaving: "Tecer",
      Patterning: "Padronizar",
      Unraveling: "Rasgar",
      Making: "Fazer",
      Unmaking: "Desfazer",
    };

    const arcanaPt = ARCANA_PT[spellData.arcanum] ?? spellData.arcanum;
    const practicePt = PRACTICE_PT[spellData.practice] ?? spellData.practice;
    // =======================================================================

    // Basic chat message data
    let chatData = {
      user: game.user.id,
      content: html,
      speaker: ChatMessage.getSpeaker({ actor: this.actor, token: this.actor.token }),
      flavor: game.i18n.localize('MTA.SpellcastingLevel') + `${arcanaPt} ${spellData.level} (${practicePt})`,
      sound: CONFIG.sounds.dice,
      roll: roll,
      rolls: [roll]
    };

    // Toggle default roll mode
    let rollMode = game.settings.get("core", "rollMode");
    chatData = ChatMessage.applyRollMode(chatData, rollMode);

    // Create the chat message
    return ChatMessage.create(chatData);
  }

  /* Rolls the spell, and the paradox, if that hasn't been rolled yet. */
  async _rollSpell(spell) {
    let spellHtml, paradoxHtml, paradoxControlHtml;
    let spellReturn = {}, paradoxReturn = {}, paradoxControlReturn = {};
    const gnosis = this.actor.type === "ephemeral" ? this.actor.system.eph_physical.power.final : this.actor.system.mage_traits.gnosis.final;

    //Spell casting roll
    spellHtml = await DiceRollerDialogue.rollToHtml({ dicePool: spell.spellcastingDice, tenAgain: spell.spell_tenAgain, nineAgain: spell.spell_nineAgain, eightAgain: spell.spell_eightAgain, roteAction: spell.spell_roteQuality, exceptionalTarget: spell.castPraxis ? 3 : 5, flavor: "", rollReturn: spellReturn });

    if ((spell.paradox.value > 0 || spell.paradox.chance_die) && !this.paradoxRolled) {
      //Paradox roll  
      paradoxHtml = await DiceRollerDialogue.rollToHtml({ dicePool: spell.paradox.value, tenAgain: spell.paradox_tenAgain, nineAgain: spell.paradox_nineAgain, eightAgain: spell.paradox_eightAgain, roteAction: spell.paradox_roteQuality, flavor: "", rollReturn: paradoxReturn });
    }

    if (spell.isBefouled && !this.paradoxRolled) {
      paradoxControlHtml = await DiceRollerDialogue.rollToHtml({ dicePool: gnosis, tenAgain: true, nineAgain: false, eightAgain: false, roteAction: false, exceptionalTarget: 5, flavor: "", rollReturn: paradoxControlReturn });
    }
    this.paradoxRolled = false;
    let rollTemplate = [];

    rollTemplate.push({
      html: spellHtml,
      title: game.i18n.localize('MTA.Spellcasting'),
      rollReturn: spellReturn
    });
    if (paradoxHtml) rollTemplate.push({
      html: paradoxHtml,
      title: game.i18n.localize('MTA.Paradox'),
      rollReturn: paradoxReturn
    });
    if (paradoxControlHtml) rollTemplate.push({
      html: paradoxControlHtml,
      title: game.i18n.localize('MTA.ControlledParadox'),
      rollReturn: paradoxControlReturn
    });

    return rollTemplate;
  }

  /**
   * Prepare an object of chat data used to display a card for the Item in the chat log
   * @return {Object}               An object of chat data to render
   */
  async getChatData(spell) {
    const data = foundry.utils.duplicate(spell); // FIXME: WTF is this??
    data.data = this.getData();
    let secrets = false;
    if (this.actor) secrets = this.actor.isOwner;
    if (game.user.isGM) secrets = true;

    // Rich text description
    data.description = await TextEditor.enrichHTML(data.description, { secrets: secrets, entities: true });
    data.rolls = await this._rollSpell(spell);
    data.modifiers = [];
    if (spell.castRote) data.modifiers.push("Clássico");
    if (spell.castPraxis) data.modifiers.push("Praxis");
    if (spell.isInured) data.modifiers.push("Resignado");
    if (spell.castRoteOwn) data.modifiers.push("Autoral");
    if (spell.castGrimoire) data.modifiers.push("Grimório");
    if (spell.isBefouled) data.modifiers.push("Contaminado");
    if (spell.yantras) {
      for (const yantra of spell.yantras) {
        data.modifiers.push(yantra.localised);
      }
    }

    // CÓDIGOS GPT

    const H = Handlebars.helpers;
    const pt = {
      duration: v => (H.ptDuration ? H.ptDuration(v) : v),
      scale: v => (H.ptScale ? H.ptScale(v) : v),
      castTime: v => (H.ptCastTime ? H.ptCastTime(v) : v),
      range: v => (H.ptRange ? H.ptRange(v) : v),
      condDur: v => (H.ptCondDuration ? H.ptCondDuration(v) : v)
    };

    data.spellFactors = [
      {
        name: game.i18n.localize('MTA.Potency'),
        value: data.potency.value,
        advanced: data.potency.isAdvanced,
        advString: data.potency.isAdvanced ? "(+2 de Resistência contra dissipação)" : ""
      },
      {
        name: game.i18n.localize('MTA.Duration'),
        value: pt.duration(data.duration.value),
        advanced: data.duration.isAdvanced,
        advString: data.duration.isAdvanced
          ? (data.condition && data.condition !== "No condition" ? "(" + pt.condDur(data.condition) + ")" : "")
          : ""
      },
      {
        name: game.i18n.localize('MTA.Scale'),
        value: pt.scale(data.scale.value),
        advanced: data.scale.isAdvanced,
        advString: ""
      },
      {
        name: game.i18n.localize('MTA.CastingTime'),
        value: pt.castTime(data.casting_time.value),
        advanced: data.casting_time.isAdvanced,
        advString: ""
      },
      {
        name: game.i18n.localize('MTA.Range'),
        value: pt.range(data.range.value),
        advanced: data.range.isAdvanced,
        advString:
          (spell.attainment_sympatheticRange ? "(Alcance simpático)" : "") +
          (spell.attainment_temporalSympathy ? " (Simpatia temporal)" : "")
      }
    ];

    // FIM DOS CÓDIGOS GPT

/*     data.spellFactors = [
      { name: game.i18n.localize('MTA.Potency'), value: data.potency.value, advanced: data.potency.isAdvanced, advString: data.potency.isAdvanced ? "(+2 withstand against dispell)" : "" },
      { name: game.i18n.localize('MTA.Duration'), value: data.duration.value, advanced: data.duration.isAdvanced, advString: data.condition ? (data.condition !== "No condition" ? "(" + data.condition + ")" : "") : "" },
      { name: game.i18n.localize('MTA.Scale'), value: data.scale.value, advanced: data.scale.isAdvanced, advString: "" },
      { name: game.i18n.localize('MTA.CastingTime'), value: data.casting_time.value, advanced: data.casting_time.isAdvanced, advString: "" },
      { name: game.i18n.localize('MTA.Range'), value: data.range.value, advanced: data.range.isAdvanced, advString: "" + (spell.attainment_sympatheticRange ? "[Symp. Range] " : "") + (spell.attainment_temporalSympathy ? "[Temporal Symp.]" : "") }
    ]; */
    if (data.additionalReach) data.spellFactors.push({ name: game.i18n.localize('MTA.ExtraReach'), value: data.additionalReach, advanced: false, advString: "" });
    data.information = [];

    for (const addon of data.data.object.addons) {
      if (addon.active || (addon.stacks && addon.stacks > 0)) {
        // Calculate total costs for stacked addons
        const reachCost = (addon.reachCost || 0) * (addon.stacks || 1);
        const manaCost = (addon.manaCost || 0) * (addon.stacks || 1);
        const willpowerCost = (addon.willpowerCost || 0) * (addon.stacks || 1);

        // Build the name dynamically
        let name = '';
        if (reachCost > 0) name += `+${reachCost} ${game.i18n.localize('MTA.Reach')}`;
        if (manaCost > 0) name += `${name ? ', ' : ''}${manaCost} ${game.i18n.localize('MTA.MageMana')}`;
        if (willpowerCost > 0) name += `${name ? ', ' : ''}${willpowerCost} ${game.i18n.localize('MTA.Willpower')}`;
        if (addon.stacks && addon.stacks > 1) name += ` [x${addon.stacks}]`;

        data.spellFactors.push({
          name: name || game.i18n.localize('MTA.ReachEffects'), // Fallback if no costs are defined
          value: addon.desc
        });
      }
    }


    const yantraBoni = data.data.object.yantras.reduce((acc, y) => acc + y.value, 0);
    const boni = data.data.object.bonusDice + data.data.castingTimePenalty + data.data.object.yantraBonus + yantraBoni;

    const penalties = data.data.potencyPenalty + data.data.durationPenalty + data.data.scalePenalty + data.data.object.woundPenalty;
    data.information.push({ name: game.i18n.localize('MTA.Dice'), value: `${data.data.object.diceBase} (base) + ${boni} (bônus) - ${penalties} (pen.)` });
    data.information.push({ name: game.i18n.localize('MTA.Reaching'), value: `${data.data.object.reach}/${data.data.object.reachFree}` });
    if (data.withstand) data.information.push({ name: game.i18n.localize('MTA.Withstand'), value: data.withstand });
    if (data.paradox.previous_rolls) data.information.push({ name: game.i18n.localize('MTA.ParadoxRollsScene'), value: data.paradox.previous_rolls });
    if (data.data.object.manaCost) data.information.push({ name: game.i18n.localize('MTA.MageMana'), value: data.data.object.manaCost });
    if (data.data.object.willpowerCost) data.information.push({ name: game.i18n.localize('MTA.Willpower'), value: data.data.object.willpowerCost });

    data.effects = this.effects;

    // Item type specific properties
    return data;
  }

  /** Helper Functions */

  /* This function returns the index in the config for a spell factor with which to calculate penalties*/
  _findFactorIndex(factor, objectData) {
    let foundIndex = -1;
    if (!objectData[factor].isAdvanced) {
      foundIndex = CONFIG.MTA.spell_casting[factor].standard.findIndex(element => {
        return element == objectData[factor].value;
      });
    }
    else {
      foundIndex = CONFIG.MTA.spell_casting[factor].advanced.findIndex(element => {
        return element === objectData[factor].value;
      });
    }
    return foundIndex;
  }

  /* This function calculates the dice penalty for a spell factor */
  _calculateFactorPenalty(factor, isPrimary, arcanumRating, objectData, bonus = 0) {
    let foundIndex = this._findFactorIndex(factor, objectData);
    return foundIndex === -1 ? 999 : (isPrimary ?
      Math.max(0, (foundIndex + Math.min(0, -arcanumRating + 1) - bonus)) * 2
      : Math.max(0, (foundIndex - bonus)) * 2);
  }

  /* This function calculates the penalty for casting time, which works slightly differently */
  _calculateCastingTimePenalty(arcanumRating, objectData, data) {
    let foundIndex = -1;
    if (!objectData.casting_time.isAdvanced) {
      foundIndex = data.casting_time.findIndex(element => {
        return element == objectData.casting_time.value;
      });
    }
    else {
      foundIndex = CONFIG.MTA.spell_casting.casting_time.advanced.findIndex(element => {
        return element === objectData.casting_time.value;
      });
    }
    return foundIndex;
  }

}