import {
  DiceRollerDialogue
} from "./dialogue-diceRoller.js";
import {
  ImprovisedSpellDialogue
} from "./dialogue-improvisedSpell.js";
/**
 * Override and extend the basic :class:`Actor` implementation
 */
export class ActorMtA extends Actor {

  /* -------------------------------------------- */
  /*	Data Preparation														*/
  /* -------------------------------------------- */

  /**
   * Augment the basic Actor data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    if (!CONFIG.MTA.supportedActorTypes.includes(this.type))
      return;

    // Get the Actor's data object
    const systemData = this.system;


    // Get special effects
    systemData.specialEffects = [];
    for (let item of this.items) {
      if (item.system.specialEffects && item.system.effectsActive) {
        for (let effect of item.system.specialEffects) {
          systemData.specialEffects.push({
            name: effect,
            rating: item.system.rating
          })
        }
      }
    }

    if (!systemData.derivedTraits) systemData.derivedTraits = {
      size: { value: 0, mod: 0 },
      speed: { value: 0, mod: 0 },
      defense: { value: 0, mod: 0 },
      armor: { value: 0, mod: 0 },
      ballistic: { value: 0, mod: 0 },
      initiativeMod: { value: 0, mod: 0 },
      perception: { value: 0, mod: 0 },
      health: { value: 0, mod: 0 },
      willpower: { value: 0, mod: 0 },
    };

    //Get modifiers from items
    let item_mods = this.items.reduce((acc, item) => {
      if (item.system.equipped) {
        if (item.system.initiativeMod) acc.initiativeMod += item.system.initiativeMod;
        if (item.type === "armor") acc.armor += item.system.rating;
        if (item.type === "armor") acc.ballistic += item.system.ballistic;
        if (item.system.defenseMod) acc.defense += item.system.defenseMod;
        if (item.system.speedMod) acc.speed += item.system.speedMod;
      }
      return acc;
    }, {
      initiativeMod: 0,
      defense: 0,
      speed: 0,
      armor: 0,
      ballistic: 0
    });

    let attributes = [];
    if (this.type === "character") {
      attributes = [
        systemData.attributes_physical,
        systemData.attributes_mental,
        systemData.attributes_social,
        systemData.skills_physical,
        systemData.skills_social,
        systemData.skills_mental,
        systemData.derivedTraits,
        systemData.attributes_physical_dream,
        systemData.attributes_mental_dream,
        systemData.attributes_social_dream,
        systemData.mage_traits,
        systemData.vampire_traits,
        systemData.werewolf_traits,
        systemData.changeling_traits,
        systemData.demon_traits,
        systemData.arcana_subtle,
        systemData.arcana_gross,
        systemData.sineater_traits,
        systemData.generalModifiers
      ];
    }
    else if (this.type === "ephemeral") {
      attributes = [
        systemData.eph_general,
        systemData.eph_physical,
        systemData.eph_mental,
        systemData.eph_social,
        systemData.derivedTraits,
        systemData.generalModifiers,
        systemData.arcana_subtle,
        systemData.arcana_gross,
      ];
    }
    else if (this.type === "simple_antagonist") {
      attributes = [
        systemData.attributes_physical,
        systemData.attributes_mental,
        systemData.attributes_social,
        systemData.derivedTraits,
        systemData.generalModifiers
      ];
    }

    attributes.forEach(attribute => Object.values(attribute).forEach(trait => {
      //if(trait == undefined) console.warn("Null attribute found", attribute, this.name)
      if (trait == undefined) trait = {};
      if (typeof trait == 'number') trait = {}; // Quick fix for a mistake I made for dream stats
      trait.final = trait.value;
      trait.raw = undefined;
      trait.isModified = false;
    }));

    const der = systemData.derivedTraits;

    let derivedTraitBuffs = [];
    let generalTraitBuffs = [];
    let itemBuffs = [];

    //Get effects from items (modifiers to any attribute/skill/etc.)
    for (let i of this.items) {
      if (i.system?.effects && (i.system?.effectsActive || i.system?.equipped)) { // only look at active effects
        if (i.type === "form" && this.system.characterType !== "Werewolf") continue; // Forms only work for werewolves
        itemBuffs = itemBuffs.concat(i.system.effects);
      }
    }

    itemBuffs.filter(e => e.name.split('.')[0] !== "derivedTraits" && e.name.split('.')[0] !== "generalModifiers").sort((a, b) => (b.value < 0) - (a.value < 0) || (!!a.overFive) - (!!b.overFive)).forEach(e => {
      const trait = e.name.split('.').reduce((o, i) => {
        if (o != undefined && o[i] != undefined) return o[i];
        else return undefined;
      }, systemData);
      if (trait != undefined) {
        if (typeof trait == 'number') {
          if (ui?.notifications) ui.notifications.info(`CofD: Este item não suporta o sistema de efeitos no momento: ${e.name}`);
          console.warn("CofD: Este item não suporta o sistema de efeitos no momento. " + e.name);
          return;
        }
        const newVal = (Number.isInteger(trait.raw) ? trait.raw : trait.value) + e.value;
        trait.raw = e.overFive ? newVal : Math.min(newVal, Math.max(trait.value, this.getTraitMaximum()));
        trait.final = Math.clamp(trait.raw, 0, Math.max(trait.value, CONFIG.MTA.traitMaximum));
        trait.isModified = true;
      }
      else {
        if (ui?.notifications) ui.notifications.info(`CofD: Este item não suporta o sistema de efeitos no momento: ${e.name}`);
        console.warn("CofD: Este item não suporta o sistema de efeitos no momento. " + e.name, this.name);
        return;
      }
    });
    derivedTraitBuffs.push(...itemBuffs.filter(e => e.name.split('.')[0] === "derivedTraits"));
    generalTraitBuffs.push(...itemBuffs.filter(e => e.name.split('.')[0] == "generalModifiers"));

    generalTraitBuffs.forEach(e => {
      const trait = e.name.split('.').reduce((o, i) => o[i], systemData);
      trait.raw = Number.isInteger(trait.raw) ? trait.raw + e.value : trait.value + e.value;
      trait.final = trait.raw;
      trait.isModified = true;
    });

    // Some defaults for all characters
    der.size.value = 5;

    // Compute derived traits
    if (this.type === "character") {
      const strength = systemData.attributes_physical.strength.final;
      const dexterity = systemData.attributes_physical.dexterity.final;
      const wits = systemData.attributes_mental.wits.final;
      const composure = systemData.attributes_social.composure.final;
      const stamina = systemData.attributes_physical.stamina.final;
      const resolve = systemData.attributes_mental.resolve.final;

      if (systemData.isDreaming) {
        der.speed.value = 5 + systemData.attributes_physical_dream.power.final + systemData.attributes_social_dream.finesse.final;
        der.defense.value = Math.min(systemData.attributes_physical_dream.power.final, systemData.attributes_social_dream.finesse.final);
        der.initiativeMod.value = systemData.attributes_social_dream.finesse.final + systemData.attributes_mental_dream.resistance.final /* + der.initiativeMod.mod + item_mods.initiativeMod */;

        let newMax = 0;
        if (systemData.characterType === "Changeling") newMax = systemData.clarity.value;
        else newMax = systemData.attributes_mental_dream.resistance.final;

        //  Add Gnosis/Wyrd derived maximum
        if (systemData.characterType === "Mage" || systemData.characterType === "Scelesti") newMax += Math.max(5, systemData.mage_traits.gnosis.final);
        else if (systemData.characterType === "Changeling") newMax += Math.max(5, systemData.changeling_traits.wyrd.final);
        else newMax += 5;
        der.health.value = newMax;
      }
      else {
        let higherOfWitsDexDefense = this.hasSpecialEffect("defenseHigherOfWitsAndDex")
          || (this.hasSpecialEffect("defenseHigherOfWitsAndDexWerewolf") && this.areAnyItemsActive("Urhan", "Urshul"));
        der.speed.value = 5 + strength + dexterity;
        der.defense.value = (higherOfWitsDexDefense ? Math.max(wits, dexterity) : Math.min(wits, dexterity)) + this._getDefenseSkill();
        der.initiativeMod.value = composure + dexterity;
        der.health.value = stamina;
      }
      der.perception.value = composure + wits + this.getClarityBonus();
      der.willpower.value = resolve + composure;
    }
    else if (this.type === "ephemeral") {
      der.speed.value = 5 + systemData.eph_physical.power.final + systemData.eph_social.finesse.final;
      if (this.hasSpecialEffect("defenseUseResistance"))
        der.defense.value = systemData.eph_mental.resistance.final;
      else
        der.defense.value = (systemData.eph_general.rank.final > 1 ? Math.min(systemData.eph_physical.power.final, systemData.eph_social.finesse.final) : Math.max(systemData.eph_physical.power.final, systemData.eph_social.finesse.final))
      der.initiativeMod.value = systemData.eph_social.finesse.final + systemData.eph_mental.resistance.final;
      der.perception.value = systemData.eph_social.finesse.final + systemData.eph_mental.resistance.final;
      der.health.value = systemData.eph_mental.resistance.final;
      der.willpower.value = systemData.eph_general.rank.final <= 5 ? Math.min(systemData.eph_social.finesse.final + systemData.eph_mental.resistance.final, 10) : systemData.eph_social.finesse.final + systemData.eph_mental.resistance.final;
    }
    else if (this.type === "simple_antagonist") {
      const str = systemData.attributes_physical.strength.final;
      const dex = systemData.attributes_physical.dexterity.final;
      const wit = systemData.attributes_mental.wits.final;
      const comp = systemData.attributes_social.composure.final;
      const resolve = systemData.attributes_mental.resolve.final;
      der.speed.value = 5 + str + dex;
      der.defense.value = Math.min(wit, dex);
      der.initiativeMod.value = comp + dex;
      der.health.value = systemData.attributes_physical.stamina.final;
      der.perception.value = comp + wit;
      der.willpower.value = resolve + comp;
    }
    else if (this.type === "brief_nightmare") {
      const all_other_dicepools = systemData.all_other_dicepools;
      const best_dice_pool = systemData.best_dice_pool.value;
      //const worst_dice_pool = systemData.worst_dice_pool.value;
      der.health.value = 2 + best_dice_pool;
      //der.willpower.value = 0;
      der.defense.value = all_other_dicepools;
      der.speed.value = 5 + Math.max(all_other_dicepools, best_dice_pool);
      der.initiativeMod.value = Math.max(all_other_dicepools, best_dice_pool);
      der.perception.value = all_other_dicepools;

      systemData.numDreadPowers = this.getNumDreadPowers();
    }

    //systemData.activeSpellCount = this.items.reduce((acc, cur) => cur.type !== "activeSpell" ? 0 : cur.system.isRelinquishedSafely ? acc + 0 : cur.system.isRelinquished ? acc + 0 : acc + 1, 0);
    // Apply derived trait buffs. Note: item_mods are different from the buffs below - they
    //                                  are stuff like initiative mod, etc. on weapons ...
    der.size.value += der.size.mod;
    der.armor.value += der.armor.mod + item_mods.armor;
    der.ballistic.value += der.ballistic.mod + item_mods.ballistic;
    der.speed.value += der.speed.mod + item_mods.speed;
    der.defense.value += der.defense.mod + item_mods.defense;
    der.initiativeMod.value += der.initiativeMod.mod + item_mods.initiativeMod;
    der.perception.value += der.perception.mod;
    der.health.value += der.health.mod;
    der.willpower.value += der.willpower.mod;

    /*     console.log("WHAT Speed", der.speed.value, der.speed.mod, item_mods.speed)
        console.log("WHAT defense", der.defense.value, der.defense.mod, item_mods.defense)
        console.log("WHAT initiativeMod", der.initiativeMod.value, der.initiativeMod.mod, item_mods.initiativeMod) */

    [systemData.derivedTraits].forEach(attribute => Object.values(attribute).forEach(trait => {
      trait.final = trait.value;
      trait.raw = undefined;
      trait.isModified = false;
    }));

    // Apply derived Traits buffs
    derivedTraitBuffs.forEach(e => {
      const trait = e.name.split('.').reduce((o, i) => o[i], systemData);
      trait.raw = Number.isInteger(trait.raw) ? trait.raw + e.value : trait.value + e.value;
      trait.final = Math.max(trait.raw, 0);
      trait.isModified = true;
    });

    if (!systemData.isDreaming && this.type !== "brief_nightmare") der.health.final += der.size.final;

    // No negative values
    [systemData.derivedTraits].forEach(attribute => Object.values(attribute).forEach(trait => {
      trait.final = Math.max(trait.final, 0);
    }));

    // Set willpower (no need to do a calculate button)
    systemData.willpower.max = der.willpower.final;

    /*     der.size.final = Math.max(0, der.size.final);
        der.speed.final = Math.max(0, der.speed.final);
        der.defense.final = Math.max(0, der.defense.final);
        der.armor.final = Math.max(0, der.armor.final);
        der.ballistic.final = Math.max(0, der.ballistic.final);
        der.initiativeMod.final = Math.max(0, der.initiativeMod.final);
        der.perception.final = Math.max(0, der.perception.final);
     */
    // Get current demon cover
    if (systemData.characterType === "Demon") {
      systemData.currentCover = 0;
      for (let actorItem of this.items) {
        if (actorItem.type == "cover" && actorItem.system.isActive) {
          systemData.currentCover = actorItem.system.rating;
          systemData.currentCoverName = actorItem.name;
          break;
        }
      }
    }

    if (systemData.geistId === this.id) systemData.geistId = undefined;
    if (systemData.sineaterId === this.id) systemData.sineaterId = undefined;

    if (systemData.characterType === "Sin-Eater") {
      const synergyLvl = CONFIG.MTA.synergy_levels[Math.min(9, Math.max(0, systemData.sineater_traits.synergy.final - 1))];
      if (synergyLvl) {
        systemData.synergyRelationship = synergyLvl.relationship;
        systemData.synergyLiminalAura = synergyLvl.liminalAura;
        systemData.synergyTouchstones = synergyLvl.touchstones;
      }
    }

    // Get Sin-eater's Geist
    if (systemData.characterType === "Sin-Eater" && systemData.geistId) {
      systemData.geistActor = game.actors.get(systemData.geistId);
      if (systemData.geistActor) {
        systemData.effectiveRank = Math.min(systemData.sineater_traits.synergy.final, systemData.geistActor.system.eph_general.rank.final);
      }
    }

    if (systemData.mage_traits) {
      // Calculate active spell limits
      if (systemData.characterType === "Mage"
        || systemData.characterType === "Scelesti") {
        systemData.mage_traits.activeSpellMaximum.final += systemData.mage_traits.gnosis.final;
      }
      else if (this.type === "ephemeral") {
        systemData.mage_traits.activeSpellMaximum.final = 99;
      }
      else {
        systemData.mage_traits.activeSpellMaximum.final += 1;
      }
    }


    // Get Geist's Sin-eater
    if (systemData.ephemeralType === "Ghost" && systemData.sineaterId) {
      systemData.sineaterActor = game.actors.get(systemData.sineaterId);
      if (systemData.sineaterActor) {
        systemData.willpower.value = systemData.sineaterActor.system.willpower.value;
        systemData.willpower.max = systemData.sineaterActor.system.willpower.max;
        systemData.essence.value = systemData.sineaterActor.system.plasm.value;
        systemData.essence.max = systemData.sineaterActor.system.plasm.max;
        systemData.haunt_power = systemData.sineaterActor.items.filter(item => item.type === "haunt_power");
        systemData.haunts = {};

        for (const [key, val] of Object.entries(systemData.sineaterActor.system.haunts)) {
          systemData.haunts[key] = {
            value: val.value
          }
        }
      }
    }
  }

  async _preUpdate(changed, options, user) {

    // This happens on the ephemeral entity Geist:
    if (this.system.sineaterActor) { // Changes to the Geist cause an update to the Sin-eater
      // Geist update -> Sin-eater update -> Geist prepareData

      if (changed?.system?.willpower && changed?.system?.essence) {
        const updateData = {};

        if (changed.system.willpower.value !== this.system.sineaterActor.system.willpower.value)
          updateData['system.willpower.value'] = changed.system.willpower.value;

        if (changed.system.willpower.max !== this.system.sineaterActor.system.willpower.max)
          updateData['system.willpower.max'] = changed.system.willpower.max;

        // plasm on the Geist is called essence
        if (changed.system.essence.value !== this.system.sineaterActor.system.plasm.value)
          updateData['system.plasm.value'] = changed.system.essence.value;

        if (changed.system.essence.max !== this.system.sineaterActor.system.plasm.max)
          updateData['system.plasm.max'] = changed.system.essence.max;

        // await the update, so that the values on the sheet don't flicker back and forth
        await this.system.sineaterActor.update(updateData);
      }
    }

    return super._preUpdate(changed, options, user);
  }

  async _onUpdate(data, options, userId) {
    if (this.system.geistActor) { // Updates to the Sin-eater causes the Geist to re-calculate stats and refresh
      this.system.geistActor.prepareData();
      if (this.system.geistActor.sheet) this.system.geistActor.sheet.render();
    }
    return super._onUpdate(data, options, userId);
  }

  /* -------------------------------------------- */
  /*  Socket Listeners and Handlers
  /* -------------------------------------------- */

  /** @override */
  _preCreate(data, user) {
    super._preCreate(data, user);

    const tokenUpdateData = {};
    if (data.prototypeToken?.actorLink === undefined) {
      tokenUpdateData["actorLink"] = true;
    }

    if (!foundry.utils.isEmpty(tokenUpdateData)) this.prototypeToken.updateSource(tokenUpdateData);
  }



  /** @override */
  static async create(data, options = {}) {
    const actor = await super.create(data, options);
    if (actor.type === "character") await actor.createWerewolfForms();

    return actor;
  }

  /**
   * Rolls a set of dice and calculates a result based on the provided traits and bonuses.
   *
   * @param {object} params - The parameters for the roll.
   * @param {string[]} [params.traits=[]] - An array of strings in the format "<trait-group>.<trait>", e.g. ["attributes_physical.strength", "skills_social.persuasion"])..
   * @param {number} [params.diceBonus=0] - A bonus to add to the dice roll.
   * @param {string} [params.rollName="Skill check"] - The name of the roll.
   * @param {string} [params.rollType="dialogue"] - The type of roll, either "dialogue" or "quick".
   *
   * @returns {number} The result of the roll.
   */
  roll({ traits = [], diceBonus = 0, rollName = "Teste de habilidade", rollType = "dialogue", damageRoll = false }) {

    const { dicePool, flavor, specialties } = this.assembleDicePool({ traits, diceBonus });

    switch (rollType) {
      case 'dialogue':
        let title = "";
        title = rollName + ": " + flavor;
        let diceRoller = new DiceRollerDialogue({ dicePool, flavor: title, title, actorOverride: this, specialties });
        diceRoller.render(true);
        break;
      case 'quick':
        DiceRollerDialogue.rollToChat({
          dicePool,
          flavor,
          actorOverride: this
        });
        break;
      default:
        return { flavor, dicePool };
    }
    // TODO: Return result of the roll

  }

  /**
   * Gets the value for a specific trait name.
   * Usage: getTraitValue("attributes_physical.strength")
   */
  getTraitValue(trait) {
    let ret = 0;
    ret = trait.split('.').reduce((o, i) => {
      if (o != undefined && o[i] != undefined) return o[i];
      else return undefined;
    }, this.system);

    if (!Number.isInteger(ret)) {
      if (typeof ret.max == 'number') ret = ret.max; // E.g. Willpower, ..
      else if (typeof ret.final == 'number') ret = ret.final;
      else if (typeof ret.value == 'number') ret = ret.value;
      else {
        ret = 0;
        console.warn("CofD: A roll attribute could not be resolved. " + cur);
      }
    }

    return ret;
  }


  /**
   * Assembles a dice pool from an array of traits into a concrete number,
   * alongside the flavor text describing the assembled dice pool.
   *
   * @param {object} params - The parameters for the roll.
   * @param {string[]} [params.traits=[]] - An array of strings in the format "<trait-group>.<trait>", e.g. ["attributes_physical.strength", "skills_social.persuasion"])..
   * @param {number} [params.diceBonus=0] - A bonus to add to the dice roll.
   * @param {number} [params.ignoreUnskilled=false] - Whether a 0 in a skill should not give a penalty.
   *
   * @returns {object} An object containing a dice pool and a flavor string.
   * @property {number} dicePool - The assembled dice pool as a number.
   * @property {string} flavor - A string representing the contents of the dice pool.
   */
  assembleDicePool({ traits = [], diceBonus = 0, ignoreUnskilled = false }) {
    const systemData = this.system;

    //Get dice pool
    let dicePool = 0;
    let flavor = "";
    let isPhysicalRoll = false;
    let isSocialRoll = false;
    let isMentalRoll = false;
    let specialties = [];

    if (traits.length > 0) {
      // Get dice pool according to the item's dice pool attributes from the actor
      let diceFromTraits = traits ? traits.reduce((acc, cur) => {

        let ret = 0;
        let flv = "";
        ret = cur.split('.').reduce((o, i) => {
          if (o != undefined && o[i] != undefined) return o[i];
          else return undefined;
        }, systemData);

        // Append specialties
        if (this.type === "character" && ret?.specialties && Array.isArray(ret.specialties)) {
          specialties.push(...ret.specialties);
        }

        if (!Number.isInteger(ret)) {
          if (ret && typeof ret.max == 'number') ret = ret.max; // E.g. Willpower, ..
          else if (ret && typeof ret.final == 'number') ret = ret.final;
          else if (ret && typeof ret.value == 'number') ret = ret.value;
          else {
            ret = 0;
            console.warn("CofD: A roll attribute could not be resolved. " + cur);
          }
        }
        if (cur.split('.')[0] === "disciplines_own") flv = cur.split('.').reduce((o, i) => o[i], systemData).label;
        else flv = game.i18n.localize("MTA." + cur);

        // Apply penalty if character has 0 in a skill
        const skillType = cur.split('.')[0];
        if (!ignoreUnskilled && (skillType === "skills_physical" || skillType === "skills_social") && ret <= 0) {
          flv += " (inexperiente)";
          ret -= 1;
        } else if (!ignoreUnskilled && skillType === "skills_mental" && ret <= 0) {
          flv += " (inexperiente)";
          ret -= 3;
        }

        if (skillType === "skills_physical" || skillType === "attributes_physical")
          isPhysicalRoll = true;


        if (skillType === "skills_social" || skillType === "attributes_social")
          isSocialRoll = true;


        if (skillType === "skills_mental" || skillType === "attributes_mental")
          isMentalRoll = true;

        if (flavor) flavor += " + " + flv;
        else flavor = flv;
        return acc + ret;
      }, 0) : 0;
      dicePool += diceFromTraits;
    }
    else flavor = "Teste de habilidade";

    if (diceBonus) {
      dicePool += diceBonus;
      flavor += diceBonus >= 0 ? ' (+' : ' (';
      flavor += diceBonus + ' bonus)';
    }

    const general = this.system.generalModifiers;
    if (general) {
      if (general.allDicePools.final) {
        dicePool += general.allDicePools.final;
        flavor += (general.allDicePools.final >= 0 ? ' (+' : ' (') + general.allDicePools.final + ' em tudo)';
      }

      if (isPhysicalRoll && general.physicalDicePools.final) {
        dicePool += general.physicalDicePools.final;
        flavor += (general.physicalDicePools.final >= 0 ? ' (+' : ' (') + general.physicalDicePools.final + ' físico)';
      }

      if (isSocialRoll && general.socialDicePools.final) {
        dicePool += general.socialDicePools.final;
        flavor += (general.socialDicePools.final >= 0 ? ' (+' : ' (') + general.socialDicePools.final + ' social)';
      }

      if (isMentalRoll && general.mentalDicePools.final) {
        dicePool += general.mentalDicePools.final;
        flavor += (general.mentalDicePools.final >= 0 ? ' (+' : ' (') + general.mentalDicePools.final + ' mental)';
      }
    }

    console.log("AA", isPhysicalRoll, isSocialRoll, isMentalRoll, general.physicalDicePools.final, general.socialDicePools.final, general.mentalDicePools.final)

    let woundPenalty = this.getWoundPenalties();

    if (woundPenalty > 0) {
      dicePool -= woundPenalty;
      flavor += " (Ferimentos: -" + woundPenalty + ")";
    }

    return { dicePool, flavor, specialties };
  }

  async werewolfTransform(form) {
    let updates = [];
    const forms = this.items.filter(item => item.type === "form");

    forms.forEach(f => {
      updates.push({ _id: f._id, 'system.effectsActive': f._id === form.id ? true : false });
    });
    form.roll()
    await this.updateEmbeddedDocuments("Item", updates);
    this.calculateAndSetMaxHealth();
  }

  /**
   * Creates the 5 standard werewolf forms for the actor, and
   * deletes all existing forms.
   */
  async createWerewolfForms() {
    //Add the 5 basic werewolf forms
    const itemData = [
      {
        name: "Hishu",
        type: "form",
        img: "systems/mta/icons/forms/Hishu.svg",
        system: {
          subname: "Human",
          effects: [
            { name: "derivedTraits.perception", value: 1, overFive: true }
          ],
          description_short: "Sheep's Clothing",
          description: "",
          effectsActive: true
        }
      },
      {
        name: "Dalu",
        type: "form",
        img: "systems/mta/icons/forms/Dalu.svg",
        system: {
          subname: "Near-Human",
          effects: [
            { name: "attributes_physical.strength", value: 1, overFive: true },
            { name: "attributes_physical.stamina", value: 1, overFive: true },
            { name: "attributes_social.manipulation", value: -1, overFive: true },
            { name: "derivedTraits.size", value: 1, overFive: true },
            { name: "derivedTraits.perception", value: 2, overFive: true }
          ],
          description_short: "Teeth/Claws +0L\nDefense vs. Firearms\nMild Lunacy\nBadass Motherfucker",
          description: ""
        }
      },
      {
        name: "Gauru",
        type: "form",
        img: "systems/mta/icons/forms/Gauru.svg",
        system: {
          subname: "Wolf-Man",
          effects: [
            { name: "attributes_physical.strength", value: 3, overFive: true },
            { name: "attributes_physical.dexterity", value: 1, overFive: true },
            { name: "attributes_physical.stamina", value: 2, overFive: true },
            { name: "derivedTraits.size", value: 2, overFive: true },
            { name: "derivedTraits.perception", value: 3, overFive: true }
          ],
          description_short: "Teeth/Claws +2L\n(Initiative +3)\nDefense vs. Firearms\nFull Lunacy\nRegeneration\nRage\nPrimal Fear",
          description: ""
        }
      },
      {
        name: "Urshul",
        type: "form",
        img: "systems/mta/icons/forms/Urshul.svg",
        system: {
          subname: "Near-Wolf",
          effects: [
            { name: "attributes_physical.strength", value: 2, overFive: true },
            { name: "attributes_physical.dexterity", value: 2, overFive: true },
            { name: "attributes_physical.stamina", value: 2, overFive: true },
            { name: "attributes_social.manipulation", value: -1, overFive: true },
            { name: "derivedTraits.size", value: 1, overFive: true },
            { name: "derivedTraits.speed", value: 3, overFive: true },
            { name: "derivedTraits.perception", value: 3, overFive: true }
          ],
          description_short: "Teeth +2L/Claws +1L\nDefense vs. Firearms\nModerate Lunacy\nWeaken the Prey",
          description: ""
        }
      },
      {
        name: "Urhan",
        type: "form",
        img: "systems/mta/icons/forms/Urhan.svg",
        system: {
          subname: "Wolf",
          effects: [
            { name: "attributes_physical.dexterity", value: 2, overFive: true },
            { name: "attributes_physical.stamina", value: 1, overFive: true },
            { name: "attributes_social.manipulation", value: -1, overFive: true },
            { name: "derivedTraits.size", value: -1, overFive: true },
            { name: "derivedTraits.speed", value: 3, overFive: true },
            { name: "derivedTraits.perception", value: 4, overFive: true }
          ],
          description_short: "Teeth +1L\nChase Down",
          description: ""
        }
      }
    ];
    let oldForms = this.items.filter(item => item.type === "form").map(item => item.id);
    if (oldForms) await this.deleteEmbeddedDocuments("Item", oldForms);
    await this.createEmbeddedDocuments("Item", itemData);
  }

  //Search for Merit Defensive Combat
  _getDefenseSkill() {
    const systemData = this.system;
    let athleticsSkill = systemData.skills_physical.athletics.final;

    const hasBrawlMerit = this.hasSpecialEffect("defenseBrawl");
    let hasWeaponryMerit = this.hasSpecialEffect("defenseWeaponry");
    if (hasWeaponryMerit) {
      hasWeaponryMerit = this.items.some(ele => {
        return ele.system?.equipped
          && ele.type === "melee"
          && ele.system?.weaponType !== "Unarmed";
      });
    }
    const defenseAthletics = this.hasSpecialEffect("defenseAthletics");

    // lowerDefense desligado = mantém exatamente o comportamento atual
    if (!game.settings.get("mta", "lowerDefense")) {
      const brawlSkill = hasBrawlMerit ? systemData.skills_physical.brawl.final : 0;
      const weaponrySkill = hasWeaponryMerit ? systemData.skills_physical.weaponry.final : 0;
      return Math.max(brawlSkill, weaponrySkill, athleticsSkill);
    }

    // lowerDefense ligado = aplica a regra nova
    athleticsSkill = defenseAthletics
      ? Math.ceil(systemData.skills_physical.athletics.value / 2)
      : 0;

    const hasNonUnarmedWieldedWeapon = this.items.some(item => {
      if (!item.system?.equipped) return false;
      if (!item.isWeapon()) return false;
      return !(item.type === "melee" && item.system?.weaponType === "Unarmed");
    });

    const brawlSkill = (hasBrawlMerit && !hasNonUnarmedWieldedWeapon)
      ? Math.ceil(systemData.skills_physical.brawl.value / 2)
      : 0;

    const weaponrySkill = hasWeaponryMerit
      ? Math.ceil(systemData.skills_physical.weaponry.value / 2)
      : 0;

    return Math.max(brawlSkill, weaponrySkill, athleticsSkill);
  }

  /** Returns the attribute limit of the character (e.g. Gnosis for mages) **/
  getTraitMaximum() {
    const data = this.system;
    if (this.type !== "character")
      return 999;

    const powerStats = { //TODO: Put in config
      Mortal: 5,
      Sleepwalker: 5,
      Mage: data.mage_traits.gnosis?.final,
      Scelesti: data.mage_traits.gnosis?.final,
      Proximi: 5,
      Vampire: data.vampire_traits.bloodPotency?.final,
      Ghoul: data.vampire_traits.bloodPotency?.final,
      Changeling: data.changeling_traits.wyrd?.final,
      Werewolf: data.werewolf_traits.primalUrge?.final,
      Demon: data.demon_traits.primum?.final,
      "Sin-Eater": data.sineater_traits.synergy?.final,
    };
    if (!powerStats[data.characterType]) {
      return 5;
    }
    return Math.max(5, powerStats[data.characterType]);
  }

  openMageSightDialogue() {
    // Labels PT só para EXIBIÇÃO (chaves em lowercase)
    const ARCANUM_LABELS_PT = {
      death: "Morte",
      fate: "Destino",
      forces: "Força",
      life: "Vida",
      matter: "Matéria",
      mind: "Mente",
      prime: "Primórdio",
      space: "Espaço",
      spirit: "Espírito",
      time: "Tempo"
    };
    const tArc = (a) => ARCANUM_LABELS_PT[String(a).toLowerCase()] ?? a;

    const isRulingArcanum = (name) => {
      const isGross = CONFIG.MTA.arcana_gross?.[name];
      const arcanum = isGross ? this.system.arcana_gross[name] : this.system.arcana_subtle[name];
      return !!arcanum?.isRuling;
    };

    const tArcDisplay = (a) => `${tArc(a)}${isRulingArcanum(a) ? " 🆓" : ""}`;

    // Lista (EN nos values, PT no display)
    const arcanaKeys = Object.keys(CONFIG.MTA.arcana); // p.ex. ["death","fate",...]
    const listItems = arcanaKeys.map(a => {
      const id = `ms-arc-${a}`;
      return `
      <li class="ms-item">
        <span class="ms-name" data-en="${a}">${tArcDisplay(a)}</span>
        <label class="equipped checkBox" for="${id}">
          <input id="${id}" data-arcanum="${a}" type="checkbox">
          <span></span>
        </label>
      </li>`;
    }).join("");

    // Helpers
    const getArcana = (html) => {
      return [...html[0].querySelectorAll('.mage-sight-list input[type="checkbox"]:checked')]
        .map(i => i.dataset.arcanum); // EN
    };

    const getManaCost = (arcanaList) => {
      let manaCost = 0;
      for (const name of arcanaList) {
        if (!isRulingArcanum(name)) manaCost++;
      }
      return manaCost;
    };

    // Dialog em 2 colunas (grid). O <style> dá o layout; fallback inline no <ul> se algum tema bloquear <style>.
    const content = `
  <style>
    .ms-wrap { padding: 12px 14px 16px; }

    .ms-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: clamp(80px, 6vw, 90px);
      row-gap: 6px;
      margin: 0; padding: 0; list-style: none;
    }

    .ms-item {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      column-gap: 8px;
      padding: 2px 0;
    }
    .ms-name { margin: 0; }

    .ms-sep {
      border: 0;
      border-top: 1px solid rgba(128,128,128,.35);
      margin: 12px 0 8px;
    }

    .ms-mana {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 0;
      width: 100%;
      text-align: center;
    }
    .ms-mana input[name="manacost"] {
      width: 4ch;
      text-align: center;
      padding: 2px 4px;
    }

    /* Respiro extra antes dos botões */
    .ms-footer-spacer { height: 12px; }

    @media (max-width: 500px) {
      .ms-grid { grid-template-columns: 1fr; }
    }
  </style>

  <div class="ms-wrap">
    <ul class="mage-sight-list ms-grid"
        style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:64px;row-gap:6px;margin:0;padding:0;list-style:none;">
      ${listItems}
    </ul>

    <hr class="ms-sep" role="separator"
        style="border:0;border-top:1px solid #d59861e6;margin:12px 0 8px;">

    <div class="ms-mana"
        style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:0;width:100%;text-align:center;">
      <span><strong>💰 Custo de Mana pela cena:</strong></span>
      <input type="number" name="manacost" value="0" readonly/>
    </div>

    <div class="ms-footer-spacer"></div>
  </div>
  `;

    let d = new Dialog({
      title: "👓 Sentidos Ativos de mago",
      content,
      render: html => {
        html.find('input[type="checkbox"]').on("change", () => {
          const arcanaList = getArcana(html);
          const manaCost = getManaCost(arcanaList);
          html.find('input[name="manacost"]').val(manaCost);
        });
      },
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirmar",
          callback: html => {
            const arcanaList = getArcana(html);   // EN
            const manaCost = getManaCost(arcanaList);

            const newMana = this.system.mana.value - manaCost;
            if (newMana < 0) return ui.notifications.warn('Mana insuficiente!');

            const actionType = arcanaList.every(a => isRulingArcanum(a)) ? "Ação Reflexiva" : "Ação Instantânea";

            const listDisplay = arcanaList.map(a => `<li>${tArc(a)}</li>`).join('');
            const messageContent = `<div>Sentidos de mago (${actionType}):</div><ul>${listDisplay}</ul><div>Custo de Mana pela cena: ${manaCost}</div>`;

            ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: messageContent
            });
            this.update({ 'system.mana.value': newMana });
            if (manaCost > 0) ui.notifications.warn(`Você gastou Mana! O valor será reduzido automaticamente.`);
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancelar"
        }
      },
      default: "cancel"
    });
    d.render(true);
  }

  // CÓDIGO GPT

  openClashOfWillsDialogue() {
    const s = this.system || {};
    const gnosis = Number(s?.mage_traits?.gnosis?.final ?? s?.mage_traits?.gnosis?.value ?? 0);

    // FV atual: controla visibilidade da checkbox e o desconto
    const wpCur = Number(s?.willpower?.value ?? 0);
    const canSpendWill = wpCur > 0;

    // Monta lista de Arcanos (subtle + gross) — apenas com valor > 0
    const arcanaEntries = [];
    const pushArcana = (groupObj, groupKey) => {
      if (!groupObj) return;
      for (const [k, v] of Object.entries(groupObj)) {
        const val = Number(v?.final ?? v?.value ?? 0);
        if (val <= 0) continue;
        const label = (CONFIG?.MTA?.arcana?.[k])
          ? game.i18n.localize(CONFIG.MTA.arcana[k])
          : (k.charAt(0).toUpperCase() + k.slice(1));
        arcanaEntries.push({ path: `${groupKey}.${k}`, key: k, label, value: val });
      }
    };
    pushArcana(s.arcana_subtle, "arcana_subtle");
    pushArcana(s.arcana_gross, "arcana_gross");

    // Ordena alfabeticamente pelo rótulo PT-BR
    const locale = game.i18n?.lang || "pt-BR";
    const collator = new Intl.Collator(locale, { sensitivity: "base" });
    arcanaEntries.sort((a, b) => collator.compare(a.label, b.label));

    const hasArcana = arcanaEntries.length > 0;

    // Opções do select: arcanos primeiro, "Arcano indisponível (0)" no FIM
    const arcOptsHTML = arcanaEntries
      .map((a, i) => `<option value="${a.path}" ${hasArcana && i === 0 ? "selected" : ""}>${a.label} (${a.value})</option>`)
      .join("");
    const noneOptionHTML = `<option value="__none__" ${hasArcana ? "" : "selected"}>Nenhum</option>`;
    const optionsHTML = arcOptsHTML + noneOptionHTML;

    const content = `
<form class="mta-dialogue">
  <div class="ms-wrap" style="padding:12px 14px 16px;"> <!-- padding garantido -->
    <!-- TÍTULO 1 -->
    <legend class="ms-title" style="display:block;width:100%;text-align:center;margin:0 0 8px;">
      <strong>🎲 Parada de dados</strong>
    </legend>

    <p style="margin:4px 0;">📶 Índice de Gnose: <strong>${gnosis}</strong></p>

    <!-- Linha Arcano: grid local (não depende do outro diálogo) -->
    <div style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;margin-top:6px;">
      <label for="arcano" style="margin:0;">🔠 Arcano:</label>
      <select name="arcano" id="arcano" style="margin:0; width:auto; min-width:160px;">
        ${optionsHTML}
      </select>
    </div>

    <!-- separador âmbar (mantido) -->
    <hr role="separator" style="border:0;border-top:1px solid #d59861e6;margin:12px 0 12px;">

    <!-- TÍTULO 2 -->
    <legend class="ms-title" style="display:block;width:100%;text-align:center;margin:0 0 8px;">
      <strong>⚙️ Modificadores</strong>
    </legend>

    <!-- Modificadores: 1 coluna com respiro entre itens -->
    <ul style="
      display:grid;
      grid-template-columns:1fr;
      row-gap:6px;
      margin:0; padding:0; list-style:none;
    ">
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;">Duração avançada: 1 dia (<b>+1</b>)</p>
        <label class="equipped checkBox" for="ms-mod-dur1d">
          <input id="ms-mod-dur1d" type="checkbox" name="dur1d"><span></span>
        </label>
      </li>
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;">Duração avançada: 1 semana (<b>+2</b>)</p>
        <label class="equipped checkBox" for="ms-mod-dur1w">
          <input id="ms-mod-dur1w" type="checkbox" name="dur1w"><span></span>
        </label>
      </li>
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;">Duração avançada: 1 mês (<b>+3</b>)</p>
        <label class="equipped checkBox" for="ms-mod-dur1m">
          <input id="ms-mod-dur1m" type="checkbox" name="dur1m"><span></span>
        </label>
      </li>
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;">Duração avançada: 1 ano ou Indefinida (<b>+4</b>)</p>
        <label class="equipped checkBox" for="ms-mod-dur1y">
          <input id="ms-mod-dur1y" type="checkbox" name="dur1y"><span></span>
        </label>
      </li>
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;">Potência avançada (<b>+1</b>)</p>
        <label class="equipped checkBox" for="ms-mod-advPot">
          <input id="ms-mod-advPot" type="checkbox" name="advPot"><span></span>
        </label>
      </li>

      ${canSpendWill ? `
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;"><b>⚡ Força de vontade</b></p>
        <label class="equipped checkBox" for="ms-mod-willpower">
          <input id="ms-mod-willpower" type="checkbox" name="willpower"><span></span>
        </label>
      </li>` : ``}
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;"><b>⚙️ Modificadores genéricos</b></p>
        <input
          id="ms-mod-generic"
          type="number"
          name="genMod"
          inputmode="numeric"
          step="1"
          value="0"
          style="margin:0;width:84px;padding:2px 6px; text-align:right;"
        />
      </li>
    </ul>
  </div>
</form>
  `;

    new Dialog({
      title: "🆚 Choque de vontades",
      content,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirmar",
          callback: async (html) => {
            const form = html[0].querySelector("form");
            const arcPath = form.arcano?.value;

            // Modificadores
            const durDice =
              (form.dur1d?.checked ? 1 : 0) +
              (form.dur1w?.checked ? 2 : 0) +
              (form.dur1m?.checked ? 3 : 0) +
              (form.dur1y?.checked ? 4 : 0);
            const advPot = form.advPot?.checked ? 1 : 0;
            const willSpent = !!form.willpower?.checked;
            const willAdd = willSpent ? 3 : 0;
            let genericMod = Number(form.genMod?.value ?? 0);
            if (!Number.isFinite(genericMod)) genericMod = 0;
            genericMod = Math.trunc(genericMod);

            // Arcano selecionado (ou "Nenhum")
            let arcVal = 0;
            let arcLabel = "";
            if (arcPath !== "__none__") {
              const arcNode = arcPath?.split(".").reduce((o, k) => o?.[k], s) || {};
              arcVal = Number(arcNode?.final ?? arcNode?.value ?? 0);
              const selected = arcanaEntries.find(a => a.path === arcPath);
              arcLabel = selected?.label || "Arcano";
            }

            // Pool e flavor (com arcano traduzido e tag de FV se usada)
            const dicePool = Math.max(0, gnosis + arcVal + durDice + advPot + willAdd + genericMod);
            const modsSum = durDice + advPot + willAdd;
            const flavorBase = `Choque de vontades: Gnose ${gnosis} + ${arcLabel} ${arcVal}`;
            const flavorMods = modsSum ? ` (fatores avançados: +${modsSum})` : "";
            const flavorGen = genericMod !== 0 ? ` (modificadores: ${genericMod})` : "";
            const flavorWP = willSpent ? ` (Força de vontade)` : "";
            const flavor = `${flavorBase}${flavorMods}${flavorGen}${flavorWP}`;

            // Rolagem
            if (typeof DiceRollerDialogue?.rollToChat === "function") {
              await DiceRollerDialogue.rollToChat({
                dicePool,
                targetNumber: 8,
                extended: false,
                flavor,
                showFlavor: true,
                blindGMRoll: false,
                exceptionalTarget: 5
              });
            } else {
              const roll = await (new Roll(`${dicePool}d10cs>=8`)).evaluate({ async: true });
              roll.toMessage({ flavor });
            }

            // Gasta 1 FV (direto)
            if (willSpent) {
              await this.update({ "system.willpower.value": Math.max(0, wpCur - 1) });
              ui.notifications.warn(`Você gastou Força de Vontade! O valor será atualizado automaticamente.`);
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancelar", callback: () => { }
        }
      },
      default: "confirm"
    }, { jQuery: true }).render(true);
  }


  /**
   * Executes a perception roll using Composure + Wits.
   * if hidden is set, the roll is executed as a blind GM roll.
   */
  rollPerception(quickRoll, hidden) {
    //const data = this.system;
    //let dicepool = data.derivedTraits.perception.final;
    const { dicePool, flavor: baseFlavor } = this.assembleDicePool({
      traits: [
        "attributes_mental.wits",
        "attributes_social.composure"
      ]
    });
    const cleanedFlavor = baseFlavor.replace(/^Teste de habilidade/, "");
    const finalFlavor = `Percepção: ${cleanedFlavor}`;
    if (quickRoll) DiceRollerDialogue.rollToChat({
      dicePool: dicePool,
      flavor: finalFlavor,
      title: finalFlavor,
      blindGMRoll: hidden,
      actorOverride: this
    });
    else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicePool,
        flavor: finalFlavor,
        title: finalFlavor,
        blindGMRoll: true,
        actorOverride: this
      });
      diceRoller.render(true);
    }
  }

  rollIntuition(quickRoll, hidden) {
    const { dicePool, flavor: baseFlavor, specialties } = this.assembleDicePool({
      traits: [
        "attributes_social.composure",
        "skills_social.empathy"
      ]
    });
    const cleanedFlavor = baseFlavor.replace(/^Teste de habilidade/, "");
    const finalFlavor = `Intuição: ${cleanedFlavor}`;
    if (quickRoll) {
      DiceRollerDialogue.rollToChat({
        dicePool: dicePool,
        flavor: finalFlavor,
        title: finalFlavor,
        blindGMRoll: hidden,
        actorOverride: this
      });
    } else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicePool,
        flavor: finalFlavor,
        title: finalFlavor,
        blindGMRoll: true,
        actorOverride: this,
        specialties: specialties
      });
      diceRoller.render(true);
    }
  }

  rollInvestigation(quickRoll, hidden) {
    const { dicePool, flavor: baseFlavor, specialties } = this.assembleDicePool({
      traits: [
        "attributes_mental.intelligence",
        "skills_mental.investigation"
      ]
    });
    const cleanedFlavor = baseFlavor.replace(/^Teste de habilidade/, "");
    const finalFlavor = `Análise: ${cleanedFlavor}`;
    if (quickRoll) {
      DiceRollerDialogue.rollToChat({
        dicePool: dicePool,
        flavor: finalFlavor,
        title: finalFlavor,
        blindGMRoll: hidden,
        actorOverride: this
      });
    } else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicePool,
        flavor: finalFlavor,
        title: finalFlavor,
        blindGMRoll: true,
        actorOverride: this,
        specialties: specialties
      });
      diceRoller.render(true);
    }
  }

  rollBaldearNoite(quickRoll) {
    const data = this.system;
    let dicepool = 10 - data.werewolf_traits.harmony.value;
    let flavor = "Baldear-se à Hisil: 10 - Harmonia";
    if (quickRoll) DiceRollerDialogue.rollToChat({
      dicePool: dicepool,
      flavor: flavor,
      title: flavor,
    });
    else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicepool,
        flavor: flavor,
        title: flavor,
        addBonusFlavor: true,
      });
      diceRoller.render(true);
    }
  }

  rollBaldearDia(quickRoll) {
    const data = this.system;
    let dicepool = data.werewolf_traits.harmony.value;
    let flavor = "Baldear-se ao Mundo Material: Harmonia";
    if (quickRoll) DiceRollerDialogue.rollToChat({
      dicePool: dicepool,
      flavor: flavor,
      title: flavor,
    });
    else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicepool,
        flavor: flavor,
        title: flavor,
        addBonusFlavor: true,
      });
      diceRoller.render(true);
    }
  }

  rollHarmoniaUp(quickRoll) {
    const data = this.system;
    let dicepool = data.attributes_social.composure.final + data.attributes_mental.resolve.final;
    let penalty = data.werewolf_traits.harmony.value == 10 ? 0 : data.werewolf_traits.harmony.value == 9 ? -4 : data.werewolf_traits.harmony.value == 8 ? -3 : data.werewolf_traits.harmony.value == 7 ? -2 : data.werewolf_traits.harmony.value == 6 ? -1 : 0;
    dicepool += penalty;
    let flavor = "Ponto de Ruptura em direção à Carne";
    if (quickRoll) DiceRollerDialogue.rollToChat({
      dicePool: dicepool,
      flavor: flavor,
      title: flavor,
    });
    else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicepool,
        flavor: flavor,
        title: flavor,
        addBonusFlavor: true,
      });
      diceRoller.render(true);
    }
  }

  rollHarmoniaDown(quickRoll) {
    const data = this.system;
    let dicepool = data.attributes_social.composure.final + data.attributes_mental.resolve.final;
    let penalty = data.werewolf_traits.harmony.value == 0 ? 0 : data.werewolf_traits.harmony.value == 1 ? -4 : data.werewolf_traits.harmony.value == 2 ? -3 : data.werewolf_traits.harmony.value == 3 ? -2 : data.werewolf_traits.harmony.value == 4 ? -1 : 0;
    dicepool += penalty;
    let flavor = "Ponto de Ruptura em direção ao Espírito";
    if (quickRoll) DiceRollerDialogue.rollToChat({
      dicePool: dicepool,
      flavor: flavor,
      title: flavor,
    });
    else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicepool,
        flavor: flavor,
        title: flavor,
        addBonusFlavor: true,
      });
      diceRoller.render(true);
    }
  }

  rollGeneralDicepool(flavor, dicepool, quickRoll, hidden) {
    if (quickRoll) DiceRollerDialogue.rollToChat({
      dicePool: dicepool,
      flavor: flavor,
      title: this.name + " - " + flavor,
      blindGMRoll: hidden,
      actorOverride: this
    });
    else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicepool,
        flavor: flavor,
        title: this.name + " - " + flavor,
        blindGMRoll: true,
        actorOverride: this
      });
      diceRoller.render(true);
    }
  }

  rollCombatDicepool(flavor, dicepool, quickRoll, hidden) {
    if (quickRoll) DiceRollerDialogue.rollToChat({
      dicePool: dicepool,
      flavor: flavor,
      comment: flavor,
      title: this.name + " - " + flavor,
      blindGMRoll: hidden,
      actorOverride: this,
      damageRoll: true
    });
    else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicepool,
        flavor: flavor,
        comment: flavor,
        title: this.name + " - " + flavor,
        blindGMRoll: true,
        actorOverride: this,
        damageRoll: true,
        itemImg: 'systems/mta/icons/placeholders/combat_dice_pool.svg'
      });
      diceRoller.render(true);
    }
  }

  damage(damageAmount, damagetype, resistant = false) {
    if (damageAmount === 0) return;
    console.log("Damaging " + this.name + " by " + damageAmount + " " + damagetype + " damage");
    if (damagetype === "bashing") damagetype = "value"

    if (this.system.health[damagetype] != undefined) {
      let updateData = {};
      if (damageAmount > 0) {

        let carryOver_lethal = 0;
        let carryOver_aggravated = 0;

        if (damagetype === 'aggravated') {
          updateData[`system.health.aggravated`] = Math.max(0, this.system.health.aggravated - damageAmount);
          updateData[`system.health.lethal`] = Math.max(0, this.system.health.lethal - damageAmount);
          updateData[`system.health.value`] = Math.max(0, this.system.health.value - damageAmount);

          const messageContent = (this.name + " recebeu " + damageAmount + " ponto(s) de dano agravado!");
          const chatData = {
            speaker: ChatMessage.getSpeaker({}),
            content: messageContent
          };
          ChatMessage.create(chatData);

        }
        else if (damagetype === 'lethal') {
          carryOver_aggravated = - Math.min(0, this.system.health.lethal - damageAmount);

          if (carryOver_aggravated > 0) updateData[`system.health.aggravated`] = Math.max(0, this.system.health.aggravated - carryOver_aggravated);
          updateData[`system.health.lethal`] = Math.max(0, this.system.health.lethal - damageAmount);
          updateData[`system.health.value`] = Math.max(0, this.system.health.value - damageAmount);

          const messageContent = (this.name + " recebeu " + damageAmount + " ponto(s) de dano letal!");
          const chatData = {
            speaker: ChatMessage.getSpeaker({}),
            content: messageContent
          };
          ChatMessage.create(chatData);

        }
        else if (damagetype === 'value') {
          carryOver_lethal = - Math.min(0, this.system.health.value - damageAmount);
          carryOver_aggravated = - Math.min(0, this.system.health.lethal - carryOver_lethal);

          if (carryOver_aggravated > 0) updateData[`system.health.aggravated`] = Math.max(0, this.system.health.aggravated - carryOver_aggravated);
          if (carryOver_lethal > 0) updateData[`system.health.lethal`] = Math.max(0, this.system.health.lethal - damageAmount);
          updateData[`system.health.value`] = Math.max(0, this.system.health.value - damageAmount);

          const messageContent = (this.name + " recebeu " + damageAmount + " ponto(s) de dano contundente!");
          const chatData = {
            speaker: ChatMessage.getSpeaker({}),
            content: messageContent
          };
          ChatMessage.create(chatData);

        }

        // Apply resistant damage
        if (resistant) {
          let marked = "";
          let inflictedBashing = damagetype === "value" ? damageAmount - carryOver_lethal - carryOver_aggravated : 0;
          let inflictedLethal = (damagetype === "lethal" ? damageAmount - carryOver_aggravated : 0) + carryOver_lethal;
          let inflictedAggravated = (damagetype === "aggravated" ? damageAmount : 0) + carryOver_aggravated;

          const offsetBashing = this.system.health.max - (updateData[`system.health.lethal`] ?? this.system.health.lethal);
          const offsetLethal = this.system.health.max - (updateData[`system.health.aggravated`] ?? this.system.health.aggravated);

          updateData['system.health.marked'] = this.system.health.marked.split(',').map((cur, i) => {
            if (cur === "1") { return "1"; }
            else {
              if (inflictedAggravated) {
                inflictedAggravated--;
                return "1";
              }
              else if (inflictedLethal && i >= offsetLethal) {
                inflictedLethal--;
                return "1";
              }
              else if (inflictedBashing && i >= offsetBashing) {
                inflictedBashing--;
                return "1";
              }
              return "0";
            }
          }).join(',');
        }
      }
      else { // Negative damage == healing
        if (damagetype === 'value') {
          updateData[`system.health.value`] = Math.min(this.system.health.lethal, this.system.health.value - damageAmount);

          const messageContent = (this.name + " curou " + (damageAmount * -1) + " ponto(s) de dano contundente!");
          const chatData = {
            speaker: ChatMessage.getSpeaker({}),
            content: messageContent
          };
          ChatMessage.create(chatData);

        }

        else if (damagetype === 'lethal') {
          updateData[`system.health.lethal`] = Math.min(this.system.health.aggravated, this.system.health.lethal - damageAmount);
          updateData[`system.health.value`] = Math.min(updateData[`system.health.lethal`], this.system.health.value - damageAmount);

          const messageContent = (this.name + " curou " + (damageAmount * -1) + " ponto(s) de dano letal!");
          const chatData = {
            speaker: ChatMessage.getSpeaker({}),
            content: messageContent
          };
          ChatMessage.create(chatData);

        }
        else if (damagetype === 'aggravated') {
          updateData[`system.health.aggravated`] = Math.min(this.system.health.max, this.system.health.aggravated - damageAmount);
          updateData[`system.health.lethal`] = Math.min(updateData[`system.health.aggravated`], this.system.health.lethal - damageAmount);
          updateData[`system.health.value`] = Math.min(updateData[`system.health.lethal`], this.system.health.value - damageAmount);

          const messageContent = (this.name + " curou " + (damageAmount * -1) + " ponto(s) de dano agravado!");
          const chatData = {
            speaker: ChatMessage.getSpeaker({}),
            content: messageContent
          };
          ChatMessage.create(chatData);

        }
      }

      return this.update(updateData);
    }
  }

  getAllSpecialEffects(effectName) {
    return this.system.specialEffects.filter(e => e.name === effectName);
  }

  getSpecialEffect(effectName) {
    return this.system.specialEffects.find(e => e.name === effectName);
  }

  hasSpecialEffect(effectName) {
    return this.system.specialEffects.some(e => e.name === effectName);
  }

  /**
   * 
   */
  areAnyItemsActive(...args) {
    for (const item of this.items) {
      if (args.includes(item.name) && item.system.effectsActive) {
        return true;
      }
    }
    return false;
  }

  getWoundPenalties() {
    const systemData = this.system;
    let woundPenalty = 0;
    if (systemData.health.value <= 3 && !(this.type === "ephemeral")) {
      woundPenalty = 2 - (systemData.health.value - 1);
      // Check for Iron Stamina Merit
      let ironStamina = this.getSpecialEffect("reducedWoundPenalty");
      if (ironStamina) woundPenalty = Math.max(0, woundPenalty - ironStamina.rating);
    }
    return woundPenalty;
  }

  // 
  /**
   * Gets the Perception bonus dependent on Clarity (only Changelings).
   * In contrast to wound getWoundPenalties, penalties here are negative.
   */
  getClarityBonus() {
    const systemData = this.system;
    if (systemData.characterType !== "Changeling") return 0;
    let clarity = systemData.clarity.value;
    let clarityMax = systemData.clarity.max;

    let diceBonus = (clarity < 3) ? -2 : (clarity < 5) ? -1 : 0;
    if (clarity === clarityMax) diceBonus += 2;
    if (clarity <= 0) diceBonus = -99;

    return diceBonus;
  }

  castSpell(spell) {
    const itemData = spell ? foundry.utils.duplicate(spell.system) : {};
    if (spell) {
      if (spell.system.isRote) itemData.castRote = true;
      else if (spell.system.isPraxis) itemData.castPraxis = true;
    }

    let activeSpell = new CONFIG.Item.documentClass({
      system: foundry.utils.mergeObject(game.model.Item["activeSpell"], itemData, {
        inplace: false
      }),
      name: spell ? spell.name : game.i18n.localize('MTA.ImprovisedSpell'),
      img: spell ? spell.img : '',
      type: "activeSpell"
    });

    activeSpell.img = spell ? spell.img : '';

    let spellDialogue = new ImprovisedSpellDialogue(activeSpell, this);
    spellDialogue.render(true);
  }


  /**
   * @param {*} haunt 
   * @param {any[]} [keys=[]] - The keys unlocked with the haunt.
   * @param {boolean} [hasResonance=false] - whether the keys used have synergy with the haunt (gives exceptional on 3)
   * @param {boolean} [spendWillpower=false] - whether Willpower should be spent to avoid the Doomed condition.
   */
  async activateHauntPower(haunt, keys = [], spendWillpower = false, hasResonance = false) {
    if (!haunt) return;
    const firstKey = keys ? keys[0] : undefined;
    const keyAmount = keys ? keys.length : 0;

    console.log(haunt, keys, spendWillpower, hasResonance)

    // Unlocking keys & gain free plasm
    let unlockAttributeValue = 0;

    if (firstKey) {
      const unlockAttribute = firstKey.system.unlockAttribute;
      if (this.system.attributes_physical[unlockAttribute])
        unlockAttributeValue = this.system.attributes_physical[unlockAttribute].final;
      else if (this.system.attributes_social[unlockAttribute])
        unlockAttributeValue = this.system.attributes_social[unlockAttribute].final;
      else if (this.system.attributes_mental[unlockAttribute])
        unlockAttributeValue = this.system.attributes_mental[unlockAttribute].final;
    }

    if (unlockAttributeValue) {
      this.update({ 'system.plasm.value': this.system.plasm.value + unlockAttributeValue * keyAmount });
      this.createSimpleMessage(`+ ${unlockAttributeValue} ${game.i18n.localize("MTA.Plasm")} (${firstKey.name})`);
    }


    let additionalFlavor = keyAmount ? keys.reduce((acc, cur, index) => acc + cur.name + (index < keyAmount - 1 ? ", " : "]"), "[") : "";
    if (spendWillpower) additionalFlavor += " [" + game.i18n.localize("MTA.useWillpower") + "]";
    if (hasResonance) additionalFlavor += " [" + game.i18n.localize("MTA.hasResonance") + "]";

    // Roll haunt
    await haunt.roll(undefined, true, { diceRollBonus: unlockAttributeValue, exceptionalTarget: hasResonance ? 3 : 5, additionalFlavor });

    // Figure out Doomed condition
    const rollResult = this.getFlag('mta', 'rollReturn');

    if (keyAmount && !rollResult.exceptionalSuccess) {
      if (spendWillpower && this.system.willpower.value > 0) { // Spend willpower to avoid the condition
        this.update({ 'system.willpower.value': this.system.willpower.value - 1 });
      }
      else { // No willpower nor exceptional success -> add 1 doomed condition per key
        const conditionData = [];
        for (let i = 0; i < keyAmount; i++) {
          const k = keys[i];
          conditionData.push({
            name: `${game.i18n.localize("MTA.DoomedCondition")} (${k.name})`,
            type: "condition",
            system: {
              description: k.system.doom
            }
          });
          this.createSimpleMessage(`${game.i18n.localize("MTA.DoomedCondition")} (${firstKey.name})`);
        }
        this.createEmbeddedDocuments("Item", conditionData);
      }
    }
  }

  unlockSineaterKey(item) {
    const unlockAttribute = item.system.unlockAttribute;
    let unlockAttributeValue;
    if (this.system.attributes_physical[unlockAttribute])
      unlockAttributeValue = this.system.attributes_physical[unlockAttribute].final;
    else if (this.system.attributes_social[unlockAttribute])
      unlockAttributeValue = this.system.attributes_social[unlockAttribute].final;
    else if (this.system.attributes_mental[unlockAttribute])
      unlockAttributeValue = this.system.attributes_mental[unlockAttribute].final;

    if (!unlockAttributeValue) return;

    // Gain plasm
    this.update({ 'system.plasm.value': this.system.plasm.value + unlockAttributeValue })

    // Gain doomed
    const conditionData = [{
      name: `Doomed (${item.name})`,
      type: "condition",
      system: {
        description: item.system.doom
      }
    }];
    this.createEmbeddedDocuments("Item", conditionData);
    this.createSimpleMessage(`+ ${unlockAttributeValue} ${game.i18n.localize("MTA.Plasm")} (${item.name})`);
    this.createSimpleMessage(`${game.i18n.localize("MTA.DoomedCondition")} (${item.name})`);
  }

  createSimpleMessage(messageContent) {
    const chatData = {
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: messageContent
    };
    ChatMessage.create(chatData);
  }

  /**
   * Executes a breaking point roll using Resolve + Composure.
   * if hidden is set, the roll is executed as a blind GM roll.
   */
  rollBreakingPoint(quickRoll, hidden) {
    const systemData = this.system;
    let dicepool = systemData.attributes_social.composure.final + systemData.attributes_mental.resolve.final;
    let penalty = systemData.integrity > 8 ? 2 : systemData.integrity > 6 ? 1 : systemData.integrity <= 2 ? -2 : systemData.integrity <= 4 ? -1 : 0;
    if (this.system.characterType === "Hunter") penalty = 0;
    dicepool += penalty;
    let flavor = "Ponto de Ruptura: Perseverança + Compostura + " + penalty;
    if (quickRoll) DiceRollerDialogue.rollToChat({
      dicePool: dicepool,
      flavor: flavor,
      title: flavor,
      blindGMRoll: hidden
    });
    else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicepool,
        flavor: flavor,
        title: flavor,
        blindGMRoll: hidden
      });
      diceRoller.render(true);
    }
  }

  /**
   * Executes a dissonance roll using Integrity.
   * if hidden is set, the roll is executed as a blind GM roll.
   */
  rollDissonance(quickRoll, hidden) {
    const systemData = this.system;
    let dicepool = systemData.integrity;
    let flavor = "Dissonância: Integridade (resistido por nível da magia, posto, pilares, etc.)";
    if (quickRoll) DiceRollerDialogue.rollToChat({
      dicePool: dicepool,
      flavor: flavor,
      title: flavor,
      blindGMRoll: hidden
    });
    else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicepool,
        flavor: flavor,
        title: flavor,
        blindGMRoll: hidden
      });
      diceRoller.render(true);
    }
  }

  /**
   * Executes a cover compromise roll using Wits + Manipulation.
   * if hidden is set, the roll is executed as a blind GM roll.
   */
  rollCompromise(quickRoll, hidden) {
    const systemData = this.system;
    let dicepool = systemData.attributes_mental.wits.final + systemData.attributes_social.manipulation.final;
    let penalty = systemData.currentCover >= 8 ? 2 : systemData.currentCover >= 6 ? 1 : systemData.currentCover <= 1 ? -2 : systemData.currentCover <= 3 ? -1 : 0;
    dicepool += penalty;
    let flavor = "Compromise: Wits + Manipulation + " + penalty;
    if (quickRoll) DiceRollerDialogue.rollToChat({
      dicePool: dicepool,
      flavor: flavor,
      title: flavor,
      blindGMRoll: hidden
    });
    else {
      let diceRoller = new DiceRollerDialogue({
        dicePool: dicepool,
        flavor: flavor,
        title: flavor,
        blindGMRoll: hidden
      });
      diceRoller.render(true);
    }
  }

  /**
   * Converts the character's stats into dream stats, 
   * depending on the template.
   */
  dreaming(unequipItems) {
    const systemData = this.system;
    const updateData = {};
    updateData['system.isDreaming'] = !systemData.isDreaming;
    if (updateData['system.isDreaming']) {
      // Start dreaming. Replace attributes and health.
      if (systemData.characterType === "Mage" || systemData.characterType === "Scelesti") updateData['system.attributes_physical_dream.power.value'] = Math.max(systemData.attributes_mental.intelligence.final, systemData.attributes_social.presence.final);
      else if (systemData.characterType === "Changeling") updateData['system.attributes_physical_dream.power.value'] = systemData.attributes_social.presence.final;
      else updateData['system.attributes_physical_dream.power.value'] = systemData.attributes_mental.intelligence.final;

      if (systemData.characterType === "Mage" || systemData.characterType === "Scelesti") updateData['system.attributes_social_dream.finesse.value'] = Math.max(systemData.attributes_mental.wits.final, systemData.attributes_social.manipulation.final);
      else if (systemData.characterType === "Changeling") updateData['system.attributes_social_dream.finesse.value'] = systemData.attributes_social.manipulation.final;
      else updateData['system.attributes_social_dream.finesse.value'] = systemData.attributes_mental.wits.final;

      if (systemData.characterType === "Mage" || systemData.characterType === "Scelesti") updateData['system.attributes_mental_dream.resistance.value'] = Math.max(systemData.attributes_mental.resolve.final, systemData.attributes_social.composure.final);
      else if (systemData.characterType === "Changeling") updateData['system.attributes_mental_dream.resistance.value'] = systemData.attributes_social.composure.final;
      else updateData['system.attributes_mental_dream.resistance.value'] = systemData.attributes_mental.resolve.final;

      // Slightly unusual: to make sure that token's health bars stll show the currently important health,
      // the normal health is backed up into dream_health, and health is replaced, instead of introducing
      // a new type of health as a new trait. Dream health is not backed up, as I believe that's not a thing.
      updateData['system.dream_health'] = systemData.health;
      let newMax = 0;
      if (systemData.characterType === "Changeling") newMax = systemData.clarity.value;
      else newMax = updateData['system.attributes_mental_dream.resistance.value'];

      //  Add Gnosis/Wyrd derived maximum
      if (systemData.characterType === "Mage" || systemData.characterType === "Scelesti") newMax += Math.max(5, systemData.mage_traits.gnosis.final);
      else if (systemData.characterType === "Changeling") newMax += Math.max(5, systemData.changeling_traits.wyrd.final);
      else newMax += 5;

      updateData['system.health'] = {
        max: newMax,
        lethal: newMax,
        aggravated: newMax,
        value: newMax
      }

    }
    else {
      // Dreaming ended. Reset health.
      if (systemData.dream_health) updateData['system.health'] = systemData.dream_health;
      let amnion = this.items.filter(item => item.name === "Amnion");
      if (amnion) this.deleteEmbeddedDocuments("Item", amnion.map(item => item.id));
    }
    if (unequipItems) {
      let equipped = this.items.filter(item => item.system.equipped);
      if (equipped) {
        this.updateEmbeddedDocuments("Item", equipped.map(item => {
          return {
            _id: item.id,
            'system.equipped': false
          }
        }));
      }
    }
    this.update(updateData);
  }

  scourParadox() {
    if (!this.system.patternParadox) return;
    this.damage(this.system.patternParadox, "lethal", true);
    this.update({ "system.patternParadox": 0 });
  }

  scourPattern() {
    const reduceAttribute = async (attribute) => {
      const itemData = {
        type: "condition",
        name: game.i18n.localize("MTA.DialoguePatternScouring.ConditionName"),
        img: "systems/mta/icons/gui/macro-scoured-pattern.svg",
        "system.effectsActive": true,
        "system.effects": [
          {
            name: attribute,
            value: -1
          }
        ]
      };

      return this.createEmbeddedDocuments("Item", [itemData]);
    };

    const grantMana = async () => {
      const manaValue = Number(this.system?.mana?.value ?? 0);
      const manaMax = Number(this.system?.mana?.max ?? 0);

      await this.update({
        "system.mana.value": Math.clamp(manaValue + 3, 0, manaMax)
      });

      ui.notifications.warn("Você recebeu Mana! O valor será atualizado automaticamente.");
    };

    const warnScouredPattern = () => {
      ui.notifications.warn("A Condição 'Padrão danificado' foi adicionada à sua ficha, ela atualiza seu atributo automaticamente.");
    };

    const scourAttribute = async (attribute) => {
      await reduceAttribute(attribute);
      await grantMana();
      warnScouredPattern();
    };

    const scouringActions = {
      lethal: async () => {
        await this.damage(1, "lethal", true);
        await grantMana();
      },

      strength: async () => {
        await scourAttribute("attributes_physical.strength");
      },

      dexterity: async () => {
        await scourAttribute("attributes_physical.dexterity");
      },

      stamina: async () => {
        await scourAttribute("attributes_physical.stamina");
      }
    };

    const gnosis = Math.clamp(
      Number(this.system?.mage_traits?.gnosis?.final ?? 0) - 1,
      0,
      9
    );

    const scouringFrequency = CONFIG.MTA.gnosis_levels[gnosis].scouringFrequency;

    const optionData = [
      {
        id: "mta-scour-lethal",
        value: "lethal",
        label: game.i18n.localize("MTA.DialoguePatternScouring.ButtonOne"),
        checked: true
      },
      {
        id: "mta-scour-strength",
        value: "strength",
        label: game.i18n.localize("MTA.DialoguePatternScouring.ButtonTwo"),
        checked: false
      },
      {
        id: "mta-scour-dexterity",
        value: "dexterity",
        label: game.i18n.localize("MTA.DialoguePatternScouring.ButtonThree"),
        checked: false
      },
      {
        id: "mta-scour-stamina",
        value: "stamina",
        label: game.i18n.localize("MTA.DialoguePatternScouring.ButtonFour"),
        checked: false
      }
    ];

    const optionsHTML = optionData.map(option => `
    <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:3px 0;">
      <label for="${option.id}" style="margin:0;line-height:1.25;">
        ${option.label}
      </label>

      <label class="equipped checkBox" for="${option.id}">
        <input
          id="${option.id}"
          type="checkbox"
          class="mta-scour-option"
          name="input.scouringOption"
          value="${option.value}"
          ${option.checked ? "checked" : ""}
        >
        <span></span>
      </label>
    </li>
  `).join("");

    const content = `
<form class="mta-dialogue mta-scour-pattern-dialog">
  <div class="ms-wrap" style="padding:12px 14px 16px;">

    <p style="margin:4px 0 10px;line-height:1.35;text-align:justify;text-align-last:left;">
      ${game.i18n.format("MTA.DialoguePatternScouring.ScouringFrequency", { var: scouringFrequency })}
    </p>

    <hr role="separator" style="border:0;border-top:1px solid #d59861e6;margin:12px 0 12px;">

    <ul style="
      display:grid;
      grid-template-columns:1fr;
      row-gap:6px;
      margin:0;
      padding:0;
      list-style:none;
    ">
      ${optionsHTML}
    </ul>

  </div>
</form>
`;

    new Dialog({
      title: game.i18n.localize("MTA.DialoguePatternScouring.Title"),
      content,
      render: html => {
        const options = html.find(".mta-scour-option");

        options.on("change", event => {
          const changed = event.currentTarget;

          if (changed.checked) {
            options.not(changed).prop("checked", false);
          }
        });
      },
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirmar",
          callback: async html => {
            const selected = html.find(".mta-scour-option:checked").val();

            if (!selected) {
              ui.notifications.warn("Selecione uma opção de Purga do Padrão.");
              return false;
            }

            const action = scouringActions[selected];

            if (!action) {
              ui.notifications.warn("Opção de Purga do Padrão inválida.");
              return false;
            }

            await action();
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancelar"
        }
      },
      default: "confirm"
    }).render(true);
  }

  /* -------------------------------------------- */
  /*  Shared dialogue helpers                     */
  /* -------------------------------------------- */

  _codEscapeHTML(value) {
    const div = document.createElement("div");
    div.innerText = String(value ?? "");
    return div.innerHTML;
  }

  _codToFiniteNumber(value, fallback = 0) {
    const number = Number(value ?? fallback);
    return Number.isFinite(number) ? number : fallback;
  }

  _codClamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  _codGetByPath(obj, path) {
    return String(path ?? "").split(".").reduce((acc, key) => acc?.[key], obj);
  }

  _codItemNumber(actor, regex) {
    for (const item of actor?.items ? Array.from(actor.items) : []) {
      const match = String(item?.name ?? "").match(regex);
      if (match) return Number(match[1]) || 0;
    }
    return 0;
  }

  _codBuildOptions(options = []) {
    const safe = Array.isArray(options) ? options : [];
    if (!safe.length) return `<option value="">Nenhuma opção encontrada</option>`;

    return safe.map(option => {
      if (typeof option === "string") {
        return `<option value="${this._codEscapeHTML(option)}">${this._codEscapeHTML(option)}</option>`;
      }

      const value = option?.value ?? option?.label ?? "";
      const label = option?.label ?? option?.value ?? "";
      const disabled = option?.disabled ? "disabled" : "";
      return `<option value="${this._codEscapeHTML(value)}" ${disabled}>${this._codEscapeHTML(label)}</option>`;
    }).join("");
  }

  _codPlainUUID(value) {
    const text = String(value ?? "");
    return text.match(/^@UUID\[[^\]]+\]\{([^}]+)\}$/)?.[1] ?? text;
  }

  _codRawUUID(value) {
    const text = String(value ?? "").trim();
    return text.match(/^@UUID\[([^\]]+)\](?:\{[^}]*\})?$/)?.[1] ?? text;
  }

  _codCleanItemName(value) {
    return String(value ?? "").replace(/\s*\([^)]*\)\s*$/g, "").trim();
  }

  _codArcanoFromDetail(value) {
    return String(value ?? "").replace(/\s+\d+\s*$/g, "").trim();
  }

  _codGetDateLabel() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = String(today.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  _codUtilityFacade() {
    return {
      esc: value => this._codEscapeHTML(value),
      clamp: (value, min, max) => this._codClamp(value, min, max),
      path: (obj, path) => this._codGetByPath(obj, path),
      itemNumber: (actor, regex) => this._codItemNumber(actor, regex),
      options: options => this._codBuildOptions(options),
      plainUUID: value => this._codPlainUUID(value),
      rawUUID: value => this._codRawUUID(value),
      cleanItemName: value => this._codCleanItemName(value),
      arcanoFromDetail: value => this._codArcanoFromDetail(value)
    };
  }

  _codResizeDialogToFit(dialog, formSelector) {
    requestAnimationFrame(() => {
      if (!dialog?.element?.length) return;

      const appEl = dialog.element;
      const header = appEl.find(".window-header");
      const windowContent = appEl.find(".window-content");
      const form = appEl.find(formSelector);
      const buttons = appEl.find(".dialog-buttons");

      appEl.css({ height: "auto" });

      windowContent.css({
        height: "auto",
        "max-height": "none",
        overflow: "visible"
      });

      buttons.css({
        height: "auto",
        "min-height": "",
        "max-height": "",
        flex: "0 0 auto"
      });

      buttons.find("button").css({
        height: "auto",
        "min-height": "",
        "max-height": ""
      });

      const headerH = header.outerHeight(true) || 0;
      const formH = form.outerHeight(true) || 0;
      const buttonsH = buttons.outerHeight(true) || 0;
      const paddingTop = parseFloat(windowContent.css("padding-top")) || 0;
      const paddingBottom = parseFloat(windowContent.css("padding-bottom")) || 0;
      const wantedHeight = Math.ceil(headerH + formH + buttonsH + paddingTop + paddingBottom + 8);
      const maxHeight = Math.floor(window.innerHeight - 80);

      dialog.setPosition({ height: Math.min(wantedHeight, maxHeight) });
      windowContent.css({ overflow: wantedHeight > maxHeight ? "auto" : "visible" });
    });
  }

  _codSyncNativeRadioGroup(html, groupName) {
    const rows = html.find(`.mta-native-radio[data-radio-group="${groupName}"]`);

    rows.each((_, rowEl) => {
      const row = $(rowEl);
      const input = row.find("input[type='radio']");
      const checked = input.prop("checked");
      const disabled = input.prop("disabled");

      row.find(".activeIcon")
        .toggleClass("fas fa-dot-circle", checked)
        .toggleClass("far fa-circle", !checked)
        .css("visibility", "visible");

      row
        .attr("data-checked", checked ? "1" : "0")
        .attr("data-disabled", disabled ? "1" : "0");
    });
  }

  _codBindNativeRadioGroup(html, groupName) {
    const rows = html.find(`.mta-native-radio[data-radio-group="${groupName}"]`);

    rows.on("click", event => {
      const row = $(event.currentTarget);
      const input = row.find("input[type='radio']");

      if (input.prop("disabled")) return;

      rows.find("input[type='radio']").prop("checked", false);
      input.prop("checked", true).trigger("change");
      this._codSyncNativeRadioGroup(html, groupName);
    });

    rows.find("input[type='radio']").on("change", () => this._codSyncNativeRadioGroup(html, groupName));
    this._codSyncNativeRadioGroup(html, groupName);
  }

  _codGetPlayerCharacterActors() {
    const actors = new Map();

    for (const user of game.users.players ?? []) {
      const actor = user.character;
      if (actor?.id && !actors.has(actor.id)) actors.set(actor.id, actor);
    }

    return Array.from(actors.values());
  }

  _codBuildActorCheckbox(actor, prefix) {
    const safeId = this._codEscapeHTML(actor.id);
    const inputId = `${prefix}-actor-${safeId}`;

    return `
      <li class="cod-check-row" data-locked="0">
        <label for="${inputId}" class="cod-field-label">
          ${this._codEscapeHTML(actor.name)}
        </label>

        <label class="equipped checkBox" for="${inputId}">
          <input id="${inputId}" type="checkbox" class="cod-actor-checkbox" value="${safeId}">
          <span></span>
        </label>
      </li>
    `;
  }

  _codBuildActorList(actors, prefix) {
    if (!actors.length) {
      return `
        <li class="cod-empty-row">
          <p>Nenhum personagem principal de jogador encontrado.</p>
        </li>
      `;
    }

    return actors.map(actor => this._codBuildActorCheckbox(actor, prefix)).join("");
  }

  _codSyncSelectAll(refs) {
    const locked = refs.selectAllCheckbox.prop("checked");

    refs.actorCheckboxes
      .prop("checked", locked)
      .prop("disabled", locked)
      .closest(".cod-check-row")
      .attr("data-locked", locked ? "1" : "0");
  }

  _codGetSelectedActorIds(html) {
    return html.find(".cod-actor-checkbox:checked")
      .map((_, el) => el.value)
      .get();
  }

  _codApplyProgressToActors(actorIds, actorsById, name, beats, arcaneBeats) {
    for (const id of actorIds) {
      const actor = actorsById.get(id) ?? game.actors.get(id);
      if (typeof actor?.addProgress !== "function") continue;
      actor.addProgress(name, beats, arcaneBeats);
    }
  }

  restorePattern() {
    return this._openPatternRestoreDialogue({
      title: "❤️‍🩹 Restaurando o Padrão",
      description: `Com uma <strong>Ação Instantânea</strong> que custa <strong>3 pontos de Mana</strong>, você pode receber 1 dos benefícios:`,
      options: [
        {
          id: "restore-lethal",
          value: "lethal",
          label: "Curar 1 <strong>ferimento letal</strong>",
          manaCost: 3,
          damage: { amount: -1, type: "lethal" },
          checked: true
        },
        {
          id: "restore-bashing",
          value: "bashing",
          label: "Curar 1 <strong>ferimento contundente</strong>",
          manaCost: 3,
          damage: { amount: -1, type: "bashing" }
        },
        {
          id: "restore-tilt",
          value: "tilt",
          label: "Eliminar 1 <strong>Incidente físico</strong>",
          manaCost: 3,
          deleteType: "tilt",
          selectLabel: "⚠️ <strong>Incidente:</strong>"
        },
        {
          id: "restore-condition",
          value: "condition",
          label: "Eliminar 1 <strong>Condição mental</strong>",
          manaCost: 3,
          deleteType: "condition",
          selectLabel: "⚠️ <strong>Condição:</strong>"
        }
      ]
    });
  }

  improvedRestorePattern() {
    return this._openPatternRestoreDialogue({
      title: "❤️‍🩹 Restaurando o Padrão aprimoradamente",
      description: `Graças a um Dote de Vida ••, você pode realizar uma <strong>Ação Instantânea</strong> que custa <strong>menos Mana</strong> (conforme a opção escolhida), para receber 1 dos benefícios:`,
      options: [
        {
          id: "improved-restore-lethal",
          value: "lethal",
          label: "Curar 1 <strong>ferimento letal</strong> (<strong>-2 de Mana</strong>)",
          manaCost: 2,
          damage: { amount: -1, type: "lethal" },
          checked: true
        },
        {
          id: "improved-restore-bashing",
          value: "bashing",
          label: "Curar 1 <strong>ferimento contundente</strong> (<strong>-1 de Mana</strong>)",
          manaCost: 1,
          damage: { amount: -1, type: "bashing" }
        },
        {
          id: "improved-restore-tilt",
          value: "tilt",
          label: "Eliminar 1 <strong>Incidente físico</strong> (<strong>-3 de Mana</strong>)",
          manaCost: 3,
          deleteType: "tilt",
          selectLabel: "⚠️ <strong>Incidente</strong>:"
        },
        {
          id: "improved-restore-condition",
          value: "condition",
          label: "Eliminar 1 <strong>Condição mental</strong> (<strong>-3 de Mana</strong>)",
          manaCost: 3,
          deleteType: "condition",
          selectLabel: "⚠️ <strong>Condição</strong>:"
        }
      ]
    });
  }

  _openPatternRestoreDialogue({ title, description, options }) {
    const actor = this || game.user?.character;

    if (!actor) {
      ui.notifications.warn("Não foi possível identificar o personagem.");
      return;
    }

    const itemTypeCache = new Map();
    const getCachedItemsByType = type => this._mtaRestoreGetItemsByType(actor, type, itemTypeCache);

    const preparedOptions = this._preparePatternRestoreOptions(actor, options, getCachedItemsByType);

    const hasAnyTarget = preparedOptions.some(option => option.hasTarget);
    const hasAnyAvailableOption = preparedOptions.some(option => option.available);

    if (!hasAnyTarget) {
      ui.notifications.error("<b>Não há Incidentes, Condições ou ferimentos</b> para Restauração!");
      return;
    }

    if (!hasAnyAvailableOption) {
      ui.notifications.error("<b>Mana insuficiente</b> para Restauração!");
      return;
    }

    const optionsByValue = new Map(preparedOptions.map(option => [option.value, option]));

    const buildOptionRow = option => {
      const disabled = option.available ? "" : "disabled";
      const checked = option.checked && option.available ? "checked" : "";
      const title = this._mtaRestoreGetUnavailableTitle(option);
      const titleAttr = title ? `title="${this._codEscapeHTML(title)}"` : "";

      return `
      <li
        class="mta-restore-option-row"
        data-option="${this._codEscapeHTML(option.value)}"
        data-available="${option.available ? "1" : "0"}"
        data-insufficient-mana="${option.insufficientMana ? "1" : "0"}"
        ${titleAttr}
      >
        <div class="mta-restore-option-content">
          <label for="${this._codEscapeHTML(option.id)}" class="mta-restore-option-label">
            ${option.label}
          </label>

          <label class="equipped checkBox" for="${this._codEscapeHTML(option.id)}">
            <input
              id="${this._codEscapeHTML(option.id)}"
              type="checkbox"
              class="mta-restore-option"
              name="input.restoreOption"
              value="${this._codEscapeHTML(option.value)}"
              ${checked}
              ${disabled}
              aria-disabled="${option.available ? "false" : "true"}"
            >
            <span></span>
          </label>
        </div>

        ${option.insufficientMana ? `
          <div class="mta-restore-mana-warning">
            Mana insuficiente!
          </div>
        ` : ""}
      </li>
    `;
    };

    const buildItemSelectGroup = option => {
      if (!option.deleteType) return "";

      const items = option.items ?? [];
      const selectId = `${option.id}-select`;
      const disabled = option.available && items.length ? "" : "disabled";

      return `
      <div
        class="mta-restore-item-select"
        data-option="${this._codEscapeHTML(option.value)}"
      >
        <hr role="separator" class="mta-restore-separator">

        <div class="mta-restore-select-row">
          <label for="${this._codEscapeHTML(selectId)}" class="mta-restore-select-label">
            ${option.selectLabel}
          </label>

          <select
            id="${this._codEscapeHTML(selectId)}"
            name="input.${this._codEscapeHTML(option.value)}Item"
            class="mta-restore-item-choice"
            data-option="${this._codEscapeHTML(option.value)}"
            ${disabled}
          >
            ${this._mtaRestoreBuildItemOptions(items)}
          </select>
        </div>
      </div>
    `;
    };

    const getSelectedOption = html => {
      const selected = html.find(".mta-restore-option:checked:not(:disabled)").val();
      return optionsByValue.get(selected);
    };

    const restoreDamage = async option => {
      await actor.damage(option.damage.amount, option.damage.type, true);
      await this._mtaRestoreSpendMana(actor, option.manaCost);
    };

    const deleteSelectedItem = async (html, option) => {
      const itemId = html.find(`.mta-restore-item-choice[data-option="${option.value}"]`).val();

      if (!itemId) {
        ui.notifications.warn("Selecione um item para eliminar.");
        return false;
      }

      const item = actor.items.get(itemId);

      if (!item) {
        ui.notifications.warn("O item selecionado não foi encontrado na ficha do personagem.");
        return false;
      }

      const confirmed = await this._mtaRestoreConfirmItemDeletion(actor, item, option);

      if (!confirmed) return false;

      await actor.deleteEmbeddedDocuments("Item", [item.id]);
      await this._mtaRestoreSpendMana(actor, option.manaCost);

      ui.notifications.warn(`O item '${item.name}' foi removido da ficha do personagem.`);
    };

    const executeRestoreOption = async (html, option) => {
      /*
       * Revalidação no clique.
       * Não usa o cache preparado para a abertura do diálogo.
       */
      if (!this._mtaRestoreHasOptionTarget(actor, option)) {
        ui.notifications.warn("Esta opção não está mais disponível para este personagem.");
        return false;
      }

      if (!this._mtaRestoreHasEnoughMana(actor, option)) {
        ui.notifications.warn("Mana insuficiente!");
        return false;
      }

      if (option.damage) {
        await restoreDamage(option);
        return;
      }

      if (option.deleteType) {
        return deleteSelectedItem(html, option);
      }

      ui.notifications.warn("A opção selecionada não possui uma ação configurada.");
      return false;
    };

    const optionHTML = preparedOptions.map(buildOptionRow).join("");
    const selectGroupsHTML = preparedOptions.map(buildItemSelectGroup).join("");

    const content = `
<form class="mta-dialogue mta-restore-pattern-dialog">
  <div class="ms-wrap">

    <p class="mta-restore-description">
      ${description}
    </p>

    <hr role="separator" class="mta-restore-separator">

    <ul class="mta-restore-options-list">
      ${optionHTML}
    </ul>

    ${selectGroupsHTML}

    <hr role="separator" class="mta-restore-separator">

    <p class="mta-restore-note">
      <strong>Obs.</strong>: <strong>Condições</strong> eliminadas desta forma <strong>não</strong> concedem um Beat como recompensa!
    </p>

  </div>
</form>
`;

    let d;

    const resizeToFit = () => this._codResizeDialogToFit(d, "form.mta-restore-pattern-dialog");

    const updateConfirmButtonState = html => {
      const hasEnabledSelection = Boolean(html.find(".mta-restore-option:checked:not(:disabled)").length);
      d?.element?.find('button[data-button="confirm"]').prop("disabled", !hasEnabledSelection);
    };

    const updateItemSelectVisibility = html => {
      const selected = html.find(".mta-restore-option:checked:not(:disabled)").val();

      html.find(".mta-restore-item-select").hide();

      if (selected) {
        html.find(`.mta-restore-item-select[data-option="${selected}"]`).show();
      }

      updateConfirmButtonState(html);
      resizeToFit();
    };

    const bindExclusiveCheckboxes = html => {
      const optionInputs = html.find(".mta-restore-option");
      const enabledInputs = optionInputs.filter(":not(:disabled)");

      enabledInputs.on("change", event => {
        const changed = event.currentTarget;

        if (changed.checked) {
          enabledInputs.not(changed).prop("checked", false);
        } else {
          changed.checked = true;
        }

        updateItemSelectVisibility(html);
      });
    };

    d = new Dialog({
      title,
      content,
      render: html => {
        bindExclusiveCheckboxes(html);
        updateItemSelectVisibility(html);
      },
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirmar",
          callback: async html => {
            const option = getSelectedOption(html);

            if (!option) {
              ui.notifications.warn("Selecione uma opção de Restauração de Padrão.");
              return false;
            }

            return executeRestoreOption(html, option);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancelar"
        }
      },
      default: "confirm"
    });

    d.render(true);
  }

  _preparePatternRestoreOptions(actor, options, getItemsByType) {
    const preparedOptions = options.map(option => {
      const items = option.deleteType ? getItemsByType(option.deleteType) : [];
      const hasTarget = option.damage
        ? this._mtaRestoreHasCurableDamage(actor, option.damage.type)
        : items.length > 0;
      const hasMana = this._mtaRestoreHasEnoughMana(actor, option);

      return {
        ...option,
        items,
        hasTarget,
        hasMana,
        insufficientMana: hasTarget && !hasMana,
        available: hasTarget && hasMana
      };
    });

    const defaultOption = preparedOptions.find(option => option.available && option.checked)
      ?? preparedOptions.find(option => option.available);

    for (const option of preparedOptions) {
      option.checked = defaultOption ? option.value === defaultOption.value : false;
    }

    return preparedOptions;
  }

  _mtaRestoreNormalizeDamageType(type) {
    return type === "bashing" ? "value" : String(type ?? "").toLowerCase();
  }

  _mtaRestoreGetHealth(actor) {
    return actor.system?.health ?? {};
  }

  _mtaRestoreGetAvailableMana(actor) {
    return this._codToFiniteNumber(actor.system?.mana?.value);
  }

  _mtaRestoreHasEnoughMana(actor, option) {
    return this._mtaRestoreGetAvailableMana(actor) >= this._codToFiniteNumber(option.manaCost);
  }

  _mtaRestoreHasCurableDamage(actor, type) {
    const health = this._mtaRestoreGetHealth(actor);
    const damageType = this._mtaRestoreNormalizeDamageType(type);

    const value = this._codToFiniteNumber(health.value);
    const lethal = this._codToFiniteNumber(health.lethal);
    const aggravated = this._codToFiniteNumber(health.aggravated);
    const max = this._codToFiniteNumber(health.max);

    if (damageType === "value") return value < lethal;
    if (damageType === "lethal") return lethal < aggravated;
    if (damageType === "aggravated") return aggravated < max;

    return false;
  }

  _mtaRestoreGetItemsByType(actor, type, cache) {
    const normalizedType = String(type ?? "").toLowerCase();

    if (!cache.has(normalizedType)) {
      const items = actor.items
        .filter(item => String(item.type ?? "").toLowerCase() === normalizedType)
        .sort((a, b) => {
          return String(a.name ?? "").localeCompare(String(b.name ?? ""), "pt-BR", {
            sensitivity: "base",
            numeric: true
          });
        });

      cache.set(normalizedType, items);
    }

    return cache.get(normalizedType);
  }

  _mtaRestoreHasItemOfType(actor, type) {
    const normalizedType = String(type ?? "").toLowerCase();
    return actor.items.some(item => String(item.type ?? "").toLowerCase() === normalizedType);
  }

  _mtaRestoreHasOptionTarget(actor, option) {
    if (option.damage) return this._mtaRestoreHasCurableDamage(actor, option.damage.type);
    if (option.deleteType) return this._mtaRestoreHasItemOfType(actor, option.deleteType);
    return false;
  }

  _mtaRestoreGetUnavailableTitle(option) {
    if (option.insufficientMana) return "Mana insuficiente.";
    if (!option.hasTarget) return "Não disponível para este personagem.";
    return "";
  }

  _mtaRestoreBuildItemOptions(items) {
    if (!items.length) {
      return `<option value="">Nenhum item encontrado</option>`;
    }

    return items.map(item => {
      return `<option value="${this._codEscapeHTML(item.id)}">${this._codEscapeHTML(item.name)}</option>`;
    }).join("");
  }

  async _mtaRestoreSpendMana(actor, cost) {
    const manaValue = Number(actor.system?.mana?.value ?? 0);
    const manaMax = Number(actor.system?.mana?.max ?? 0);
    const finiteCost = this._codToFiniteNumber(cost);

    await actor.update({
      "system.mana.value": Math.clamp(manaValue - finiteCost, 0, manaMax)
    });

    ui.notifications.warn("Você gastou Mana! O valor será atualizado automaticamente.");
  }

  _mtaRestoreConfirmItemDeletion(actor, item, option) {
    return new Promise(resolve => {
      let resolved = false;

      const finish = value => {
        if (resolved) return;
        resolved = true;
        resolve(value);
      };

      const content = `
<form class="mta-dialogue mta-restore-confirm-dialog">
  <div class="ms-wrap">
    <p class="mta-restore-confirm-text">
      <strong>ATENÇÃO!</strong> Você escolheu eliminar '<em>${this._codEscapeHTML(item.name)}</em>' da ficha de
      '<em>${this._codEscapeHTML(actor.name)}</em>'. Deseja prosseguir com a exclusão?
    </p>

    <p class="mta-restore-confirm-note">
      Esta ação também gastará <strong>${this._codEscapeHTML(option.manaCost)} ponto${option.manaCost === 1 ? "" : "s"} de Mana</strong>.
    </p>
  </div>
</form>
`;

      new Dialog({
        title: "⚠️ Confirmar exclusão?",
        content,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-trash"></i>',
            label: "Excluir",
            callback: () => finish(true)
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancelar",
            callback: () => finish(false)
          }
        },
        default: "cancel",
        close: () => finish(false)
      }).render(true);
    });
  }

  // Macro: Assistente de Anomalias paradoxais — MtA 2e / Foundry V12
  // Versão V4.2 refatorada — automações da V4.1 com polimento estrutural da V3.
  // Escopo: usar depois de uma rolagem de Paradoxo bem-sucedida.

  async openParadoxAnomalyAssistant() {
    // ---------------------------------------------------------------------------
    // Utilidades
    // ---------------------------------------------------------------------------
    const U = this._codUtilityFacade();

    // ---------------------------------------------------------------------------
    // Dados fixos / caminhos exatos do sistema
    // ---------------------------------------------------------------------------
    const ARCANA_PATHS = {
      "Destino": "arcana_subtle.fate",
      "Espaço": "arcana_gross.space",
      "Espírito": "arcana_subtle.spirit",
      "Força": "arcana_gross.forces",
      "Matéria": "arcana_gross.matter",
      "Mente": "arcana_subtle.mind",
      "Morte": "arcana_subtle.death",
      "Primórdio": "arcana_subtle.prime",
      "Tempo": "arcana_gross.time",
      "Vida": "arcana_gross.life"
    };

    const UUIDS = {
      fatigue: "@UUID[Compendium.CompendiumCofD.cond.Item.zkUPLG5H4LYLLBzd]{Fadiga abissal}",
      deferred: "@UUID[Compendium.CompendiumCofD.cond.Item.sazbsIkVk7vlXcFL]{Paradoxo prorrogado}",
      veto: "@UUID[Compendium.CompendiumCofD.cond.Item.m86g3SqqcNscOfH8]{Veto abissal}",
      personalIncident: "@UUID[Compendium.CompendiumCofD.journal.JournalEntry.UcNmAYrzjV5flyAH.JournalEntryPage.7sms5C0goNROuDFd]",
      environmentalIncident: "@UUID[Compendium.CompendiumCofD.journal.JournalEntry.UcNmAYrzjV5flyAH.JournalEntryPage.QznF5mrSkuektBaf]"
    };

    const PARADOX_CONDITION_LINKS = [
      { label: "Coice abissal", value: "@UUID[Compendium.CompendiumCofD.cond.Item.zGAINsoG5uWSprXR]{Coice abissal}" },
      { label: "Imago abissal", value: "@UUID[Compendium.CompendiumCofD.cond.Item.OUMmGsDx0cTJvHcz]{Imago abissal}" },
      { label: "Impureza abissal", value: "@UUID[Compendium.CompendiumCofD.cond.Item.kLWBZp1KOnARcNxp]{Impureza abissal}" },
      { label: "Nimbus abissal", value: "@UUID[Compendium.CompendiumCofD.cond.Item.vxB97gtW1J9d9QSi]{Nimbus abissal}" }
    ];

    const CONDITION_UUID_BY_NAME = Object.fromEntries(PARADOX_CONDITION_LINKS.map(c => [c.label, c.value]));

    const SPELL_FACTORS = [
      ["factor-primary", "Modificar Elevação: <strong>Fator primário</strong>", "Modificar Elevação: Fator primário"],
      ["factor-advanced-potency", "Modificar Elevação: <strong>Potência avançada</strong>", "Modificar Elevação: Potência avançada"],
      ["factor-advanced-scale", "Modificar Elevação: <strong>Escala avançada</strong>", "Modificar Elevação: Escala avançada"],
      ["factor-advanced-duration", "Modificar Elevação: <strong>Duração avançada</strong>", "Modificar Elevação: Duração avançada"],
      ["factor-indefinite-duration", "Modificar Elevação: <strong>Duração indefinida</strong>", "Modificar Elevação: Duração Indefinida"],
      ["factor-sensory-range", "Modificar Elevação: <strong>Alcance avançado (Sensorial)</strong>", "Modificar Elevação: Alcance avançado (Sensorial)"],
      ["factor-remote-viewing", "Modificar Elevação: <strong>Visualização remota</strong>", "Modificar Elevação: Visualização remota"],
      ["factor-active-spell-slot", "Modificar Elevação: <strong>Controle de Feitiço Ativo</strong>", "Modificar Elevação: Controle de Feitiço Ativo"]
    ];

    const ZONES = [
      ["zone-none", "Sem zona antimagia", 0, true],
      ["zone-room", "Zona antimagia: 1 cômodo", 2],
      ["zone-house", "Zona antimagia: 1 casa média", 4],
      ["zone-floor", "Zona antimagia: 1 andar ou bairro pequeno", 6],
      ["zone-village", "Zona antimagia: 1 vila", 8],
      ["zone-city", "Zona antimagia: 1 cidade", 10]
    ];

    // ---------------------------------------------------------------------------
    // Dados do ator / mecânica
    // ---------------------------------------------------------------------------
    const getActorWisdom = actor => Number(actor?.system?.mage_traits?.wisdom?.final ?? actor?.system?.mage_traits?.wisdom?.value ?? 5);
    const getActorGnosis = actor => Number(actor?.system?.mage_traits?.gnosis?.final ?? actor?.system?.mage_traits?.gnosis?.value ?? 0);

    const getActorArcanaValue = (actor, arcano) => {
      const trait = U.path(actor?.system, ARCANA_PATHS[arcano]);
      return Number(trait?.final ?? trait?.value ?? 0);
    };

    const getActorArcanaOptions = actor => {
      const options = Object.keys(ARCANA_PATHS)
        .map(arcano => ({
          arcano,
          value: getActorArcanaValue(actor, arcano)
        }))
        .filter(({ value }) => value > 0)
        .map(({ arcano, value }) => `${arcano} ${value}`);

      return options.length
        ? options
        : [{ value: "", label: "Nenhum Arcano maior que 0", disabled: true }];
    };

    const getDurationsByWisdom = wisdom => {
      const w = Number(wisdom) || 0;
      if (w >= 8) return { anomaly: "1 cena", condition: "1 arco / mês" };
      if (w >= 4) return { anomaly: "1 capítulo / dia", condition: "1 capítulo / dia" };
      if (w >= 1) return { anomaly: "1 arco / mês", condition: "1 cena" };
      return { anomaly: "1 crônica / ano", condition: "1 turno" };
    };

    const getActorYantraOptions = actor => {
      const yantras = (actor?.items ? Array.from(actor.items) : [])
        .filter(item => String(item?.type ?? "").toLowerCase() === "yantra")
        .map(item => item.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      return yantras.length ? yantras : [{ value: "", label: "Nenhum Yantra encontrado", disabled: true }];
    };

    const detectDeferredParadox = actor => U.itemNumber(actor, /paradoxo\s+prorrogado\s*\((\d+)\)/i);
    const detectAbyssalFatigue = actor => U.itemNumber(actor, /fadiga\s+abissal\s*\(-?(\d+)\)/i);

    const actorResources = actor => ({
      "Mana": Number(actor?.system?.mana?.value ?? 0),
      "Força de Vontade": Number(actor?.system?.willpower?.value ?? 0)
    });

    const getCandidateActors = () => {
      const actors = new Map();

      const addActor = actor => {
        if (actor && getActorGnosis(actor) > 0 && !actors.has(actor.id)) {
          actors.set(actor.id, actor);
        }
      };

      for (const token of canvas.tokens?.controlled ?? []) {
        addActor(token.actor);
      }

      addActor(game.actors.get(ChatMessage.getSpeaker()?.actor));

      for (const user of game.users.players) {
        addActor(user.character);
      }

      addActor(this);

      for (const actor of game.actors.contents) {
        addActor(actor);
      }

      return Array.from(actors.values());
    };

    const candidateActors = getCandidateActors();
    if (!candidateActors.length) {
      ui.notifications.warn("Nenhum personagem encontrado.");
      return;
    }

    // ---------------------------------------------------------------------------
    // Operações persistentes de ficha
    // ---------------------------------------------------------------------------
    const ActorOps = {
      findItem(actor, baseName) {
        const wanted = String(baseName ?? "").toLowerCase();
        return Array.from(actor?.items ?? []).find(item => U.cleanItemName(item.name).toLowerCase() === wanted);
      },

      async deleteItem(actor, baseName) {
        const item = ActorOps.findItem(actor, baseName);
        if (item) await item.delete();
      },

      async assertUuid(uuid, message) {
        const document = await fromUuid(U.rawUUID(uuid));
        if (!document) throw new Error(message);
        return document;
      },

      async importItem(actor, uuid) {
        const source = await ActorOps.assertUuid(uuid, `Item não encontrado: ${uuid}`);
        const data = source.toObject ? source.toObject() : foundry.utils.duplicate(source);
        delete data._id;
        return Item.create(data, { parent: actor });
      },

      async upsertItem(actor, baseName, uuid) {
        return ActorOps.findItem(actor, baseName) ?? ActorOps.importItem(actor, uuid);
      },

      async validateAutomations(ctx, effects) {
        const fatigue = effects.find(e => e.id === "abyssal-fatigue");
        const consume = effects.find(e => e.id === "consume-resource");
        const mageCondition = effects.find(e => e.id === "mage-condition");
        const veto = effects.find(e => e.id === "abyssal-veto");

        if (consume && consume.qty > (actorResources(ctx.actor)[consume.detail] ?? 0)) {
          throw new Error(`${consume.detail} insuficiente.`);
        }

        if (fatigue) await ActorOps.assertUuid(UUIDS.fatigue, "Condição Fadiga abissal não encontrada.");

        if (mageCondition) {
          const label = U.plainUUID(mageCondition.detail);
          const uuid = CONDITION_UUID_BY_NAME[label];
          if (!uuid) throw new Error(`Condição paradoxal não reconhecida: ${label || "sem nome"}.`);
          await ActorOps.assertUuid(uuid, `Condição ${label} não encontrada.`);
        }

        if (veto) {
          const arcano = U.arcanoFromDetail(veto.detail);
          if (!ARCANA_PATHS[arcano]) throw new Error(`Arcano inválido para Veto abissal: ${veto.detail || "sem Arcano"}.`);
          await ActorOps.assertUuid(UUIDS.veto, "Condição Veto abissal não encontrada.");
        }
      },

      async spendResource(actor, resource, qty) {
        if (!qty) return;

        const current = actorResources(actor)[resource] ?? 0;
        if (qty > current) throw new Error(`${resource} insuficiente.`);

        const path = resource === "Mana" ? "system.mana.value" : "system.willpower.value";
        await actor.update({ [path]: current - qty });
        ui.notifications.info(`${actor.name} teve ${qty} ponto(s) de ${resource} consumido(s)!`);
      },

      async addMageCondition(ctx, effect) {
        const label = U.plainUUID(effect.detail);
        const uuid = CONDITION_UUID_BY_NAME[label];
        if (!uuid) throw new Error(`Condição paradoxal não reconhecida: ${label || "sem nome"}.`);

        const item = await ActorOps.upsertItem(ctx.actor, label, uuid);
        if (["Coice abissal", "Imago abissal"].includes(label)) await item.update({ name: `${label} (+${ctx.raises})` });
      },

      async applyFatigue(ctx, effect) {
        const next = U.clamp(ctx.fatigue + effect.qty, 0, 5);

        if (next <= 0) {
          await ActorOps.deleteItem(ctx.actor, "Fadiga abissal");
          return;
        }

        const item = await ActorOps.upsertItem(ctx.actor, "Fadiga abissal", UUIDS.fatigue);
        await item.update({
          name: `Fadiga abissal (-${next})`,
          "system.effectsActive": true,
          "system.effects": [
            { name: "generalModifiers.physicalDicePools", value: -next, overFive: true },
            { name: "generalModifiers.mentalDicePools", value: -next, overFive: true },
            { name: "generalModifiers.socialDicePools", value: -next, overFive: true }
          ]
        });
      },

      async applyVeto(ctx, effect) {
        const arcano = U.arcanoFromDetail(effect.detail);
        const path = ARCANA_PATHS[arcano];
        if (!path) throw new Error(`Arcano inválido para Veto abissal: ${effect.detail || "sem Arcano"}.`);

        const item = await ActorOps.upsertItem(ctx.actor, "Veto abissal", UUIDS.veto);
        await item.update({
          name: `Veto abissal (${arcano})`,
          "system.effectsActive": true,
          "system.effects": [{ name: path, value: -3, overFive: true }]
        });
      },

      async clearDeferredParadox(ctx) {
        if (ctx.eruption && ctx.deferred > 0) await ActorOps.deleteItem(ctx.actor, "Paradoxo prorrogado");
      },

      async applyAutomations(ctx, effects) {
        await ActorOps.validateAutomations(ctx, effects);

        const fatigue = effects.find(e => e.id === "abyssal-fatigue");
        const consume = effects.find(e => e.id === "consume-resource");
        const mageCondition = effects.find(e => e.id === "mage-condition");
        const veto = effects.find(e => e.id === "abyssal-veto");

        if (consume) await ActorOps.spendResource(ctx.actor, consume.detail, consume.qty);
        if (fatigue) await ActorOps.applyFatigue(ctx, fatigue);
        if (mageCondition) await ActorOps.addMageCondition(ctx, mageCondition);
        if (veto) await ActorOps.applyVeto(ctx, veto);
        await ActorOps.clearDeferredParadox(ctx);
      }
    };

    // ---------------------------------------------------------------------------
    // Interface comum
    // ---------------------------------------------------------------------------
    const resizeToFit = dialog => this._codResizeDialogToFit(dialog, "form.paradox-helper-dialog, form.paradox-builder-dialog");

    const bindNativeRadioGroup = (html, groupName) => this._codBindNativeRadioGroup(html, groupName);

    const fieldLabel = input => {
      const label = input.closest(".ph-effect-row, .ph-form-row").find("label").first().text().trim();
      return label || input.attr("name") || input.attr("id") || "campo numérico";
    };

    const validateNumberLimits = root => {
      const errors = [];

      $(root).find("input[type='number']").each((_, el) => {
        const input = $(el);
        if (input.prop("disabled")) return;

        const raw = String(input.val() ?? "").trim();
        if (raw === "") return;

        const value = Number(raw);
        const label = fieldLabel(input);
        const minRaw = input.attr("min");
        const maxRaw = input.attr("max");
        const min = minRaw !== undefined && minRaw !== "" ? Number(minRaw) : undefined;
        const max = maxRaw !== undefined && maxRaw !== "" ? Number(maxRaw) : undefined;

        if (!Number.isFinite(value)) errors.push(`Valor inválido em ${label}.`);
        if (Number.isFinite(min) && value < min) errors.push(`${label} não pode ser menor que ${min}.`);
        if (Number.isFinite(max) && value > max) errors.push(`${label} não pode ser maior que ${max}.`);
      });

      return errors;
    };

    const bindGuardedButton = (dialog, buttonName, handler) => {
      requestAnimationFrame(() => {
        const button = dialog?.element?.find(`button[data-button='${buttonName}']`)?.[0];
        if (!button || button.dataset.phGuarded === "true") return;

        button.dataset.phGuarded = "true";
        button.addEventListener("click", async event => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          await handler();
        }, true);
      });
    };

    const openJournalPage = async uuid => {
      const page = await fromUuid(U.rawUUID(uuid));
      if (!page) return ui.notifications.warn("Journal não encontrado.");

      if (page.parent?.sheet) return page.parent.sheet.render(true, { pageId: page.id });
      return page.sheet?.render(true);
    };

    // ---------------------------------------------------------------------------
    // Catálogos de efeitos
    // ---------------------------------------------------------------------------
    const journalButton = (uuid, emoji, title) => `<button type="button" class="ph-journal-btn" data-uuid="${uuid}" title="${U.esc(title)}">${emoji}</button>`;

    const baseEffectDefs = ctx => [
      ...SPELL_FACTORS.map(([id, label, chat]) => ({ id, type: "checkbox", cost: 1, label, chat })),
      { id: "target-condition", type: "checkbox", cost: 1, label: "Impor <strong>Condição paradoxal ao alvo</strong>", chat: "Impor Condição paradoxal ao alvo", detail: "select", options: PARADOX_CONDITION_LINKS },
      {
        id: "abyssal-fatigue",
        type: "number",
        cost: 2,
        min: 0,
        max: Math.max(0, 5 - ctx.fatigue),
        disabled: ctx.fatigue >= 5,
        label: ctx.fatigue >= 5
          ? "Impor/aumentar <strong>Fadiga abissal</strong> (<em>máximo já atingido!</em>)"
          : "Impor/aumentar <strong>Fadiga abissal</strong> (máximo 5x)",
        chat: "Impor/aumentar Fadiga abissal"
      },
      { id: "deny-yantra", type: "checkbox", cost: 2, label: "<strong>Negar Yantra específico</strong> (exceto dedicado) por 1 cena", chat: "Negar acesso à Yantra específico por 1 cena", detail: "select", options: getActorYantraOptions(ctx.actor) },
      { id: "change-target", type: "checkbox", cost: 2, label: "<strong>Mudar o alvo</strong> do feitiço", chat: "Mudar o alvo do feitiço", detail: "text", placeholder: "Novo alvo" },
      { id: "delay-spell", type: "number", cost: 2, min: 0, max: 3, label: "<strong>Atrasar</strong> o efeito do feitiço em 1 turno (máximo 3x)", chat: "Atrasar o efeito do feitiço" },
      { id: "force-concentration", type: "checkbox", cost: 2, label: "Forçar <strong>concentração</strong> no feitiço", chat: "Forçar concentração no feitiço" },
      { id: "flare-nimbus", type: "checkbox", cost: 2, label: "<strong>Fulgura Nimbus obviamente</strong> por 1 cena", chat: "Fulgurar Nimbus por 1 cena" },
      {
        id: "common-incident",
        type: "number",
        cost: 2,
        min: 0,
        label: `Instaurar <strong>Incidente Pessoal ou Ambiental</strong> ${journalButton(UUIDS.personalIncident, "👤", "Incidentes Pessoais")} ${journalButton(UUIDS.environmentalIncident, "🏔️", "Incidentes Ambientais")}`,
        chat: "Incidente Pessoal ou Ambiental",
        detail: "text",
        placeholder: "Incidente(s) escolhido(s)"
      },
      { id: "abyssal-incident", type: "number", cost: 3, min: 0, label: "Instaurar <strong>Incidente Ambiental abissal</strong>", chat: "Incidente Ambiental abissal", detail: "text", placeholder: "Incidente(s) escolhido(s)" },
      { id: "lethal-damage", type: "number", cost: 3, min: 0, label: "Causar <strong>1 de dano letal</strong> ao conjurador ou alvo do feitiço", chat: "Dano letal", detail: "text", placeholder: "Quantidade e alvo do dano" },
      { id: "consume-resource", type: "select-number", cost: 4, min: 0, label: "Consumir <strong>1 de Mana ou Força de Vontade</strong>", chat: "Consumir Mana/Força de Vontade", options: ["Mana", "Força de Vontade"] },
      { id: "later-scene", type: "checkbox", cost: 4, label: "Manifestar Anomalias selecionadas <strong>em cena posterior</strong>", chat: "Manifestação posterior de Anomalias" },
      { id: "abyssal-entity", type: "entity", cost: 5, costLabel: "5+", label: "Invocar <strong>Entidade abissal</strong> (posto 2, +1 por Elevação extra)", chat: "Invocar Entidade abissal" },
      { id: "mage-condition", type: "checkbox", cost: 7, label: "Impor <strong>Condição paradoxal ao conjurador</strong>", chat: "Impor Condição paradoxal ao conjurador", detail: "select", options: PARADOX_CONDITION_LINKS }
    ];

    const eruptionEffectDefs = ctx => [
      { id: "super-nimbus", type: "checkbox", cost: 4, label: "<strong>Fulgurar Nimbus obviamente</strong> pela duração especial", chat: "Fulgurar Nimbus pela duração especial" },
      { id: "abyssal-veto", type: "checkbox", cost: 8, label: "Impor a Condição <strong>Veto abissal</strong>", chat: "Veto abissal", detail: "select", options: getActorArcanaOptions(ctx.actor) },
      { id: "extreme-incident", type: "checkbox", cost: 8, label: "Instaurar <strong>Incidente Ambiental abissal extremo</strong>", chat: "Incidente Ambiental abissal extremo", detail: "text", placeholder: "Incidente escolhido" },
      ...ZONES.map(([id, label, cost, checked]) => ({
        id,
        type: "zone-radio",
        cost,
        checked,
        label,
        chat: {
          "zone-none": "Sem zona antimagia",
          "zone-room": "Zona antimagia: 1 cômodo",
          "zone-house": "Zona antimagia: 1 casa média",
          "zone-floor": "Zona antimagia: 1 andar ou bairro pequeno",
          "zone-village": "Zona antimagia: 1 vila",
          "zone-city": "Zona antimagia: 1 cidade"
        }[id]
      }))
    ];

    const allEffectLabels = ctx => Object.fromEntries([...baseEffectDefs(ctx), ...eruptionEffectDefs(ctx)].map(effect => [effect.id, effect.chat ?? effect.label]));

    // ---------------------------------------------------------------------------
    // HTML comum
    // ---------------------------------------------------------------------------


    const headerRow = () => `<div class="ph-head"><div>Custo</div><div>Efeito paradoxal</div><div>Incidência</div></div>`;

    const DetailRenderers = {
      select: effect => `<select class="ph-detail ph-effect-detail">${U.options(effect.options)}</select>`,
      text: effect => `<input type="text" class="ph-detail ph-effect-detail" placeholder="${U.esc(effect.placeholder ?? "Detalhes")}">`,
      none: () => ""
    };

    const ControlRenderers = {
      checkbox(effect) {
        return `<label class="equipped checkBox ph-incidence-checkbox" for="ph-${effect.id}"><input id="ph-${effect.id}" type="checkbox" class="ph-effect-check"><span></span></label>`;
      },

      number(effect) {
        const max = effect.max !== undefined && effect.max !== "" ? `max="${effect.max}"` : "";
        const disabled = effect.disabled ? "disabled" : "";
        return `<input id="ph-${effect.id}" type="number" class="attribute-value ph-effect-number" min="${effect.min ?? 0}" ${max} ${disabled} value="0">`;
      },

      "select-number"(effect) {
        return `<input id="ph-${effect.id}" type="number" class="attribute-value ph-effect-number" min="${effect.min ?? 0}" value="0">`;
      },

      entity(effect) {
        return `<label class="equipped checkBox ph-incidence-checkbox" for="ph-${effect.id}"><input id="ph-${effect.id}" type="checkbox" class="ph-entity-check"><span></span></label>`;
      },

      "zone-radio"(effect) {
        return `<span class="cell ph-incidence-radio"><i class="activeIcon ${effect.checked ? "fas fa-dot-circle" : "far fa-circle"}"></i></span><input id="ph-${effect.id}" type="radio" name="antimagicZone" value="${effect.id}" ${effect.checked ? "checked" : ""} class="ph-hidden-radio">`;
      }
    };

    const detailHTML = effect => {
      if (effect.type === "select-number") return `<select class="ph-detail-select">${U.options(effect.options)}</select>`;
      if (effect.type === "entity") return `<input type="number" class="ph-entity-extra" min="0" value="" placeholder="Posto adicional">`;
      return DetailRenderers[effect.detail ?? "none"]?.(effect) ?? "";
    };

    const controlHTML = effect => ControlRenderers[effect.type]?.(effect) ?? "";

    const effectRowHTML = effect => `
<li class="ph-effect-row ${effect.type === "zone-radio" ? "item-row mta-native-radio ph-zone-choice ph-radio-row" : ""}"
  data-radio-group="${effect.type === "zone-radio" ? "antimagic-zone" : ""}"
  data-effect-id="${effect.id}"
  data-control="${effect.type}"
  data-cost="${effect.cost}"
  data-disabled="${effect.disabled ? "1" : "0"}">
  <div class="ph-cost">${effect.costLabel ?? effect.cost}</div>
  <div class="ph-effect-cell"><label for="ph-${effect.id}" class="ph-effect-label${effect.type === "zone-radio" ? " ph-clickable-label" : ""}">${effect.label}</label>${detailHTML(effect)}</div>
  <div class="ph-control-cell">${controlHTML(effect)}</div>
</li>`;

    const effectTableHTML = effects => `<div class="ph-table">${headerRow()}<ul class="ph-effect-list">${effects.map(effectRowHTML).join("")}</ul></div>`;

    // ---------------------------------------------------------------------------
    // Primeiro diálogo
    // ---------------------------------------------------------------------------
    const actorOptionsHTML = () => candidateActors.map((actor, index) => `<option value="${actor.id}" ${index === 0 ? "selected" : ""}>${U.esc(actor.name)}</option>`).join("");

    const buildFirstDialogContent = () => {
      const actor = candidateActors[0];
      const wisdom = getActorWisdom(actor);
      const durations = getDurationsByWisdom(wisdom);

      return `
<form class="mta-sheet mta-dialogue paradox-helper-dialog">
  <div class="ph-wrap">
    <div class="ph-form-row ph-actor-row">
      <label for="ph-actor"><strong>👤 Personagem</strong>:</label>
      <select id="ph-actor" name="actorId" class="ph-select">${actorOptionsHTML()}</select>
    </div>

    <hr class="ph-hr">

    <div class="ph-form-row"><label for="ph-raises"><strong>🔥 Elevações imediatas</strong>:</label><input id="ph-raises" type="number" name="raises" class="attribute-value ph-number" min="0" value="1"></div>
    <div class="ph-form-row"><label for="ph-wisdom"><strong>🧠 Sabedoria</strong>:</label><input id="ph-wisdom" type="number" name="wisdom" class="attribute-value ph-number" min="0" max="10" value="${wisdom}"></div>
    <div class="ph-form-row"><label for="ph-deferred"><strong>⏳ Paradoxo prorrogado</strong>:</label><input id="ph-deferred" type="number" name="deferred" class="attribute-value ph-number" min="0" value="${detectDeferredParadox(actor)}" readonly tabindex="-1"></div>
    <div class="ph-form-row"><label for="ph-fatigue"><strong>🪫 Fadiga abissal</strong>:</label><input id="ph-fatigue" type="number" name="fatigue" class="attribute-value ph-number" min="0" max="5" value="${detectAbyssalFatigue(actor)}" readonly tabindex="-1"></div>
    <div class="ph-form-row"><label for="ph-eruption"><strong>💥 Erupção abissal?</strong></label><label class="equipped checkBox" for="ph-eruption"><input id="ph-eruption" type="checkbox" name="eruption"><span></span></label></div>

    <hr class="ph-hr">

    <div class="ph-box">
      <legend class="ph-title"><strong>📌 Prévia</strong></legend>
      <p>• Aumento por prorrogação: <strong class="ph-deferred-bonus">0</strong></p>
      <p>• Duração de Anomalias: <strong class="ph-anomaly-duration">${durations.anomaly}</strong></p>
      <p>• Duração de Condições: <strong class="ph-condition-duration">${durations.condition}</strong></p>
      <p>• Elevações totais: <strong class="ph-total">1</strong></p>
    </div>

    <hr class="ph-hr">

    <legend class="ph-title"><strong>📣 Mensagem no chat</strong></legend>
    <ul class="ph-radio-list">
      <li class="item-row mta-native-radio" data-radio-group="visibility"><label for="ph-visible-gm" class="ph-clickable-label">👤 Somente para o <b>narrador</b></label><span class="cell"><i class="activeIcon fas fa-dot-circle"></i></span><input id="ph-visible-gm" type="radio" name="visibility" value="gm" checked class="ph-hidden-radio"></li>
      <li class="item-row mta-native-radio" data-radio-group="visibility"><label for="ph-visible-public" class="ph-clickable-label">👥 Público para os <b>jogadores</b></label><span class="cell"><i class="activeIcon far fa-circle"></i></span><input id="ph-visible-public" type="radio" name="visibility" value="public" class="ph-hidden-radio"></li>
    </ul>
  </div>
</form>`;
    };

    const collectFirstDialogData = async () => new Promise(resolve => {
      let d;
      let resolved = false;
      const finish = value => {
        if (!resolved) {
          resolved = true;
          resolve(value);
        }
      };

      d = new Dialog({
        title: "🌀 Parâmetros do Paradoxo",
        content: buildFirstDialogContent(),
        render: html => {
          const actorSelect = html.find("#ph-actor");
          const wisdomInput = html.find("#ph-wisdom");
          const deferredInput = html.find("#ph-deferred");
          const fatigueInput = html.find("#ph-fatigue");
          const raisesInput = html.find("#ph-raises");
          const eruptionInput = html.find("#ph-eruption");

          bindNativeRadioGroup(html, "visibility");

          const updatePreview = () => {
            const raises = Math.max(0, Number(raisesInput.val()) || 0);
            const wisdom = U.clamp(wisdomInput.val(), 0, 10);
            const deferred = Math.max(0, Number(deferredInput.val()) || 0);
            const durations = getDurationsByWisdom(wisdom);
            const deferredBonus = Math.floor(deferred / 4);
            const eruptionBonus = eruptionInput.prop("checked") ? deferred + 2 : 0;

            html.find(".ph-deferred-bonus").text(deferredBonus);
            html.find(".ph-anomaly-duration").text(durations.anomaly);
            html.find(".ph-condition-duration").text(durations.condition);
            html.find(".ph-total").text(raises + deferredBonus + eruptionBonus);
          };

          const syncActor = () => {
            const actor = game.actors.get(actorSelect.val());
            if (!actor) return;
            wisdomInput.val(getActorWisdom(actor));
            deferredInput.val(detectDeferredParadox(actor));
            fatigueInput.val(detectAbyssalFatigue(actor));
            updatePreview();
          };

          const submitFirst = () => {
            const errors = validateNumberLimits(d.element);
            if (errors.length) return ui.notifications.warn(errors[0]);

            const actor = game.actors.get(actorSelect.val());
            if (!actor) return ui.notifications.warn("Selecione um personagem válido.");

            const raises = Math.max(0, Number(raisesInput.val()) || 0);
            const wisdom = U.clamp(wisdomInput.val(), 0, 10);
            const deferred = Math.max(0, Number(deferredInput.val()) || 0);
            const fatigue = U.clamp(fatigueInput.val(), 0, 5);
            const eruption = eruptionInput.prop("checked");
            const deferredBonus = Math.floor(deferred / 4);
            const durations = getDurationsByWisdom(wisdom);

            finish({
              actor,
              raises,
              wisdom,
              deferred,
              fatigue,
              eruption,
              deferredBonus,
              available: raises + deferredBonus + (eruption ? deferred + 2 : 0),
              visibility: html.find("input[name='visibility']:checked").val() || "gm",
              anomalyDuration: durations.anomaly,
              conditionDuration: durations.condition
            });
            d.close();
          };

          actorSelect.on("change", syncActor);
          wisdomInput.add(deferredInput).add(fatigueInput).add(raisesInput).on("input", updatePreview);
          eruptionInput.on("change", updatePreview);

          updatePreview();
          bindGuardedButton(d, "ok", submitFirst);
        },
        buttons: {
          ok: { icon: '<i class="fas fa-check"></i>', label: "Continuar", callback: () => false },
          cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancelar", callback: () => finish(null) }
        },
        default: "ok",
        close: () => finish(null)
      }, { width: 500, resizable: true });

      d.render(true);
    });

    // ---------------------------------------------------------------------------
    // Segundo diálogo / efeitos
    // ---------------------------------------------------------------------------
    const buildSecondDialogContent = ctx => `
<form class="mta-sheet mta-dialogue paradox-builder-dialog">
  <div class="ph-wrap">
    <div class="ph-budget-grid">
      <div class="ph-box"><p>Disponíveis</p><p class="value ph-budget-total">${ctx.available}</p></div>
      <div class="ph-box"><p>Gastas</p><p class="value ph-budget-spent">0</p></div>
      <div class="ph-box"><p>Restantes</p><p class="value ph-budget-left">${ctx.available}</p></div>
    </div>

    <hr class="ph-hr">

    <legend class="ph-title ph-title-common"><strong>📜 Anomalias comuns</strong></legend>
    ${effectTableHTML(baseEffectDefs(ctx))}

    <hr class="ph-hr">

    <div class="ph-eruption-section" ${ctx.eruption ? "" : "hidden"}>
      <legend class="ph-title ph-title-eruption"><strong>💥 Anomalias superiores (Erupção abissal)</strong></legend>
      ${effectTableHTML(eruptionEffectDefs(ctx))}
    </div>

    <div class="ph-warning ph-budget-warning"><strong>⚠️ Anomalias escolhidas excedem as Elevações disponíveis!</strong></div>
  </div>
</form>`;


    const toggleRowDetails = row => {
      const control = row.data("control");
      const isActive = {
        checkbox: () => row.find(".ph-effect-check").prop("checked"),
        number: () => (Number(row.find(".ph-effect-number").val()) || 0) > 0,
        "select-number": () => (Number(row.find(".ph-effect-number").val()) || 0) > 0,
        entity: () => row.find(".ph-entity-check").prop("checked")
      }[control]?.() ?? false;

      row.find(".ph-detail, .ph-detail-select, .ph-entity-extra").toggle(isActive);
    };

    const EffectCollectors = {
      checkbox(row, cost) {
        if (!row.find(".ph-effect-check").prop("checked")) return null;
        return { qty: 1, total: cost, detail: row.find(".ph-detail").val()?.trim() ?? "" };
      },

      number(row, cost) {
        const qty = Math.max(0, Number(row.find(".ph-effect-number").val()) || 0);
        if (qty <= 0) return null;
        return { qty, total: cost * qty, detail: row.find(".ph-detail").val()?.trim() ?? "" };
      },

      "select-number"(row, cost) {
        const qty = Math.max(0, Number(row.find(".ph-effect-number").val()) || 0);
        if (qty <= 0) return null;
        return { qty, total: cost * qty, detail: row.find(".ph-detail-select").val()?.trim() ?? "" };
      },

      entity(row) {
        if (!row.find(".ph-entity-check").prop("checked")) return null;
        const extra = Math.max(0, Number(row.find(".ph-entity-extra").val()) || 0);
        return { qty: 1, total: 5 + extra, detail: `Posto ${2 + extra}${extra ? ` (+${extra} extra)` : ""}` };
      },

      "zone-radio"(row, cost, id) {
        if (!row.find("input[type='radio']").prop("checked") || id === "zone-none") return null;
        return { qty: 1, total: cost, detail: "" };
      }
    };

    const collectSelectedEffects = (html, ctx) => {
      const labels = allEffectLabels(ctx);
      const effects = [];

      html.find(".ph-effect-row").each((_, rowEl) => {
        const row = $(rowEl);
        const id = row.data("effect-id");
        const control = row.data("control");
        const cost = Number(row.data("cost")) || 0;
        const collected = EffectCollectors[control]?.(row, cost, id);

        if (collected) effects.push({ id, label: labels[id] ?? id, cost, ...collected });
      });

      return effects;
    };

    // ---------------------------------------------------------------------------
    // Chat / atualizações
    // ---------------------------------------------------------------------------
    const UpdateText = {
      safePart(value) {
        const text = String(value ?? "").trim();
        if (!text) return "";
        return text.startsWith("@UUID[") ? text : U.esc(text);
      },

      paren(...parts) {
        const text = parts.map(UpdateText.safePart).filter(Boolean).join(", ");
        return text ? ` (${text})` : "";
      },

      detail(effect) {
        return UpdateText.paren(effect?.detail);
      }
    };

    const UpdateRules = {
      "abyssal-fatigue": (ctx, effect) => {
        const current = ctx.fatigue;
        const next = U.clamp(current + effect.qty, 0, 5);
        return `${UUIDS.fatigue}: ${current ? `-${current}` : "ausente"} → -${next}`;
      },
      "target-condition": (ctx, effect) => `<b>Condição paradoxal</b> no alvo ${UpdateText.paren(effect.detail, ctx.conditionDuration)}`,
      "mage-condition": (ctx, effect) => `<b>Condição paradoxal</b> no conjurador${UpdateText.paren(effect.detail, ctx.conditionDuration)}`,
      "abyssal-veto": (ctx, effect) => {
        const arcano = U.arcanoFromDetail(effect.detail);
        return `${UUIDS.veto}${arcano ? ` em ${U.esc(arcano)}` : ""} (${U.esc(ctx.conditionDuration)})`;
      },
      "deny-yantra": (_ctx, effect) => `<b>Yantra negado</b> por 1 cena${UpdateText.detail(effect)}`,
      "later-scene": () => `<b>Manifestar posteriormente</b> anomalias selecionadas`,
      "factor-active-spell-slot": () => `Modificar <b>controle de Feitiço Ativo</b>`,
      "common-incident": (ctx, effect) => `Instaurar ${effect.qty} <b>Incidente(s) comum(ns)</b>${UpdateText.paren(effect.detail, ctx.anomalyDuration)}`,
      "abyssal-incident": (ctx, effect) => `Instaurar ${effect.qty} <b>Incidente(s) Ambiental(is) abissal(is)</b>${UpdateText.paren(effect.detail, ctx.anomalyDuration)}`,
      "extreme-incident": (ctx, effect) => `Instaurar <b>Incidente Ambiental abissal extremo</b>${UpdateText.paren(effect.detail, ctx.anomalyDuration)}`,
      "lethal-damage": (_ctx, effect) => `Aplicar ${effect.qty} de <b>ferimento(s) letal</b>${UpdateText.detail(effect)}`,
      "consume-resource": (_ctx, effect) => `<b>Consumir ${effect.qty}</b> de ${U.esc(effect.detail || "recurso")} do conjurador`
    };

    const buildSheetUpdates = (ctx, effects) => {
      const updates = effects.map(effect => UpdateRules[effect.id]?.(ctx, effect, effects)).filter(Boolean);
      if (ctx.eruption && ctx.deferred > 0) updates.push(`${UUIDS.deferred}: ${ctx.deferred} → 0`);
      return updates;
    };

    const ChatCard = {


      gap: `<p class="ph-chat-gap">&nbsp;</p><hr><p class="ph-chat-gap">&nbsp;</p>`,

      effectDetail(effect) {
        if (!effect.detail) return "";
        const detailValue = effect.id === "abyssal-veto" ? U.arcanoFromDetail(effect.detail) : U.plainUUID(effect.detail);
        return ` (<em>${U.esc(detailValue)}</em>)`;
      },

      effectLine(effect) {
        const qtyText = effect.qty > 1 ? ` × ${effect.qty}` : "";
        return `<li><strong>${effect.total}</strong>: ${U.esc(effect.label)}${qtyText}${ChatCard.effectDetail(effect)}</li>`;
      },

      render(ctx, effects) {
        const effectLines = effects.length ? effects.map(effect => ChatCard.effectLine(effect)).join("") : `<li>Nenhuma Anomalia selecionada.</li>`;
        const updateLines = buildSheetUpdates(ctx, effects).map(update => `<li>${update}</li>`).join("") || `<li>Nenhuma atualização de ficha</li>`;

        return `
<div class="paradox-chat-card">
  <h3>🌀 Paradoxo (${U.esc(ctx.actor.name)})</h3>
  <p>🧠 <strong>Sabedoria:</strong> ${ctx.wisdom}</p>
  <p>⏱️ <strong>Anomalias:</strong> ${U.esc(ctx.anomalyDuration)}</p>
  <p>🕯️ <strong>Condições:</strong> ${U.esc(ctx.conditionDuration)}</p>
  <p>💥 <strong>Erupção abissal:</strong> ${ctx.eruption ? "sim" : "não"}</p>
  ${ChatCard.gap}
  <h3>📜 Anomalias escolhidas</h3>
  <ul>${effectLines}</ul>
  ${ChatCard.gap}
  <h3>🆕 Atualizações de ficha</h3>
  <ul>${updateLines}</ul>
</div>`;
      }
    };

    const postToChat = async (ctx, effects) => {
      const chatData = {
        speaker: ChatMessage.getSpeaker({ actor: ctx.actor }),
        content: ChatCard.render(ctx, effects)
      };
      if (ctx.visibility === "gm") chatData.whisper = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
      await ChatMessage.create(chatData);
    };

    const openBuilderDialog = async ctx => new Promise(resolve => {
      let d;
      let resolved = false;
      const finish = value => {
        if (!resolved) {
          resolved = true;
          resolve(value);
        }
      };

      d = new Dialog({
        title: "🌀 Construção do Paradoxo",
        content: buildSecondDialogContent(ctx),
        render: html => {
          bindNativeRadioGroup(html, "antimagic-zone");

          const updateBudget = () => {
            html.find(".ph-effect-row").each((_, rowEl) => toggleRowDetails($(rowEl)));

            const effects = collectSelectedEffects(html, ctx);
            const spent = effects.reduce((sum, e) => sum + e.total, 0);
            const left = ctx.available - spent;
            const leftEl = html.find(".ph-budget-left");

            html.find(".ph-budget-spent").text(spent);
            leftEl
              .text(left)
              .removeClass("ph-budget-negative ph-budget-positive")
              .toggleClass("ph-budget-negative", left < 0)
              .toggleClass("ph-budget-positive", left > 0);
            html.find(".ph-budget-warning").toggle(left < 0);
            resizeToFit(d);
          };

          const submitSecond = async () => {
            const errors = validateNumberLimits(d.element);
            if (errors.length) return ui.notifications.warn(errors[0]);

            const effects = collectSelectedEffects(html, ctx);
            const spent = effects.reduce((sum, e) => sum + e.total, 0);

            if (ctx.available - spent < 0) {
              ui.notifications.warn("Anomalias escolhidas excedem as Elevações disponíveis!");
              updateBudget();
              return;
            }

            try {
              await ActorOps.applyAutomations(ctx, effects);
            } catch (error) {
              console.error(error);
              ui.notifications.warn(error.message ?? "Falha ao atualizar a ficha.");
              return;
            }

            await postToChat(ctx, effects);
            finish(true);
            d.close();
          };

          html.find(".ph-effect-check, .ph-entity-check, input[name='antimagicZone']").on("change", updateBudget);
          html.find(".ph-effect-number, .ph-entity-extra").on("input", updateBudget);
          html.find(".ph-detail-select").on("change", updateBudget);
          html.find(".ph-journal-btn").on("click", event => {
            event.preventDefault();
            event.stopPropagation();
            openJournalPage(event.currentTarget.dataset.uuid);
          });
          bindGuardedButton(d, "ok", submitSecond);

          updateBudget();
          resizeToFit(d);

          requestAnimationFrame(() => {
            d?.element?.find(".window-content").scrollTop(0);
            d?.element?.find("button").trigger("blur");
          });
        },
        buttons: {
          ok: { icon: '<i class="fas fa-check"></i>', label: "Enviar ao chat", callback: () => false },
          cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancelar", callback: () => finish(false) }
        },
        default: "ok",
        close: () => finish(false)
      }, { width: 700, resizable: true });

      d.render(true);
    });

    const ctx = await collectFirstDialogData();
    if (!ctx) return;
    await openBuilderDialog(ctx);
  }

  addProgressDialogue() {
    const ownedActors = this._codGetPlayerCharacterActors();
    const actorsById = new Map(ownedActors.map(actor => [actor.id, actor]));
    const content = this._codProgressBuildDialogContent(ownedActors);

    let d;

    d = new Dialog({
      title: "➕ Adicionar Experiência",
      content,
      render: html => this._codProgressBindDialog(html, d),
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirmar",
          callback: html => this._codProgressSubmit(html, actorsById)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancelar"
        }
      },
      default: "ok"
    });

    d.render(true);
  }

  _codProgressBuildDialogContent(ownedActors) {
    const actorCheckboxes = this._codBuildActorList(ownedActors, "cod-progress");
    const selectAllDisabled = ownedActors.length ? "" : "disabled";

    return `
<form class="mta-sheet mta-dialogue cod-progress-dialog">
  <div class="ms-wrap">

    <div class="cod-actor-header">
      <span></span>

      <legend class="cod-title">
        <strong>👤 Personagens</strong>
      </legend>

      <div class="cod-select-all-wrap">
        <label for="cod-progress-select-all" class="cod-select-all-label">✔️</label>

        <label class="equipped checkBox" for="cod-progress-select-all">
          <input
            id="cod-progress-select-all"
            type="checkbox"
            class="cod-select-all-checkbox"
            ${selectAllDisabled}
          >
          <span></span>
        </label>
      </div>
    </div>

    <ul class="cod-actor-list">
      ${actorCheckboxes}
    </ul>

    <hr role="separator" class="cod-separator">

    <div class="cod-form-row">
      <label for="cod-progress-reason" class="cod-field-label"><strong>🗂️ Motivo</strong>:</label>

      <select id="cod-progress-reason" name="input.reason" class="cod-reason-select">
        <optgroup label="Beat">
          <option value="beat:Presença">📆 Presença</option>
          <option value="beat:Aspiração">⌛ Aspiração</option>
          <option value="beat:Cena">🎬 Cena</option>
          <option value="beat:Cena (Combate)">&nbsp;&nbsp;&nbsp;&nbsp;⚔️ Combate</option>
          <option value="beat:Cena (Dano extenso)">&nbsp;&nbsp;&nbsp;&nbsp;🤕 Dano extenso</option>
          <option value="beat:Cena (Desafio de Habilidade)">&nbsp;&nbsp;&nbsp;&nbsp;🏁 Desafio de Habilidade</option>
          <option value="beat:Cena (Perseguição)">&nbsp;&nbsp;&nbsp;&nbsp;👣 Perseguição</option>
          <option value="beat:Cena (Protagonismo)">&nbsp;&nbsp;&nbsp;&nbsp;🤴 Protagonismo</option>
          <option value="beat:Cena (Rendição)">&nbsp;&nbsp;&nbsp;&nbsp;🏳️ Rendição ou derrota</option>
          <option value="beat:Condição">🗃️ Condição</option>
          <option value="beat:Falha Dramática">❌ Falha Dramática</option>
          <option value="beat:Impressão piorada">📉 Impressão piorada</option>
          <option value="beat:Ponto de Ruptura">🧠 Ponto de Ruptura</option>
          <option value="beat:Recompensa">🪙 Recompensa (missão)</option>
          <option value="beat:custom">⚙️ Personalizado</option>
        </optgroup>

        <optgroup label="Beat Arcano">
          <option value="arcane:Aspiração">⌛ Aspiração</option>
          <option value="arcane:Cena">🎬 Cena</option>
          <option value="arcane:Cena (Combate)">&nbsp;&nbsp;&nbsp;&nbsp;⚔️ Combate</option>
          <option value="arcane:Cena (Desafio de Habilidade)">&nbsp;&nbsp;&nbsp;&nbsp;🏁 Desafio de Habilidade</option>
          <option value="arcane:Cena (Protagonismo)">&nbsp;&nbsp;&nbsp;&nbsp;🤴 Protagonismo</option>
          <option value="arcane:Cena (Rendição)">&nbsp;&nbsp;&nbsp;&nbsp;🏳️ Rendição ou derrota</option>
          <option value="arcane:Condição">🗃️ Condição</option>
          <option value="arcane:Erupção abissal">💥 Erupção abissal</option>
          <option value="arcane:Falha Dramática">❌ Falha Dramática</option>
          <option value="arcane:Teste de Húbris">🥸 Teste de Húbris</option>
          <option value="arcane:Legado">🩸 Legado</option>
          <option value="arcane:Obsessão">⏱️ Obsessão</option>
          <option value="arcane:Paradoxo purgado">🫨 Paradoxo purgado</option>
          <option value="arcane:Recompensa">🪙 Recompensa (missão)</option>
          <option value="arcane:custom">⚙️ Personalizado</option>
        </optgroup>
      </select>
    </div>

    <div class="cod-custom-group" hidden>
      <div class="cod-form-row">
        <label for="cod-custom-reason" class="cod-field-label"><strong>📋 Descrição:</strong></label>

        <input
          id="cod-custom-reason"
          type="text"
          name="input.customReason"
          class="attribute-specialty cod-custom-reason"
          disabled
          placeholder="Descreva o motivo"
        />
      </div>
    </div>

    <div class="cod-amount-group">
      <div class="cod-amount-number cod-form-row">
        <label for="cod-progress-amount" class="cod-field-label"><strong>#️⃣ Quantidade de Beats</strong>:</label>

        <input
          id="cod-progress-amount"
          type="number"
          class="attribute-value cod-number-input"
          name="input.amount"
          data-dtype="Number"
          min="0"
          value="1"
        />
      </div>

      <div class="cod-amount-aspiration" hidden>
        <p><strong>#️⃣ Tipo de Aspiração:</strong></p>

        <ul class="cod-aspiration-list">
          <li class="item-row mta-native-radio cod-aspiration-choice" data-radio-group="input.aspirationMode" data-checked="1" data-disabled="0">
            <label for="cod-aspiration-double" class="cod-field-label cod-clickable-label">Dupla</label>
            <span class="cell cod-radio-icon-cell"><i class="activeIcon fas fa-dot-circle"></i></span>
            <input id="cod-aspiration-double" type="radio" name="input.aspirationMode" value="double" checked class="cod-hidden-radio">
          </li>

          <li class="item-row mta-native-radio cod-aspiration-choice" data-radio-group="input.aspirationMode" data-checked="0" data-disabled="0">
            <label for="cod-aspiration-single" class="cod-field-label cod-clickable-label">Única</label>
            <span class="cell cod-radio-icon-cell"><i class="activeIcon far fa-circle"></i></span>
            <input id="cod-aspiration-single" type="radio" name="input.aspirationMode" value="single" class="cod-hidden-radio">
          </li>
        </ul>
      </div>
    </div>

  </div>
</form>
`;
  }

  _codProgressBindDialog(html, dialog) {
    const refs = {
      selectAllCheckbox: html.find(".cod-select-all-checkbox"),
      actorCheckboxes: html.find(".cod-actor-checkbox"),
      reasonSelect: html.find(".cod-reason-select"),
      customInput: html.find(".cod-custom-reason"),
      customGroup: html.find(".cod-custom-group"),
      amountNumberWrap: html.find(".cod-amount-number"),
      amountAspWrap: html.find(".cod-amount-aspiration"),
      aspirationRadios: html.find("input[name='input.aspirationMode']")
    };

    refs.selectAllCheckbox.on("change", () => this._codSyncSelectAll(refs));
    refs.reasonSelect.on("change", () => this._codProgressUpdateDynamicSections(html, dialog, refs));

    this._codBindNativeRadioGroup(html, "input.aspirationMode");
    this._codSyncSelectAll(refs);
    this._codProgressUpdateDynamicSections(html, dialog, refs);
  }

  _codProgressParseReason(value) {
    const [kind = "", key = ""] = String(value ?? "").split(":");
    return { kind, key };
  }

  _codProgressUpdateDynamicSections(html, dialog, refs) {
    const { key } = this._codProgressParseReason(refs.reasonSelect.val());
    const isCustom = key === "custom";
    const isAspiration = key === "Aspiração";

    refs.customGroup.prop("hidden", !isCustom);
    refs.customInput.prop("disabled", !isCustom);
    if (!isCustom) refs.customInput.val("");

    refs.amountNumberWrap.prop("hidden", isAspiration);
    refs.amountAspWrap.prop("hidden", !isAspiration);

    if (isAspiration && !refs.aspirationRadios.filter(":checked").length) {
      refs.aspirationRadios.filter("[value='double']").prop("checked", true);
    }

    if (isAspiration) this._codSyncNativeRadioGroup(html, "input.aspirationMode");
    this._codResizeDialogToFit(dialog, "form.cod-progress-dialog");
  }

  _codProgressSubmit(html, actorsById) {
    const actorIds = this._codGetSelectedActorIds(html);

    if (!actorIds.length) {
      ui.notifications.warn("Selecione pelo menos um personagem.");
      return false;
    }

    const reasonValue = html.find("select[name='input.reason']").val();

    if (!reasonValue) {
      ui.notifications.warn("Selecione um motivo.");
      return false;
    }

    const { kind, key } = this._codProgressParseReason(reasonValue);
    const isArcane = kind === "arcane";
    const isCustom = key === "custom";
    let amount = 0;

    if (key === "Aspiração") {
      const mode = html.find("input[name='input.aspirationMode']:checked").val() || "double";
      amount = mode === "double" ? 2 : 1;
    } else {
      amount = Number(html.find("input[name='input.amount']").val()) || 0;

      if (amount < 0) {
        ui.notifications.warn("Informe uma quantidade de Beats válida.");
        return false;
      }
    }

    const customReason = String(html.find("input[name='input.customReason']").val() ?? "").trim();

    if (isCustom && !customReason) {
      ui.notifications.warn("Preencha o motivo personalizado.");
      return false;
    }

    const reasonLabel = isCustom ? customReason : key;
    const name = `${this._codGetDateLabel()} - ${reasonLabel}`;
    this._codApplyProgressToActors(actorIds, actorsById, name, isArcane ? 0 : amount, isArcane ? amount : 0);
  }

  spendProgressDialogue() {
    const ownedActors = this._codGetPlayerCharacterActors();
    const actorsById = new Map(ownedActors.map(actor => [actor.id, actor]));
    const content = this._codSpendBuildDialogContent(ownedActors);

    let d;

    d = new Dialog({
      title: "➖ Gastar Experiência",
      content,
      render: html => this._codSpendBindDialog(html, d),
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirmar",
          callback: html => this._codSpendSubmit(html, actorsById)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancelar"
        }
      },
      default: "ok"
    });

    d.render(true);
  }

  _codSpendBuildDialogContent(ownedActors) {
    const actorCheckboxes = this._codBuildActorList(ownedActors, "cod-spend");
    const selectAllDisabled = ownedActors.length ? "" : "disabled";

    return `
<form class="mta-sheet mta-dialogue cod-progress-dialog cod-spend-dialog">
  <div class="ms-wrap">

    <div class="cod-actor-header">
      <span></span>

      <legend class="cod-title">
        <strong>👤 Personagens</strong>
      </legend>

      <div class="cod-select-all-wrap">
        <label for="cod-spend-select-all" class="cod-select-all-label">✔️</label>

        <label class="equipped checkBox" for="cod-spend-select-all">
          <input id="cod-spend-select-all" type="checkbox" class="cod-select-all-checkbox" ${selectAllDisabled}>
          <span></span>
        </label>
      </div>
    </div>

    <ul class="cod-actor-list">
      ${actorCheckboxes}
    </ul>

    <hr role="separator" class="cod-separator">

    <legend class="cod-title cod-section-title">
      <strong>🔀 Modo de compra</strong>
    </legend>

    <ul class="cod-mode-list">
      <li class="cod-check-row">
        <label for="cod-spend-mixed" class="cod-field-label">💱 Compra mista?</label>
        <label class="equipped checkBox" for="cod-spend-mixed">
          <input id="cod-spend-mixed" type="checkbox" name="input.mixed">
          <span></span>
        </label>
      </li>
    </ul>

    <div class="cod-type-fields">
      <div class="cod-type-layout">
        <p>🎖️ Tipo de Beats:</p>

        <ul class="cod-type-list">
          <li class="item-row mta-native-radio cod-type-choice" data-radio-group="input.type" data-checked="1" data-disabled="0">
            <label for="cod-spend-type-beat" class="cod-field-label cod-clickable-label">Comuns</label>
            <span class="cell cod-radio-icon-cell"><i class="activeIcon fas fa-dot-circle"></i></span>
            <input id="cod-spend-type-beat" type="radio" name="input.type" value="beat" checked class="cod-hidden-radio">
          </li>

          <li class="item-row mta-native-radio cod-type-choice" data-radio-group="input.type" data-checked="0" data-disabled="0">
            <label for="cod-spend-type-arcane" class="cod-field-label cod-clickable-label">Arcanos</label>
            <span class="cell cod-radio-icon-cell"><i class="activeIcon far fa-circle"></i></span>
            <input id="cod-spend-type-arcane" type="radio" name="input.type" value="arcane" class="cod-hidden-radio">
          </li>
        </ul>
      </div>
    </div>

    <div class="cod-xp-fields">
      <div class="cod-form-row">
        <label for="cod-spend-xp" class="cod-field-label">🆙 Pontos de XP:</label>
        <input id="cod-spend-xp" type="number" class="attribute-value cod-number-input" name="input.amount" data-dtype="Number" min="0" value="1" />
      </div>
    </div>

    <hr class="cod-mixed-separator cod-separator" role="separator" hidden>

    <div class="cod-mixed-fields" hidden>
      <legend class="cod-title cod-section-title">
        <strong>💸 Beats gastos</strong>
      </legend>

      <ul class="cod-mixed-list">
        <li class="cod-form-row cod-compact-row">
          <label for="cod-spend-beats-common" class="cod-field-label">Comuns:</label>
          <input id="cod-spend-beats-common" type="number" class="attribute-value cod-number-input" name="input.beatsCommon" data-dtype="Number" min="0" value="0" />
        </li>

        <li class="cod-form-row cod-compact-row">
          <label for="cod-spend-beats-arcane" class="cod-field-label">Arcanos:</label>
          <input id="cod-spend-beats-arcane" type="number" class="attribute-value cod-number-input" name="input.beatsArcane" data-dtype="Number" min="0" value="0" />
        </li>
      </ul>

      <p class="cod-mixed-summary">Total: 0 Beats = 0 XP</p>
    </div>

    <hr role="separator" class="cod-separator">

    <div class="cod-form-row">
      <label for="cod-spend-custom-reason" class="cod-field-label"><strong>🛍️ Compra</strong>:</label>
      <input id="cod-spend-custom-reason" type="text" name="input.customReason" class="attribute-specialty cod-custom-reason" placeholder="Descreva o gasto" />
    </div>

  </div>
</form>
`;
  }

  _codSpendBindDialog(html, dialog) {
    const refs = {
      selectAllCheckbox: html.find(".cod-select-all-checkbox"),
      actorCheckboxes: html.find(".cod-actor-checkbox"),
      mixedCheckbox: html.find("input[name='input.mixed']"),
      xpFields: html.find(".cod-xp-fields"),
      mixedFields: html.find(".cod-mixed-fields"),
      mixedSeparator: html.find(".cod-mixed-separator"),
      xpTypeRadios: html.find("input[name='input.type']"),
      xpTypeGroup: html.find(".cod-type-fields"),
      beatsCommonInput: html.find("input[name='input.beatsCommon']"),
      beatsArcaneInput: html.find("input[name='input.beatsArcane']"),
      mixedSummary: html.find(".cod-mixed-summary")
    };

    refs.selectAllCheckbox.on("change", () => this._codSyncSelectAll(refs));
    refs.mixedCheckbox.on("change", () => {
      this._codSpendUpdateMode(html, dialog, refs);
      this._codSpendUpdateMixedSummary(refs);
    });
    refs.beatsCommonInput.on("input", () => this._codSpendUpdateMixedSummary(refs));
    refs.beatsArcaneInput.on("input", () => this._codSpendUpdateMixedSummary(refs));

    this._codBindNativeRadioGroup(html, "input.type");
    this._codSyncSelectAll(refs);
    this._codSpendUpdateMode(html, dialog, refs);
    this._codSpendUpdateMixedSummary(refs);
    this._codResizeDialogToFit(dialog, "form.cod-progress-dialog");
  }

  _codSpendUpdateMode(html, dialog, refs) {
    const mixed = refs.mixedCheckbox.prop("checked");

    refs.xpFields.prop("hidden", mixed);
    refs.xpTypeGroup.prop("hidden", mixed);
    refs.xpTypeRadios.prop("disabled", mixed);
    refs.mixedSeparator.prop("hidden", !mixed);
    refs.mixedFields.prop("hidden", !mixed);

    this._codSyncNativeRadioGroup(html, "input.type");
    this._codResizeDialogToFit(dialog, "form.cod-progress-dialog");
  }

  _codSpendUpdateMixedSummary(refs) {
    const common = Number(refs.beatsCommonInput.val()) || 0;
    const arcane = Number(refs.beatsArcaneInput.val()) || 0;
    const totalBeats = common + arcane;
    const xpEquivalent = totalBeats / 5;
    const xpStr = xpEquivalent.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    });

    refs.mixedSummary.text(`Total: ${totalBeats} Beats = ${xpStr} XP`);
  }

  _codSpendSubmit(html, actorsById) {
    const actorIds = this._codGetSelectedActorIds(html);

    if (!actorIds.length) {
      ui.notifications.warn("Selecione pelo menos um personagem.");
      return false;
    }

    const mixed = html.find("input[name='input.mixed']").prop("checked");
    let beats = 0;
    let arcaneBeats = 0;

    if (mixed) {
      const common = Number(html.find("input[name='input.beatsCommon']").val()) || 0;
      const arcane = Number(html.find("input[name='input.beatsArcane']").val()) || 0;

      if (common <= 0 && arcane <= 0) {
        ui.notifications.warn("Informe pelo menos alguns Beats comuns ou arcanos para a compra mista.");
        return false;
      }

      beats = common > 0 ? -common : 0;
      arcaneBeats = arcane > 0 ? -arcane : 0;
    } else {
      const xp = Number(html.find("input[name='input.amount']").val()) || 0;

      if (xp <= 0) {
        ui.notifications.warn("Informe uma quantidade de XP válida.");
        return false;
      }

      const type = html.find("input[name='input.type']:checked").val();

      if (!type) {
        ui.notifications.warn("Selecione Beat ou Beat Arcano.");
        return false;
      }

      const beatsSpent = -5 * xp;
      if (type === "beat") beats = beatsSpent;
      else if (type === "arcane") arcaneBeats = beatsSpent;
    }

    const customReason = String(html.find("input[name='input.customReason']").val() ?? "").trim();

    if (!customReason) {
      ui.notifications.warn("Preencha o motivo personalizado do gasto.");
      return false;
    }

    this._codApplyProgressToActors(actorIds, actorsById, `${this._codGetDateLabel()} - ${customReason}`, beats, arcaneBeats);
  }

  callAmnion() {
    const itemData = {
      type: "condition",
      name: "Amnion",
      img: "systems/mta/icons/gui/macro-amnion.svg",
      'system.effectsActive': true,
      'system.effects': [
        {
          name: "derivedTraits.armor",
          value: Math.min(this.system.mage_traits.gnosis.final, Math.max(...Object.values(this.system.arcana_subtle).map(arcanum => arcanum.value)))
        },
        {
          name: "attributes_social_dream.finesse",
          value: -2
        },
        {
          name: "derivedTraits.defense",
          value: -1
        }
      ]
    }
    return this.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * Adds a progress entry to the actor, with given name and beats.
   */
  addProgress(name = "", beats = 0, arcaneBeats = 0) {
    const system = this.system;
    beats = Math.floor(beats);
    arcaneBeats = Math.floor(arcaneBeats);
    let progress = system.progress ? foundry.utils.duplicate(system.progress) : [];
    progress.push({
      name: name,
      beats: beats,
      arcaneBeats: arcaneBeats
    });
    return this.update({
      'system.progress': progress
    });
  }

  /**
   * Removes a progress entry from the actor at a given position.
   * Note, that the first entry (__INITIAL__) is not part of the progress array;
   * the element coming after it has index 0.
   */
  removeProgress(index = 0) {
    const system = this.system;
    let progress = system.progress ? foundry.utils.duplicate(system.progress) : [];
    progress.splice(index, 1);
    return this.update({
      'system.progress': progress
    });
  }

  /**
   * Calculates and sets the maximum health for the actor using the formula
   * Stamina + Size.
   * If health is set lower than any damage, the damage is lost.
   */
  calculateAndSetMaxHealth() {
    const system = this.system;
    const maxHealth_old = system.health.max;
    //let maxHealth = data.derivedTraits.size.final + data.attributes_physical.stamina.final;
    let maxHealth = system.derivedTraits.health.final;
    //if(data.characterType === "Vampire") maxHealth += data.disciplines.common.resilience.value;

    let diff = maxHealth - maxHealth_old;
    if (diff === 0) return;

    let updateData = {}
    updateData['system.health.max'] = maxHealth;

    if (diff >= 0) { // New health is more than old
      updateData['system.health.lethal'] = (+system.health.lethal + diff);
      updateData['system.health.aggravated'] = (+system.health.aggravated + diff);
      updateData['system.health.value'] = (+system.health.value + diff);
    } else { // New health is less than old
      updateData['system.health.lethal'] = Math.max(0, (+system.health.lethal + diff));
      updateData['system.health.aggravated'] = Math.max(0, (+system.health.aggravated + diff));
      updateData['system.health.value'] = Math.max(0, (+system.health.value + diff));

      if (system.health.lethal < Math.abs(diff)) { // Too much lethal damage, upgrade lethal to aggravated damage.
        updateData['system.health.aggravated'] = Math.max(0, updateData['system.health.aggravated'] - Math.abs(Math.abs(diff) - system.health.lethal));
      }

      let diffBashing = Math.max(0, Math.abs(diff) - system.health.value);
      if (system.health.lethal < Math.abs(diff)) diffBashing -= Math.abs(Math.abs(diff) - system.health.lethal);
      if (diffBashing > 0) { // Too much bashing damage, upgrade bashing to lethal, or lethal to aggravated damage.
        updateData['system.health.lethal'] -= diffBashing;
        if (updateData['system.health.lethal'] < 0) {
          updateData['system.health.aggravated'] = Math.max(0, updateData['system.health.aggravated'] + updateData['system.health.lethal']);
          updateData['system.health.lethal'] = 0;
        }
      }
    }
    this.update(updateData);
  }

  /**
   * Calculates and sets the maximum splat-specific resource for the actor.
   * Mage: Mana (determined by Gnosis)
   * Vampire: Vitae (determined by Blood Potency)
   */
  calculateAndSetMaxResource() {
    const system = this.system;
    if (system.characterType === "Mage" || system.characterType === "Proximi" || system.characterType === "Scelesti") { // Mana
      let maxResource = (system.characterType === "Mage" || system.characterType === "Scelesti") ? CONFIG.MTA.gnosis_levels[Math.min(9, Math.max(0, system.mage_traits.gnosis.final - 1))].max_mana : 5;
      let updateData = {}
      updateData['system.mana.max'] = maxResource;
      this.update(updateData);
    } else if (system.characterType === "Vampire" || system.characterType === "Ghoul") { // Vitae
      let maxResource = CONFIG.MTA.bloodPotency_levels[Math.min(10, Math.max(0, system.vampire_traits.bloodPotency.final))].max_vitae;
      if (system.vampire_traits.bloodPotency.final < 1) maxResource = system.attributes_physical.stamina.final

      let obj = {}
      obj['system.vitae.max'] = maxResource;
      this.update(obj);
    } else if (system.characterType === "Werewolf") {
      let maxResource = CONFIG.MTA.primalUrge_levels[Math.min(9, Math.max(0, system.werewolf_traits.primalUrge.final - 1))].max_essence;

      let obj = {}
      obj['system.essence.max'] = maxResource;
      this.update(obj);
    } else if (system.characterType === "Demon") {
      let maxResource = CONFIG.MTA.primum_levels[Math.min(9, Math.max(0, system.demon_traits.primum.final - 1))].max_aether;

      let obj = {}
      obj['system.aether.max'] = maxResource;
      this.update(obj);
    } else if (system.characterType === "Sin-Eater") { // Plasm
      let maxResource = CONFIG.MTA.synergy_levels[Math.min(9, Math.max(0, system.sineater_traits.synergy.final - 1))].max_plasm;

      let obj = {}
      obj['system.plasm.max'] = maxResource;
      this.update(obj);
    }
  }

  /**
   * Calculates and sets the maximum clarity for the actor using the formula
   * Wits + Composure.
   * If clarity is set lower than any damage, the damage is lost.
   * Also calls updateChangelingTouchstones().
   */
  async calculateAndSetMaxClarity() {
    const system = this.system;
    const maxClarity_old = system.clarity.max;
    let maxClarity = system.attributes_mental.wits.final + system.attributes_social.composure.final;

    let updateData = {}
    updateData['system.clarity.max'] = maxClarity;

    let diff = maxClarity - maxClarity_old;
    if (diff > 0) {
      updateData['system.clarity.severe'] = "" + (+system.clarity.severe + diff);
      updateData['system.clarity.value'] = "" + (+system.clarity.value + diff);
    } else {
      updateData['system.clarity.severe'] = "" + Math.max(0, (+system.clarity.severe + diff));
      updateData['system.clarity.value'] = "" + Math.max(0, (+system.clarity.value + diff));
    }
    await this.update(updateData);
    this.updateChangelingTouchstones();
  }

  /**
   * Updates the number of touchstones based on the maximum clarity.
   */
  updateChangelingTouchstones() {
    const system = this.system;
    let touchstones = foundry.utils.duplicate(system.touchstones_changeling);
    let touchstone_amount = Object.keys(touchstones).length;
    if (touchstone_amount < system.clarity.max) {
      while (touchstone_amount < system.clarity.max) {
        touchstones[touchstone_amount + 1] = "";
        touchstone_amount = Object.keys(touchstones).length;
      }
    } else if (touchstone_amount > system.clarity.max) {
      while (touchstone_amount > system.clarity.max) {
        touchstones['-=' + touchstone_amount] = null;
        touchstone_amount -= 1;
      }
    }
    let updateData = {};
    updateData['system.touchstones_changeling'] = touchstones;
    this.update(updateData);
  }


  getNumDreadPowers() {
    let countDreadPowers = this.items.filter(item => item.type === "dreadPower").map(item => item.system.rating).reduce((a, b) => a + b, 0);
    countDreadPowers += this.items.filter(item => item.type === "numen").length;

    return countDreadPowers;
  }
}