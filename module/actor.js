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
        flavor += (general.allDicePools.final >= 0 ? ' (+' : ' (') + general.allDicePools.final + ' [todas])';
      }

      if (isPhysicalRoll && general.physicalDicePools.final) {
        dicePool += general.physicalDicePools.final;
        flavor += (general.physicalDicePools.final >= 0 ? ' (+' : ' (') + general.physicalDicePools.final + ' [física])';
      }

      if (isSocialRoll && general.socialDicePools.final) {
        dicePool += general.socialDicePools.final;
        flavor += (general.socialDicePools.final >= 0 ? ' (+' : ' (') + general.socialDicePools.final + ' [social])';
      }

      if (isMentalRoll && general.mentalDicePools.final) {
        dicePool += general.mentalDicePools.final;
        flavor += (general.mentalDicePools.final >= 0 ? ' (+' : ' (') + general.mentalDicePools.final + ' [mental])';
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
        <p style="margin:0;">Duração avançada (1 dia)</p>
        <label class="equipped checkBox" for="ms-mod-dur1d">
          <input id="ms-mod-dur1d" type="checkbox" name="dur1d"><span></span>
        </label>
      </li>
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;">Duração avançada (1 semana)</p>
        <label class="equipped checkBox" for="ms-mod-dur1w">
          <input id="ms-mod-dur1w" type="checkbox" name="dur1w"><span></span>
        </label>
      </li>
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;">Duração avançada (1 mês)</p>
        <label class="equipped checkBox" for="ms-mod-dur1m">
          <input id="ms-mod-dur1m" type="checkbox" name="dur1m"><span></span>
        </label>
      </li>
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;">Duração avançada (1 ano ou indefinida)</p>
        <label class="equipped checkBox" for="ms-mod-dur1y">
          <input id="ms-mod-dur1y" type="checkbox" name="dur1y"><span></span>
        </label>
      </li>
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;">Potência avançada</p>
        <label class="equipped checkBox" for="ms-mod-advPot">
          <input id="ms-mod-advPot" type="checkbox" name="advPot"><span></span>
        </label>
      </li>

      ${canSpendWill ? `
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;">⚡ Força de vontade</p>
        <label class="equipped checkBox" for="ms-mod-willpower">
          <input id="ms-mod-willpower" type="checkbox" name="willpower"><span></span>
        </label>
      </li>` : ``}
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <p style="margin:0;">⚙️ Modificadores genéricos</p>
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

      ui.notifications.warn(`Você recebeu Mana! O valor será atualizado automaticamente.`);
    };

    const warnScouredPattern = () => {
      ui.notifications.warn(`A Condição 'Padrão danificado' foi adicionada à sua ficha, ela atualiza seu atributo automaticamente.`);
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

    let d;

    d = new Dialog({
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

        requestAnimationFrame(() => {
          if (!d?.element?.length) return;

          const appEl = d.element;
          const headerH = appEl.find(".window-header").outerHeight(true) || 0;

          const contentEl = appEl.find(".window-content")[0];
          const contentH = contentEl ? contentEl.scrollHeight : 0;

          d.setPosition({ height: headerH + contentH + 8 });
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

            if (selected === "lethal") {
              await this.damage(1, "lethal", true);
              await grantMana();
              return;
            }

            if (selected === "strength") {
              await reduceAttribute("attributes_physical.strength");
              await grantMana();
              warnScouredPattern();
              return;
            }

            if (selected === "dexterity") {
              await reduceAttribute("attributes_physical.dexterity");
              await grantMana();
              warnScouredPattern();
              return;
            }

            if (selected === "stamina") {
              await reduceAttribute("attributes_physical.stamina");
              await grantMana();
              warnScouredPattern();
              return;
            }
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

    const escapeHTML = (value) => {
      const div = document.createElement("div");
      div.innerText = String(value ?? "");
      return div.innerHTML;
    };

    const spendMana = async (cost) => {
      const manaValue = Number(actor.system?.mana?.value ?? 0);
      const manaMax = Number(actor.system?.mana?.max ?? 0);

      await actor.update({
        "system.mana.value": Math.clamp(manaValue - cost, 0, manaMax)
      });

      ui.notifications.warn(`Você gastou Mana! O valor será atualizado automaticamente.`);
    };

    const getItemsByType = (type) => {
      return actor.items
        .filter(item => String(item.type).toLowerCase() === type)
        .sort((a, b) => {
          return String(a.name ?? "").localeCompare(String(b.name ?? ""), "pt-BR", {
            sensitivity: "base",
            numeric: true
          });
        });
    };
    const buildItemOptions = (items) => {
      if (!items.length) {
        return `<option value="">Nenhum item encontrado</option>`;
      }

      return items.map(item => `
      <option value="${item.id}">${escapeHTML(item.name)}</option>
    `).join("");
    };

    const buildItemSelectGroup = (option) => {
      if (!option.deleteType) return "";

      const items = getItemsByType(option.deleteType);
      const selectId = `${option.id}-select`;

      return `
      <div
        class="mta-restore-item-select"
        data-option="${option.value}"
        style="display:none;margin-top:10px;"
      >
        <hr role="separator" style="border:0;border-top:1px solid #d59861e6;margin:12px 0 12px;">

        <div style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;">
          <label for="${selectId}" style="margin:0;">${option.selectLabel}</label>

          <select
            id="${selectId}"
            name="input.${option.value}Item"
            class="mta-restore-item-choice"
            data-option="${option.value}"
            style="margin:0;width:auto;min-width:220px;"
            ${items.length ? "" : "disabled"}
          >
            ${buildItemOptions(items)}
          </select>
        </div>
      </div>
    `;
    };

    const confirmItemDeletion = (item, option) => {
      return new Promise(resolve => {
        let resolved = false;

        const finish = (value) => {
          if (resolved) return;
          resolved = true;
          resolve(value);
        };

        const content = `
<form class="mta-dialogue mta-restore-confirm-dialog">
  <div class="ms-wrap" style="padding:12px 14px 16px;">
    <p style="margin:4px 0 8px;line-height:1.35;text-align:justify;text-align-last:left;">
      <strong>ATENÇÃO!</strong> Você escolheu eliminar <strong>${escapeHTML(item.name)}</strong> da ficha de
      <strong>${escapeHTML(actor.name)}</strong>. Deseja prosseguir com a exclusão?
    </p>

    <p style="margin:4px 0 0;font-size:0.92em;opacity:0.78;line-height:1.35;text-align:justify;text-align-last:left;">
      Esta ação também gastará <strong>${option.manaCost} ponto${option.manaCost === 1 ? "" : "s"} de Mana</strong>.
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
    };

    const optionHTML = options.map(option => `
    <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:3px 0;">
      <label for="${option.id}" style="margin:0;line-height:1.25;">
        ${option.label}
      </label>

      <label class="equipped checkBox" for="${option.id}">
        <input
          id="${option.id}"
          type="checkbox"
          class="mta-restore-option"
          name="input.restoreOption"
          value="${option.value}"
          ${option.checked ? "checked" : ""}
        >
        <span></span>
      </label>
    </li>
  `).join("");

    const selectGroupsHTML = options.map(buildItemSelectGroup).join("");

    const content = `
<form class="mta-dialogue mta-restore-pattern-dialog">
  <div class="ms-wrap" style="padding:12px 14px 16px;">

    <p style="margin:4px 0 8px;line-height:1.35;text-align:justify;text-align-last:left;">
      ${description}
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
      ${optionHTML}
    </ul>

    ${selectGroupsHTML}


    <hr role="separator" style="border:0;border-top:1px solid #d59861e6;margin:12px 0 12px;">

    <p style="margin:4px 0 10px;font-size:0.92em;opacity:0.78;line-height:1.35;text-align:justify;text-align-last:left;">
    <strong>Obs.</strong>: <strong>Condições</strong> eliminadas desta forma <strong>não</strong> concedem um Beat como recompensa!
    </p>

  </div>
</form>
`;

    let d;

    d = new Dialog({
      title,
      content,
      render: html => {
        const optionInputs = html.find(".mta-restore-option");
        const selectGroups = html.find(".mta-restore-item-select");

        function resizeToFit() {
          requestAnimationFrame(() => {
            if (!d?.element?.length) return;

            const appEl = d.element;
            const headerH = appEl.find(".window-header").outerHeight(true) || 0;

            const contentEl = appEl.find(".window-content")[0];
            const contentH = contentEl ? contentEl.scrollHeight : 0;

            d.setPosition({ height: headerH + contentH + 8 });
          });
        }

        function updateItemSelectVisibility() {
          const selected = optionInputs.filter(":checked").val();

          selectGroups.hide();

          if (selected) {
            html.find(`.mta-restore-item-select[data-option="${selected}"]`).show();
          }

          resizeToFit();
        }

        optionInputs.on("change", event => {
          const changed = event.currentTarget;

          if (changed.checked) {
            optionInputs.not(changed).prop("checked", false);
          } else {
            changed.checked = true;
          }

          updateItemSelectVisibility();
        });

        updateItemSelectVisibility();
        resizeToFit();
      },
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirmar",
          callback: async html => {
            const selected = html.find(".mta-restore-option:checked").val();

            if (!selected) {
              ui.notifications.warn("Selecione uma opção de Restauração de Padrão.");
              return false;
            }

            const option = options.find(o => o.value === selected);

            if (!option) {
              ui.notifications.warn("A opção selecionada não foi reconhecida.");
              return false;
            }

            if (option.damage) {
              await actor.damage(option.damage.amount, option.damage.type, true);
              await spendMana(option.manaCost);
              return;
            }

            if (option.deleteType) {
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

              const confirmed = await confirmItemDeletion(item, option);

              if (!confirmed) return false;

              await actor.deleteEmbeddedDocuments("Item", [item.id]);
              await spendMana(option.manaCost);

              ui.notifications.warn(`O item '${item.name}' foi removido da ficha do personagem.`);
              return;
            }
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

  /**
   * A mage macro which conjures the amnion (as an item)
   * and equips it.
   */
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

  addProgressDialogue() {
    const escapeHTML = (value) => {
      const div = document.createElement("div");
      div.innerText = String(value ?? "");
      return div.innerHTML;
    };

    // Personagem principal de cada jogador (exclui GM)
    const ownedActors = [...new Set(
      game.users.players
        .map(u => u.character)
        .filter(a => !!a)
    )];

    const actorCheckboxes = ownedActors.length
      ? ownedActors.map(a => {
        const inputId = `cod-progress-actor-${a.id}`;

        return `
        <li class="cod-check-row" style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
          <label for="${inputId}" style="margin:0;">${escapeHTML(a.name)}</label>
          <label class="equipped checkBox" for="${inputId}">
            <input id="${inputId}" type="checkbox" class="cod-actor-checkbox" value="${a.id}">
            <span></span>
          </label>
        </li>
      `;
      }).join("")
      : `
      <li style="padding:2px 0;">
        <p style="margin:0;">Nenhum personagem principal de jogador encontrado.</p>
      </li>
    `;

    const content = `
<form class="mta-sheet mta-dialogue cod-progress-dialog">
  <div class="ms-wrap" style="padding:12px 14px 16px;">

    <legend class="ms-title" style="display:block;width:100%;text-align:center;margin:0 0 8px;">
      <strong>👤 Personagens</strong>
    </legend>

    <ul class="cod-actor-list" style="
      display:grid;
      grid-template-columns:1fr;
      row-gap:6px;
      margin:0;
      padding:0;
      list-style:none;
    ">
      ${actorCheckboxes}
    </ul>

    <hr role="separator" style="border:0;border-top:1px solid #d59861e6;margin:12px 0 12px;">

    <div style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;margin-top:6px;">
      <label for="cod-progress-reason" style="margin:0;"><strong>🗂️ Motivo</strong>:</label>

      <select id="cod-progress-reason" name="input.reason" class="cod-reason-select" style="margin:0;width:auto;min-width:220px;">
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

    <div class="cod-presence-all-group" style="display:none;margin-top:10px;">
      <ul style="display:grid;grid-template-columns:1fr;row-gap:6px;margin:0;padding:0;list-style:none;">
        <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
          <label for="cod-presence-all" style="margin:0;">Todos presentes?</label>
          <label class="equipped checkBox" for="cod-presence-all">
            <input id="cod-presence-all" type="checkbox" class="cod-presence-all-checkbox" checked>
            <span></span>
          </label>
        </li>
      </ul>
    </div>

    <div class="cod-custom-group" style="display:none;margin-top:10px;">
      <div style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;">
        <label for="cod-custom-reason" style="margin:0;">📋 Descrição:</label>
        <input
          id="cod-custom-reason"
          type="text"
          name="input.customReason"
          class="attribute-specialty cod-custom-reason"
          disabled
          placeholder="Descreva o motivo"
          style="margin:0;min-width:220px;"
        />
      </div>
    </div>

    <div class="cod-amount-group">
      <div class="cod-amount-number" style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;margin-top:10px;">
        <label for="cod-progress-amount" style="margin:0;"><strong>#️⃣ Quantidade de Beats</strong>:</label>

        <input
          id="cod-progress-amount"
          type="number"
          class="attribute-value"
          name="input.amount"
          data-dtype="Number"
          min="0"
          value="1"
          style="margin:0;width:84px;padding:2px 6px;text-align:right;"
        />
      </div>

      <div class="cod-amount-aspiration" style="display:none;grid-template-columns:1fr auto;align-items:center;column-gap:12px;margin-top:10px;">
        <p style="margin:0;">Aspiração:</p>

        <ul style="
          display:grid;
          grid-template-columns:1fr;
          row-gap:4px;
          margin:0;
          padding:0;
          list-style:none;
          min-width:120px;
        ">
          <li
            class="item-row mta-native-radio cod-aspiration-choice"
            data-radio-group="input.aspirationMode"
            style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;cursor:pointer;"
          >
            <label for="cod-aspiration-double" style="margin:0;cursor:pointer;">Dupla</label>
            <span class="cell" style="padding:0;">
              <i class="activeIcon fas fa-dot-circle"></i>
            </span>
            <input
              id="cod-aspiration-double"
              type="radio"
              name="input.aspirationMode"
              value="double"
              checked
              style="display:none;"
            >
          </li>

          <li
            class="item-row mta-native-radio cod-aspiration-choice"
            data-radio-group="input.aspirationMode"
            style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;cursor:pointer;"
          >
            <label for="cod-aspiration-single" style="margin:0;cursor:pointer;">Única</label>
            <span class="cell" style="padding:0;">
              <i class="activeIcon far fa-circle" style="visibility:visible;"></i>
            </span>
            <input
              id="cod-aspiration-single"
              type="radio"
              name="input.aspirationMode"
              value="single"
              style="display:none;"
            >
          </li>
        </ul>
      </div>
    </div>

  </div>
</form>
`;

    let d;
    d = new Dialog({
      title: "➕ Adicionar Experiência",
      content,
      render: html => {
        const reasonSelect = html.find(".cod-reason-select");
        const customInput = html.find(".cod-custom-reason");
        const customGroup = html.find(".cod-custom-group");

        const presenceAllGroup = html.find(".cod-presence-all-group");
        const presenceAllCheckbox = html.find(".cod-presence-all-checkbox");
        const actorCheckboxes = html.find(".cod-actor-checkbox");

        const amountNumberWrap = html.find(".cod-amount-number");
        const amountAspWrap = html.find(".cod-amount-aspiration");
        const aspirationRadios = html.find("input[name='input.aspirationMode']");

        function syncNativeRadioGroup(groupName) {
          const rows = html.find(`.mta-native-radio[data-radio-group="${groupName}"]`);

          rows.each((i, rowEl) => {
            const row = $(rowEl);
            const input = row.find("input[type='radio']");
            const icon = row.find(".activeIcon");
            const checked = input.prop("checked");

            if (checked) {
              icon
                .removeClass("far fa-circle")
                .addClass("fas fa-dot-circle")
                .css("visibility", "visible");

              row.css("opacity", "1");
            } else {
              icon
                .removeClass("fas fa-dot-circle")
                .addClass("far fa-circle")
                .css("visibility", "visible");

              row.css("opacity", "0.72");
            }
          });
        }

        function bindNativeRadioGroup(groupName) {
          const rows = html.find(`.mta-native-radio[data-radio-group="${groupName}"]`);

          rows.on("click", event => {
            const row = $(event.currentTarget);
            const input = row.find("input[type='radio']");

            if (input.prop("disabled")) return;

            rows.find("input[type='radio']").prop("checked", false);
            input.prop("checked", true).trigger("change");

            syncNativeRadioGroup(groupName);
          });

          rows.find("input[type='radio']").on("change", () => {
            syncNativeRadioGroup(groupName);
          });

          syncNativeRadioGroup(groupName);
        }

        function toggleCustom() {
          const value = reasonSelect.val() || "";
          const isCustom = value.endsWith(":custom");

          if (isCustom) {
            customGroup.show();
            customInput.prop("disabled", false);
          } else {
            customGroup.hide();
            customInput.prop("disabled", true).val("");
          }
        }

        function applyPresenceAll() {
          const value = reasonSelect.val() || "";
          const isPresence = (value === "beat:Presença");
          const allPresent = presenceAllCheckbox.prop("checked");

          if (isPresence && allPresent) {
            actorCheckboxes.prop("checked", true).prop("disabled", true);
            actorCheckboxes.closest(".cod-check-row").css("opacity", "0.65");
          } else {
            actorCheckboxes.prop("disabled", false);
            actorCheckboxes.closest(".cod-check-row").css("opacity", "1");
          }
        }

        function togglePresenceUI() {
          const value = reasonSelect.val() || "";
          const isPresence = (value === "beat:Presença");
          const wasVisible = presenceAllGroup.is(":visible");

          if (isPresence) {
            presenceAllGroup.show();

            if (!wasVisible) {
              presenceAllCheckbox.prop("checked", true);
            }
          } else {
            presenceAllGroup.hide();
            presenceAllCheckbox.prop("checked", false);
          }

          applyPresenceAll();
        }

        function toggleAmountUI() {
          const value = reasonSelect.val() || "";
          const parts = value.split(":");
          const key = parts[1] || "";

          const isAspiration = (key === "Aspiração");

          if (isAspiration) {
            amountNumberWrap.hide();
            amountAspWrap.css("display", "grid");

            if (!aspirationRadios.filter(":checked").length) {
              aspirationRadios.filter("[value='double']").prop("checked", true);
            }

            syncNativeRadioGroup("input.aspirationMode");
          } else {
            amountAspWrap.hide();
            amountNumberWrap.show();
          }
        }

        reasonSelect.on("change", () => {
          toggleCustom();
          togglePresenceUI();
          toggleAmountUI();
          resizeToFit();
        });

        presenceAllCheckbox.on("change", () => {
          applyPresenceAll();
          resizeToFit();
        });

        function resizeToFit() {
          requestAnimationFrame(() => {
            if (!d?.element?.length) return;

            const appEl = d.element;
            const headerH = appEl.find(".window-header").outerHeight(true) || 0;

            const contentEl = appEl.find(".window-content")[0];
            const contentH = contentEl ? contentEl.scrollHeight : 0;

            d.setPosition({ height: headerH + contentH + 8 });
          });
        }

        bindNativeRadioGroup("input.aspirationMode");

        toggleCustom();
        togglePresenceUI();
        toggleAmountUI();
        resizeToFit();
      },
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirmar",
          callback: html => {
            const actorIds = html.find(".cod-actor-checkbox:checked")
              .map((i, el) => el.value)
              .get();

            if (!actorIds.length) {
              ui.notifications.warn("Selecione pelo menos um personagem.");
              return false;
            }

            const reasonValue = html.find("select[name='input.reason']").val();

            if (!reasonValue) {
              ui.notifications.warn("Selecione um motivo.");
              return false;
            }

            const parts = reasonValue.split(":");
            const kind = parts[0];
            const key = parts[1];
            const isArcane = (kind === "arcane");
            const isCustom = (key === "custom");

            let amount = 0;

            if (key === "Aspiração") {
              const mode = html.find("input[name='input.aspirationMode']:checked").val() || "double";
              amount = (mode === "double") ? 2 : 1;
            } else {
              amount = Number(html.find("input[name='input.amount']").val()) || 0;

              if (amount < 0) {
                ui.notifications.warn("Informe uma quantidade de Beats válida.");
                return false;
              }
            }

            let customReason = html.find("input[name='input.customReason']").val();
            if (customReason) customReason = customReason.trim();

            if (isCustom && !customReason) {
              ui.notifications.warn("Preencha o motivo personalizado.");
              return false;
            }

            const today = new Date();
            const day = String(today.getDate()).padStart(2, "0");
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const year = String(today.getFullYear()).slice(-2);
            const dateStr = `${day}/${month}/${year}`;

            const reasonLabel = isCustom ? customReason : key;
            const name = `${dateStr} - ${reasonLabel}`;

            for (const id of actorIds) {
              const actor = game.actors.get(id);
              if (!actor || typeof actor.addProgress !== "function") continue;

              const beats = isArcane ? 0 : amount;
              const arcaneBeats = isArcane ? amount : 0;

              actor.addProgress(name, beats, arcaneBeats);
            }
          }
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

  spendProgressDialogue() {
    const escapeHTML = (value) => {
      const div = document.createElement("div");
      div.innerText = String(value ?? "");
      return div.innerHTML;
    };

    // Personagem principal de cada jogador (exclui GM)
    const ownedActors = [...new Set(
      game.users.players
        .map(u => u.character)
        .filter(a => !!a)
    )];

    const actorCheckboxes = ownedActors.length
      ? ownedActors.map(a => {
        const inputId = `cod-spend-actor-${a.id}`;

        return `
        <li class="cod-check-row" style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
          <label for="${inputId}" style="margin:0;">${escapeHTML(a.name)}</label>
          <label class="equipped checkBox" for="${inputId}">
            <input id="${inputId}" type="checkbox" class="cod-actor-checkbox" value="${a.id}">
            <span></span>
          </label>
        </li>
      `;
      }).join("")
      : `
      <li style="padding:2px 0;">
        <p style="margin:0;">Nenhum personagem principal de jogador encontrado.</p>
      </li>
    `;

    const content = `
<form class="mta-sheet mta-dialogue cod-progress-dialog">
  <div class="ms-wrap" style="padding:12px 14px 16px;">

    <legend class="ms-title" style="display:block;width:100%;text-align:center;margin:0 0 8px;">
      <strong>👤 Personagens</strong>
    </legend>

    <ul class="cod-actor-list" style="
      display:grid;
      grid-template-columns:1fr;
      row-gap:6px;
      margin:0;
      padding:0;
      list-style:none;
    ">
      ${actorCheckboxes}
    </ul>

    <hr role="separator" style="border:0;border-top:1px solid #d59861e6;margin:12px 0 12px;">

    <legend class="ms-title" style="display:block;width:100%;text-align:center;margin:0 0 8px;">
      <strong>🔀 Modo de compra</strong>
    </legend>

    <ul style="
      display:grid;
      grid-template-columns:1fr;
      row-gap:6px;
      margin:0;
      padding:0;
      list-style:none;
    ">
      <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
        <label for="cod-spend-mixed" style="margin:0;">💱 Compra mista?</label>
        <label class="equipped checkBox" for="cod-spend-mixed">
          <input id="cod-spend-mixed" type="checkbox" name="input.mixed">
          <span></span>
        </label>
      </li>
    </ul>

    <div class="cod-type-fields" style="margin-top:10px;">
      <div style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:12px;">
        <p style="margin:0;">🎖️ Tipo de Beats:</p>

        <ul style="
          display:grid;
          grid-template-columns:1fr;
          row-gap:4px;
          margin:0;
          padding:0;
          list-style:none;
          min-width:120px;
        ">
          <li
            class="item-row mta-native-radio cod-type-choice"
            data-radio-group="input.type"
            style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;cursor:pointer;"
          >
            <label for="cod-spend-type-beat" style="margin:0;cursor:pointer;">Comuns</label>
            <span class="cell" style="padding:0;">
              <i class="activeIcon fas fa-dot-circle"></i>
            </span>
            <input
              id="cod-spend-type-beat"
              type="radio"
              name="input.type"
              value="beat"
              checked
              style="display:none;"
            >
          </li>

          <li
            class="item-row mta-native-radio cod-type-choice"
            data-radio-group="input.type"
            style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;cursor:pointer;"
          >
            <label for="cod-spend-type-arcane" style="margin:0;cursor:pointer;">Arcanos</label>
            <span class="cell" style="padding:0;">
              <i class="activeIcon far fa-circle" style="visibility:visible;"></i>
            </span>
            <input
              id="cod-spend-type-arcane"
              type="radio"
              name="input.type"
              value="arcane"
              style="display:none;"
            >
          </li>
        </ul>
      </div>
    </div>

    <div class="cod-xp-fields" style="margin-top:10px;">
      <div style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;">
        <label for="cod-spend-xp" style="margin:0;">🆙 Pontos de XP:</label>

        <input
          id="cod-spend-xp"
          type="number"
          class="attribute-value"
          name="input.amount"
          data-dtype="Number"
          min="0"
          value="1"
          style="margin:0;width:84px;padding:2px 6px;text-align:right;"
        />
      </div>
    </div>

    <div class="cod-mixed-fields" style="display:none;margin-top:10px;">
      <legend class="ms-title" style="display:block;width:100%;text-align:center;margin:0 0 8px;">
        <strong>💸 Beats gastos</strong>
      </legend>

      <ul style="
        display:grid;
        grid-template-columns:1fr;
        row-gap:6px;
        margin:0;
        padding:0;
        list-style:none;
      ">
        <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
          <label for="cod-spend-beats-common" style="margin:0;">Comuns:</label>
          <input
            id="cod-spend-beats-common"
            type="number"
            class="attribute-value"
            name="input.beatsCommon"
            data-dtype="Number"
            min="0"
            value="0"
            style="margin:0;width:84px;padding:2px 6px;text-align:right;"
          />
        </li>

        <li style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;padding:2px 0;">
          <label for="cod-spend-beats-arcane" style="margin:0;">Arcanos:</label>
          <input
            id="cod-spend-beats-arcane"
            type="number"
            class="attribute-value"
            name="input.beatsArcane"
            data-dtype="Number"
            min="0"
            value="0"
            style="margin:0;width:84px;padding:2px 6px;text-align:right;"
          />
        </li>
      </ul>

      <p class="cod-mixed-summary" style="font-size:0.9em;opacity:0.8;margin:8px 0 0;text-align:center;">
        Total: 0 Beats = 0 XP
      </p>
    </div>

    <hr role="separator" style="border:0;border-top:1px solid #d59861e6;margin:12px 0 12px;">

    <div style="display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;">
      <label for="cod-spend-custom-reason" style="margin:0;"><strong>🛍️ Compra</strong>:</label>

      <input
        id="cod-spend-custom-reason"
        type="text"
        name="input.customReason"
        class="attribute-specialty cod-custom-reason"
        placeholder="Descreva o gasto"
        style="margin:0;min-width:220px;"
      />
    </div>

  </div>
</form>
`;

    let d;
    d = new Dialog({
      title: "➖ Gastar Experiência",
      content,
      render: html => {
        const mixedCheckbox = html.find("input[name='input.mixed']");
        const xpFields = html.find(".cod-xp-fields");
        const mixedFields = html.find(".cod-mixed-fields");
        const xpTypeRadios = html.find("input[name='input.type']");
        const xpTypeGroup = html.find(".cod-type-fields");
        const beatsCommonInput = html.find("input[name='input.beatsCommon']");
        const beatsArcaneInput = html.find("input[name='input.beatsArcane']");
        const mixedSummary = html.find(".cod-mixed-summary");

        function syncNativeRadioGroup(groupName) {
          const rows = html.find(`.mta-native-radio[data-radio-group="${groupName}"]`);

          rows.each((i, rowEl) => {
            const row = $(rowEl);
            const input = row.find("input[type='radio']");
            const icon = row.find(".activeIcon");
            const checked = input.prop("checked");
            const disabled = input.prop("disabled");

            if (checked) {
              icon
                .removeClass("far fa-circle")
                .addClass("fas fa-dot-circle")
                .css("visibility", "visible");

              row.css("opacity", disabled ? "0.45" : "1");
            } else {
              icon
                .removeClass("fas fa-dot-circle")
                .addClass("far fa-circle")
                .css("visibility", "visible");

              row.css("opacity", disabled ? "0.35" : "0.72");
            }

            row.css("cursor", disabled ? "default" : "pointer");
          });
        }

        function bindNativeRadioGroup(groupName) {
          const rows = html.find(`.mta-native-radio[data-radio-group="${groupName}"]`);

          rows.on("click", event => {
            const row = $(event.currentTarget);
            const input = row.find("input[type='radio']");

            if (input.prop("disabled")) return;

            rows.find("input[type='radio']").prop("checked", false);
            input.prop("checked", true).trigger("change");

            syncNativeRadioGroup(groupName);
          });

          rows.find("input[type='radio']").on("change", () => {
            syncNativeRadioGroup(groupName);
          });

          syncNativeRadioGroup(groupName);
        }

        function updateMode() {
          const mixed = mixedCheckbox[0]?.checked;

          if (mixed) {
            xpFields.hide();
            xpTypeGroup.hide();
            xpTypeRadios.prop("disabled", true);
            mixedFields.show();
          } else {
            xpFields.show();
            xpTypeGroup.show();
            xpTypeRadios.prop("disabled", false);
            mixedFields.hide();
          }

          syncNativeRadioGroup("input.type");
        }

        function updateMixedSummary() {
          const common = Number(beatsCommonInput.val()) || 0;
          const arcane = Number(beatsArcaneInput.val()) || 0;
          const totalBeats = common + arcane;
          const xpEquivalent = totalBeats / 5;

          const xpStr = xpEquivalent.toLocaleString("pt-BR", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2
          });

          mixedSummary.text(`Total: ${totalBeats} Beats = ${xpStr} XP`);
        }

        function resizeToFit() {
          requestAnimationFrame(() => {
            if (!d?.element?.length) return;

            const appEl = d.element;
            const headerH = appEl.find(".window-header").outerHeight(true) || 0;

            const contentEl = appEl.find(".window-content")[0];
            const contentH = contentEl ? contentEl.scrollHeight : 0;

            d.setPosition({ height: headerH + contentH + 8 });
          });
        }

        mixedCheckbox.on("change", () => {
          updateMode();
          updateMixedSummary();
          resizeToFit();
        });

        beatsCommonInput.on("input", updateMixedSummary);
        beatsArcaneInput.on("input", updateMixedSummary);

        bindNativeRadioGroup("input.type");

        updateMode();
        updateMixedSummary();
        resizeToFit();
      },
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirmar",
          callback: html => {
            const actorIds = html.find(".cod-actor-checkbox:checked")
              .map((i, el) => el.value)
              .get();

            if (!actorIds.length) {
              ui.notifications.warn("Selecione pelo menos um personagem.");
              return false;
            }

            const mixed = html.find("input[name='input.mixed']")[0]?.checked;

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

              if (type === "beat") {
                beats = beatsSpent;
              } else if (type === "arcane") {
                arcaneBeats = beatsSpent;
              }
            }

            let customReason = html.find("input[name='input.customReason']").val();
            if (customReason) customReason = customReason.trim();

            if (!customReason) {
              ui.notifications.warn("Preencha o motivo personalizado do gasto.");
              return false;
            }

            const today = new Date();
            const day = String(today.getDate()).padStart(2, "0");
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const year = String(today.getFullYear()).slice(-2);
            const dateStr = `${day}/${month}/${year}`;

            const name = `${dateStr} - ${customReason}`;

            for (const id of actorIds) {
              const actor = game.actors.get(id);
              if (!actor || typeof actor.addProgress !== "function") continue;

              actor.addProgress(name, beats, arcaneBeats);
            }
          }
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