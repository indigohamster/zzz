// Inkwell Deep live tuning table.
// Edit this file while the local server is running, then refresh the browser.
// Browser loading uses a timestamp, so this file does not get stuck in cache.

export default {
  // Map size in tiles. If heightTiles grows, also stretch the layer yRange below.
  world: {
    widthTiles: 1280,
    heightTiles: 420,
  },

  // Night timing in seconds.
  night: {
    durationSeconds: 135,
    overtimeExtensionSeconds: 60,
    allNightExtensionSeconds: 120,
    overtimeBodyCost: 12,
    allNightBodyCost: 32,
  },

  // Room weights order:
  // [combat, resource, event, treasure, shop, danger, explore]
  layers: {
    shallow: {
      yRange: [30, 120],
      minRooms: 5,
      maxRooms: 7,
      roomWeights: [1, 4, 3, 1, 1, 0, 3],
    },
    middle: {
      yRange: [135, 245],
      minRooms: 5,
      maxRooms: 8,
      roomWeights: [3, 2, 3, 2, 1, 2, 1],
    },
    deep: {
      yRange: [260, 350],
      minRooms: 4,
      maxRooms: 7,
      roomWeights: [4, 1, 1, 0, 0, 3, 0],
    },
  },

  // Set a rule weight to 0 to remove it from random generation.
  mapGeneration: {
    defaultRuleId: "blue_hole_descent",
    extraRoomsPerLayer: 0,
    ruleWeights: {
      blue_hole_descent: 3,
      coral_labyrinth: 2,
      thermal_split: 2,
      pressure_drop: 1,
      ink_spine: 0,
      split_current: 0,
      reef_maze: 0,
      collapsed_chute: 0,
    },
  },

  // Chance that a completed canvas gate throws the player into another room.
  portalReturn: {
    baseChance: 0.22,
    minChance: 0.12,
    maxChance: 0.72,
    riskGapScale: 0.025,
    riskyChoiceBonus: 0.14,
    forceActionBonus: 0.025,
    templateMistakeBonus: 0.08,
    pressureBonus: 0.12,
    stablePressureBonus: -0.04,
    aiTemplateBonus: 0.07,
    horrorSketchBonus: 0.04,
    arrivalPaddingPixels: 28,
  },

  // Short-loop fun meter. Raise gains if runs still feel flat.
  flow: {
    max: 100,
    rushSeconds: 10,
    decayPerSecond: 1.5,
    exploreRoom: 12,
    dangerRoom: 18,
    kill: 16,
    bossKill: 60,
    chest: 28,
    roomClear: 24,
    gateReturn: 42,
    riftReturn: 34,
    rushInkGain: 18,
    rushDamageMultiplier: 1.22,
    rushMoveMultiplier: 1.18,
    rushInkRegenBonus: 0.065,
    rushDashCostMultiplier: 0.65,
  },

  // Exploration sites are inspectable oddities hidden in rooms.
  exploration: {
    siteChance: 0.72,
    maxSites: 14,
    inspectRadiusPixels: 48,
    flowGain: 26,
    rareFlowGain: 42,
    materialGain: 2,
    inkGain: 8,
    hpGain: 3,
  },
};
