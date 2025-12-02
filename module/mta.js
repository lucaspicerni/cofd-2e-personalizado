// Import Modules
import {
  MtAActorSheet
} from "./actor-sheet.js";
import {
  MtAItemSheet
} from "./item-sheet.js";
import {
  ItemMtA
} from "./item.js";
import {
  ActorMtA
} from "./actor.js";
import {
  DetectionModeTwillight
} from "./detection-mode.js";
import {
  DiceRollerDialogue
} from "./dialogue-diceRoller.js"
import { registerSystemSettings } from "./settings.js";
import * as templates from "./templates.js";
import * as migrations from "./migration.js";
import { MTA } from "./config.js";
import {
  TokenHotBar
} from "./token-macrobar.js";
import {
  TokenMTA
} from "./token.js"
import {
  TokenTwillightFilter
} from './shaders.js'
import { MTACombatTracker } from "./combat-tracker.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  console.log(`Initializing MtA System`);
  CONFIG.debug.hooks = false
  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.MTA = MTA;
  CONFIG.TinyMCE.toolbar = CONFIG.TinyMCE.toolbar.replace("styles", "styles fontfamily forecolor backcolor");

  CONFIG.Combat.initiative.formula = "1d10 + @derivedTraits.initiativeMod.final";

  CONFIG.Item.documentClass = ItemMtA;
  CONFIG.Actor.documentClass = ActorMtA;
  CONFIG.Token.objectClass = TokenMTA;
  CONFIG.ui.combat = MTACombatTracker;


  //---------------------------------------------------


  game.tooltip.constructor.TOOLTIP_ACTIVATION_MS = 0; // God, the default tooltip duration is awful. Does anyone prefer it?

  CONFIG.JournalEntry.noteIcons = { //Removed: Barrel, Castle, Coins, Fire, Hanging Sign, Pawprint, Statue, Sword, Temple, Waterfall, Windmill
    Airport: "systems/mta/icons/notes/airport.svg",
    Anchor: "icons/svg/anchor.svg",
    Bag: "systems/mta/icons/notes/bag.svg",
    Barracks: "systems/mta/icons/notes/barracks.svg",
    Book: "icons/svg/book.svg",
    Bridge: "systems/mta/icons/notes/bridge.svg",
    Cave: "icons/svg/cave.svg",
    Chest: "icons/svg/chest.svg",
    City: "systems/mta/icons/notes/city.svg",
    Computer: "systems/mta/icons/notes/computer.svg",
    House: "icons/svg/house.svg",
    Island: "systems/mta/icons/notes/island.svg",
    Key: "systems/mta/icons/notes/key.svg",
    Mountain: "icons/svg/mountain.svg",
    'Oak Tree': "icons/svg/oak.svg",
    Obelisk: "icons/svg/obelisk.svg",
    Pentagram: "systems/mta/icons/notes/pentagram.svg",
    Pin: "systems/mta/icons/notes/pin.svg",
    Portal: "systems/mta/icons/notes/portal.svg",
    Ruins: "icons/svg/ruins.svg",
    Shop: "systems/mta/icons/notes/shop.svg",
    Sign: "systems/mta/icons/notes/sign.svg",
    Skull: "icons/svg/skull.svg",
    Spell: "systems/mta/icons/notes/spell.svg",
    Spirit: "systems/mta/icons/notes/spirit.svg",
    Tankard: "icons/svg/tankard.svg",
    'Temple Gate': "systems/mta/icons/notes/temple-gate.svg",
    Totem: "systems/mta/icons/notes/totem.svg",
    Tower: "systems/mta/icons/notes/tower.svg",
    Trap: "icons/svg/trap.svg",
    Village: "icons/svg/village.svg"
  }
  //Updated: Bridge, City, Tower
  //Added: Island, Shop, Pin, Magic Portal, Spell, Computer, Bag, Pentagram, Temple Gate, Totem, Key, Airport, Barracks, Spirit

  // Register System Settings
  registerSystemSettings();

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("cod2e", MtAActorSheet, {
    makeDefault: true
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("cod2e", MtAItemSheet, {
    makeDefault: true
  });
  // Preload Handlebars Templates
  templates.preloadHandlebarsTemplates();
  templates.registerHandlebarsHelpers();

  game.socket.on('system.mta', (request, ack) => {
    if(request.type === 'cleanupSpellEffects' && game.user.isGM) {
      handleCleanUpSpellEffects(request.spellInstanceId);
    }
  });
});

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once("setup", function() {

  if(game.settings.get("mta", "homebrewDemons")) {
    CONFIG.MTA.addHouseRules();
  }

  // Localize CONFIG objects once up-front
  const toLocalize = [
    "generalModifiers",
    "eph_physical",
    "eph_social",
    "eph_mental",
    "eph_general",
    "attributes",
    "attributes_physical",
    "attributes_social",
    "attributes_mental",
    "skills_physical",
    "skills_social",
    "skills_mental",
    "derivedTraits",
    "arcana",
    "arcana_gross",
    "arcana_subtle",
    "disciplines_common",
    "disciplines_unique",
    "vampire_traits",
    "rite_types",
    "changeling_traits",
    "werewolf_renown",
    "werewolf_traits",
    "demon_traits",
    "giftTypes",
    "attributes_physical_dream",
    "attributes_social_dream",
    "attributes_mental_dream",
    "hunter_traits",
    "mage_traits",
    "special_effects",
    "special_effects_descriptions",
    "localisation",
    "sineater_traits",
    "haunts_left",
    "haunts_right",
    "haunts"
  ];

  // Exclude some from sorting where the default order matters
  const noSort = [
    "eph_physical",
    "eph_social",
    "eph_mental",
    "attributes",
    "attributes_physical",
    "attributes_social",
    "attributes_mental",
    "derivedTraits",
    "giftTypes",
    "attributes_physical_dream",
    "attributes_social_dream",
    "attributes_mental_dream",
    "sineater_traits",
    "haunts_left",
    "haunts_right",
    "haunts"
  ];

  // Localize and sort CONFIG objects
  for ( let o of toLocalize ) {
    const localized = Object.entries(CONFIG.MTA[o]).map(e => {
      return [e[0], game.i18n.localize(e[1])];
    });
    if ( !noSort.includes(o) ) localized.sort((a, b) => a[1].localeCompare(b[1]));
    CONFIG.MTA[o] = localized.reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {});
  }

});

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration.
 * Small version changes (after the last dot) do not need a migration.
 */
Hooks.once("ready", function() {
  // Determine whether a system migration is required and feasible
  const currentVersion = game.settings.get("mta", "systemMigrationVersion");
  const migrationVersion = game.system.version;
  console.log("MTA Current Version: " + currentVersion);
  let version_nums_current = currentVersion.split(".").map(x=>+x);
  let version_nums_migration = migrationVersion.split(".").map(x=>+x);
  //const NEEDS_MIGRATION_VERSION = 0.84;
  //const COMPATIBLE_MIGRATION_VERSION = 0.80;
  let needMigration = (version_nums_current[0] < version_nums_migration[0]) || (version_nums_current[0] === version_nums_migration[0] && version_nums_current[1] < version_nums_migration[1]) || (currentVersion === null);

  // Perform the migration
  if(game.user.isGM){
    if ( needMigration) {
      migrations.migrateWorld(version_nums_current, version_nums_migration);
    }
    else if(!migrations.compareVersion(version_nums_current, version_nums_migration) && (version_nums_current[0] !== version_nums_migration[0] || version_nums_current[1] !== version_nums_migration[1] || version_nums_current[2] !== version_nums_migration[2])){
      game.settings.set("mta", "systemMigrationVersion", game.system.version);
      ui.notifications.warn(`MtA System downgraded to version ${game.system.version}.`, {permanent: true});
    }
  }
  CONFIG.MTA.TOKENBAR = TokenHotBar.tokenHotbarInit();
  foundry.utils.debounce(createTokenBar, 200);

  // NEW STATUS EFFECTS & VISION MODES
  CONFIG.statusEffects.push({
    id: "twillight",
    label: "MTA.Effect.Twillight",
    icon: "systems/mta/icons/statusEffects/twillight.svg"
  });
  CONFIG.specialStatusEffects.TWILLIGHT = "twillight";

  CONFIG.Canvas.detectionModes.seeTwillight = new DetectionModeTwillight({
    id: "seeTwillight",
    label: "MTA.Detection.SeeTwillight",
    type: DetectionMode.DETECTION_TYPES.SIGHT
  });
  CONFIG.Canvas.detectionModes.senseTwillight = new DetectionModeTwillight({
    id: "senseTwillight",
    label: "MTA.Detection.SenseTwillight",
    walls: false,
    type: DetectionMode.DETECTION_TYPES.OTHER
  });

  CONFIG.Canvas.detectionModes.xray = new DetectionModeBasicSight({
    id: "xray",
    label: "MTA.Detection.Xray",
    type: DetectionMode.DETECTION_TYPES.SIGHT,
    walls: false
  });

  // Basic sight can't see Twillight
  const basicSight_canDetect = CONFIG.Canvas.detectionModes.basicSight._canDetect;
  CONFIG.Canvas.detectionModes.basicSight._canDetect = function(visionSource, target) {
    let isVisible = basicSight_canDetect(visionSource,target);
    const tgt = target?.document;
    if((tgt instanceof TokenDocument) && tgt.hasStatusEffect(CONFIG.specialStatusEffects.TWILLIGHT)) isVisible = false;
    return isVisible;
  }

  // X-ray vision is the same as basic sight
  CONFIG.Canvas.detectionModes.xray._canDetect = CONFIG.Canvas.detectionModes.basicSight._canDetect;

  // Tremor feel can't see Twillight
  const feelTremor_canDetect = CONFIG.Canvas.detectionModes.feelTremor._canDetect;
  CONFIG.Canvas.detectionModes.feelTremor._canDetect = function(visionSource, target) {
    let isVisible = feelTremor_canDetect(visionSource,target);
    const tgt = target?.document;
    if((tgt instanceof TokenDocument) && tgt.hasStatusEffect(CONFIG.specialStatusEffects.TWILLIGHT)) isVisible = false;
    return isVisible;
  }
  // -------------------------------------
  window.COFD = {
    DiceRollerDialogue
  }

});



Hooks.on("renderChatMessage", (message, html, data) => {
  // Optionally collapse the description
  if (game.settings.get("mta", "autoCollapseItemDescription")) html.find(".card-description").hide();

  if(data.message.blind && !game.user.isGM){
    html.find(".dice-formula").html(`???`);
    html.find(".dice-tooltip").html(``);
    let total = html.find(".dice-total");
    total.html(`?`);
    total.removeClass('exceptionalSuccess dramaticFailure');

    html.addClass('hidden-message');
  }

  const actor = game.actors.get(data.message.speaker.actor);
  const senderName = html.find(".message-sender");

  // Hide actor name if player does not have at least limited permission
/*   if(actor && actor.getUserLevel(game.user) !== CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {

    // Show token name instead if that is visible (TODO: currently only works for prototype settings...)
    if(actor.prototypeToken.displayName === CONST.TOKEN_DISPLAY_MODES.ALWAYS || actor.prototypeToken.displayName === CONST.TOKEN_DISPLAY_MODES.HOVER) {
      senderName.text(actor.prototypeToken.name);
    }
    else senderName.text('???');
  } */

  // If the user is the message author or the actor owner, proceed

  if (actor && actor.isOwner) return;
  else if (game.user.isGM || (data.author.id === game.user.id)) return;

  // Chat card changes
  const chatCard = html.find(".chat-card");
  if (chatCard.length === 0) {
    return;
  }

  // Otherwise hide action buttons
  const buttons = chatCard.find("button[data-action]");
  buttons.each((i, btn) => {
    btn.style.display = "none"
  });
});

Hooks.on("renderChatLog", (app, html, data) => ItemMtA.chatListeners(html));

//Dice Roller
$(document).ready(() => {
  const diceIconSelector = '#chat-controls .chat-control-icon .fa-dice-d20';

  $(document).on('click', diceIconSelector, ev => {
    ev.preventDefault();
    let diceRoller = new DiceRollerDialogue({});
    diceRoller.render(true);
  });
});

Hooks.on("renderActorDirectory", (app, html, data) => {
  const actorListItems = html.find('.actor');

  actorListItems.toArray().forEach(v => {
    const id = v.dataset.documentId;
    if(id){
      const actor = game.actors.get(id);
      if(actor){
        //Adds colored border to characters based on their type
        let characterType;
        switch (actor.type) {
          case "character": characterType = actor.system.characterType; break;
          case "simple_antagonist": characterType = actor.system.simpleAntagonistType; break;
          case "brief_nightmare": characterType = actor.system.briefNightmareType; break;
          case "ephemeral": characterType = actor.system.ephemeralType; break;
          default: characterType = null;
        }
        const color = game.user.isGM || actor.system.isTypeKnown ? CONFIG.MTA.typeColors[characterType] : CONFIG.MTA.typeColors["unknown"];
        $(v).find('img').css("border", "1px solid " + color);
        //$(v).find('a').css("color", color);

      }
      else console.log("ERROR: invalid actor found.")
    }
  });
});


const createTokenBar = () =>
  {
    const controlled = canvas.tokens.controlled;
    if(controlled.length){
      CONFIG.MTA.TOKENBAR.tokens = controlled;
      CONFIG.MTA.TOKENBAR.render(true);
    }
    else{
      CONFIG.MTA.TOKENBAR.close();
    }
  }

Hooks.on("controlToken", foundry.utils.debounce(createTokenBar, 200));

Hooks.on("updateActor", foundry.utils.debounce(createTokenBar, 200));
Hooks.on("updateItem", foundry.utils.debounce(createTokenBar, 200));
Hooks.on("updateToken", foundry.utils.debounce(createTokenBar, 200));


Hooks.on("deleteItem", (item, options, userId) => {
  if (item.type !== "activeSpell") return;
  const spellInstanceId = item.system.spellInstanceId;
  if (!spellInstanceId) return;

  if(game.user.isGM) {
    handleCleanUpSpellEffects(spellInstanceId);
  }
  else {
    game.socket.emit("system.mta", {
      type: "cleanupSpellEffects",
      spellInstanceId
    });
  }
});

async function handleCleanUpSpellEffects(spellInstanceId) {
  if(!spellInstanceId) return;
  if(!game.user.isGM) return;
  for (let actor of game.actors.contents) {
    const toDelete = actor.items.filter(i =>
      i.type === "spellEffect" 
      && i.system?.spellInstanceId
      && i.system?.spellInstanceId === spellInstanceId
    );
    if(toDelete.length) {
      await actor.deleteEmbeddedDocuments("Item", toDelete.map(i => i.id));
      ui.notifications.warn(`${toDelete.length} efeito de feitiço deletado de ${actor.name}`);
    }
  }
}



// This override draws a specific shader for the Twillight condition

Hooks.on("drawToken", (token) => {
  configureTokenTwillightFilter(token, token.document.hasStatusEffect(CONFIG.specialStatusEffects.TWILLIGHT));
});

Hooks.on("applyTokenStatusEffect", (token, statusId, active) => {
  if (statusId === CONFIG.specialStatusEffects.TWILLIGHT) {
    canvas.perception.update({ refreshVision: true, refreshLighting: true }, true);
    configureTokenTwillightFilter(token, active);
  }
});

function configureTokenTwillightFilter(token, active) {
  if (!active) token.mesh.filters?.findSplice(filter => filter instanceof TokenTwillightFilter);
  else if (!token.mesh.filters?.some(filter => filter instanceof TokenTwillightFilter)) {
    const filter = TokenTwillightFilter.create();
    token.mesh.filters ??= [];
    token.mesh.filters.push(filter);
  }
}
