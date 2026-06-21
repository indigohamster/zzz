const DEFAULT_TUNING = {
  world: {
    widthTiles: 1280,
    heightTiles: 420,
  },
  night: {
    durationSeconds: 135,
    overtimeExtensionSeconds: 60,
    allNightExtensionSeconds: 120,
    overtimeBodyCost: 12,
    allNightBodyCost: 32,
  },
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

const externalTuning = globalThis.__INKWELL_TUNING__ ?? {};

export const TUNING = mergeTuning(DEFAULT_TUNING, externalTuning);
export const DEFAULT_INKWELL_TUNING = cloneValue(DEFAULT_TUNING);

function mergeTuning(base, override) {
  const output = cloneValue(base);
  mergeInto(output, override);
  return output;
}

function mergeInto(target, source) {
  if (!source || typeof source !== "object") return target;
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      target[key] = [...value];
      continue;
    }
    if (value && typeof value === "object") {
      const nextTarget = target[key] && typeof target[key] === "object" && !Array.isArray(target[key])
        ? target[key]
        : {};
      target[key] = mergeInto(nextTarget, value);
      continue;
    }
    if (value !== undefined) target[key] = value;
  }
  return target;
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
  }
  return value;
}
