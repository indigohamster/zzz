// Weapon evolution definitions.
// Each evolution applies permanent modifiers and optional gameplay flags
// when the player picks it during a level-up.
export const WEAPON_EVOLUTIONS = [
  // ©¤©¤ spear ©¤©¤
  {
    id: "spear_pierce",
    weaponType: "spear",
    name: "¹áºç",
    desc: "Spear pierces through 2 more targets.",
    levelRequired: 1,
    modifiers: [{ type: "add", stat: "pierce", value: 2 }],
    flags: ["pierceBonus"],
  },
  {
    id: "spear_burst",
    weaponType: "spear",
    name: "ÁÑÕó",
    desc: "Spear hits trigger a small burst of ink.",
    levelRequired: 1,
    modifiers: [{ type: "mul", stat: "damage", value: 1.08 }],
    flags: ["onHitBurstInk"],
  },
  {
    id: "spear_rapid",
    weaponType: "spear",
    name: "¼²´Ì",
    desc: "Attacks 35% faster, -15% damage.",
    levelRequired: 1,
    modifiers: [
      { type: "mul", stat: "attackSpeed", value: 1.35 },
      { type: "mul", stat: "damage", value: 0.85 },
    ],
    flags: [],
  },

  // ©¤©¤ sword ©¤©¤
  {
    id: "sword_combo",
    weaponType: "sword",
    name: "Á¬·æ",
    desc: "Consecutive sword hits deal rising damage.",
    levelRequired: 1,
    modifiers: [{ type: "mul", stat: "damage", value: 1.12 }],
    flags: ["comboScaling"],
  },
  {
    id: "sword_crit",
    weaponType: "sword",
    name: "¶ÏÓ°",
    desc: "Sword crit chance +25%.",
    levelRequired: 1,
    modifiers: [{ type: "add", stat: "critChance", value: 0.25 }],
    flags: [],
  },
  {
    id: "sword_dash",
    weaponType: "sword",
    name: "Ì¤Ä«",
    desc: "Sword attacks lunge forward a short distance.",
    levelRequired: 1,
    modifiers: [{ type: "add", stat: "range", value: 6 }],
    flags: ["dashOnAttack"],
  },

  // ©¤©¤ axe ©¤©¤
  {
    id: "axe_cleave",
    weaponType: "axe",
    name: "ÁÑÉ½",
    desc: "Axe attack range +35%.",
    levelRequired: 1,
    modifiers: [{ type: "mul", stat: "range", value: 1.35 }],
    flags: [],
  },
  {
    id: "axe_stun",
    weaponType: "axe",
    name: "ÕðÄ«",
    desc: "Axe hits have a chance to stun enemies.",
    levelRequired: 1,
    modifiers: [{ type: "mul", stat: "knockback", value: 1.25 }],
    flags: ["stunOnHit"],
  },
  {
    id: "axe_execute",
    weaponType: "axe",
    name: "¶ÏÊ×",
    desc: "Axe deals extra damage to low-health enemies.",
    levelRequired: 1,
    modifiers: [
      { type: "mul", stat: "damage", value: 1.1 },
      { type: "mul", stat: "damage", value: 1.35, condition: "lowHp" },
    ],
    flags: ["executeDamage"],
  },

  // ©¤©¤ bow ©¤©¤
  {
    id: "bow_multishot",
    weaponType: "bow",
    name: "É¢Óð",
    desc: "Bow fires extra projectiles per shot.",
    levelRequired: 1,
    modifiers: [{ type: "mul", stat: "attackSpeed", value: 1.22 }],
    flags: ["multiShot"],
  },
  {
    id: "bow_poison",
    weaponType: "bow",
    name: "¶¾Ä«",
    desc: "Bow hits inflict lingering ink damage.",
    levelRequired: 1,
    modifiers: [{ type: "add", stat: "damage", value: 3 }],
    flags: ["poisonOnHit"],
  },
  {
    id: "bow_focus",
    weaponType: "bow",
    name: "ÄýÉñ",
    desc: "Damage increases with distance to target.",
    levelRequired: 1,
    modifiers: [
      { type: "mul", stat: "range", value: 1.12 },
      { type: "mul", stat: "damage", value: 1.15 },
    ],
    flags: ["focusDamage"],
  },

  // ©¤©¤ staff ©¤©¤
  {
    id: "staff_orb",
    weaponType: "staff",
    name: "Ä«Áé",
    desc: "Staff attacks spawn a homing ink orb.",
    levelRequired: 1,
    modifiers: [{ type: "mul", stat: "attackSpeed", value: 0.88 }],
    flags: ["homingOrb"],
  },
  {
    id: "staff_chain",
    weaponType: "staff",
    name: "Á¬Ä«",
    desc: "Staff hits chain to a nearby enemy.",
    levelRequired: 1,
    modifiers: [{ type: "add", stat: "pierce", value: 1 }],
    flags: ["chainHit"],
  },
  {
    id: "staff_summon",
    weaponType: "staff",
    name: "ÕÙÒÛ",
    desc: "Staff kills have a chance to summon an ink familiar.",
    levelRequired: 1,
    modifiers: [{ type: "mul", stat: "damage", value: 1.08 }],
    flags: ["summonOnKill"],
  },
];

const EVOLUTIONS_BY_ID = new Map(WEAPON_EVOLUTIONS.map((evo) => [evo.id, evo]));

export function getWeaponEvolution(id) {
  return EVOLUTIONS_BY_ID.get(id) ?? null;
}

export function listEvolutionsForWeaponType(weaponType) {
  return WEAPON_EVOLUTIONS.filter((evo) => evo.weaponType === weaponType);
}