const MONSTER_DEFINITIONS = [
  {
    id: "sketchling",
    enemyType: "swarm",
    hpBonus: 0,
    speed: 1.35,
    jump: -4.4,
    color: "#202026",
    eye: "#f1ead9",
    sightX: 330,
    sightY: 150,
    behavior: "walker",
    shape: "box",
    spriteId: "sketchling",
    spriteHeight: 40,
    contactDamage: 5,
    inkDrain: 1.25,
    combatTags: ["swarm", "light", "fragile"],
    weakness: ["sword", "whip"],
    resistance: [],
  },
  {
    id: "inkmite",
    enemyType: "fast",
    hpBonus: -8,
    speed: 1.8,
    jump: -5.1,
    color: "#171921",
    eye: "#5f6f96",
    sightX: 290,
    sightY: 130,
    behavior: "skitter",
    shape: "round",
    spriteId: "inkmite",
    spriteHeight: 34,
    contactDamage: 4,
    inkDrain: 1.6,
    combatTags: ["fast", "evasive", "fragile"],
    weakness: ["dagger"],
    resistance: ["hammer"],
  },
  {
    id: "binder",
    enemyType: "armored",
    hpBonus: 12,
    speed: 1.05,
    jump: -3.9,
    color: "#31272b",
    eye: "#d8cfb8",
    sightX: 360,
    sightY: 135,
    behavior: "guard",
    shape: "block",
    spriteId: "binder",
    spriteHeight: 48,
    contactDamage: 6,
    inkDrain: 1.1,
    combatTags: ["armored", "heavy", "shielded"],
    weakness: ["hammer"],
    resistance: ["dagger", "sword"],
  },
  {
    id: "margin_eel",
    enemyType: "longBody",
    hpBonus: 4,
    speed: 1.2,
    jump: -4.2,
    color: "#25212a",
    eye: "#d8cfb8",
    sightX: 380,
    sightY: 145,
    w: 28,
    h: 14,
    behavior: "skitter",
    shape: "long",
    spriteId: "margin_eel",
    spriteHeight: 38,
    contactDamage: 5,
    inkDrain: 1.4,
    combatTags: ["longBody", "reachSensitive"],
    weakness: ["spear"],
    resistance: [],
  },
  {
    id: "paper_kite",
    enemyType: "flying",
    hpBonus: -4,
    speed: 1.55,
    jump: -5.2,
    color: "#2d3040",
    eye: "#f0d9a5",
    sightX: 350,
    sightY: 180,
    w: 20,
    h: 16,
    spawnYOffset: -26,
    behavior: "leaper",
    shape: "kite",
    spriteId: "paper_kite",
    spriteHeight: 42,
    contactDamage: 4,
    inkDrain: 1.8,
    combatTags: ["flying", "aerial"],
    weakness: ["spear", "whip"],
    resistance: ["hammer"],
  },
  {
    id: "blot_sentinel",
    enemyType: "sentinel",
    hpBonus: 8,
    speed: 0.82,
    jump: -4.2,
    color: "#1d1b25",
    eye: "#b23b48",
    sightX: 400,
    sightY: 170,
    w: 20,
    h: 22,
    behavior: "sentinel",
    shape: "block",
    spriteId: "blot_sentinel",
    spriteHeight: 44,
    contactDamage: 7,
    inkDrain: 2,
    combatTags: ["sentinel", "ranged", "inkDrain"],
    weakness: ["dagger", "spear"],
    resistance: ["whip"],
  },
];

const MONSTERS_BY_ID = new Map(MONSTER_DEFINITIONS.map((monster) => [monster.id, monster]));

const ROOM_SPAWN_TABLES = {
  combat: [
    ["sketchling", 5],
    ["inkmite", 3],
    ["binder", 2],
    ["paper_kite", 2],
    ["blot_sentinel", 1],
  ],
  resource: [
    ["sketchling", 4],
    ["binder", 4],
    ["margin_eel", 2],
    ["blot_sentinel", 1],
  ],
  rift: [
    ["inkmite", 4],
    ["paper_kite", 4],
    ["sketchling", 2],
    ["blot_sentinel", 2],
  ],
};

export function getMonsterDefinition(id) {
  return cloneMonster(MONSTERS_BY_ID.get(id) ?? MONSTERS_BY_ID.get("sketchling"));
}

export function listMonsterDefinitions() {
  return MONSTER_DEFINITIONS.map(cloneMonster);
}

export function pickMonsterForRoom(roomType, random = Math.random) {
  const table = ROOM_SPAWN_TABLES[roomType] ?? ROOM_SPAWN_TABLES.combat;
  const totalWeight = table.reduce((sum, entry) => sum + entry[1], 0);
  let roll = random() * totalWeight;

  for (const [id, weight] of table) {
    roll -= weight;
    if (roll <= 0) return getMonsterDefinition(id);
  }

  return getMonsterDefinition(table[table.length - 1][0]);
}

function cloneMonster(monster) {
  return {
    ...monster,
    combatTags: [...(monster.combatTags ?? [])],
    weakness: [...(monster.weakness ?? [])],
    resistance: [...(monster.resistance ?? [])],
  };
}
