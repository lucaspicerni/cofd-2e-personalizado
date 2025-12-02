import {
  ReloadDialogue
} from "./dialogue-reload.js";
import {
  createShortActionMessage
} from "./chat.js";
import {
  SkillEditDialogue
} from "./dialogue-skillEdit.js";
import {
  ProgressDialogue
} from "./dialogue-progress.js";
import "../lib/dragster/dragster.js";
import * as customui from "./ui.js";
import { TacticDialogue } from "./dialogue-tactic.js";

const getInventory = () => ({
  firearm: {
    dataset: [ { label: "MTA.DamageShort", property: "system.damage" }, { label: "MTA.Range" }, { label: "MTA.Cartridge", property: "system.cartridge" }, { label: "MTA.Magazine" }, { label: "MTA.InitiativeShort", property: "system.initiativeMod" }, { label: "MTA.Size", property: "system.size" }, { label: "MTA.QuantityShort", property: "system.quantity" } ]
  },
  melee: {
    dataset: [ { label: "MTA.Damage", property: "system.damage" }, { label: "MTA.Type", property: "system.type" }, { label: "MTA.Initiative", property: "system.initiative" }, { label: "MTA.Size", property: "system.size" }, { label: "MTA.QuantityShort", property: "system.quantityshort" } ]
  },
  explosive: {
    dataset: [ { label: "MTA.Damage", property: "system.damage" }, { label: "MTA.Initiative", property: "system.initiative" }, { label: "MTA.BlastArea", property: "system.blastarea" }, { label: "MTA.Force", property: "system.force" }, { label: "MTA.Size", property: "system.size" }, { label: "MTA.QuantityShort", property: "system.quantityshort" } ]
  },
  armor: {
    dataset: [ { label: "MTA.Rating", property: "system.rating" }, { label: "MTA.Defense", property: "system.defense" }, { label: "MTA.Speed", property: "system.speed" }, { label: "MTA.Coverage", property: "system.coverage" }, { label: "MTA.Structure", property: "system.structure" }, { label: "MTA.QuantityShort", property: "system.quantityshort" } ]
  },
  equipment: {
    dataset: [ { label: "MTA.DiceBonus", property: "system.dicebonus" }, { label: "MTA.Durability", property: "system.durability" }, { label: "MTA.Structure", property: "system.structure" }, { label: "MTA.Size", property: "system.size" }, { label: "MTA.QuantityShort", property: "system.quantityshort" } ]
  },
  ammo: {
    dataset: [ { label: "MTA.Cartridge", property: "system.cartridge" }, { label: "MTA.Quantity", property: "system.quantity" } ]
  },
  spell: {
    dataset: [ { label: "MTA.Arcanum", property: "system.arcanum" }, { label: "MTA.Level", property: "system.level" }, { label: "MTA.PrimaryFactorShort", property: "system.primaryFactor" }, { label: "MTA.Withstand", property: "system.withstand" }, { label: "MTA.RoteSkill", property: "system.roteSkill" } ]
  },
  activeSpell: {
    dataset: [ { label: "MTA.Arcanum", property: "system.arcanum" }, { label: "MTA.Level", property: "system.level" }, { label: "MTA.Potency", property: "system.potency" }, { label: "MTA.Duration", property: "system.duration" }, { label: "MTA.Scale", property: "system.scale" } ]
  },
  spellTemplate: {
    dataset: [ { label: "MTA.Arcanum", property: "system.arcanum" }, { label: "MTA.Level", property: "system.level" }, { label: "MTA.Potency", property: "system.potency" }, { label: "MTA.Duration", property: "system.duration" }, { label: "MTA.Scale", property: "system.scale" } ]
  },
  merit: {
    dataset: [ { label: "MTA.Rating", property: "system.rating" } ]
  },
  dreadPower: {
    dataset: [ { label: "MTA.Rating", property: "system.rating" } ]
  },
  numen: {
    dataset: [ { label: "MTA.Reaching", property: "system.reaching" } ]
  },
  manifestation: {
    dataset: []
  },
  influence: {
    dataset: [ { label: "MTA.Rating", property: "system.rating" } ]
  },
  demonPower: {
    dataset: [ { label: "MTA.Lore", property: "system.lore" }, { label: "MTA.Rating", property: "system.rating" }, { label: "MTA.Torment", property: "system.torment" } ]
  },
  condition: {
    dataset: [ { label: "MTA.Persistent", property: "system.persistent" } ]
  },
  tilt: {
    dataset: [ { label: "MTA.Environmental", property: "system.environmental" } ]
  },
  yantra: {
    dataset: [ { label: "MTA.DiceBonus", property: "system.dicebonus" }, { label: "MTA.Type", property: "system.type" } ]
  },
  attainment: {
    dataset: [ { label: "MTA.Arcanum", property: "system.arcanum" }, { label: "MTA.Level", property: "system.level" }, { label: "MTA.Legacy", property: "system.legacy" } ]
  },
  relationship: {
    dataset: [ { label: "MTA.Impression", property: "system.impression" }, { label: "MTA.Doors", property: "system.doors" }, { label: "MTA.Penalty", property: "system.penalty" } ]
  },
  vehicle: {
    dataset: [ { label: "MTA.DiceBonus", property: "system.dicebonus" }, { label: "MTA.Size", property: "system.size" }, { label: "MTA.Durability", property: "system.durability" }, { label: "MTA.Structure", property: "system.structure" }, { label: "MTA.Speed", property: "system.speed" } ]
  },
  devotion: {
    dataset: [ { label: "MTA.Cost", property: "system.cost" }, { label: "MTA.Action", property: "system.action" } ]
  },
  rite: {
    dataset: [ { label: "MTA.Type", property: "system.type" }, { label: "MTA.RiteTarget", property: "system.ritetarget" }, { label: "MTA.Withstand", property: "system.withstand" } ]
  },
  vinculum: {
    dataset: [ { label: "MTA.VinculumStage", property: "system.vinculumstage" } ]
  },
  discipline_power: {
    dataset: [ { label: "MTA.Discipline", property: "system.discipline" }, { label: "MTA.Level", property: "system.level" }, { label: "MTA.Cost", property: "system.cost" }, { label: "MTA.Action", property: "system.action" } ]
  },
  container: {
    dataset: [ { label: "MTA.Durability", property: "system.durability" }, { label: "MTA.Structure", property: "system.structure" }, { label: "MTA.Size", property: "system.size" } ]
  },
  service: {
    dataset: [ { label: "MTA.DiceBonus", property: "system.dicebonus" }, { label: "MTA.Skill", property: "system.skill" } ]
  },
  contract: {
    dataset: [ { label: "MTA.Type", property: "system.type" }, { label: "MTA.Cost", property: "system.cost" }, { label: "MTA.Action", property: "system.action" }, { label: "MTA.Duration", property: "system.duration" } ]
  },
  pledge: {
    dataset: [ { label: "MTA.Type", property: "system.type" } ]
  },
  form: {
    descriptions: {},
    dataset: []
  },
  facet: {
    dataset: [ { label: "MTA.Gift", property: "system.gift" }, { label: "MTA.Level", property: "system.level" }, { label: "MTA.Cost", property: "system.cost" }, { label: "MTA.Action", property: "system.action" } ]
  },
  werewolf_rite: {
    dataset: [ { label: "MTA.Type", property: "system.type" }, { label: "MTA.Level", property: "system.level" }, { label: "MTA.Action", property: "system.action" } ]
  },
  embed: {
    dataset: [ { label: "MTA.Category", property: "system.category" }, { label: "MTA.Action", property: "system.action" }, { label: "MTA.Key", property: "system.key" } ]
  },
  interlock: {
    dataset: [ { label: "MTA.Action", property: "system.action" }, { label: "MTA.Cost", property: "system.cost" }, { label: "MTA.Key", property: "system.key" } ]
  },
  exploit: {
    dataset: [ { label: "MTA.Action", property: "system.action" }, { label: "MTA.Cost", property: "system.cost" } ]
  },
  cover: {
    dataset: [ { label: "MTA.Rating", property: "system.rating" }, { label: "MTA.Beats", property: "system.beats" }, { label: "MTA.Active", property: "system.active" } ]
  },
  glitch: {
    dataset: [ { label: "MTA.Category", property: "system.category" }, { label: "MTA.Class", property: "system.class" }, { label: "MTA.Variation", property: "system.variation" } ]
  },
  pact: {
    dataset: [ { label: "MTA.DemonAspectPoints", property: "system.demonaspectpoints" }, { label: "MTA.HumanAspectPoints", property: "system.humanaspectpoints" }, { label: "MTA.Duration", property: "system.duration" } ]
  },
  formAbility: {
    dataset: [ { label: "MTA.Weapon", property: "system.weapon" }, { label: "MTA.Active", property: "system.active" } ]
  },
  coil: {
    dataset: [ { label: "MTA.Rating", property: "system.rating" }, { label: "MTA.Mystery", property: "system.mystery" } ]
  },
  scale: {
    dataset: [ { label: "MTA.Mystery", property: "system.mystery" } ]
  },
  tactic: {
    dataset: [ { label: "MTA.Favored", property: "system.favored" } ]
  },
  advanced_armory: {
    dataset: [ { label: "MTA.Loadout", property: "system.loadout" }, { label: "MTA.Action", property: "system.action" }, { label: "MTA.Duration", property: "system.duration" } ]
  },
  virtuous_ritual: {
    dataset: [ { label: "MTA.TargetSuccesses", property: "system.targetsuccesses" }, { label: "MTA.Duration", property: "system.duration" } ]
  },
  castigation_rite: {
    dataset: [ { label: "MTA.Cost", property: "system.cost" }, { label: "MTA.Action", property: "system.action" }, { label: "MTA.Duration", property: "system.duration" } ]
  },
  elixir: {
    dataset: [ { label: "MTA.Prepared", property: "system.prepared" }, { label: "MTA.Cost", property: "system.cost" }, { label: "MTA.Action", property: "system.action" }, { label: "MTA.Duration", property: "system.duration" } ]
  },
  perispiritism_ritual: {
    dataset: [ { label: "MTA.Cost", property: "system.cost" }, { label: "MTA.Action", property: "system.action" }, { label: "MTA.Duration", property: "system.duration" } ]
  },
  teleinformatics: {
    dataset: [ { label: "MTA.Cost", property: "system.cost" }, { label: "MTA.Action", property: "system.action" }, { label: "MTA.Duration", property: "system.duration" } ]
  },
  thaumatech_implant: {
    dataset: [ { label: "MTA.Cost", property: "system.cost" }, { label: "MTA.Action", property: "system.action" }, { label: "MTA.Duration", property: "system.duration" } ]
  },
  general_dice_pool: {
    dataset: [ { label: "MTA.Value", property: "system.value" } ]
  },
  combat_dice_pool: {
    dataset: [ { label: "MTA.Value", property: "system.value" }, { label: "MTA.Damage", property: "system.damage" } ]
  },
  haunt_power: {
    dataset: [ { label: "MTA.Haunt", property: "system.haunt" }, { label: "MTA.Rating", property: "system.rating" }, { label: "MTA.Cost", property: "system.cost" } ]
  },
  key: {
    dataset: [ { label: "MTA.Attribute", property: "system.attribute" }, { label: "MTA.Innate", property: "system.innate" } ]
  },
  ceremony: {
    dataset: [ { label: "MTA.Rating", property: "system.rating" }, { label: "MTA.Duration", property: "system.duration" } ]
  },
  spellEffect: {
    dataset: [ ]
  },
});

export class MtAActorSheet extends ActorSheet {
  constructor(...args) {
    super(...args);

    Hooks.on("closeProgressDialogue", (app, ele) => {
      if (app === this._progressDialogue) this._progressDialogue = null;
    });
  }

  /* -------------------------------------------- */

  /**
   * Get the correct HTML template path to use for rendering this particular sheet
   * @type {String}
   */
  get template() {
    if (!game.user.isGM && this.actor.limited) return "systems/mta/templates/actors/limited-sheet.html";
    if (this.actor.type === "ephemeral") return "systems/mta/templates/actors/ephemeral-sheet.html";
    if (this.actor.type === "simple_antagonist") return "systems/mta/templates/actors/simple-antagonist-sheet.html";
    if (this.actor.type === "brief_nightmare") return "systems/mta/templates/actors/brief-nightmare-sheet.html";
    return "systems/mta/templates/actors/character.html";
  }

  /* -------------------------------------------- */

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["mta-sheet", "worldbuilding", "sheet", "actor"],
      width: 1166,
      height: 830,
      dragDrop: [{dragSelector: "tbody .item-row:not(.no-drag)", dropSelector: null}],
      tabs: [{
        navSelector: ".tabs",
        contentSelector: ".sheet-body",
        initial: "attributes"
      }]
    });
  }

  /* -------------------------------------------- */

  /**
   * Prepare data for rendering the Actor sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async getData() {
    // The Actor's data
    const actor = this.actor;
    const systemData = actor.system;
    const items = actor.items;
    const sheetData = {};

    /* const data = super.getData();
    Object.assign(data.data, data.data.data)
    data.data.data = null; */ // Previous fix

    const inventory = getInventory();

    if (systemData.characterType === "Changeling") inventory.condition.dataset.push({label: "MTA.Clarity"});

    //Localise inventory headers
    Object.values(inventory).forEach(section => {
      section.items = [];
      section.dataset.forEach((item, i, a ) => a[i].label = game.i18n.localize(item.label));
    });

    items.forEach(item => {
      if (inventory[item.type]) {
        if (!inventory[item.type].items) {
          inventory[item.type].items = [];
        }
        inventory[item.type].items.push(item);
      }
    });
    
    //Inventory sorting
    const sortFlags = game.user.flags?.mta?.sort;
    if (sortFlags) {
      for (const itemType of Object.keys(inventory)) {
        const flag = sortFlags[itemType];

        if (!flag || flag?.sort === "none") {
          inventory[itemType].items.sort((a, b) => b.sort - a.sort);
          continue;
        }

        if (flag.sort === "special") {
          if (itemType === "spell") {
            inventory[itemType].items.sort((a, b) => {
              const get = (obj, path) => path.split('.').reduce((acc, part) => acc?.[part], obj);
        
              const arcA = get(a, "system.arcanum") ?? "";
              const arcB = get(b, "system.arcanum") ?? "";
        
              if (arcA !== arcB) return arcA.localeCompare(arcB);
        
              const lvlA = get(a, "system.level") ?? 0;
              const lvlB = get(b, "system.level") ?? 0;
        
              if (lvlA !== lvlB) return lvlA - lvlB;
        
              return (a.name ?? "").localeCompare(b.name ?? "");
            });
          }
          continue;
        }
        

        const property = flag.property;
        const sort = flag.sort;

        // Function to resolve the property path
        const resolveProperty = (obj, path) => {
          return path.split('.').reduce((acc, part) => acc?.[part], obj);
        };

        console.log("SORTING BY", property, sort)

        inventory[itemType].items.sort((a, b) => {
          let valA = resolveProperty(a, property);
          let valB = resolveProperty(b, property);
          console.log("A", a)

          // Handle null or undefined values
          if (valA == null && valB == null) return 0;
          if (valA == null) return sort === "up" ? -1 : 1;
          if (valB == null) return sort === "up" ? 1 : -1;

          // Handle strings
          if (typeof valA === "string" && typeof valB === "string") {
            return sort === "up" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }

          // Handle numbers
          if (typeof valA === "number" && typeof valB === "number") {
            return sort === "up" ? valA - valB : valB - valA;
          }

          // Handle booleans (true -> 1, false -> 0)
          if (typeof valA === "boolean" && typeof valB === "boolean") {
            return sort === "up" ? (valA - valB) : (valB - valA);
          }

          // Ignore unsupported types
          return 0;
        });
      }
    }
    else {
      for(let itemType in inventory){
        inventory[itemType].items.sort((a, b) => b.sort - a.sort);
      }
    }

    if(systemData.characterType === "Werewolf"){
      for (const form of inventory.form.items) {
        const item = items.get(form.id);
        const chatData = await item.getChatData({
          secrets: actor.isOwner
        });
        inventory.form.descriptions[form.id] = chatData.description;
      }
      
      systemData.essence_per_turn = CONFIG.MTA.primalUrge_levels[Math.min(9, Math.max(0, systemData.werewolf_traits.primalUrge.final - 1))].essence_per_turn;
    }

    if(systemData.characterType === "Demon"){
      sheetData.embed = {};
      sheetData.interlock = {};
      const keys_embeds = inventory.embed.items.filter(item => item.system.isKey);
      for(let i = 1; i <= 4; i++) {
        const key_embed = keys_embeds.find(item => item.system.keyNumber === i);
        const key_interlock = inventory.interlock.items.find(item => item.system.keyNumber === i);
        if(key_embed) sheetData.embed[i] = key_embed;
        if(key_interlock) sheetData.interlock[i] = key_interlock;
      }

      sheetData.seesCipher = systemData.cipherVisible || game.user.isGM;
      sheetData.seesFinalTruth = systemData.finalTruthVisible || game.user.isGM;
      sheetData.isGM = game.user.isGM;

      sheetData.aether_per_turn = CONFIG.MTA.primum_levels[Math.min(9, Math.max(0, systemData.demon_traits.primum.final - 1))].aether_per_turn;
      sheetData.currentCover = 0;
      for(let item of items) {
        if(item.type === "cover" && item.system.isActive) {
          sheetData.currentCover = item.system.rating;
          sheetData.currentCoverName = item.name;
          break;
        }
      }
    }

    const isAnyMage = systemData.characterType === "Mage" || systemData.characterType === "Scelesti";

    if (isAnyMage) sheetData.mana_per_turn = CONFIG.MTA.gnosis_levels[Math.min(9, Math.max(0, systemData.mage_traits.gnosis.final - 1))].mana_per_turn;
    else if (systemData.characterType === "Proximi") sheetData.mana_per_turn = 1;
    if (systemData.characterType === "Vampire" || systemData.characterType === "Ghoul") sheetData.vitae_per_turn = CONFIG.MTA.bloodPotency_levels[Math.min(10, Math.max(0, systemData.vampire_traits.bloodPotency.final))].vitae_per_turn;
    if (systemData.characterType === "Changeling") sheetData.glamour_per_turn = CONFIG.MTA.glamour_levels[Math.min(9, Math.max(0, systemData.changeling_traits.wyrd.value - 1))].glamour_per_turn;
    if (actor.type === "character") {
      systemData.progress ||= [];

      let beats = systemData.progress.reduce((acc, cur) => {
        if (cur && cur.beats) return acc + +cur.beats;
        else return acc;
      }, 0);

      if(systemData.beats) {
        beats += systemData.beats;
      }
      if(systemData.experience) {
        beats += 5*systemData.experience;
      }

      sheetData.beats_computed = beats % 5;
      sheetData.experience_computed = Math.floor(beats / 5);
    }

    const beatsKey = CONFIG.MTA.EXTRA_BEAT_CONFIG[systemData.characterType];

    sheetData.extraBeatsName = beatsKey ? game.i18n.localize(beatsKey) : undefined;

    const expKey = CONFIG.MTA.EXTRA_EXP_CONFIG[systemData.characterType];
    sheetData.extraExpName = expKey ? game.i18n.localize(expKey) : undefined;


    if (sheetData.extraBeatsName != undefined){
      
      let arcaneBeats = systemData.progress.reduce((acc, cur) => {
        if (cur && cur.arcaneBeats) return acc + 1 * cur.arcaneBeats;
        else return acc;
      }, 0);
      if(systemData.arcaneBeats) {
        arcaneBeats += systemData.arcaneBeats;
      }
      if(systemData.arcaneExperience) {
        arcaneBeats += 5*systemData.arcaneExperience;
      }


      sheetData.arcaneBeats_computed = arcaneBeats % 5;
      sheetData.arcaneExperience_computed = Math.floor(arcaneBeats / 5);
    }

    if (isAnyMage) {
      sheetData.activeSpells = {
        value: inventory.activeSpell.items.reduce((acc, cur) => cur.system.isRelinquishedSafely ? acc + 0 : cur.system.isRelinquished ? acc + 0 : acc + 1, 0),
        max: isAnyMage ? systemData.mage_traits.gnosis.final : 1
      };
    }

    if (systemData.characterType === "Proximi") {
      sheetData.blessingLimit = {
        value: inventory.spell.items.reduce((acc, cur) => {
          return acc + cur.system.level;
        }, 0),
        max: 30
      };
    }

    if(systemData.characterType === "Hunter"){
      sheetData.thaumatech_count = inventory.thaumatech_implant.items.length;
      sheetData.thaumatech_max = systemData.attributes_physical.stamina.final + systemData.derivedTraits.size.final;
      sheetData.elixir_count = inventory.elixir.items.reduce((acc, elixir) => acc + elixir.system.prepared, 0) || 0;
      sheetData.elixir_max = systemData.attributes_physical.stamina.final + systemData.hunter_traits.elixir.value; //FIXME: value instead of final?
      sheetData.benediction_effective = systemData.hunter_traits.benediction.value + Math.min(0, systemData.integrity - 5);
    }

    if(systemData.characterType === "Sin-Eater"){
      sheetData.plasm_per_turn = CONFIG.MTA.synergy_levels[Math.min(9, Math.max(0, systemData.sineater_traits.synergy.final - 1))]?.plasm_per_turn;
      inventory.ceremony.dataset.push({label: game.i18n.localize("MTA.Innate")});
    }

    sheetData.possibleRemembranceTraits = {
      skills: JSON.parse(JSON.stringify(CONFIG.MTA.all_traits.skills))
    };

    for (const key in sheetData.possibleRemembranceTraits) {
      let t = sheetData.possibleRemembranceTraits[key];
      t.list = t.list.reduce((prev, val) => {
        let ret = {};
        Object.entries(CONFIG.MTA[val]).forEach(e => {
          ret[val + '.' + e[0]] = e[1];
        });

        return { ...prev, ...ret };
      }, {});
    }

    const meritList = {};

    this.actor.items.forEach(item => {
      if (item.type === "merit") meritList[item.id] = item.name;
    });

    sheetData.possibleRemembranceTraits.merits = {
      name: "MTA.Merits",
      list: meritList
    };

    if (actor.type === "ephemeral") {
      if(systemData.ephemeralType === "Supernal Entity") {
        sheetData.ephemeralEntityName = CONFIG.MTA.supernalEntityTypes[systemData.supernalArcanum1];

        sheetData.activeSpells = {
          value: inventory.activeSpell.items.reduce((acc, cur) => cur.system.isRelinquishedSafely ? acc + 0 : cur.system.isRelinquished ? acc + 0 : acc + 1, 0),
          max: 99
        };
      }
      else {
        if (systemData.eph_general.rank.final > 10) sheetData.ephemeralEntityName = "Uber-Entity"
        else if (systemData.eph_general.rank.final < 1) sheetData.ephemeralEntityName = "Lesser Entity"
        else sheetData.ephemeralEntityName = CONFIG.MTA.ephemeral_ranks[systemData.eph_general.rank.final - 1][systemData.ephemeralType];

        if (systemData.sineaterId) sheetData.ephemeralEntityName = "Geist";
      }
    }

    //Get additional attributes & skills from config file
    if (actor.type === "character") {
      Object.entries(CONFIG.MTA.attributes_physical).forEach(([key,value], index) => {
        if(!systemData.attributes_physical[key]) systemData.attributes_physical[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.attributes_social).forEach(([key,value], index) => {
        if(!systemData.attributes_social[key]) systemData.attributes_social[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.attributes_mental).forEach(([key,value], index) => {
        if(!systemData.attributes_mental[key]) systemData.attributes_mental[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.skills_physical).forEach(([key,value], index) => {
        if(!systemData.skills_physical[key]) systemData.skills_physical[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.skills_social).forEach(([key,value], index) => {
        if(!systemData.skills_social[key]) systemData.skills_social[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.skills_mental).forEach(([key,value], index) => {
        if(!systemData.skills_mental[key]) systemData.skills_mental[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.arcana_gross).forEach(([key,value], index) => {
        if(!systemData.arcana_gross[key]) systemData.arcana_gross[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.arcana_subtle).forEach(([key,value], index) => {
        if(!systemData.arcana_subtle[key]) systemData.arcana_subtle[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.disciplines_common).forEach(([key,value], index) => {
        if(!systemData.disciplines_common[key]) systemData.disciplines_common[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.disciplines_unique).forEach(([key,value], index) => {
        if(!systemData.disciplines_unique[key]) systemData.disciplines_unique[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.werewolf_renown).forEach(([key,value], index) => {
        if(!systemData.werewolf_renown[key]) systemData.werewolf_renown[key] = {value: 0};
      });
    }
    else if (actor.type === "ephemeral") {
      Object.entries(CONFIG.MTA.eph_physical).forEach(([key,value], index) => {
        if(!systemData.eph_physical[key]) systemData.eph_physical[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.eph_social).forEach(([key,value], index) => {
        if(!systemData.eph_social[key]) systemData.eph_social[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.eph_mental).forEach(([key,value], index) => {
        if(!systemData.eph_mental[key]) systemData.eph_mental[key] = {value: 0};
      });
    }
    else if (actor.type === "simple_antagonist") {
      Object.entries(CONFIG.MTA.attributes_physical).forEach(([key,value], index) => {
        if(!systemData.attributes_physical[key]) systemData.attributes_physical[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.attributes_social).forEach(([key,value], index) => {
        if(!systemData.attributes_social[key]) systemData.attributes_social[key] = {value: 0};
      });
      Object.entries(CONFIG.MTA.attributes_mental).forEach(([key,value], index) => {
        if(!systemData.attributes_mental[key]) systemData.attributes_mental[key] = {value: 0};
      });

      for (const item of inventory.general_dice_pool.items) {
        item.system.enrichedDescription = await TextEditor.enrichHTML(item.system.description, { secrets: this.actor.isOwner, entities: true });
      }

      for (const item of inventory.combat_dice_pool.items) {
        item.system.enrichedDescription = await TextEditor.enrichHTML(item.system.description, { secrets: this.actor.isOwner, entities: true });
      }
    }

    sheetData.enrichedDescription = await TextEditor.enrichHTML(this.actor.system.description, { secrets: this.actor.isOwner, entities: true });
    sheetData.enrichedNimbus = await TextEditor.enrichHTML(this.actor.system.nimbus, { secrets: this.actor.isOwner, entities: true });


    const data = {
      actor,
      inventory,
      system: systemData,
      owner: actor.isOwner,
      limited: actor.limited,
      options: this.options,
      editable: this.isEditable,
      cssClass: actor.isOwner ? "editable" : "locked",
      config: CONFIG.MTA,
      rollData: this.actor.getRollData.bind( this.actor ), // What is this?
      ...sheetData
    };
    console.log(data)
    data.owodAttributeOrdering = game.settings.get("mta", "owodAttributeOrdering");

    return data;
  }

  /* -------------------------------------------- */

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
    super.activateListeners(html);

    //Custom select text boxes
    customui.registerCustomSelectBoxes(html, this);
    
    //Health tracker
    /* this._onBoxChange(html); */
    this._initialiseDotTrackers(html);

    // 
    html.find('.cell.item-name span').click(event => this._onItemSummary(event));

    // Collapse item table
    html.find('.item-table .cell.header.first .collapsible.button').click(event => this._onTableCollapse(event));
    
    // Receive collapsed state from flags
    html.find('.item-table .cell.header.first .collapsible.button').toArray().filter(ele => {
      if(this.actor &&  this.actor.id && game.user.flags.mta && game.user.flags.mta[this.actor.id] && game.user.flags.mta[this.actor.id][$(ele).siblings('.sortable.button')[0].dataset.type] && game.user.flags.mta[this.actor.id][$(ele).siblings('.sortable.button')[0].dataset.type].collapsed){
        $(ele).parent().parent().parent().siblings('tbody').hide();
        $(ele).addClass("fa-plus-square");
      }
    });
    
    // Special sorts
    html.find('.item-table .super-sort.button').click(event => this._onSuperSort(event));

    // Sort item table
    html.find('.item-table .sortable.button').click(event => this._onTableSort(event));

    html.find('.item-table .super-sort.button').toArray().forEach(ele => {
      const itemType = ele.dataset.sorttype;
      if(!itemType || !game.user.flags.mta?.sort) return;

      const sortData = game.user.flags.mta.sort[itemType];

      if(sortData && sortData.sort === "special"){
        const et = $(ele).children(".super-sort");
        $(ele).addClass("active");
      }
    });
    
    // Receive sort state from flags
    html.find('.item-table .sortable.button').toArray().forEach(ele => {
      const property = ele.dataset.sortproperty;
      const itemType = ele.dataset.sorttype;
      if(!property || !itemType || !game.user.flags.mta?.sort) return;

      const sortData = game.user.flags.mta.sort[itemType];

      if(sortData && sortData.property === property){
        const sort = sortData.sort;
        const et = $(ele).children(".fas");
        if (sort === "up") { // sort A-Z
          et.removeClass("fa-sort");
          et.addClass("fa-sort-up");

        }
        else if (sort === "down") { // sort Z-A
          et.removeClass("fa-sort");
          et.removeClass("fa-sort-up");
          et.addClass("fa-sort-down");
        }
      }
    });

    /* Everything below here is only needed if the sheet is editable */
    if (!this.options.editable) return;

    html.find('.geist-actor-button').click(event => {
      const actor = this.actor.system.geistActor ?? this.actor.system.sineaterActor;
      if (!actor) return console.error("Error: actor not found");
      console.log("OPENING", actor)
      actor.sheet.render(true);
    });

    // Update Inventory Item
    html.find('.item-edit').click(event => {
      const itemId = event.currentTarget.closest(".item-edit").dataset.itemId;
      const item = this.actor.items.get(itemId);
      item.sheet.render(true);
    });

    html.find('.item-delete').click(ev => {
      const itemId = event.currentTarget.closest(".item-delete").dataset.itemId;

      if(ev.shiftKey) { // Delete immediately
        this.actor.deleteEmbeddedDocuments("Item",[itemId]);
        return;
      }

      // Confirmation dialogue
      let d = new Dialog({
        title: "Confirmar exclusão",
        content: "<p>Tem certeza de que quer excluir permanentemente este item?</p><p>(Segurar Shift pula este diálogo)</p>",
        buttons: {
         one: {
          icon: '<i class="fas fa-trash"></i>',
          label: "Excluir",
          callback: () => this.actor.deleteEmbeddedDocuments("Item",[itemId])
         },
         two: {
          label: "Cancelar"
         }
        },
        default: "two"
       });
       d.render(true);
    });

    // Update dicepool
				
    html.find('.dicepool-name.antagonist').change(event => {
      const itemId = event.currentTarget.closest(".dicepool-name.antagonist").dataset.itemId;
      if(itemId) {
        const val = event.target.value;
        const updates = [{_id: itemId, name: val}];
        this.actor.updateEmbeddedDocuments("Item", updates);
      }
    });
				
    html.find('.dicepool-value.antagonist').change(event => {
      const itemId = event.currentTarget.closest(".dicepool-value.antagonist").dataset.itemId;
      const type = event.currentTarget.closest(".dicepool-value.antagonist").dataset.type;
      console.log("TY", type)
      if(itemId) {
        if(type === "value") {
          const val = +event.target.value;
          const updates = [{_id: itemId, system: {value: val}}];
          this.actor.updateEmbeddedDocuments("Item", updates);
        }
        else if(type === "damage") {
          const val = +event.target.value;
          const updates = [{_id: itemId, system: {damage: val}}];
          this.actor.updateEmbeddedDocuments("Item", updates);
        }
      }
    });
				
/*     html.find('.dicepool-value.nightmare-other').change(event => {
      const itemId = this.actor._id
      const val = event.target.value;					
      const updates = [{_id: itemId, system: {all_other_dicepools: val}}];
      Actor.updateDocuments(updates);
    });
				
    html.find('.dicepool-value.nightmare-best').change(event => {
      const itemId = this.actor._id
      const val = event.target.value;					
      const updates = [{_id: itemId, system: {best_dice_pool: {value: val}}}];
      Actor.updateDocuments(updates);
    });
				
    html.find('.dicepool-value.nightmare-worst').change(event => {
      const itemId = this.actor._id
      const val = event.target.value;					
      const updates = [{_id: itemId, system: {worst_dice_pool: {value: val}}}];
      Actor.updateDocuments(updates);
    }); */
				
    html.find('.input-doubles-as').change(event => {
      const itemId = this.actor._id
      const val = event.target.value;					
      const updates = [{_id: itemId, system: {doubles_as: val}}];
      Actor.updateDocuments(updates);
    });
					
    html.find('.dicepool-delete.antagonist').click(ev => {
      const itemId = ev.currentTarget.closest(".dicepool-delete.antagonist").dataset.itemId;

      if(ev.shiftKey) { // Delete immediately
        this.actor.deleteEmbeddedDocuments("Item",[itemId]);
        return;
      }

      // Confirmation dialogue
      let d = new Dialog({
        title: "Confirm delete",
        content: "<p>Are you sure you want to permanently delete this dicepool?</p><p>(Holding shift skips this dialogue)</p>",
        buttons: {
         one: {
          icon: '<i class="fas fa-trash"></i>',
          label: "Delete",
          callback: () => this.actor.deleteEmbeddedDocuments("Item",[itemId])
         },
         two: {
          label: "Cancel"
         }
        },
        default: "two"
       });
       d.render(true);
    });
				
    html.find('.dicepool-delete.nightmare-best').click(event => {
      const itemId = this.actor._id;
      const idx = event.currentTarget.closest(".dicepool-delete.nightmare-best").dataset.itemId;
      if (idx >= 0) {
        const descriptions = this.actor.system.best_dice_pool.descriptions.slice();
        descriptions.splice(idx, 1);
        const updates = [{_id: itemId, system: {best_dice_pool: {descriptions: descriptions}}}];
        Actor.updateDocuments(updates);
      }
    });
    
    html.find('.dicepool-delete.nightmare-worst').click(event => {
      const itemId = this.actor._id;
      const idx = event.currentTarget.closest(".dicepool-delete.nightmare-worst").dataset.itemId;
      if (idx >= 0) {
        const descriptions = this.actor.system.worst_dice_pool.descriptions.slice();
        descriptions.splice(idx, 1);
        const updates = [{_id: itemId, system: {worst_dice_pool: {descriptions: descriptions}}}];
        Actor.updateDocuments(updates);
      }
    });
				
    html.find('.dicepool-name.nightmare-best').change(event => {
      const itemId = this.actor._id;
      const val = event.target.value;
      const idx = event.currentTarget.closest(".dicepool-name.nightmare-best").dataset.itemId;
      if (idx >= 0) {
        const descriptions = this.actor.system.best_dice_pool.descriptions.slice();
        descriptions.splice(idx, 1, val);
        const updates = [{_id: itemId, system: {best_dice_pool: {descriptions: descriptions}}}];
        Actor.updateDocuments(updates);
      }
    });
				
    html.find('.dicepool-name.nightmare-worst').change(event => {
      const itemId = this.actor._id;
      const val = event.target.value;
      const idx = event.currentTarget.closest(".dicepool-name.nightmare-worst").dataset.itemId;
      if (idx >= 0) {
        const descriptions = this.actor.system.worst_dice_pool.descriptions.slice();
        descriptions.splice(idx, 1, val);
        const updates = [{_id: itemId, system: {worst_dice_pool: {descriptions: descriptions}}}];
        Actor.updateDocuments(updates);
      }
    });

    html.find('.remembranceTraitAdd').click(async event => {
      const systemData = this.actor.system;
      const list = systemData.remembranceTraits ? foundry.utils.duplicate(systemData.remembranceTraits) : []; 
      list.push({ name: "skills_physical.athletics", value: 0 });

      await this.actor.update({
        ["system.remembranceTraits"]: list
      });
    });

    // Remove effect
    html.find('.remembranceTraitRemove').click(async event => {
      const systemData = this.actor.system;
      const list = systemData.remembranceTraits ? foundry.utils.duplicate(systemData.remembranceTraits) : [];
      const index = event.currentTarget.dataset.index;
      list.splice(index, 1);

      await this.actor.update({
        ["system.remembranceTraits"]: list
      });
    });

    // select change
				
    html.find('select.briefNightmareType').change(event => {
      let defaultBriefNightmareValues = null;
      if (event.target.value === "Minion") {
        defaultBriefNightmareValues = {
          bestDicepool: 5,
          worstDicepool: 0,
          allOtherDicepool: 2,
          dreadPowers: 3,
          willpower: 2
        };
      }
      else if (event.target.value === "Horde") {
        defaultBriefNightmareValues = {
          bestDicepool: 7,
          worstDicepool: 1,
          allOtherDicepool: 3,
          dreadPowers: 5,
          willpower: 3
        };
      }
      else if (event.target.value === "LoneTerror") {
        defaultBriefNightmareValues = {
          bestDicepool: 10,
          worstDicepool: 2,
          allOtherDicepool: 5,
          dreadPowers: 7,
          willpower: 6
        };
      }
      if (defaultBriefNightmareValues) {
        const updates = [{
          _id: this.actor._id, 
          system: {
            best_dice_pool: { value: defaultBriefNightmareValues.bestDicepool },
            worst_dice_pool: { value: defaultBriefNightmareValues.worstDicepool },
            all_other_dicepools: defaultBriefNightmareValues.allOtherDicepool,
            dread_powers: defaultBriefNightmareValues.dreadPowers,
            willpower: {
              value: defaultBriefNightmareValues.willpower,
              max: defaultBriefNightmareValues.willpower
            },
            derivedTraits: {
              willpower: { value: defaultBriefNightmareValues.willpower }
            }
          }
        }];
        Actor.updateDocuments(updates);
      }
    });
				
    // Item Dragging
    
    let handler = ev => this._handleDragEnter(ev)
    html.find('.item-row').each((i, li) => {
      if (li.classList.contains("header")) return;
      //li.setAttribute("draggable", true);
      new Dragster( li );
      li.addEventListener("dragster:enter", ev => this._handleDragEnter(ev) , false);
      li.addEventListener("dragster:leave", ev => this._handleDragLeave(ev) , false);
    });
    
    // Equip Inventory Item
    html.find('.equipped.checkBox input').click(ev => {
      const itemId = ev.currentTarget.closest(".equipped.checkBox input").dataset.itemId;
      const item = this.actor.items.get(itemId);
      let toggle = !item.system.equipped;
      const updateData = {
        "system.equipped": toggle
      };
      item.update(updateData);
    });

    html.find('.coverActive.checkBox input').click(ev => {
      const itemId = ev.currentTarget.closest(".coverActive.checkBox input").dataset.itemId;
      const item = this.actor.items.get(itemId);
      const updateData = [];
      this.actor.items.forEach(actorItem => {
        if(actorItem._id !== item._id && actorItem.type == "cover" && actorItem.system.isActive) {
          updateData.push({
            _id: actorItem._id,
            "system.isActive": false
          });
        }
      });
      updateData.push({
        _id: item._id,
        "system.isActive": !item.system.isActive
      });
      this.actor.updateEmbeddedDocuments("Item", updateData);
    });

    html.find('.formAbilityActive.checkBox input').click(ev => {
      const itemId = ev.currentTarget.closest(".formAbilityActive.checkBox input").dataset.itemId;
      const item = this.actor.items.get(itemId);
      let toggle = !item.system.effectsActive;
      const updateData = {
        "system.effectsActive": toggle
      };
      item.update(updateData);
    });

    html.find('.spell-rote').click(ev => {
      const itemId = ev.currentTarget.closest(".spell-rote").dataset.itemId;
      const item = this.actor.items.get(itemId);
      let toggle = !item.system.isRote
      const updateData = {
        "system.isRote": toggle
      };
      item.update(updateData);
    });

    html.find('.spell-praxis').click(ev => {
      const itemId = ev.currentTarget.closest(".spell-praxis").dataset.itemId;
      const item = this.actor.items.get(itemId);
      let toggle = !item.system.isPraxis
      const updateData = {
        "system.isPraxis": toggle
      };
      item.update(updateData);
    });

    html.find('.spell-inured').click(ev => {
      const itemId = ev.currentTarget.closest(".spell-inured").dataset.itemId;
      const item = this.actor.items.get(itemId);
      let toggle = !item.system.isInured
      const updateData = {
        "system.isInured": toggle
      };
      item.update(updateData);
    });

    html.find('.spell-befouled').click(ev => {
      const itemId = ev.currentTarget.closest(".spell-befouled").dataset.itemId;
      const item = this.actor.items.get(itemId);
      let toggle = !item.system.isBefouled
      const updateData = {
        "system.isBefouled": toggle
      };
      item.update(updateData);
    });

    html.find('.favicon').click(ev => {
      const itemId = ev.currentTarget.closest(".favicon").dataset.itemId;
      const item = this.actor.items.get(itemId);
      let toggle = !item.system.isFavorite
      const updateData = {
        "system.isFavorite": toggle
      };
      item.update(updateData);
    });

    html.find('.activeIcon').click(ev => {
      const itemId = ev.currentTarget.closest(".activeIcon").dataset.itemId;
      const item = this.actor.items.get(itemId);
      let toggle = !item.system.effectsActive
      const updateData = {
        "system.effectsActive": toggle
      };
      item.update(updateData);
    });    

    html.find('.relinquish.unsafe').click(ev => {
      const itemId = ev.currentTarget.closest(".relinquish.unsafe").dataset.itemId;
      const item = this.actor.items.get(itemId);
      let isRelinquished = !item.system.isRelinquished;
      let isRelinquishedSafely = false;
      const updateData = {
        "system.isRelinquished": isRelinquished,
        "system.isRelinquishedSafely": isRelinquishedSafely
      };
      item.update(updateData);
    });

    html.find('.relinquish.safe').click(ev => {
      const itemId = ev.currentTarget.closest(".relinquish.safe").dataset.itemId;
      const item = this.actor.items.get(itemId);
      let isRelinquishedSafely = !item.system.isRelinquishedSafely;
      let isRelinquished = false;
      const updateData = {
        "system.isRelinquished": isRelinquished,
        "system.isRelinquishedSafely": isRelinquishedSafely
      };
      item.update(updateData);
    });

    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.dicepool-create.antagonist').click(this._onItemCreate.bind(this));
				
    html.find('.dicepool-create.nightmare-best').click(event => {
      const itemId = this.actor._id;
      const description = game.i18n.localize("MTA.BestDicePool");
      const updates = [{_id: itemId, system: {best_dice_pool: {descriptions: [...this.actor.system.best_dice_pool.descriptions] .concat([description])}}}];
      Actor.updateDocuments(updates);
    });

    html.find('.dicepool-create.nightmare-worst').click(event => {
      const itemId = this.actor._id;
      const description = game.i18n.localize("MTA.WorstDicePool");
      const updates = [{_id: itemId, system: {worst_dice_pool: {descriptions: [...this.actor.system.worst_dice_pool.descriptions] .concat([description])}}}];
      Actor.updateDocuments(updates);
    });

    html.find('.discipline-create').click(ev => {
      let ownDisciplines = this.actor.system.disciplines_own ? foundry.utils.duplicate(this.actor.system.disciplines_own) : {};
      let discipline = {
        label: "New Discipline",
        value: 0
      };
      let newKey = Object.keys(ownDisciplines).reduce((acc, ele) => {
        return +ele > acc ? +ele : acc;
      }, 0);
      newKey += 1;
      ownDisciplines[newKey] = discipline;
      const updateData = {
        "system.disciplines_own": ownDisciplines
      };
      this.actor.update(updateData);
    });

    html.find('.discipline-delete').click(ev => {
      let ownDisciplines = this.actor.system.disciplines_own ? foundry.utils.duplicate(this.actor.system.disciplines_own) : {};
      const discipline_key = ev.currentTarget.closest(".discipline-delete").dataset.attribute;

      //delete ownDisciplines[discipline_key];
      ownDisciplines['-=' + discipline_key] = null;
      let updateData = {
        "system.disciplines_own": ownDisciplines
      };
      this.actor.update(updateData);
    });

    html.find('.discipline-edit').click(ev => {
      const et = $(ev.currentTarget);
      et.siblings(".discipline-name").toggle();
      et.siblings(".attribute-button").toggle();
    });

    $('.discipline-edit').on('keypress', function (e) {
      if(e.which === 13){
        const et = $(ev.currentTarget);
        et.siblings(".discipline-name").toggle();
        et.siblings(".attribute-button").toggle();
      }
    });

    // Reload Firearm
    html.find('.item-reload').click(ev => this._onItemReload(ev));

    html.find('.progress').click(async ev => {
      if (this._progressDialogue) this._progressDialogue.bringToTop();
      else this._progressDialogue = await new ProgressDialogue(this.actor).render(true);
    });

    html.find('.item-magValue').mousedown(ev => this._onItemChangeAmmoAmount(ev));

    html.find('.skill-specialty').click(ev => {
      ev.preventDefault();
      const trait = ev.currentTarget.dataset.trait;
      new SkillEditDialogue(this.actor, trait).render(true);
    });

    html.find('.niceNumber').click(function(event) {
      let v = $(event.target).text();
      let i = $(this).find('input');
      
      if (v === '+') {
        i.val(parseInt(i.val()) + 1);
      } else if (v === '−') {
        i.val(parseInt(i.val()) - 1);
      }
      
      i.trigger('change');
    });


    html.find('.arcana-state').click(ev => {
      const traitName = ev.currentTarget.closest(".arcana-state").dataset.trait;

      const type = traitName.split('.')[0];
      const arcanum = traitName.split('.')[1];

      let updateAttribute = foundry.utils.duplicate(this.actor.system[type]);

      if (updateAttribute[arcanum].isRuling) {
        updateAttribute[arcanum].isRuling = false;
        updateAttribute[arcanum].isInferior = true;

      } else if (updateAttribute[arcanum].isInferior) {
        updateAttribute[arcanum].isRuling = false;
        updateAttribute[arcanum].isInferior = false;
      } else {
        updateAttribute[arcanum].isRuling = true;
        updateAttribute[arcanum].isInferior = false;
      }

      let obj = {}
      obj[`system.${type}`] = updateAttribute;
      this.actor.update(obj);
      
    });

    html.find('.haunt-state').click(ev => {
      const traitName = ev.currentTarget.closest(".haunt-state").dataset.trait;

      const type = traitName.split('.')[0];
      const haunt = traitName.split('.')[1];

      let updateAttribute = foundry.utils.duplicate(this.actor.system[type]);

      if (updateAttribute[haunt].hasAffinity) {
        updateAttribute[haunt].hasAffinity = false;

      } else {
        updateAttribute[haunt].hasAffinity = true;
      }

      let obj = {}
      obj[`system.${type}`] = updateAttribute;
      this.actor.update(obj);
      
    });

    html.find('.scour-paradox-button').click(ev => {
      this.actor.scourParadox();
    });


    html.find('.renown-state').click(ev => {
      const traitName = ev.currentTarget.closest(".renown-state").dataset.trait;

      const type = traitName.split('.')[0];
      const renown = traitName.split('.')[1];

      let updateAttribute = foundry.utils.duplicate(this.actor.system.werewolf_renown);

      if (this.actor.system.werewolf_renown[renown].isAuspice) {
        updateAttribute[renown].isAuspice = false;
        updateAttribute[renown].isTribe = true;

      } else if (this.actor.system.werewolf_renown[renown].isTribe) {
        updateAttribute[renown].isAuspice = false;
        updateAttribute[renown].isTribe = false;
      } else {
        updateAttribute[renown].isAuspice = true;
        updateAttribute[renown].isTribe = false;
      }

      let obj = {}
      obj['system.werewolf_renown'] = updateAttribute;
      this.actor.update(obj);
      
    });

    // Item Rolling
    html.find('.item-table .item-image').click(event => this._onItemRoll(event));
    html.find('.item-table .item-image').on("contextmenu", event => this._onItemRoll(event, true));
    
    // Werewolf transform
    html.find('.forms-column .item-image').click(event => this._onWerewolfTransform(event));

    // Calculate Max Health
    html.find('.calculate.health').click(event => {
      this.actor.calculateAndSetMaxHealth();
    });

    html.find('.calculate.resource').click(event => {
      this.actor.calculateAndSetMaxResource();
    });

    html.find('.calculate.clarity').click(event => {
      this.actor.calculateAndSetMaxClarity();
    });

    // Macros

    html.find('.allOtherDicepoolButton').mousedown(event => {
      const name = game.i18n.localize("MTA.AllOtherDicePools");
      const val = this.actor.system.all_other_dicepools;	
						
      switch (event.which) {
        case 1:
          this.actor.rollGeneralDicepool(name, val, false, true);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollGeneralDicepool(name, val, true, true);
          break;
      }
    });
				
    html.find('.bestDicepoolButton').mousedown(event => {
      const itemId = event.currentTarget.closest(".bestDicepoolButton").dataset.itemId;
      const name = this.actor.system.best_dice_pool.descriptions[itemId];
      const val = this.actor.system.best_dice_pool.value;	
						
      switch (event.which) {
        case 1:
          this.actor.rollGeneralDicepool(name, val, false, true);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollGeneralDicepool(name, val, true, true);
          break;
      }
    });
				
    html.find('.worstDicepoolButton').mousedown(event => {
      const itemId = event.currentTarget.closest(".worstDicepoolButton").dataset.itemId;
      const name = this.actor.system.worst_dice_pool.descriptions[itemId];
      const val = this.actor.system.worst_dice_pool.value;	
          
      switch (event.which) {
        case 1:
          this.actor.rollGeneralDicepool(name, val, false, true);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollGeneralDicepool(name, val, true, true);
          break;
      }
    });

    html.find('.generalDicepoolButton').mousedown(event => {
      const itemId = event.currentTarget.closest(".generalDicepoolButton").dataset.itemId;
      if(itemId) {
        const item = this.actor.getEmbeddedDocument("Item", itemId);
        item.roll();
			}
    });
				
    html.find('.combatDicepoolButton').mousedown(event => {
      const itemId = event.currentTarget.closest(".combatDicepoolButton").dataset.itemId;

      if(itemId) {
        const item = this.actor.getEmbeddedDocument("Item", itemId);
        item.roll();
			}
    });

    html.find('.mageSightButton').mousedown(ev => {
      this.actor.openMageSightDialogue();
    });

    html.find('.clashOfWillsButton').mousedown(ev => {
      this.actor.openClashOfWillsDialogue();
    });

    html.find('.scourPatternButton').mousedown(ev => {
      this.actor.scourPattern();
    });

    html.find('.restorePatternButton').mousedown(ev => {
      this.actor.restorePattern();
    });    

    // CÓDIGO GPT
    (() => {
      const $btn = html.find('.improvedRestorePatternButton');
      const $improved = html.find('.improvedRestorePatternButton');
      const $basic = html.find('.restorePatternButton');

      const getLife = () => {
        const s = this.actor.system ?? {};
        const pick = (obj) => {
          if (obj == null) return 0;
          if (typeof obj === "object") return Number(obj.final ?? obj.value ?? 0) || 0;
          return Number(obj) || 0;
        };
        const v1 = pick(s.arcana?.life);
        const v2 = pick(s.arcana_gross?.life);
        return v1 || v2;
      };

      const lifeVal = getLife();

      $improved.off("mousedown");

      if (lifeVal >= 2) {
        $improved.on("mousedown", (ev) => {
          ev.preventDefault();
          this.actor.improvedRestorePattern();
        });
        $basic.remove();
      } else {
        $improved.remove();
      }
    })();

    /*
    html.find('.improvedRestorePatternButton').mousedown(ev => {
      this.actor.improvedRestorePattern();
    });
    */
    
    html.find('.perceptionButton').mousedown(ev => {
      switch (ev.which) {
        case 1:
          this.actor.rollPerception(false, true);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollPerception(true, true);
          break;
      }
    });
    
    html.find('.intuitionButton').mousedown(ev => {
      switch (ev.which) {
        case 1:
          this.actor.rollIntuition(false, true);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollIntuition(true, true);
          break;
      }
    });

    html.find('.investigationButton').mousedown(ev => {
      switch (ev.which) {
        case 1:
          this.actor.rollInvestigation(false, true);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollInvestigation(true, true);
          break;
      }
    });

    html.find('.breakingPointButton').mousedown(ev => {
      switch (ev.which) {
        case 1:
          this.actor.rollBreakingPoint(false, false);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollBreakingPoint(true, false);
          break;
      }
    });

    html.find('.rollBaldearNoiteButton').mousedown(ev => {
      switch (ev.which) {
        case 1:
          this.actor.rollBaldearNoite(false, false);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollBaldearNoite(true, false);
          break;
      }
    });

    html.find('.rollBaldearDiaButton').mousedown(ev => {
      switch (ev.which) {
        case 1:
          this.actor.rollBaldearDia(false, false);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollBaldearDia(true, false);
          break;
      }
    });

    html.find('.rollHarmoniaUpButton').mousedown(ev => {
      switch (ev.which) {
        case 1:
          this.actor.rollHarmoniaUp(false, false);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollHarmoniaUp(true, false);
          break;
      }
    });

    html.find('.rollHarmoniaDownButton').mousedown(ev => {
      switch (ev.which) {
        case 1:
          this.actor.rollHarmoniaDown(false, false);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollHarmoniaDown(true, false);
          break;
      }
    });
    
    html.find('.dissonanceButton').mousedown(ev => {
      switch (ev.which) {
        case 1:
          this.actor.rollDissonance(false, false);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollDissonance(true, false);
          break;
      }
    });

    html.find('.compromiseButton').mousedown(ev => {
      switch (ev.which) {
        case 1:
          this.actor.rollCompromise(false, false);
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.rollCompromise(true, false);
          break;
      }
    });

    html.find('.dreamingButton').mousedown(ev => {
      switch (ev.which) {
        case 1:
          this.actor.dreaming();
          break;
        case 2:
          break;
        case 3:
          // Unequip items
          this.actor.dreaming(true);
          break;
      }
      
    });

    html.find('.amnionButton').mousedown(ev => {
      this.actor.callAmnion();
    });

    // Clicking roll button
    html.find('.rollButton').mousedown(ev => {

      const attributeChecks = $(".attribute-check:checked");

      const attributeInputs = [];
      attributeChecks.each(function() {
        let $this = $(this);
        
        if ($this.attr("data-trait")) {
          attributeInputs.push($this);
        } else if ($this.parent().attr("data-trait")) {
          attributeInputs.push($this.parent());
        }
      });

      const rollAttributes = attributeInputs.map(v => v.attr("data-trait"));

      switch (ev.which) {
        case 1:
          this.actor.roll({traits: rollAttributes})
          break;
        case 2:
          break;
        case 3:
          //Quick Roll
          this.actor.roll({traits: rollAttributes, rollType: 'quick'})
          break;
      }

      //Uncheck attributes/skills and reset
      attributeChecks.prop("checked", !attributeChecks.prop("checked"));
    });

    //Clicking spellcasting button
    html.find('.improvisedSpellButton').mousedown(ev => this._onActivateSpell(ev));
  }
  
  /* Handles drag-and-drop visual */
  _handleDragEnter(event){
    let ele = event.target.closest(".item-row");
    if(ele) $(ele).addClass('over')
  }
  
  _handleDragLeave(event) {
    let ele = event.target.closest(".item-row");
    if(ele) $(ele).removeClass('over')
  }

  _onDropActor(event, data) {
    if (this.actor.system.characterType === "Sin-Eater" && data.uuid) {
      const actor = fromUuidSync(data.uuid);
      if (actor && actor.id) {
        this.actor.update({
          'system.geistId': actor.id
        });
        actor.update({
          'system.sineaterId': this.actor.id
        })
      }
    }
    else if (this.actor.system.ephemeralType === "Ghost" && data.uuid) {
      const actor = fromUuidSync(data.uuid);
      if (actor && actor.id) {
        this.actor.update({
          'system.sineaterId': actor.id
        });
        actor.update({
          'system.geistId': this.actor.id
        })
      }
    }
    return super._onDropActor(event, data);
  }
  
  _onDragStart(event) {
    const id = event.target.dataset.itemId;
    const source = this.actor.items.get(id);
    const background = source.img;
    let img = $(event.target).find('.item-image');
    img.css("cssText",'background-image: url(' + background + ') !important');

    event.dataTransfer.setDragImage(img[0], 0, 0);
    return super._onDragStart(event);
  }
  /** @override 
  * Exact copy of the foundry code, except for the !target render,
  * and the sortBefore check.
  */
  _onSortItem(event, itemData) {
    // TODO - for now, don't allow sorting for Token Actor overrides
    //if (this.actor.isToken) return;
      
    // Get the drag source and its siblings
    const source = this.actor.items.get(itemData._id);
    if(!source) return;
    const siblings = this.actor.items.filter(i => {
      return (i.type === source.type) && (i._id !== source._id);
    });

    if(siblings.length <= 0) return;

    // Get the drop target
    const dropTarget = event.target.closest(".item");
    const targetId = dropTarget ? dropTarget.dataset.itemId : null;

    //Find target that matches the source type and is not the source itself
    const target = this.actor.items.find(i => {
      return (i.type === source.type) 
              && (i._id !== source._id) 
              && (i._id === targetId);
    });

    if(!target) return this.render();
      
    const sortBefore = source.sort > target?.sort;

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(source, {target: target, siblings: siblings, sortBefore: sortBefore});
    const updateData = sortUpdates.map(u => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });
    // Perform the update
    return this.actor.updateEmbeddedDocuments("Item", updateData);

  }

  async _onActivateSpell(ev, spell) {
    this.actor.castSpell(spell);
  }

  async _onRollTactic(ev, item) {
    let tacticDialogue = new TacticDialogue(this.actor, item);
    tacticDialogue.render(true);
  }




/** @override */
async _onDropItemCreate(itemData) {
  let items = itemData instanceof Array ? itemData : [itemData];

  const toCreate = [];
  for ( const item of items ) {
    const result = await this._onDropSingleItem(item);
    if ( result ) toCreate.push(result);
  }

  // Create the owned items as normal
  return this.actor.createEmbeddedDocuments("Item", toCreate);
}

  static isAllowedItemType(item, actor) {
    if(actor.type === "ephemeral") {
      return CONFIG.MTA.ephemeralItemTypes.includes(item.type) || !(CONFIG.MTA.characterItemTypes.includes(item.type) || CONFIG.MTA.simpleAntagonistItemTypes.includes(item.type) || CONFIG.MTA.briefNightmareItemTypes.includes(item.type));
    }
    if(actor.type === "character") {
      if (item.type === "numen") return true; // TODO: And is horror
      return CONFIG.MTA.characterItemTypes.includes(item.type) || !(CONFIG.MTA.ephemeralItemTypes.includes(item.type) || CONFIG.MTA.simpleAntagonistItemTypes.includes(item.type) || CONFIG.MTA.briefNightmareItemTypes.includes(item.type));
    }
    if(actor.type === "brief_nightmare") {
      if (item.type === "numen") return true;
      return CONFIG.MTA.briefNightmareItemTypes.includes(item.type) || !(CONFIG.MTA.characterItemTypes.includes(item.type) || CONFIG.MTA.ephemeralItemTypes.includes(item.type) || CONFIG.MTA.simpleAntagonistItemTypes.includes(item.type));
    }
    return true;
  }

/**
   * Handles dropping of a single item onto this character sheet.
   * @param {object} itemData            The item data to create.
   * @returns {Promise<object|boolean>}  The item data to create after processing, or false if the item should not be
   *                                     created or creation has been otherwise handled.
   * @protected
   */
 async _onDropSingleItem(itemData) {

  if(this.actor.type === "simple_antagonist" && 
    !(itemData.type === "general_dice_pool" || itemData.type === "combat_dice_pool" 
    || itemData.type === "merit" || itemData.type === "condition" || itemData.type === "tilt")) {
      const response = await Dialog.wait({
        title: "Incompatible item type.",
        content: "Which type should the item convert to? (Description and name are kept)",
        buttons: {
          foo: { label: game.i18n.localize("MTA.GeneralDicePool"), callback: () => ( 'general_dice_pool' ) },
          bar: { label: game.i18n.localize("MTA.CombatDicePool"), callback: () => ( 'combat_dice_pool' ) },
        },
        close: () => (null)
      });
      if(!response) return;
      itemData.type = response;
      if(response === "general_dice_pool") {
        itemData.system = {
          value: itemData.system?.dicePool?.value,
          description: itemData.system?.description
        }
      }
      else {
        itemData.system = {
          value: itemData.system?.dicePool?.value,
          damage: itemData.system?.damage,
          description: itemData.system?.description,
          applyDefense: itemData.system?.applyDefense,
          noSuccessesToDamage:  itemData.system?.noSuccessesToDamage,
          penetration: itemData.system?.penetration
        }
      }
  }

  // Check to make sure items of this type are allowed on this actor
  if (!MtAActorSheet.isAllowedItemType(itemData, this.actor)) {
    ui.notifications.warn("Este tipo de item não pode ser equipado neste personagem.");
    return false;
  }

  // Clean up data
  if ( itemData.system ) {
    if(itemData.type ==="spell"){
      itemData.system.isPraxis = false;
      itemData.system.isRote = false;
      itemData.system.isInured = false;
      itemData.system.isBefouled = false;
    }
    if(itemData.type ==="cover"){
      itemData.system.isActive = false;
    }
    if(itemData.system.equipped) itemData.system.equipped = false;
    if(itemData.system.isFavorite) itemData.system.isFavorite = false;
  }

  return itemData;
}

  async _onItemChangeAmmoAmount(ev) {
    const weaponId = ev.currentTarget.closest(".item-magValue").dataset.itemId;
    const weapon = this.actor.items.get(weaponId);
    const magazine = weapon.system.magazine;

    if (magazine) {
      let ammoCount = magazine.system.quantity;
      switch (ev.which) {
        case 1:
          ammoCount = Math.min(ammoCount + 1, weapon.system.capacity);
          break;
        case 2:
          break;
        case 3:
          ammoCount = Math.max(ammoCount - 1, 0);
          break;
      }

      weapon.update({
        'system.magazine.system.quantity': ammoCount
      });
    }
  }

  /**
   * Handle reloading of a firearm from the Actor Sheet
   * @private
   */
  async _onItemReload(ev) {

    const weaponId = ev.currentTarget.closest(".item-reload").dataset.itemId;
    const weapon = this.actor.items.get(weaponId);
    const weaponData = weapon.system;
    if (weaponData.magazine) { // Eject magazine
      createShortActionMessage("Ejetou a munição!", this.actor);
      
      ev.target.classList.remove("reloaded");

      //Add ejected ammo back into the inventory
      const ammoData = {...weaponData.magazine};
      delete ammoData._id;
      delete ammoData.effects; // TODO: Remove once foundry bug is fixed (can't find the issue??)
      
      let foundElement = this.actor.items.find(item => (item.name === ammoData.name) && (item.system.cartridge === ammoData.system.cartridge));

      let updateData = [];
      let a;
      //const index = inventory.findIndex(ele => (ele.data.name === ammoData.name) && (ele.data.cartridge === ammoData.cartridge));
      if (foundElement) { // Add ammo to existing magazine
        updateData.push({
          _id: foundElement._id,
          'system.quantity': foundElement.system.quantity + ammoData.system.quantity
        }); 
      } 
      else a = await this.actor.createEmbeddedDocuments("Item", [ammoData]); // Add new magazine item

      updateData.push({
        _id: weapon.id,
        'system.magazine': null
      }); // Remove magazine from weapon
      this.actor.updateEmbeddedDocuments("Item", updateData);

    } else {
      //Open reload menu
      let ammoList = new ReloadDialogue(weapon, ev.target);
      ammoList.render(true);
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
				
    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type,
      //system: foundry.utils.duplicate(header.dataset)
    };
    
    //delete itemData.data["type"];
				
    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   * @private
   */
  _onItemRoll(event, quickRoll=false) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item-name").dataset.itemId;
    let item = this.actor.items.get(itemId);

    if (!item && this.actor.system.haunt_power) { // Geist haunt powers are taken from the sin-eater 
      item = this.actor.system.haunt_power.find(item => item.id == itemId);
      return item.roll(undefined, quickRoll, { actorOverride : this.actor });
    }

    // Roll spells through the actor
    if (item.type === "spell" || item.type === "spellTemplate") return this._onActivateSpell(event, item);
    if (item.type === "tactic") return this._onRollTactic(event, item);
    if (item.type === "key") return this._onUnlockSineaterKey(event, item);
    if (item.type === "haunt_power") return this._onActivateHauntPower(event, item);
    // Otherwise roll the Item directly

    
    return item.roll(undefined, quickRoll);
  }

  _onActivateHauntPower(ev, haunt) {
    const keys = this.actor.items.filter(item => item.type === "key");
    // TODO: Synergy checkbox
    // TODO: Willpower checkbox
    let d = new Dialog({
      title: "Unlock Key",
      content: `
      <style>
        .check-box-form-line {
          margin: 1rem 0;
        }
      </style>
      <ul class="haunt-key-list">
        ${keys.reduce((acc, key) => acc + `<li class="haunt-key" data-name="${key.name}" data-id="${key.id}">
          <div class="item-image" style="background-image: url(${key.img})"></div>
          <div>${key.name} (${key.system.unlockAttribute})</div>       
          </li>`, '')}
      </ul>
      <div class="check-box-line">
        <label>${game.i18n.localize("MTA.hasResonance")}</label>
        <label class="checkBox">
          <input type="checkbox" class="hauntSynergy">
          <span></span>
        </label>
      </div>
      <div class="check-box-form-line">
        <label>${game.i18n.localize("MTA.useWillpower")}</label>
        <label class="checkBox">
          <input type="checkbox" class="useWillpower">
          <span></span>
        </label>
      </div>
      `,
      buttons: {
        one: {
          label: "Use",
          callback: (html) => {
            const hauntKeyElements = html[0].querySelectorAll('.haunt-key');
            const selectedHauntKeys = [];
            hauntKeyElements.forEach(element => {
              if (element.classList.contains('selected')) {
                const id = element.dataset.id;
                const item = this.actor.items.find(item => item.id === id);
                if (item) selectedHauntKeys.push(item);
              }
            });

            const synergyElement = html[0].querySelector('.hauntSynergy');
            const hasResonance = synergyElement.checked;
            console.log(synergyElement, hasResonance)
            const willpowerElement = html[0].querySelector('.useWillpower');
            const spendWillpower = willpowerElement.checked;
            this.actor.activateHauntPower(haunt, selectedHauntKeys, spendWillpower, hasResonance);
          }
        },
        two: {
          label: "Cancel"
        }
      },
      default: "two",
      render: (html) => {
        const hauntKeyElements = html[0].querySelectorAll('.haunt-key');
        hauntKeyElements.forEach(element => {
          element.addEventListener('click', () => {
            const clickedName = element.dataset.name;
            hauntKeyElements.forEach(el => {
              if (el.dataset.name !== clickedName) {
                el.classList.remove('selected');
              }
            });
            element.classList.toggle('selected');
          });
        });
      }
    });
    d.render(true);
  }

  _onUnlockSineaterKey(event, item) {
    item.showChatCard();
    let d = new Dialog({
      title: "Unlock Key",
      buttons: {
        one: {
          label: "Unlock",
          callback: () => this.actor.unlockSineaterKey(item)
        },
        two: {
          label: "Cancel"
        }
      },
      default: "two"
    });
    d.render(true);
  }

/**
   * Handle transformation into a werewolf form.
   * @private
   */
  async _onWerewolfTransform(event) { //TODO: move this to actor.js
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    this.actor.werewolfTransform(item);
  }


  /**
   * Handle collapsing of inventory tables (e.g. firearms, etc.).
   * The collapsed state is stored per user for every actor for every table.
   * @private
   */
  _onTableCollapse(event) {
    const et = $(event.currentTarget);
    if (et.hasClass('fa-plus-square')) { // collapsed
      et.removeClass("fa-plus-square");
      et.addClass("fa-minus-square");
      et.parent().parent().parent().siblings('tbody').show();
      
      // Update user flags, so that collapsed state is saved
      let updateData = {'flags':{'mta':{[this.actor._id]:{[et.siblings('.sortable.button')[0].dataset.type]:{collapsed: false}}}}};
      game.user.update(updateData);
      
    } else { // not collapsed
      et.parent().parent().parent().siblings('tbody').hide();
      et.removeClass("fa-minus-square");
      et.addClass("fa-plus-square");
      
      // Update user flags, so that collapsed state is saved
      let updateData = {'flags':{'mta':{[this.actor._id]:{[et.siblings('.sortable.button')[0].dataset.type]:{collapsed: true}}}}};
      game.user.update(updateData);
    }
  }

  async _onSuperSort(event) {
    const itemType = event.currentTarget.dataset.sorttype;

    const updateData = {
      'flags.mta.sort': {
        [itemType]: { sort: "special" }
      }
    };
    await game.user.update(updateData);

    this.render()
  }
    
    async _onTableSort(event) {
      const et = $(event.currentTarget).children(".fas");
      const property = event.currentTarget.dataset.sortproperty;
      const itemType = event.currentTarget.dataset.sorttype;

      console.log("SORT", property, itemType, et)
      if(!property || !itemType) return;

      let sort;

      if (et.hasClass('fa-sort')) { // sort A-Z
        et.removeClass("fa-sort");
        et.addClass("fa-sort-up");
        sort = 'up';
      }
      else if (et.hasClass('fa-sort-up')) { // sort Z-A
        et.removeClass("fa-sort-up");
        et.addClass("fa-sort-down");
        sort = 'down';
      }
      else {
        et.removeClass("fa-sort-down"); // unsorted
        et.addClass("fa-sort");
        sort = 'none';
      }

      console.log("SORT", sort, game.user.flags)

      const updateData = {
        'flags.mta.sort': {
          [itemType]: { sort, property }
        }
      };
      await game.user.update(updateData);

      this.render()
    }


  async _onItemSummary(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item-row");

    // Toggle summary
    if (li.hasClass("expanded")) {
      const summary = li.next(".item-summary");
      summary.children().children("div").slideUp(200, () => summary.remove());
    } else {
      const tb = $( event.currentTarget ).parents( ".item-table" );
      const colSpanMax = [ ...tb.get( 0 ).rows[ 0 ].cells ].reduce( ( a, v ) => ( v.colSpan ) ? a + v.colSpan * 1 : a + 1, 0 );
      const item = this.actor.items.get( li.data( "item-id" ) );
      const chatData = await item.getChatData({
        secrets: this.actor.owner
      });
      const tr = $(`<tr class="item-summary"> <td colspan="${colSpanMax}"> <div> ${chatData.description} </div> </td> </tr>`);
      const div = tr.children().children("div");
      div.hide();
      li.after(tr);
      div.slideDown(200);
    }
    li.toggleClass("expanded");
  }

  async _initialiseDotTrackers(html){
    let trackers = html.find('.kMageTracker');
    trackers.toArray().forEach( trackerEle => {
      if( trackerEle.dataset && !trackerEle.dataset.initialised){
        let makeHiddenInput = (name,value,dataType="Number") => {
          let i = document.createElement('input');
          i.type = 'hidden';
          i.name = name;
          i.value = value;
          if(dataType){i.dataset.dtype=dataType;}
          return trackerEle.insertAdjacentElement('afterbegin',i);
        }
        let td = trackerEle.dataset;
        let trackerName = td.name || 'unknowntracker';
        let trackerNameDelimiter = '.';
        let trackerType = (td.type)?td.type:'oneState';
        let stateOrder = (td.states)?td.states.split('/'):['off','on'];
        let stateCount = stateOrder.map( v => (td[v])?td[v]*1:0 ).map( (v,k,a) => ((k>0)?a[0]-v:v) ).map( v => (v < 0)?0:v );
        let stateHighest = stateOrder.length -1; 
        let markingOn = (td.marked !== undefined)?true:false;
        let markedBoxes = null, mbInput = null;
        if(markingOn){
          markedBoxes = [...Array(stateCount[0])].map(v => 0);
          td.marked.split(',').forEach( (v,k) => { if(k < markedBoxes.length && (v*1)){ markedBoxes[k] = 1 } } ) 
          mbInput = makeHiddenInput(trackerName + trackerNameDelimiter + 'marked',markedBoxes.join(','),false);
          trackerEle.insertAdjacentElement('afterbegin',mbInput)
        }
        let renderBox = trackerEle.appendChild( document.createElement('div') );
        trackerEle.dataset.initialised = 'yes';
        let inputs = stateOrder.map( (v,k) => {
          if(k === 0 && this.options.editable){
            trackerEle.insertAdjacentHTML('afterbegin',`<div class="niceNumber">
             <input name="${trackerName + trackerNameDelimiter + v}" type="number" value="${stateCount[k]}">
             <div class="numBtns"><div class="plusBtn">+</div><div class="minusBtn">−</div></div>
            </div>`);
            return trackerEle.firstChild;
          } else {
            return makeHiddenInput(trackerName + trackerNameDelimiter + v, stateCount[0] - stateCount[k]);
          }
        });
        
        let updateDots = (num=0, index=false) => {
          let abNum = Math.abs(num);
          
          // update the stateCount
          // if(index) then fill all dots up to & incl. index with num or empty all dots down to & incl. index if they are <=
          if(num > 0 || num < 0){
            if(index !== false){ 
              stateCount.forEach( (c,s,a) => { if(s<=abNum && s > 0){ a[s] = (num > 0)?index + 1:index; } } );
            } else {
              stateCount = stateCount.map( (c,s,a) => (num > 0 && s == abNum)?c+1:( num < 0 && s<= abNum && s > 0)?c-1:c );
            }
          }
          
           // clamping down values in case they somehow got bugged minimum 0, maximum is the count of state 0
          stateCount = stateCount.map( v => (v <0)?0:(v>stateCount[0])?stateCount[0]:v);
          
          // removing marks if the corresponding box is set to status 0
          if(markingOn){
            markedBoxes = markedBoxes.map( (v,k) => (v && k < stateCount[1])?v:0 ); }
          
          // update inputs
          stateCount.forEach( (c,s) => {
            let nuVal = stateCount[0] - c;
            if(inputs[s].value !== undefined && inputs[s].value != nuVal){   inputs[s].value = nuVal; }
          });
          if(markingOn){
            mbInput.value = markedBoxes.join(',');}
          
          
          // render
          let dots = [...Array(stateCount[0])].map( (v,k) => stateCount.slice(1).reduce( (a,scC,scK) => (scC >=(k+1))?scK+1:a ,0) );
          let r = '<div class="boxes">' + dots.reduce( (a,v,k) => a + `<div data-state="${v}" data-index="${k}"${markingOn&&markedBoxes[k]?' data-marked="true" title="Dano resistente!"':''}></div>`,'') + '</div>';
          if( trackerType == 'health' && !(this.actor.type === "ephemeral")){ 
            //let dicePenalty = dots.slice(-stateHighest).reduce( (a,v) => (v>0)?a+1:a ,0);
            let dicePenalty = this.actor.getWoundPenalties();
            let penaltyMap = {
              '0' : game.i18n.localize('MTA.HealthPenalty.physicallyStable'),
              '1' : game.i18n.localize('MTA.HealthPenalty.losingConsciousness'),
              '2' : game.i18n.localize('MTA.HealthPenalty.bleedingOut'),
              '3' : game.i18n.localize('MTA.HealthPenalty.dead')
            };
            r += `<div class="info"><span>${game.i18n.localize('MTA.HealthPenalty.YouAre')} <b>${penaltyMap[dots[dots.length -1]]}</b>.</span><span>${game.i18n.localize('MTA.DicePenalty')}<b>−${dicePenalty}</b></span></div>`;
          }
          else if (trackerType == 'clarity') {
            //let dicePenalty = dots.slice(-stateHighest).reduce( (a,v) => (v>0)?a+1:a ,0);
            let diceBonus = this.actor.getClarityBonus();

            //const dmg = dots.filter(v => v === 0);
            //let dicePenalty = (dmg.length < 3) ? -2 : (dmg.length < 5) ? -1 : 0;
            //if(dmg.length === dots.length) dicePenalty += 2;
            if(diceBonus >= 0) diceBonus = '+' + diceBonus;
            if(diceBonus === -99) diceBonus = '?';
            let penaltyMap = {
              '+2': game.i18n.localize('MTA.ClarityPenalty.lucid'),
              '+1': game.i18n.localize('MTA.ClarityPenalty.rational'),
              '+0': game.i18n.localize('MTA.ClarityPenalty.clear-headed'),
              '-1': game.i18n.localize('MTA.ClarityPenalty.hazy'),
              '-2': game.i18n.localize('MTA.ClarityPenalty.losingTrack'),
              '?':  game.i18n.localize('MTA.ClarityPenalty.inAComa')
            };
  
            r += `<div class="info"><span>${game.i18n.localize('MTA.HealthPenalty.YouAre')} <b>${penaltyMap[diceBonus]}</b>.</span><span>${game.i18n.localize('MTA.Perception')}:  <b>${diceBonus}</b></span></div>`;
          }
          renderBox.innerHTML = r;
          
          if(num !== 0){   inputs[1].dispatchEvent( new Event('change',{'bubbles':true}) )   }
        };
        
        if (this.options.editable) {
          // attaching event listeners for left and right clicking the states and changing the max value input
          trackerEle.addEventListener('pointerdown', (e, t = e.target) => {
            if( t.dataset && t.dataset.state ){
              let s = t.dataset.state*1;
              let index = (trackerType == 'oneState' && t.dataset.index)?t.dataset.index*1:false;

              if(e.button === 1 && markingOn && t.dataset.index && t.dataset.index < markedBoxes.length ){
                e.preventDefault();
                markedBoxes[t.dataset.index] = (markedBoxes[t.dataset.index])?0:1;
                updateDots('update');
              }
              else{
                updateDots( (e.button === 2)?-s:(s===stateHighest)?-s:s+1,index);
              }
            }
          });
          trackerEle.addEventListener('contextmenu', (e, t = e.target) => { if(t.dataset.state){  e.preventDefault();  } });
          trackerEle.addEventListener('input', (e, t = e.target) => {
            if(t.type == 'number' && t.name == (trackerName + trackerNameDelimiter +stateOrder[0])){
              stateCount[0] = t.value * 1;
              updateDots('update');
            }
          });
        }
        
        // trigger first render
        updateDots();
      }
    });
  }

  /** @override */
  async _updateObject(event, formData) {
    if (!formData.system) formData = foundry.utils.expandObject(formData);
    if (formData.system?.characterType === "Changeling") {
      //Adjust the number of touchstones on clarity update
      let touchstones = formData.system.touchstones_changeling ? foundry.utils.duplicate(formData.system.touchstones_changeling) : {};
      let touchstone_amount = Object.keys(touchstones).length;
      const clarity_max = formData.system.clarity?.max ? formData.system.clarity.max : this.object.system.clarity.max;
        
      if (touchstone_amount < clarity_max) {
        while (touchstone_amount < clarity_max) {
          touchstones[touchstone_amount + 1] = "";
          touchstone_amount++;
        }
      } else if (touchstone_amount > clarity_max) {
        while (touchstone_amount > clarity_max) {
          touchstones['-=' + touchstone_amount] = null;
          touchstone_amount -= 1;
        }
      }
        formData.system.touchstones_changeling = touchstones;
    }

    if (formData.system?.remembranceTraits) {
      formData.system.remembranceTraits = Object.values(formData.system.remembranceTraits);
    }

    // Update the Item
    await super._updateObject(event, formData);
  }

  

}