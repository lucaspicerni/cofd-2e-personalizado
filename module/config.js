/**
 * WARNING: Remember, if you change anything in this file, it will get overwritten when the system updates. 
 * So make a backup of any changes, and re-apply them afterwards.
 */

// Namespace Configuration Values
export const MTA = {};

const path = 'systems/mta/icons/placeholders/';


/**
 * The paths to the individual placeholder icons
 * for each item type within the system.
 * Feel free to modify, but add the corresponding
 * icon in the placeholder path.
 * Note: There is a bug in Firefox with svg icons which
 * have an explicity width and height.
*/
MTA.placeholders = new Map([
  ["condition", path + 'Condition.svg'],
  ["tilt", path + 'Tilt.svg'],
  ["environmental", path + 'EnvironmentalTilt.svg'],
  ["death", path + "Death.svg"],
  ["fate", path + "Fate.svg"],
  ["forces", path + "Forces.svg"],
  ["life", path + "Life.svg"],
  ["matter", path + "Matter.svg"],
  ["mind", path + "Mind.svg"],
  ["prime", path + "Prime.svg"],
  ["space", path + "Space.svg"],
  ["spirit", path + "Spirit.svg"],
  ["time", path + "Time.svg"],
  ["relationship", path + 'Relationship.svg'],
  ["vinculum", path + 'Relationship.svg'],
  ["service", path + 'Service.svg'],
  ["container", path + 'Container.svg'],
  ["merit", path + 'Merit.svg'],
  ["yantra", path + 'Yantra.svg'],
  ["firearm", path + 'Firearm.svg'],
  ["melee", path + 'Melee.svg'],
  ["unarmed", path + 'Unarmed.svg'],
  ["thrown", path + 'Thrown.svg'],
  ["equipment", path + 'Equipment.svg'],
  ["armor", path + 'Armor.svg'],
  ["ammo", path + 'Ammo.svg'],
  ["contract", path + 'Contract.svg'],
  ["pledge", path + 'Pledge.svg'],
  ["devotion", path + 'devotion.svg'],
  ["rite", path + 'Rite.svg'],
  ["miracle", path + 'Miracle.svg'],
  ["discipline_power", path + 'DisciplinePower.svg'],
  ["magic", path + 'Magic.svg'],
  ["werewolf_rite", path + 'Rite-Wolf.svg'],
  ["pack_rite", path + 'Rite-Pack.svg'],
  ["numen", path + 'Numen.svg'],
  ["manifestation", path + 'Manifestation.svg'],
  ["influence", path + 'Influence.svg'],
  ["moonGift", path + 'Gift-Moon.svg'],
  ["shadowGift", path + 'Gift-Shadow.svg'],
  ["wolfGift", path + 'Gift-Wolf.svg'],
  ["vehicle", path + 'Vehicle.svg'],
  ["dreadPower", path + 'DreadPower.svg'],
  ["embed", path + 'Embed.svg'],
  ["interlock", path + 'Interlock.svg'],
  ["exploit", path + 'Exploit.svg'],
  ["cover", path + 'Cover.svg'],
  ["glitch", path + 'Glitch.svg'],
  ["pact", path + 'Pact.svg'],
  ["formAbility", path + 'Manifestation.svg'],
  ["coil", path + 'Coil.svg'],
  ["scale", path + 'Scale.svg'],
  ["form", 'systems/mta/icons/forms/Gauru.svg'],
  ["tactic", path + 'Tactic.svg'],
  ["advanced_armory", path + 'advanced_armory.svg'],
  ["virtuous_ritual", path + 'virtuous_ritual.svg'],
  ["castigation_rite", path + 'castigation_rite.svg'],
  ["elixir", path + 'elixir.svg'],
  ["perispiritism_ritual", path + 'perispiritism_ritual.svg'],
  ["teleinformatics", path + 'teleinformatics.svg'],
  ["thaumatech_implant", path + 'thaumatech_implant.svg'],
  ["explosive", path + 'explosive.svg'],
  ["combat_dice_pool", path + 'combat_dice_pool.svg'],
  ["haunt_power", path + 'haunt_power.svg'],
  ["key", path + 'key.svg'],
  ["ceremony", path + 'ceremony.svg'],
]);

/**
 * The trait maximum for attribute & skill buffs.
 * if the trait has a higher base value on the sheet,
 * that value is used instead.
 * Change it freely.
*/
MTA.traitMaximum = 100; // The absolute trait buff maximum (though it could be infinite in theory...)
MTA.traitMaximumLower = 5; // The maximum used for buffs without the checkbox, only used for attributes&skills, not derived traits

/**
 * The list of supported character types.
 * Any value added to this list will fall back to the Mortal sheet.
 * @type {Array[]}
 */
MTA.characterTypes = [
  "Mortal", 
  "Sleepwalker", 
  "Mage", 
  "Scelesti", 
  "Proximi", 
  "Vampire", 
  "Ghoul", 
  "Changeling", 
  "Werewolf", 
  "Demon", 
  "Hunter",
  "Sin-Eater"
];

/**
 * These are all the actor types for which the custom prepareData() is run.
 */
MTA.supportedActorTypes = [
  'character', 'ephemeral', 'simple_antagonist', 'brief_nightmare'
];

/**
 * The list of supported ephemeral entity types.
 * Any value added to this list will fall back to the ??? sheet.
 * @type {Array[]}
 */
MTA.ephemeralTypes = ["Angel", "Ghost", "Spirit", "Goetia", "Supernal Entity"];

MTA.scelestiRanks = ["Rabashak", "Nasnas", "Autarch", "Shedu", "Baal", "Aswadim"];

MTA.briefNightmareTypes = ["Minion", "Horde", "LoneTerror"];

MTA.supernalEntityTypes = {
  death: "Spectre",
  fate: "Moira",
  forces: "Seraph",
  life: "Atavism",
  matter: "Apeiron",
  mind: "Wraith",
  prime: "Cherub",
  space: "Imp",
  spirit: "Totem",
  time: "Anachronism"
}

MTA.special_effects = {
  "defenseBrawl": "MTA.SE.DefenseBrawl",
  "defenseWeaponry": "MTA.SE.DefenseWeaponry",
  "defenseAthletics": "MTA.SE.DefenseAthletics",
  "defenseHigherOfWitsAndDex": "MTA.SE.DefenseHigherOfWitsAndDex",
  "defenseHigherOfWitsAndDexWerewolf": "MTA.SE.DefenseHigherOfWitsAndDexWerewolf",
  "defenseUseResistance": "MTA.SE.DefenseUseResistance",
  "reducedWoundPenalty": "MTA.SE.ReducedWoundPenalty",
  "shadowName": "MTA.SE.ShadowName",
  "cabalTheme": "MTA.SE.CabalTheme",
  "highSpeech": "MTA.SE.HighSpeech"
/*   "initiativePerDot": "MTA.SE.InitiativePerDot",
  "speedPerDot": "MTA.SE.SpeedPerDot" */
}

MTA.special_effects_descriptions = {
  "defenseBrawl": "MTA.SE.DefenseBrawlInfo",
  "defenseWeaponry": "MTA.SE.DefenseWeaponryInfo",
  "defenseAthletics": "MTA.SE.DefenseAthleticsInfo",
  "defenseHigherOfWitsAndDex": "MTA.SE.DefenseHigherOfWitsAndDexInfo",
  "defenseHigherOfWitsAndDexWerewolf": "MTA.SE.DefenseHigherOfWitsAndDexWerewolfInfo",
  "defenseUseResistance": "MTA.SE.DefenseUseResistanceInfo",
  "reducedWoundPenalty": "MTA.SE.ReducedWoundPenaltyInfo",
  "shadowName": "MTA.SE.ShadowNameInfo",
  "cabalTheme": "MTA.SE.CabalThemeInfo",
  "highSpeech": "MTA.SE.HighSpeechInfo"
/*   "initiativePerDot": "MTA.SE.InitiativePerDotInfo",
  "speedPerDot": "MTA.SE.SpeedPerDotInfo" */
}

MTA.all_traits = {
  general: {
    name: "MTA.generalModifiers",
    list: [
      "generalModifiers"
    ]
  },
  attributes: {
    name: "MTA.Attributes",
    list: [
      "attributes_physical",
      "attributes_social",
      "attributes_mental"
    ]
  },
  skills: {
    name: "MTA.Skills",
    list: [
      "skills_physical",
      "skills_social",
      "skills_mental"
    ]
  },
  traits: {
    name: "MTA.Traits",
    list: [
      "derivedTraits"
    ]
  },
  mage_traits: {
    name: "MTA.Mage_traits",
    list: [
      "mage_traits",
      "arcana_gross",
      "arcana_subtle"
    ]
  },
  vampire_traits: {
    name: "MTA.Vampire_traits",
    list: [
      "vampire_traits",
      "disciplines_common",
      "disciplines_unique",
    ]
  },
  werewolf_traits: {
    name: "MTA.Werewolf_traits",
    list: [
      "werewolf_traits",
      "werewolf_renown"
    ]
  },
  changeling_traits: {
    name: "MTA.Changeling_traits",
    list: [
      "changeling_traits"
    ]
  },
  hunter_traits: {
    name: "MTA.Hunter_traits",
    list: [
      "hunter_traits"
    ]
  },
  demon_traits: {
    name: "MTA.Demon_traits",
    list: [
      "demon_traits"
    ]
  },
  sineater_traits: {
    name: "MTA.Sineater_traits",
    list: [
      "sineater_traits",
      "haunts"
    ]
  },
  dream_traits: {
    name: "MTA.Dream_traits",
    list: [
      "attributes_physical_dream",
      "attributes_social_dream",
      "attributes_mental_dream"
    ]
  },
  ephemeral_traits: {
    name: "MTA.Ephemeral_traits",
    list: [
      "eph_physical",
      "eph_social",
      "eph_mental",
      "eph_general"
    ]
  }
}









/**
 * The set of ephemeral attributes used within the system.
 * I know these attributes are technically not physical, social, and mental,
 * but do you seriously expect me to call these lists eph_power, etc.?
 * While new attributes can freely be added, removal is not advised (as some are used for derived traits).
 * @type {Object}
 */
MTA.eph_physical = {
  "power": "MTA.EphPower"
};
MTA.eph_social = {
  "finesse": "MTA.EphFinesse"
};
MTA.eph_mental = {
  "resistance": "MTA.EphResistance"
};

MTA.eph_general = {
  "rank": "MTA.Rank"
};

/**
 * A list of general modifiers.
 */
MTA.generalModifiers = {
  "allDicePools": "MTA.generalModifiers.allDicePools",
  "physicalDicePools": "MTA.generalModifiers.physicalDicePools",
  "socialDicePools": "MTA.generalModifiers.socialDicePools",
  "mentalDicePools": "MTA.generalModifiers.mentalDicePools"
}

/**
 * The set of Attributes used within the system.
 * While new attributes can freely be added, removal is not advised (as some are used for derived traits).
 * @type {Object}
 */
MTA.attributes_physical = {
    "strength": "MTA.Strength",
    "dexterity": "MTA.Dexterity",
    "stamina": "MTA.Stamina"
  };
MTA.attributes_social = {
    "presence": "MTA.Presence",
    "manipulation": "MTA.Manipulation",
    "composure": "MTA.Composure"
  };
MTA.attributes_mental = {
    "intelligence": "MTA.Intelligence",
    "wits": "MTA.Wits",
    "resolve": "MTA.Resolve"
  };

  MTA.attributes = Object.assign({}, MTA.attributes_physical, MTA.attributes_social, MTA.attributes_mental);

/**
 * The set of Skills used within the system.
 * While new skills can freely be added, removal is not advised (as some are used for derived traits).
 * @type {Object}
 */
MTA.skills_physical = {
    "athletics": "MTA.Athletics",
    "brawl": "MTA.Brawl",
    "drive": "MTA.Drive",
    "firearms": "MTA.Firearms",
    "larceny": "MTA.Larceny",
    "stealth": "MTA.Stealth", 
    "survival": "MTA.Survival",
    "weaponry": "MTA.Weaponry"
  };
MTA.skills_social = {
    "animalKen": "MTA.AnimalKen",
    "empathy": "MTA.Empathy",
    "expression": "MTA.Expression",
    "intimidation": "MTA.Intimidation",
    "persuasion": "MTA.Persuasion",
    "socialize": "MTA.Socialize", 
    "streetwise": "MTA.Streetwise",
    "subterfuge": "MTA.Subterfuge"
  };
MTA.skills_mental = {
    "academics": "MTA.Academics",
    "computer": "MTA.Computer",
    "crafts": "MTA.Crafts",
    "investigation": "MTA.Investigation",
    "medicine": "MTA.Medicine",
    "occult": "MTA.Occult", 
    "politics": "MTA.Politics",
    "science": "MTA.Science"
  };

/**
 * The set of Derived Traits used within the system.
 * Do not modify.
 * @type {Object}
 */
MTA.derivedTraits = {
  "size": "MTA.Size",
  "speed": "MTA.Speed",
  "defense": "MTA.Defense",
  "armor": "MTA.Armor",
  "initiativeMod": "MTA.Initiative",
  "ballistic": "MTA.BallisticArmor",
  "perception": "MTA.Perception",
  "health": "MTA.Health",
  "willpower": "MTA.Willpower"
}


/**
 * The set of Derived Dream Traits used within the system.
 * Do not modify.
 * @type {Object}
 */

MTA.attributes_physical_dream = {
  "power": "MTA.EphPower"
};

MTA.attributes_social_dream = {
  "finesse": "MTA.EphFinesse"
};

MTA.attributes_mental_dream = {
  "resistance": "MTA.EphResistance"
};


/**
 * The list of firearm ammunition.
 * Can freely be modified.
 * @type {Array[]}
 */
MTA.cartridges = ["9mm", ".38 Special", ".44 Magnum", ".45 ACP", "30.06", "5.56mm", "12-gauge", "Arrow", "Bolt", "Fuel Canister"];

/**
 * The list of relationship impressions.
 * Can freely be modified.
 * @type {Array[]}
 */
MTA.impressions = ["Hostil","Mediana","Boa","Excelente","Perfeita"];

/**
 * The list of ephemeral ranks.
 * Contains a nickname for every rank for every ephemeral entity type.
 * Knowledge, max_essence, and numina are currently unused.
 * @type {Array[]}
 */
 MTA.ephemeral_ranks = [{rank: 1, Ghost: "Poltergeist", Spirit: "Lesser Spirit", Angel: "Lesser angel", Goetia: "Figment", knowledge: 10, max_essence: 10, numina: "1-3"},
 {rank: 2, Ghost: "Minor ghost", Spirit: "Minor Spirit", Angel: "Angel", Goetia: "Notion", knowledge: 15, max_essence: 15, numina: "3-5"},
 {rank: 3, Ghost: "Average ghost", Spirit: "Average Spirit", Angel: "Archangel", Goetia: "Idea", knowledge: 25, max_essence: 20, numina: "5-7"},
 {rank: 4, Ghost: "Powerful ghost", Spirit: "Powerful Spirit", Angel: "Principality", Goetia: "Trend", knowledge: 35, max_essence: 30, numina: "7-9"},
 {rank: 5, Ghost: "Geist", Spirit: "Minor god", Angel: "Power", Goetia: "Meme", knowledge: 40, max_essence: 50, numina: "9-11"},
 {rank: 6, Ghost: "Geist", Spirit: "Lesser god", Angel: "Virtue", Goetia:"Belief", knowledge: 55, max_essence: 56, numina: "11-13"},
 {rank: 7, Ghost: "Geist", Spirit: "Greater god", Angel: "Dominion", Goetia:"Mentality", knowledge: 60, max_essence: 60, numina: "13-14"},
 {rank: 8, Ghost: "Geist", Spirit: "Lesser Celestine", Angel: "Throne", Goetia:"Ethos", knowledge: 70, max_essence: 70, numina: "14-16"},
 {rank: 9, Ghost: "Geist", Spirit: "Greater Celestine", Angel: "Cherubim", Goetia:"Psyche", knowledge: 80, max_essence: 80, numina: "16-20"},
 {rank: 10, Ghost: "Geist", Spirit: "Beyond manifest", Angel: "Seraphim", Goetia:"Noosphere", knowledge: 100, max_essence: 100, numina: "20+"}
];


MTA.EXTRA_BEAT_CONFIG = {
  "Scelesti": "MTA.ArcBeats",
  "Mage": "MTA.ArcBeats",
  "Hunter": "MTA.GroupBeats",
  "Sin-Eater": "MTA.SynergyBeats",
  "Vampire": "MTA.BloodBeats"
}

MTA.EXTRA_EXP_CONFIG = {
  "Scelesti": "MTA.ArcExp",
  "Mage": "MTA.ArcExp",
  "Hunter": "MTA.GroupExp",
  "Sin-Eater": "MTA.SynergyExp",
  "Vampire": "MTA.BloodExp"
}


// TODO:
/* MTA.allowedItemTypes = {
  character: [
    "equipment", 
    "container", 
    "service", 
    "firearm", 
    "melee", 
    "armor", 
    "ammo", 
    "spell", 
    "condition", 
    "tilt", 
    "merit", 
    "activeSpell", 
    "yantra", 
    "attainment", 
    "relationship", 
    "vehicle", 
    "devotion", 
    "rite", 
    "vinculum", 
    "discipline_power", 
    "contract", 
    "pledge", 
    "form", 
    "facet", 
    "werewolf_rite", 
    "numen", 
    "dreadPower", 
    "embed", 
    "interlock", 
    "exploit", 
    "cover", 
    "glitch", 
    "pact", 
    "formAbility", 
    "coil", 
    "scale", 
    "tactic", 
    "advanced_armory", 
    "virtuous_ritual", 
    "castigation_rite", 
    "elixir", 
    "perispiritism_ritual", 
    "teleinformatics", 
    "thaumatech_implant", 
    "explosive"
  ],
  ephemeral: [
    "numen", 
    "manifestation", 
    "influence",
    "dreadPower",
    "demonPower"
  ],
  simple_antagonist: [
    "general_dice_pool", 
    "combat_dice_pool"
  ],
  brief_nightmare: [
    "best_dice_pool", 
    "worst_dice_pool", 
    "dreadPower"
  ]
} */

/**
 * A list of item types that ephemeral entities use.
 */
MTA.ephemeralItemTypes = [
  "numen", "manifestation", "influence", "dreadPower", "spell", "activeSpell", "spellEffect"
]

/**
 * A list of item types that normal characters use.
 */
MTA.characterItemTypes = [
  "spell", "merit", "activeSpell", "spellEffect", "yantra", "attainment", "relationship", "devotion", "rite", "vinculum", "discipline_power", "contract", "pledge", "form", "facet", "werewolf_rite", "dreadPower", "embed", "interlock", "exploit", "cover", "glitch", "pact", "formAbility", "coil", "scale"
]

/**
 * A list of item types that simple antagonists use.
 */
MTA.simpleAntagonistItemTypes = [
  "general_dice_pool", "combat_dice_pool"
]

/**
 * A list of item types that brief nightmares use.
 */
MTA.briefNightmareItemTypes = [
  "best_dice_pool", "worst_dice_pool", "dreadPower"
]

/**
 * The set of colours used as the border around portraits in the 
 * actor directory, when the user is the GM, or the character type
 * is set to visible on the character sheet.
 * @type {Object}
 */
MTA.typeColors = {
  unknown: "DimGray", 
  Mortal: "White", 
  Sleepwalker: "CadetBlue", 
  Proximi: "Aquamarine", 
  Mage: "Aqua", 
  Scelesti: "Purple",
  Ghost: "BurlyWood", 
  Spirit: "MediumPurple", 
  Angel: "Gold", 
  Demon: "Orangered", 
  Goetia: "#79aaf7",
  "Supernal Entity": "#be51ed",
  Vampire: "Crimson", 
  Ghoul: "#B01030", 
  Changeling: "DarkGreen", 
  Werewolf: "saddlebrown",
  Hunter: "slategray", 
  SimpleAntagonist: "White",
  BriefNightmareMinion: "White",
  BriefNightmareHorde: "White",
  BriefNightmareLoneTerror: "White",
  "Sin-Eater": "#00AD00",
};


MTA.magicItemColors = {
  Default: '#9370db',
  Awakened: '#00FFFF',
  Gadget: '#ffd700',
  Imbued: '#00FFFF',
  Enhanced: '	#5BFF46 ',
  Artifact: '#ff8c00',
  Embedded: '#ffd700',
  Exploited: '#ff4500',
  Memento: '#E673AE',
}





/**
 * The list of supported melee weapon types.
 * Values added here will fall back to using Strength + Weaponry as
 * the associated dice pool for rolling.
 * @type {Array[]}
 */
MTA.meleeTypes = ["Melee", "Unarmed", "Thrown"];


/**
 * List of merits with special functions in order to display tooltips.
 * Don't modify.
 */
/* MTA.SPECIAL_MERITS = [
  {name: "MTA.DefensiveCombatBrawl", tooltip: "MTA.DefensiveCombatBrawlInfo"},
  {name: "MTA.DefensiveCombatWeaponry", tooltip: "MTA.DefensiveCombatWeaponryInfo"},
  {name: "MTA.DefensiveIronStamina", tooltip: "MTA.DefensiveIronStaminaInfo"}
]; */


MTA.localisation = {
  coercive: "MTA.Coercive",
  positional: "MTA.Positional",
  sympathetic: "MTA.Sympathetic",
  empathetic: "MTA.Empathetic"
}

/* MTA.SPECIAL_EFFECTS = {
  useBrawlForDefense,
  useWeaponryForDefense,
  ironStamina1,
  ironStamina2,
  ironStamina3,
  woundPenalty1,
  ironStamina: {
    usePotency: true
  }
} */

/* -------------------------------------------- */
/*          Mage the Awakening                  */
/* -------------------------------------------- */

/**
 * The set of gross and subtle Arcana used within the system.
 * Can freely be modified.
 * @type {Object}
 */
MTA.arcana_gross = {
  "forces": "MTA.ArcanumForces",
  "life": "MTA.ArcanumLife",
  "matter": "MTA.ArcanumMatter",
  "space": "MTA.ArcanumSpace",
  "time": "MTA.ArcanumTime"
};

MTA.arcana_subtle = {
  "death": "MTA.ArcanumDeath",
  "fate": "MTA.ArcanumFate",
  "mind": "MTA.ArcanumMind",
  "prime": "MTA.ArcanumPrime",
  "spirit": "MTA.ArcanumSpirit"
};

// A combination of gross and subtle Arcana, to be sorted separately.
MTA.arcana = Object.assign({}, MTA.arcana_gross, MTA.arcana_subtle);

/**
 * The set of rollable Mage traits used within the system.
 * Do not modify.
 * @type {Object}
 */
 MTA.mage_traits = {
  "gnosis": "MTA.MageGnosis",
  "wisdom": "MTA.MageWisdom",
  "joining": "MTA.ScelestiJoining",
  "activeSpellMaximum": "MTA.ActiveSpellMaximum"
}


MTA.practices = ["Compelling", "Knowing", "Unveiling", "Ruling", "Shielding", "Veiling", "Fraying", "Perfecting", "Weaving", "Patterning", "Unraveling", "Making", "Unmaking"];
MTA.primaryFactors = ["Potency", "Duration"];
MTA.spell_casting = {
  potency: {
    standard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    advanced: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  },
  duration: {
    standard: ["1 turn", "2 turns", "3 turns", "5 turns", "10 turns", "20 turns", "30 turns", "40 turns", "50 turns", "60 turns", "70 turns"],
    advanced: ["1 scene/hour", "1 day", "1 week", "1 month", "1 year", "Indefinite"]
  },
  scale: {
    standard: ["1 Subject, Size 5, Arm's reach", "2 Subjects, Size 6, Small room", "4 Subjects, Size 7, Large room", "8 Subjects, Size 8, Single floor", "16 Subjects, Size 9, Small house"],
    advanced: ["5 Subjects, Size 5, Large house", "10 Subjects, Size 10, Small warehouse", "20 Subjects, Size 15, Supermarket", "40 Subjects, Size 20, Shopping mall", "80 Subjects, Size 25, City block", "160 Subjects, Size 30, Small neighborhood", "320 Subjects, Size 35, Small neighborhood", "640 Subjects, Size 40, Small neighborhood", "1280 Subjects, Size 45, Small neighborhood"]
  },
  casting_time: {
    standard: ["3 hours", "1 hour", "30 minutes", "10 minutes", "1 minute"],
    advanced: ["1 turn"]
  },
  range: {
    standard: ["Self/touch or Aimed"],
    advanced: ["Sensory", "Remote View"]
  },
  sleeper_witnesses: ["None", "One", "A few", "Large group", "Full crowd"],
  condition: ["No condition", "Improbable condition", "Infrequent condition", "Common condition"]
};
MTA.gnosis_levels = [
    {mana_per_turn: 1, max_mana: 10, scouringFrequency: 1, yantraMax: 2, combinedSpellMax: 0},
    {mana_per_turn: 2, max_mana: 11, scouringFrequency: 1, yantraMax: 2, combinedSpellMax: 0},
    {mana_per_turn: 3, max_mana: 12, scouringFrequency: 1, yantraMax: 3, combinedSpellMax: 1},
    {mana_per_turn: 4, max_mana: 13, scouringFrequency: 1, yantraMax: 3, combinedSpellMax: 1},
    {mana_per_turn: 5, max_mana: 15, scouringFrequency: 2, yantraMax: 4, combinedSpellMax: 1},
    {mana_per_turn: 6, max_mana: 20, scouringFrequency: 2, yantraMax: 4, combinedSpellMax: 2},
    {mana_per_turn: 7, max_mana: 25, scouringFrequency: 3, yantraMax: 5, combinedSpellMax: 2},
    {mana_per_turn: 8, max_mana: 30, scouringFrequency: 3, yantraMax: 5, combinedSpellMax: 2},
    {mana_per_turn: 10, max_mana: 50, scouringFrequency: 3, yantraMax: 6, combinedSpellMax: 3},
    {mana_per_turn: 15, max_mana: 75, scouringFrequency: 4, yantraMax: 6, combinedSpellMax: 3}
  ];

MTA.yantras = [
  {name: "tool", value: 1},
  {name: "environment", value: 1},
  {name: "demesne", value: 2},
  {name: "supernalVerge", value: 2},
  {name: "concentration", value: 2},
  {name: "mantra", value: 2},
  {name: "runes", value: 2},
  {name: "representationalLink", value: 1},
  {name: "materialLink", value: 2},
  {name: "sacrament", value: 1},
  {name: "sacrament", value: 2},
  {name: "sacrament", value: 3},
]

/* -------------------------------------------- */
/*          Vampire the Requiem                 */
/* -------------------------------------------- */

MTA.bloodPotency_levels = [
    {vitae_per_turn: 1, max_vitae: undefined},
    {vitae_per_turn: 1, max_vitae: 10},
    {vitae_per_turn: 2, max_vitae: 11},
    {vitae_per_turn: 3, max_vitae: 12},
    {vitae_per_turn: 4, max_vitae: 13},
    {vitae_per_turn: 5, max_vitae: 15},
    {vitae_per_turn: 6, max_vitae: 20},
    {vitae_per_turn: 7, max_vitae: 25},
    {vitae_per_turn: 8, max_vitae: 30},
    {vitae_per_turn: 10, max_vitae: 50},
    {vitae_per_turn: 15, max_vitae: 75}
  ];
MTA.actionTypes = ["Instant", "Reflexive", "Contested vs", "Contested (refl. resist.) vs", "Extended"];
MTA.rite_types = {
  rite: "MTA.Rite",
  miracle: "MTA.Miracle"
}

MTA.rite_withstandTypes = ["Resisted by", "Contested by"];


/**
 * The set of Vampire disciplines.
 * The separation into common and unique is purely for display purposes (and not even correct).
 * Can freely be modified.
 * @type {Object}
 */
MTA.disciplines_common = {
  "celerity": "MTA.DisciplineCelerity", // Adds to defense
  "resilience": "MTA.DisciplineResilience",
  "vigor": "MTA.DisciplineVigor",
  "animalism": "MTA.DisciplineAnimalism",
  "obfuscate": "MTA.DisciplineObfuscate",
  "cruac": "MTA.DisciplineCruac"
};

MTA.disciplines_unique = {
  "auspex": "MTA.DisciplineAuspex",
  "dominate": "MTA.DisciplineDominate",
  "majesty": "MTA.DisciplineMajesty",
  "nightmare": "MTA.DisciplineNightmare",
  "protean": "MTA.DisciplineProtean",
  "thebanSorcery": "MTA.DisciplineThebanSorcery"
};

/**
 * The set of rollable Vampire traits used within the system.
 * Do not modify.
 * @type {Object}
 */
 MTA.vampire_traits = {
  "bloodPotency": "MTA.BloodPotency",
  "humanity": "MTA.Humanity"
}


/* -------------------------------------------- */
/*          Changeling the Lost                 */
/* -------------------------------------------- */

/**
 * The set of rollable Changeling traits used within the system.
 * Do not modify.
 * @type {Object}
 */
 MTA.changeling_traits = {
  "wyrd": "MTA.ChangelingWyrd",
  "mantle": "MTA.ChangelingMantle"
}



MTA.glamour_levels = [
    {glamour_per_turn: 1, max_glamour: 10},
    {glamour_per_turn: 2, max_glamour: 11},
    {glamour_per_turn: 3, max_glamour: 12},
    {glamour_per_turn: 4, max_glamour: 13},
    {glamour_per_turn: 5, max_glamour: 15},
    {glamour_per_turn: 6, max_glamour: 20},
    {glamour_per_turn: 7, max_glamour: 25},
    {glamour_per_turn: 8, max_glamour: 30},
    {glamour_per_turn: 10, max_glamour: 50},
    {glamour_per_turn: 15, max_glamour: 75}
  ];
  
MTA.contract_majorTypes = ["Arcadian", "Court", "Goblin"];
MTA.contract_ArcadianTypes = ["Crown", "Jewels", "Mirror", "Shield", "Steed", "Sword"];
MTA.contract_CourtTypes = ["Spring", "Summer", "Autumn", "Winter"];
MTA.contract_regalia = ["Common", "Royal"];
MTA.pledge_types = ["Sealing", "Oath", "Bargain"];

/* -------------------------------------------- */
/*          Werewolf the Requiem                */
/* -------------------------------------------- */

MTA.giftTypes = {
  moon: "MTA.Moon", 
  shadow: "MTA.Shadow", 
  wolf: "MTA.Wolf"
};

/**
 * The set of Werewolf Renown used within the system.
 * Can freely be modified.
 * @type {Object}
 */
MTA.werewolf_renown = {
  "purity": "MTA.WerewolfPurity",
  "glory": "MTA.WerewolfGlory",
  "honor": "MTA.WerewolfHonor",
  "wisdom": "MTA.WerewolfWisdom",
  "cunning": "MTA.WerewolfCunning"
}

/**
 * The set of rollable Werewolf traits used within the system.
 * Do not modify.
 * @type {Object}
 */
MTA.werewolf_traits = {
  "primalUrge": "MTA.WerewolfPrimalUrge",
  "harmony": "MTA.WerewolfHarmony"
}

MTA.primalUrge_levels = [
  {essence_per_turn: 1, max_essence: 10},
  {essence_per_turn: 2, max_essence: 11},
  {essence_per_turn: 3, max_essence: 12},
  {essence_per_turn: 4, max_essence: 13},
  {essence_per_turn: 5, max_essence: 15},
  {essence_per_turn: 6, max_essence: 20},
  {essence_per_turn: 7, max_essence: 25},
  {essence_per_turn: 8, max_essence: 30},
  {essence_per_turn: 10, max_essence: 50},
  {essence_per_turn: 15, max_essence: 75}
];

/* -------------------------------------------- */
/*          Demon the Descent                   */
/* -------------------------------------------- */

/**
 * The set of rollable Demon traits used within the system.
 * Do not modify.
 * @type {Object}
 */
MTA.demon_traits = {
  "primum": "MTA.Primum"
};

MTA.primum_levels = [
  {aether_per_turn: 1, max_aether: 10},
  {aether_per_turn: 2, max_aether: 11},
  {aether_per_turn: 3, max_aether: 12},
  {aether_per_turn: 4, max_aether: 13},
  {aether_per_turn: 5, max_aether: 14},
  {aether_per_turn: 6, max_aether: 15},
  {aether_per_turn: 7, max_aether: 20},
  {aether_per_turn: 8, max_aether: 30},
  {aether_per_turn: 10, max_aether: 50},
  {aether_per_turn: 15, max_aether: 100}
];

/* -------------------------------------------- */
/*          Hunter                              */
/* -------------------------------------------- */

MTA.hunter_traits = {
  "elixir": "MTA.Elixir",
  "advanced_armory": "MTA.AdvancedArmory",
  "benediction": "MTA.Benediction"
}

/* -------------------------------------------- */
/*          Geist the Sin-Eaters                */
/* -------------------------------------------- */

MTA.sineater_traits = {
  "synergy": "MTA.sineater_traits.synergy"
};

MTA.synergy_levels = [
  {plasm_per_turn: 1, max_plasm: 10, relationship: "coercive", liminalAura: "none", touchstones: 1},
  {plasm_per_turn: 2, max_plasm: 11, relationship: "positional", liminalAura: "anchor", touchstones: 1},
  {plasm_per_turn: 3, max_plasm: 12, relationship: "positional", liminalAura: "anchor", touchstones: 2},
  {plasm_per_turn: 4, max_plasm: 13, relationship: "positional", liminalAura: "anchor", touchstones: 2},
  {plasm_per_turn: 5, max_plasm: 15, relationship: "sympathetic", liminalAura: "anchor", touchstones: 2},
  {plasm_per_turn: 6, max_plasm: 20, relationship: "sympathetic", liminalAura: "open", touchstones: 3},
  {plasm_per_turn: 7, max_plasm: 30, relationship: "sympathetic", liminalAura: "open", touchstones: 3},
  {plasm_per_turn: 8, max_plasm: 40, relationship: "empathetic", liminalAura: "open", touchstones: 3},
  {plasm_per_turn: 9, max_plasm: 50, relationship: "empathetic", liminalAura: "controlled", touchstones: 3},
  {plasm_per_turn: 10, max_plasm: 100, relationship: "empathetic", liminalAura: "controlled", touchstones: 3}
];


MTA.haunts_left = {
  "boneyard": "MTA.haunts.boneyard",
  "caul": "MTA.haunts.caul",
  "curse": "MTA.haunts.curse",
  "dirge": "MTA.haunts.dirge",
  "marionette": "MTA.haunts.marionette",
  "void": "MTA.haunts.void",
};

MTA.haunts_right = {
  "memoria": "MTA.haunts.memoria",
  "oracle": "MTA.haunts.oracle",
  "rage": "MTA.haunts.rage",
  "shroud": "MTA.haunts.shroud",
  "tomb": "MTA.haunts.tomb",
  "well": "MTA.haunts.well",
};

MTA.haunts = Object.assign({}, MTA.haunts_left, MTA.haunts_right);


/* -------------------------------------------- */
/*          Houserules                          */
/* -------------------------------------------- */
// If this section shows up in your system, 
// I made a mistake and accidentally pushed the wrong code.

MTA.addHouseRules = () => {
  MTA.demonHouses = ["Namaru (Devils)", "Asharu (Scourges)", "Annunaki (Malefactors)", "Neberu (Fiend)", "Lammasu (Defiler)", "Rabisu (Devourer)", "Halaku (Slayer)"];
  MTA.demonFactions = ["Faustians", "Cryptics", "Luciferians", "Raveners", "Reconciler", "Tempters"];
  
  MTA.placeholders.set("demonPower", path + 'DemonPower.svg');
  
  MTA.ephemeralTypes.push("Demon");
  
  MTA.ephemeral_ranks = [{rank: 1, Ghost: "Poltergeist", Spirit: "Lesser Spirit", Angel: "Lesser angel", Demon: "Lesser demon", Goetia: "Figment", knowledge: 10, max_essence: 10, numina: "1-3"},
    {rank: 2, Ghost: "Minor ghost", Spirit: "Minor Spirit", Angel: "Angel", Demon: "Fallen angel", Goetia: "Notion", knowledge: 15, max_essence: 15, numina: "3-5"},
    {rank: 3, Ghost: "Average ghost", Spirit: "Average Spirit", Angel: "Archangel", Demon: "Fallen archangel", Goetia: "Idea", knowledge: 25, max_essence: 20, numina: "5-7"},
    {rank: 4, Ghost: "Powerful ghost", Spirit: "Powerful Spirit", Angel: "Principality", Demon: "Minor Lord", Goetia: "Trend", knowledge: 35, max_essence: 30, numina: "7-9"},
    {rank: 5, Ghost: "Geist", Spirit: "Minor god", Angel: "Power", Demon: "Lord", Goetia: "Meme", knowledge: 40, max_essence: 50, numina: "9-11"},
    {rank: 6, Ghost: "Geist", Spirit: "Lesser god", Angel: "Virtue", Demon: "Sin", Goetia:"Belief", knowledge: 55, max_essence: 56, numina: "11-13"},
    {rank: 7, Ghost: "Geist", Spirit: "Greater god", Angel: "Dominion", Demon: "Archduke", Goetia:"Mentality", knowledge: 60, max_essence: 60, numina: "13-14"},
    {rank: 8, Ghost: "Geist", Spirit: "Lesser Celestine", Angel: "Throne", Demon: "Duke", Goetia:"Ethos", knowledge: 70, max_essence: 70, numina: "14-16"},
    {rank: 9, Ghost: "Geist", Spirit: "Greater Celestine", Angel: "Cherubim", Demon: "Prince", Goetia:"Psyche", knowledge: 80, max_essence: 80, numina: "16-20"},
    {rank: 10, Ghost: "Geist", Spirit: "Beyond manifest", Angel: "Seraphim", Demon: "Emperor", Goetia:"Noosphere", knowledge: 100, max_essence: 100, numina: "20+"}
  ];
  
  MTA.ephemeralItemTypes.push("demonPower");
}

