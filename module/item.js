import {
  DiceRollerDialogue
} from "./dialogue-diceRoller.js";
import {
  ActorMtA
} from "./actor.js";
/**
 * Override and extend the basic :class:`Item` implementation
 */
export class ItemMtA extends Item {

  /* -------------------------------------------- */
  /*	Data Preparation														*/
  /* -------------------------------------------- */

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData(); //TODO: Put this functionality in where the item is initialised to avoid problems. Alternative: isImgInitialised flag
    if (!this.img || this.img === "icons/svg/item-bag.svg" || this.img.startsWith('systems/mta/icons/placeholders')) {

      let img = 'systems/mta/icons/placeholders/item-placeholder.svg';
      let type = this.type;
      if (type === "melee") {
        if (this.system.weaponType === "Unarmed") type = "unarmed";
        else if (this.system.weaponType === "Thrown") type = "thrown";
      }
      else if (type === "tilt") {
        if (this.system.isEnvironmental) type = "environmental";
      }
      else if (this.type === "rite") {
        if (this.system.riteType !== "rite") type = "miracle";
      }
      else if (this.type === "spell" || this.type === "attainment" || this.type === "activeSpell" || this.type === "spellTemplate" || this.type === "spellEffect") {
        type = this.system.arcanum;
      }
      else if (this.type === "facet") {
        if (this.system.giftType === "moon") type = "moonGift";
        else if (this.system.giftType === "shadow") type = "shadowGift";
        else if (this.system.giftType === "wolf") type = "wolfGift";
      }
      else if (this.type === "werewolf_rite") {
        if (this.system.riteType === "Wolf Rite") type = "werewolf_rite";
        else type = "pack_rite";
      }
      else if (this.type === "demonPower") {
        if (this.system.lore) {
          this.img = `systems/mta/icons/placeholders/${this.system.lore.replace(/\s+/g, '')}.svg`;
          return;
        }
      }

      if (this.type === "spellTemplate" || this.type === "spellEffect") {
        this.system.templateName = this.name;
        for (const combSpell of this.system.combinedSpells) {
          //spellData.system.description += " <hr> " + combSpell.description;
          this.system.templateName += " & " + combSpell.name;
        }
      }

      img = CONFIG.MTA.placeholders.get(type);
      if (!img) img = 'systems/mta/icons/placeholders/item-placeholder.svg';

      this.img = img;
    }
  }

  /* -------------------------------------------- */

  getRollTraits() {
    // FIXME: Currently this will only get the default traits if no dice bonus is defined.
    // Not sure if that is good behaviour..

    if (this.system.dicePool && (this.system.dicePool?.attributes?.length > 0 || this.system.dicePool.value)) {
      return { traits: this.system.dicePool.attributes, diceBonus: this.system.dicePool.value };
    }
    const defaultTraits = { // TODO: Move this into Config?
      firearm: ["attributes_physical.dexterity", "skills_physical.firearms"],
      melee: {
        Unarmed: ["attributes_physical.strength", "skills_physical.brawl"],
        Thrown: ["attributes_physical.dexterity", "skills_physical.athletics"],
        default: ["attributes_physical.strength", "skills_physical.weaponry"],
      },
      explosive: ["attributes_physical.dexterity", "skills_physical.athletics"],
      influence: ["eph_physical.power", "eph_social.finesse"],
      manifestation: ["eph_physical.power", "eph_social.finesse"],
      vehicle: ["attributes_physical.dexterity", "skills_physical.drive"],
      numen: ["eph_physical.power", "eph_social.finesse"]
    };

    if (this.system.haunt && this.system.rating === 1) {
      defaultTraits.haunt_power = ["sineater_traits.synergy", `haunts.${this.system.haunt}`]
    }

    let traits = [];

    if (this.type in defaultTraits) {
      const typeData = defaultTraits[this.type];
      if (Array.isArray(typeData)) {
        traits = typeData;
      } else if (this.system.weaponType in typeData) {
        traits = typeData[this.system.weaponType];
      } else {
        traits = typeData.default;
      }
    }

    return { traits, diceBonus: 0 };
  }

  isWeapon() {
    return this.type === "firearm" || this.type === "melee" || this.system.isWeapon || this.type === "explosive" || this.type === "combat_dice_pool";
  }

  async showChatCard() {
    const token = this.actor.token;
    const templateData = {
      item: this,
      actor: this.actor,
      tokenId: token ? `${token.object.scene.id}.${token.id}` : null, //token ? `${token.scene.id}.${token.id}` : null,
      isSpell: this.type === "spell",
      data: await this.getChatData()
    };

    // Render the chat card template
    const template = `systems/mta/templates/chat/item-card.html`;
    const html = await renderTemplate(template, templateData);

    // Basic chat message data
    const chatData = {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_STYLES.OTHER,
      content: html,
      speaker: ChatMessage.getSpeaker({ actor: this.actor, token: this.actor.token }),
      flavor: ""
    };

    // Toggle default roll mode
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "blindroll") chatData["blind"] = true;
    ChatMessage.create(chatData);
  }

  /**
   * Rolls the item with the default dice pools, or its custom dice pools if any are defined.
   * @param {*} [target] - The target token for an attack roll.
   * @param {boolean} [quickRoll=false] - If set to true, no dice roller will be shown, and the roll will be executed directly.
   * @param {Object} [options={}] 
   * @param {*} options.actorOverride - Override for the actor used to roll.
   */
  async roll(target, quickRoll = false, { actorOverride, diceRollBonus = 0, exceptionalTarget = 5, additionalFlavor = "" } = {}) {
    // TODO: Combine item description and roll

    if (this.type !== "combat_dice_pool") this.showChatCard();

    const actor = actorOverride ? actorOverride : this.actor;

    if (!actor) {
      ui.notifications.error(`CofD: Um item só pode ser rolado se um Ator o possui!`);
      return;
    }

    if (!target) { // Infer a target from the selected targets
      const targets = game.user.targets;
      target = targets ? targets.values().next().value : undefined;
    }

    let macro;
    if (this.system.dicePool?.macro) {
      macro = game.macros.get(this.system.dicePool.macro);
    }

    await actor.setFlag('mta', 'lastRolledItem', this.id);

    let { traits, diceBonus } = this.getRollTraits();

    let ignoreUnskilled = this.system.dicePool.ignoreUnskilled;

    if (actor.type === "ephemeral" && this.type === "haunt_power") {
      traits = ["eph_physical.power", "rank", `haunts.${this.system.haunt}`];
    }

    if (!traits.length && !diceBonus && this.type !== "combat_dice_pool" && this.type !== "general_dice_pool") {
      if (macro) macro.execute({ actor: actor, token: actor.token ?? actor.getActiveTokens[0], item: this });
      return;
    }

    let { dicePool, flavor, specialties } = actor.assembleDicePool({ traits, diceBonus, ignoreUnskilled });
    if (!flavor) flavor = "Teste de habilidade";

    let extended = false,
      defense = 0;

    if (this.system.diceBonus) {
      dicePool += this.system.diceBonus;
      flavor += this.system.diceBonus >= 0 ? ' (+' : ' (';
      flavor += this.system.diceBonus + ' bônus do equipamento)';
    }

    dicePool += diceRollBonus;

    if (this.type === "combat_dice_pool" || this.type === "general_dice_pool") {
      dicePool = +this.system.value;
    }
    console.log("SORRY WAT", dicePool)

    if (this.system.dicePool?.extended) {
      extended = true;
    }

    const damageRoll = this.isWeapon();
    if (damageRoll) {
      if (target?.actor?.system.derivedTraits) { // Remove target defense
        const def = target.actor.system.derivedTraits.defense;
        defense = (def.final ? def.final : def.value);
      }
      if (target) {
        flavor += " contra " + target.name;
      }
    }

    if (this.type === "explosive") { // Create measured templates for explosives
      const distance = this.system.blastArea > 0 ? this.system.blastArea : 1;
      const pos = target ? { x: target.center.x, y: target.center.y } : canvas.scene._viewPosition; // Default is middle of the screen

      const getSurroundingTokens = (origin, distance = 1) => {
        return canvas.scene.tokens.filter(t => canvas.grid.measureDistance(origin, t, { gridSpaces: true }) <= distance);
      }

      let templateData = {
        t: "circle",
        user: game.user._id,
        direction: 0,
        x: pos.x,
        y: pos.y,
        flags: {
          world: {
            measuredTemplate: true,
          },
        },
      };
      // Bashing
      canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{ ...templateData, distance: distance * 2, fillColor: game.settings.get("mta", "tokenHealthColorBashing") }])
      // Lethal
      canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{ ...templateData, distance, fillColor: game.settings.get("mta", "tokenHealthColorLethal") }])

      const rollDiceAndCalculateDamage = async (tokensAffected, damageType) => {
        let acc = '';

        for (const cur of tokensAffected) {
          const roll = await DiceRollerDialogue._roll(this.system.force);
          const damage = roll.total > 0 ? this.system.damage * 2 : this.system.damage;
          acc += `<li>@UUID[${cur.uuid}]{${cur.name}}: ${damage} de dano ${damageType} (Força: ${roll.total} successos)</li>`;
        }

        return acc;
      };

      const surr_aggravated = getSurroundingTokens(pos, 1);
      const string_aggr = await rollDiceAndCalculateDamage(surr_aggravated, 'aggravated');

      /*       surr_aggravated.reduce((acc, cur) => {
              const roll = DiceRollerDialogue._roll(this.system.force);
              const damage = roll.total > 0 ? this.system.damage*2 : this.system.damage;
              return acc + `<li>@UUID[${cur.uuid}]{${cur.name}}: ${damage} aggravated damage (Force: ${roll.total} successes)</li>`
            }, ''); */

      const surr_lethal = getSurroundingTokens(pos, distance).filter(t => !surr_aggravated.includes(t));
      const string_lethal = await rollDiceAndCalculateDamage(surr_lethal, 'lethal');
      /*       const string_lethal = await surr_lethal.reduce(async (acc, cur) => {
              const roll = await DiceRollerDialogue._roll(this.system.force);
              const damage = roll.total > 0 ? this.system.damage*2 : this.system.damage;
              return acc + `<li>@UUID[${cur.uuid}]{${cur.name}}: ${damage} lethal damage (Force: ${roll.total} successes)</li>`
            }, ''); */


      const surr_bashing = getSurroundingTokens(pos, distance * 2).filter(t => !surr_lethal.includes(t) && !surr_aggravated.includes(t));
      const string_bashing = await rollDiceAndCalculateDamage(surr_bashing, 'bashing');
      /*       const string_bashing = await surr_bashing.reduce(async (acc, cur) => {
              const roll = await DiceRollerDialogue._roll(this.system.force);
              const damage = roll.total > 0 ? this.system.damage*2 : this.system.damage;
              return acc + `<li>@UUID[${cur.uuid}]{${cur.name}}: ${damage} bashing damage (Force: ${roll.total} successes)</li>`
            }, ''); */

      ChatMessage.create({
        content: `<ul>
          ${string_aggr + string_lethal + string_bashing}
        </ul>`,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
      });
    }

    const ballistic = target ? target.actor?.system.derivedTraits.ballistic.final : 0;
    const armor = target ? target.actor?.system.derivedTraits.armor.final : 0;
    let applyDefense = this.type === "melee" || this.type === "explosive" || (this.type === "firearm" && target?.actor?.type === "ephemeral") || this.system.applyDefense;

    flavor += " " + additionalFlavor;

    if (quickRoll) {
      if (!damageRoll) {
        return DiceRollerDialogue.rollToChat({
          dicePool,
          flavor,
          title: this.name + " - " + flavor,
          actorOverride: actor,
          macro,
          actor: actor,
          comment: this.system.dicePool?.comment,
          exceptionalTarget
        });
      }
      else {
        return DiceRollerDialogue.rollWithDamage({
          dicePool,
          flavor,
          title: this.name + " - " + flavor,
          itemName: this.name,
          itemImg: this.img,
          itemDescr: this.system.description,
          itemRef: this,
          weaponDamage: +this.system.damage,
          armorPiercing: this.system.penetration,
          spendAmmo: this.type === "firearm",
          actorOverride: actor,
          macro,
          actor: actor,
          comment: this.system.dicePool?.comment,
          noSuccessesToDamage: this.type !== "explosive",
          target,
          defense,
          applyDefense,
          ignoreBallistic: this.type !== "firearm",
          armor,
          ballistic,
          exceptionalTarget
        });
      }

    }
    else {
      let diceRoller = new DiceRollerDialogue({
        dicePool,
        extended,
        flavor,
        title: this.name + " - " + flavor,
        damageRoll,
        itemName: this.name,
        itemImg: this.img,
        itemDescr: this.system.description,
        itemRef: this,
        weaponDamage: +this.system.damage,
        armorPiercing: this.system.penetration,
        spendAmmo: this.type === "firearm",
        actorOverride: actor,
        macro,
        actor: actor,
        comment: this.system.dicePool?.comment,
        noSuccessesToDamage: this.type === "explosive" || this.system.noSuccessesToDamage,
        target,
        defense,
        applyDefense,
        ignoreBallistic: this.type !== "firearm",
        armor,
        ballistic,
        exceptionalTarget,
        specialties
      });
      diceRoller.render(true);
    }

  }




  /**
   * Prepare an object of chat data used to display a card for the Item in the chat log
   * @return {Object}               An object of chat data to render
   */
  async getChatData() {
    let secrets = this.isOwner;
    if (game.user.isGM) secrets = true;
    //enrichHTML(content, secrets, entities, links, rolls, rollData) → {string}

    const data = {
      description: await TextEditor.enrichHTML(this.system.description, { secrets: secrets, entities: true })
    }

    return data;
  }

  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */

  static chatListeners(html) {
    html.on('click', '.button', this._onChatCardAction.bind(this));
    html.on('click', '.item-name', this._onChatCardToggleContent.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Handle execution of a chat card action via a click event on one of the card buttons
   * @param {Event} event       The originating click event
   * @returns {Promise}         A promise which resolves once the handler workflow is complete
   * @private
   */
  static async _onChatCardAction(event) {
    event.preventDefault();

    // Extract card data
    const button = event.currentTarget;
    button.disabled = true;

    const card = button.closest(".chat-card");
    if (!card) return;
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const action = button.dataset.action;

    // --- normalizadores PT->EN (somente strings do card) ---
    const _normDuration = (s) => {
      if (!s) return s;
      const str = String(s).trim().toLowerCase();
      if (str === "indefinida") return "Indefinite";
      if (str === "1 cena/hora" || str === "1 cena / hora") return "1 scene/hour";
      const m = str.match(/^(\d+)\s+(turno|turnos|cena|cenas|dia|dias|semana|semanas|mês|meses|mes|ano|anos)$/);
      if (!m) return s;
      const n = parseInt(m[1], 10);
      const unitMap = {
        "turno": "turn", "turnos": "turns",
        "cena": "scene", "cenas": "scenes",
        "dia": "day", "dias": "days",
        "semana": "week", "semanas": "weeks",
        "mês": "month", "meses": "months", "mes": "month",
        "ano": "year", "anos": "years"
      };
      return `${n} ${unitMap[m[2]] || m[2]}`;
    };

    function _normScale(s) {
      if (!s) return s;
      const parts = String(s).trim().split(",").map(p => p.trim());
      if (parts.length < 3) return s;
      let [p0, p1, ...rest] = parts;
      const p2 = rest.join(",").trim();
      let en0 = p0;
      const m0 = p0.toLowerCase().match(/^(\d+)\s+alvo(s)?$/);
      if (m0) {
        const n = parseInt(m0[1], 10);
        en0 = `${n} ${n === 1 ? "Subject" : "Subjects"}`;
      } else {
        en0 = p0.replace(/\bsubject(s)?\b/i, (m, pl) => pl ? "Subjects" : "Subject");
      }
      let en1 = p1;
      const m1 = p1.toLowerCase().match(/^tamanho\s+(\d+)$/);
      if (m1) {
        en1 = `Size ${m1[1]}`;
      } else {
        en1 = p1.replace(/\bsize\b/i, "Size");
      }
      // área PT -> EN
      const areaPTtoEN = {
        "alcance do braço": "Arm's reach",
        "cômodo pequeno": "Small room",
        "comodo pequeno": "Small room",
        "cômodo grande": "Large room",
        "comodo grande": "Large room",
        "um andar": "Single floor",
        "casa pequena": "Small house",
        "casa grande": "Large house",
        "galpão pequeno": "Small warehouse",
        "galpao pequeno": "Small warehouse",
        "supermercado": "Supermarket",
        "shopping": "Shopping mall",
        "quarteirão": "City block",
        "quarteirao": "City block",
        "bairro pequeno": "Small neighborhood"
      };
      let en2 = areaPTtoEN[p2.toLowerCase()] || p2;
      en2 = en2.charAt(0).toUpperCase() + en2.slice(1);
      return `${en0}, ${en1}, ${en2}`;
    };

    if (action === "addActiveSpell") {
      // Validate permission to proceed with the roll
      if (!(game.user.isGM || message.isAuthor)) return;

      // Get the Actor from a synthetic Token
      const actor = this._getChatCardActor(card.dataset.tokenId, card.dataset.actorId);
      if (!actor) return;

      //Get spell data
      let description = $(card).find(".card-description");
      description = description[0].innerHTML;

      let spellName = $(card).find(".item-name");
      spellName = spellName[0].innerText;

      //let image = $(card).find(".item-img");
      //image = image[0].src;
      let image = card.dataset.img;

      let spellFactorsArray = $(card).find(".spell-factors > li");
      spellFactorsArray = $.makeArray(spellFactorsArray);
      spellFactorsArray = spellFactorsArray.map(ele => {
        let text = ele.innerText;
        let advanced = ele.dataset.advanced === "true";
        let splitText = text.split(":", 2);

        return [splitText[0], splitText[1], advanced];
      });
      let spellFactors = {};
      for (let i = 0; i < spellFactorsArray.length; i++) {
        spellFactors[spellFactorsArray[i][0]] = { value: spellFactorsArray[i][1].trim(), isAdvanced: spellFactorsArray[i][2] };
      }

      // --- ALIAS MAP: normaliza rótulos PT -> EN para chaves estáveis ---
      // --- CÓDIGO GPT ---
      {
        const _safeMap = (entries) =>
          new Map(
            (entries || []).filter(
              (e) => Array.isArray(e) && e.length === 2 && e[0] != null && e[1] != null
            )
          );

        const alias = _safeMap([
          ["potência", "Potency"],
          ["potencia", "Potency"],
          ["potency", "Potency"],
          ["duração", "Duration"],
          ["duracao", "Duration"],
          ["duration", "Duration"],
          ["escala", "Scale"],
          ["scale", "Scale"]
          ["alcance", "Range"],
          ["tempo de conjuração", "Casting Time"],
          ["tempo de conjuracao", "Casting Time"],
          ["casting time", "Casting Time"],
          ["elevação", "Reach"],
          ["elevacao", "Reach"],
          ["força de vontade", "Willpower"],
          ["forca de vontade", "Willpower"]
        ]);
        
        const normalizeLabel = (label) => {
          if (!label) return label;
          const k = String(label).trim().toLowerCase();
          return alias.get(k) || label;
        };

        const normalized = {};
        for (const [rawKey, val] of Object.entries(spellFactors)) {
          const en = normalizeLabel(rawKey);
          normalized[en] = val;
        }
        spellFactors = normalized;
      }

      const _normDuration = (s) => {
        const str = String(s || "").trim().toLowerCase();
        if (str === "indefinida") return "Indefinite";
        if (str === "1 cena/hora") return "1 scene/hour";
        const m = str.match(/^(\d+)\s+(turno|turnos|cena|cenas|dia|dias|semana|semanas|mês|meses|ano|anos)$/);
        if (!m) return s;
        const n = Number(m[1]);
        const unitMap = {
          "turno": "turn", "turnos": "turns",
          "cena": "scene", "cenas": "scenes",
          "dia": "day", "dias": "days",
          "semana": "week", "semanas": "weeks",
          "mês": "month", "meses": "months",
          "ano": "year", "anos": "years"
        };
        const unitEn = unitMap[m[2]] || m[2];
        return `${n} ${unitEn}`;
      };

      const _normCastTime = (s) => {
        const str = String(s || "").trim().toLowerCase();
        const m = str.match(/^(\d+)\s+(minuto|minutos|hora|horas|turno|turnos)$/);
        if (!m) return s;
        const n = Number(m[1]);
        const unitMap = {
          "minuto": "minute", "minutos": "minutes",
          "hora": "hour", "horas": "hours",
          "turno": "turn", "turnos": "turns"
        };
        return `${n} ${unitMap[m[2]] || m[2]}`;
      };

      function _normScale(s) {
        if (!s) return s;
        const parts = String(s).trim().split(",").map(p => p.trim());
        if (parts.length < 3) return s;
        let [p0, p1, ...rest] = parts;
        const p2 = rest.join(",").trim();
        let en0 = p0;
        const m0 = p0.toLowerCase().match(/^(\d+)\s+alvo(s)?$/);
        if (m0) {
          const n = parseInt(m0[1], 10);
          en0 = `${n} ${n === 1 ? "Subject" : "Subjects"}`;
        } else {
          en0 = p0.replace(/\bsubject(s)?\b/i, (m, pl) => pl ? "Subjects" : "Subject");
        }
        let en1 = p1;
        const m1 = p1.toLowerCase().match(/^tamanho\s+(\d+)$/);
        if (m1) {
          en1 = `Size ${m1[1]}`;
        } else {
          en1 = p1.replace(/\bsize\b/i, "Size");
        }
        const areaMapInv = {
        "alcance do braço": "Arm's reach",
        "cômodo pequeno": "Small room",
        "comodo pequeno": "Small room",
        "cômodo grande": "Large room",
        "comodo grande": "Large room",
        "um andar": "Single floor",
        "casa pequena": "Small house",
        "casa grande": "Large house",
        "galpão pequeno": "Small warehouse",
        "galpao pequeno": "Small warehouse",
        "supermercado": "Supermarket",
        "shopping": "Shopping mall",
        "quarteirão": "City block",
        "quarteirao": "City block",
        "bairro pequeno": "Small neighborhood"
        };
        let en2 = areaMapInv[parts[2]] || parts[2];
        en2 = en2.charAt(0).toUpperCase() + en2.slice(1);
        return `${en0}, ${en1}, ${en2}`;
      };

      const _normRange = (s) => {
        const key = String(s || "").trim().toLowerCase();
        const mapInv = new Map([
          ["pessoal, toque ou dirigido", "Self/touch or Aimed"],
          ["sensorial", "Sensory"],
          ["visualização remota", "Remote View"]
        ]);
        return mapInv.get(key) || s;
      };

      if (spellFactors.Duration) spellFactors.Duration.value = _normDuration(spellFactors.Duration.value);
      if (spellFactors.Scale) spellFactors.Scale.value = _normScale(spellFactors.Scale.value);
      if (spellFactors["CastingTime"]) spellFactors["CastingTime"].value = _normCastTime(spellFactors["CastingTime"].value);
      if (spellFactors["Casting Time"]) spellFactors["Casting Time"].value = _normCastTime(spellFactors["Casting Time"].value);
      if (spellFactors.Range) spellFactors.Range.value = _normRange(spellFactors.Range.value);

      // --- FIM NORMALIZAÇÃO DE VALORES ---

      //Special handling for conditional duration, and advanced potency
      let durationSplit = spellFactors.Duration.value.split("(", 2);
      spellFactors.Duration.value = durationSplit[0];
      if (durationSplit[1]) spellFactors.Duration.condition = durationSplit[1].split(")", 1)[0];
      spellFactors.Potency.value = spellFactors.Potency.value.split("(", 1)[0].trim();
      // PT -> EN nos valores (mantém pipeline interno em EN)
      if (spellFactors?.Duration?.value) spellFactors.Duration.value = _normDuration(spellFactors.Duration.value);
      if (spellFactors?.Scale?.value) spellFactors.Scale.value = _normScale(spellFactors.Scale.value);


      const spellInstanceId = card.dataset.spellinstanceid

      const activeSpellData = {
        name: spellName,
        type: "activeSpell",
        img: image,
        system: {
          potency: spellFactors.Potency,
          duration: spellFactors.Duration,
          scale: spellFactors.Scale,
          arcanum: card.dataset.arcanum,
          level: card.dataset.level,
          practice: card.dataset.practice,
          primaryFactor: card.dataset.primfactor,
          withstand: card.dataset.withstand,
          description: description,
          addons: card.dataset.addons ? JSON.parse(card.dataset.addons) : [],
          spellInstanceId
          //chosenAddons: card.dataset.chosenAddons ? JSON.parse(card.dataset.chosenAddons).map(i => parseInt(i)) : []
        }
      };
      //Add spell to active spells
      //const activeSpellData = foundry.utils.mergeObject(spellData, {type: "activeSpell"},{insertKeys: true,overwrite: true,inplace: false,enforceTypes: true});
      await actor.createEmbeddedDocuments("Item", [activeSpellData]);
      ui.notifications.warn("Feitiço adicionado aos feitiços ativos de " + actor.name);
    }
    else if (action === "addSpellCondition") {
      if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("Por favor selecione um token primeiro.");
        return;
      }

      const selectedToken = canvas.tokens.controlled[0];
      const selectedActor = selectedToken.actor;

      if (!selectedActor) {
        ui.notifications.error("O token selecionado não possui um Ator.");
        return;
      }

      // Get the Actor from a synthetic Token
      const actor = this._getChatCardActor(card.dataset.tokenId, card.dataset.actorId);
      if (!actor) return;

      //Get spell data
      let description = $(card).find(".card-description");
      description = description[0].innerHTML;

      let spellName = $(card).find(".item-name");
      spellName = spellName[0].innerText;

      //let image = $(card).find(".item-img");
      //image = image[0].src;
      let image = card.dataset.img;

      let spellFactorsArray = $(card).find(".spell-factors > li");
      spellFactorsArray = $.makeArray(spellFactorsArray);
      spellFactorsArray = spellFactorsArray.map(ele => {
        let text = ele.innerText;
        let advanced = ele.dataset.advanced === "true";
        let splitText = text.split(":", 2);

        return [splitText[0], splitText[1], advanced];
      });
      let spellFactors = {};
      for (let i = 0; i < spellFactorsArray.length; i++) {
        spellFactors[spellFactorsArray[i][0]] = { value: spellFactorsArray[i][1].trim(), isAdvanced: spellFactorsArray[i][2] };
      }

      // --- ALIAS MAP: normaliza rótulos PT -> EN para chaves estáveis ---
      // --- CÓDIGO GPT ---
      {
        const _safeMap = (entries) =>
          new Map(
            (entries || []).filter(
              (e) => Array.isArray(e) && e.length === 2 && e[0] != null && e[1] != null
            )
          );

        const alias = _safeMap([
          ["potência", "Potency"],
          ["potencia", "Potency"],
          ["potency", "Potency"],
          ["duração", "Duration"],
          ["duracao", "Duration"],
          ["duration", "Duration"],
          ["escala", "Scale"],
          ["scale", "Scale"]
          ["alcance", "Range"],
          ["tempo de conjuração", "Casting Time"],
          ["tempo de conjuracao", "Casting Time"],
          ["casting time", "Casting Time"],
          ["elevação", "Reach"],
          ["elevacao", "Reach"],
          ["força de vontade", "Willpower"],
          ["forca de vontade", "Willpower"]
        ]);
        
        const normalizeLabel = (label) => {
          if (!label) return label;
          const k = String(label).trim().toLowerCase();
          return alias.get(k) || label;
        };

        const normalized = {};
        for (const [rawKey, val] of Object.entries(spellFactors)) {
          const en = normalizeLabel(rawKey);
          normalized[en] = val;
        }
        spellFactors = normalized;
      }

      const _normDuration = (s) => {
        const str = String(s || "").trim().toLowerCase();
        if (str === "indefinida") return "Indefinite";
        if (str === "1 cena/hora") return "1 scene/hour";
        const m = str.match(/^(\d+)\s+(turno|turnos|cena|cenas|dia|dias|semana|semanas|mês|meses|ano|anos)$/);
        if (!m) return s;
        const n = Number(m[1]);
        const unitMap = {
          "turno": "turn", "turnos": "turns",
          "cena": "scene", "cenas": "scenes",
          "dia": "day", "dias": "days",
          "semana": "week", "semanas": "weeks",
          "mês": "month", "meses": "months",
          "ano": "year", "anos": "years"
        };
        const unitEn = unitMap[m[2]] || m[2];
        return `${n} ${unitEn}`;
      };

      function _normScale(s) {
        if (!s) return s;
        const parts = String(s).trim().split(",").map(p => p.trim());
        if (parts.length < 3) return s;
        let [p0, p1, ...rest] = parts;
        const p2 = rest.join(",").trim();
        let en0 = p0;
        const m0 = p0.toLowerCase().match(/^(\d+)\s+alvo(s)?$/);
        if (m0) {
          const n = parseInt(m0[1], 10);
          en0 = `${n} ${n === 1 ? "Subject" : "Subjects"}`;
        } else {
          en0 = p0.replace(/\bsubject(s)?\b/i, (m, pl) => pl ? "Subjects" : "Subject");
        }
        let en1 = p1;
        const m1 = p1.toLowerCase().match(/^tamanho\s+(\d+)$/);
        if (m1) {
          en1 = `Size ${m1[1]}`;
        } else {
          en1 = p1.replace(/\bsize\b/i, "Size");
        }
        const areaMapInv = {
        "alcance do braço": "Arm's reach",
        "cômodo pequeno": "Small room",
        "comodo pequeno": "Small room",
        "cômodo grande": "Large room",
        "comodo grande": "Large room",
        "um andar": "Single floor",
        "casa pequena": "Small house",
        "casa grande": "Large house",
        "galpão pequeno": "Small warehouse",
        "galpao pequeno": "Small warehouse",
        "supermercado": "Supermarket",
        "shopping": "Shopping mall",
        "quarteirão": "City block",
        "quarteirao": "City block",
        "bairro pequeno": "Small neighborhood"
        };
        let en2 = areaMapInv[parts[2]] || parts[2];
        en2 = en2.charAt(0).toUpperCase() + en2.slice(1);
        return `${en0}, ${en1}, ${en2}`;
      };

      // --- fim do ALIAS MAP ---

      //Special handling for conditional duration, and advanced potency
      let durationSplit = spellFactors.Duration.value.split("(", 2);
      spellFactors.Duration.value = durationSplit[0];
      if (durationSplit[1]) spellFactors.Duration.condition = durationSplit[1].split(")", 1)[0];
      spellFactors.Potency.value = spellFactors.Potency.value.split("(", 1)[0].trim();
      // PT -> EN nos valores (mantém pipeline interno em EN)
      if (spellFactors?.Duration?.value) spellFactors.Duration.value = _normDuration(spellFactors.Duration.value);
      if (spellFactors?.Scale?.value) spellFactors.Scale.value = _normScale(spellFactors.Scale.value);


      const spellInstanceId = card.dataset.spellinstanceid

      const conditionData = {
        name: spellName,
        type: "spellEffect",
        img: image,
        system: {
          ownerTokenId: card.dataset.tokenId,
          ownerActorId: card.dataset.actorId,
          potency: spellFactors.Potency,
          duration: spellFactors.Duration,
          scale: spellFactors.Scale,
          arcanum: card.dataset.arcanum,
          level: card.dataset.level,
          practice: card.dataset.practice,
          primaryFactor: card.dataset.primfactor,
          withstand: card.dataset.withstand,
          description: description,
          addons: card.dataset.addons ? JSON.parse(card.dataset.addons) : [],
          effects: card.dataset.effects ? JSON.parse(card.dataset.effects) : [],
          spellInstanceId
        }
      }

      if (conditionData.system.effects.length) {
        conditionData.system.effectsActive = true;
      }
      await selectedActor.createEmbeddedDocuments("Item", [conditionData]);
      ui.notifications.warn("Efeito de feitiço adicionado à " + selectedActor.name);
    }
    else if (action === "applyDamage") {

      // Get target
      const tokenId = button.dataset.tokenid;
      const actorId = button.dataset.actorid;
      const actor = this._getChatCardActor(tokenId, actorId);
      let damage = +button.dataset.damage;
      let damageBashing = +button.dataset.bashingdamageinflicted;

      if (!actor?.isOwner) {
        ui.notifications.warn("Só pode ser feito pelo narrador ou o proprietário do ator!");
        return;
      }
      console.log(actor.system, button.dataset)


      if (damageBashing) await actor.damage(damageBashing, "bashing");
      if (damage) actor.damage(damage, "lethal");


      console.log("target", actor, tokenId, actorId)
    }
    // Re-enable the button
    button.disabled = false;
  }

  /* -------------------------------------------- */

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor|null}         The Actor entity or null
   * @private
   */
  static _getChatCardActor(tokenKey, actorId) {

    // Case 1 - a synthetic actor from a Token
    if (tokenKey) {
      const [sceneId, tokenId] = tokenKey.split(".");
      const scene = game.scenes.get(sceneId);
      if (!scene) return null;
      const tokenData = scene.getEmbeddedDocument("Token", tokenId);
      if (!tokenData) return null;
      //const token = new Token(tokenData);
      return tokenData.actor;
    }

    // Case 2 - use Actor ID directory
    return game.actors.get(actorId) || null;
  }

  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */
  static _onChatCardToggleContent(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const card = header.closest(".chat-card");
    const content = card.querySelector(".card-description");
    content.style.display = content.style.display === "none" ? "block" : "none";
  }
}
