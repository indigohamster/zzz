export const INK_RELICS = [
  {
    id: "sword_keen_margin",
    name: "Keen Margin",
    desc: "Sword marks cut cleaner at the edge of the page.",
    tags: ["sword", "damage"],
    modifiers: [{ type: "mul", stat: "damage", value: 1.18 }],
  },
  {
    id: "sword_second_stroke",
    name: "Second Stroke",
    desc: "Sword combos recover faster.",
    tags: ["sword", "speed"],
    modifiers: [{ type: "mul", stat: "attackSpeed", value: 1.16 }],
  },
  {
    id: "sword_close_reading",
    name: "Close Reading",
    desc: "Sword hits gain force while your body is steady.",
    tags: ["sword", "fullHp"],
    modifiers: [{ type: "add", stat: "critChance", value: 0.08, condition: "fullHp" }],
  },
  {
    id: "spear_long_sentence",
    name: "Long Sentence",
    desc: "Spear thrusts reach farther.",
    tags: ["spear", "range"],
    modifiers: [{ type: "add", stat: "range", value: 14 }],
  },
  {
    id: "spear_red_underline",
    name: "Red Underline",
    desc: "Spear hits pierce one more target.",
    tags: ["spear", "pierce"],
    modifiers: [{ type: "add", stat: "pierce", value: 1 }],
  },
  {
    id: "spear_last_argument",
    name: "Last Argument",
    desc: "Spear damage rises when your ink is almost gone.",
    tags: ["spear", "lowInk"],
    modifiers: [{ type: "mul", stat: "damage", value: 1.35, condition: "lowInk" }],
  },
  {
    id: "axe_black_revision",
    name: "Black Revision",
    desc: "Axe swings hit much harder.",
    tags: ["axe", "damage"],
    modifiers: [{ type: "mul", stat: "damage", value: 1.24 }],
  },
  {
    id: "axe_deadline_chop",
    name: "Deadline Chop",
    desc: "Axe knockback surges in boss rooms.",
    tags: ["axe", "bossRoom"],
    modifiers: [{ type: "mul", stat: "knockback", value: 1.4, condition: "bossRoom" }],
  },
  {
    id: "axe_heavy_period",
    name: "Heavy Period",
    desc: "Axe swings trade speed for damage.",
    tags: ["axe", "tradeoff"],
    modifiers: [
      { type: "mul", stat: "damage", value: 1.16 },
      { type: "mul", stat: "attackSpeed", value: 0.9 },
    ],
  },
  {
    id: "bow_blue_pin",
    name: "Blue Pin",
    desc: "Bow attacks gain reach.",
    tags: ["bow", "range"],
    modifiers: [{ type: "mul", stat: "range", value: 1.18 }],
  },
  {
    id: "bow_silent_caption",
    name: "Silent Caption",
    desc: "Bow attacks become more precise.",
    tags: ["bow", "crit"],
    modifiers: [{ type: "add", stat: "critChance", value: 0.1 }],
  },
  {
    id: "bow_thin_paper",
    name: "Thin Paper",
    desc: "Bow shots pierce when your body is low.",
    tags: ["bow", "lowHp"],
    modifiers: [{ type: "add", stat: "pierce", value: 1, condition: "lowHp" }],
  },
  {
    id: "common_warm_lamp",
    name: "Warm Lamp",
    desc: "Every weapon attacks a little faster.",
    tags: ["common", "speed"],
    modifiers: [{ type: "mul", stat: "attackSpeed", value: 1.08 }],
  },
  {
    id: "common_bitter_ink",
    name: "Bitter Ink",
    desc: "Low ink makes every hit sharper.",
    tags: ["common", "lowInk"],
    modifiers: [{ type: "mul", stat: "damage", value: 1.2, condition: "lowInk" }],
  },
  {
    id: "common_clean_corner",
    name: "Clean Corner",
    desc: "All weapons gain a little reach and knockback.",
    tags: ["common", "range", "knockback"],
    modifiers: [
      { type: "add", stat: "range", value: 5 },
      { type: "add", stat: "knockback", value: 0.6 },
    ],
  },
];

export function getInkRelic(id) {
  return INK_RELICS.find((relic) => relic.id === id) ?? null;
}
