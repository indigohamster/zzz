import { numberOr, clamp, roundTo } from "../../core/math.js?v=24";
export const TRAIT_DEFINITIONS = {
  sharp: {
    id: "sharp",
    displayName: "Sharp",
    reason: "slender silhouette increased attack reach",
  },
  heavy: {
    id: "heavy",
    displayName: "Heavy",
    reason: "dense filled marks increased damage but slowed attacks",
  },
  lightweight: {
    id: "lightweight",
    displayName: "Lightweight",
    reason: "open negative space made the weapon easier to carry",
  },
  guarded: {
    id: "guarded",
    displayName: "Guarded",
    reason: "closed shape added a longer guard window",
  },
  devoted: {
    id: "devoted",
    displayName: "Devoted",
    reason: "high investment added critical chance",
  },
  unstable: {
    id: "unstable",
    displayName: "Unstable",
    reason: "excess tracing added damage variance",
  },
};

export function generateTraits(input = {}) {
  const metrics = normalizeInput(input);
  const traits = [];

  if (metrics.aspectRatio >= 2.8 && metrics.coverage <= 0.32) addTrait(traits, "sharp");
  if (metrics.coverage >= 0.34 && metrics.complexity >= 0.45) addTrait(traits, "heavy");
  if (metrics.coverage > 0 && metrics.coverage <= 0.14) addTrait(traits, "lightweight");
  if (metrics.closedShapeScore >= 0.62) addTrait(traits, "guarded");
  if (metrics.investmentScore >= 70 || metrics.hasSignature) addTrait(traits, "devoted");
  if (isUnstable(metrics)) addTrait(traits, "unstable");

  return {
    traits,
    reasons: traits.map((trait) => trait.reason),
  };
}

export function applyTraitsToStats(stats = {}, traits = []) {
  const finalStats = {
    moveSpeedMultiplier: 1,
    blockWindowFrames: 0,
    damageVariance: 0,
    ...stats,
  };

  for (const trait of normalizeTraits(traits)) {
    switch (trait.id) {
      case "sharp":
        finalStats.range *= 1.1;
        break;
      case "heavy":
        finalStats.damage *= 1.15;
        finalStats.useTime *= 1.1;
        break;
      case "lightweight":
        finalStats.moveSpeedMultiplier *= 1.08;
        finalStats.damage *= 0.95;
        break;
      case "guarded":
        finalStats.blockWindowFrames += 2;
        break;
      case "devoted":
        finalStats.criticalChance += 0.05;
        break;
      case "unstable":
        finalStats.damageVariance = Math.max(finalStats.damageVariance, 0.2);
        break;
    }
  }

  return normalizeStats(finalStats);
}

export function normalizeTraits(traits = []) {
  if (!Array.isArray(traits)) return [];
  return traits
    .map((trait) => TRAIT_DEFINITIONS[trait?.id ?? trait] ?? null)
    .filter(Boolean);
}

function normalizeInput(input) {
  const overdrawScore = numberOr(input.overdrawScore ?? input.overdraw, 0);
  const investmentScore = numberOr(input.investmentScore, 0);
  return {
    aspectRatio: clamp(numberOr(input.aspectRatio, 1), 0.05, 20),
    coverage: clamp(numberOr(input.coverage, 0), 0, 1),
    closedShapeScore: clamp(numberOr(input.closedShapeScore ?? input.closedness, 0), 0, 1),
    complexity: clamp(numberOr(input.complexity, 0), 0, 1),
    overdrawScore: Math.max(0, overdrawScore),
    investmentScore: clamp(numberOr(investmentScore, 0), 0, 100),
    hasSignature: input.hasSignature === true,
  };
}

function addTrait(traits, id) {
  const definition = TRAIT_DEFINITIONS[id];
  if (definition && !traits.some((trait) => trait.id === id)) traits.push(definition);
}

function isUnstable(metrics) {
  if (metrics.overdrawScore <= 1) return metrics.overdrawScore >= 0.62;
  return metrics.overdrawScore >= 80 || metrics.overdrawScore * metrics.complexity >= 42;
}

function normalizeStats(stats) {
  return {
    ...stats,
    damage: Math.max(1, Math.round(numberOr(stats.damage, 1))),
    useTime: Math.max(1, Math.round(numberOr(stats.useTime, 1))),
    knockback: roundTo(numberOr(stats.knockback, 0), 1),
    range: Math.max(1, Math.round(numberOr(stats.range, 1))),
    inkCost: Math.max(0, Math.round(numberOr(stats.inkCost, 0))),
    criticalChance: clamp(roundTo(numberOr(stats.criticalChance, 0), 3), 0, 0.75),
    moveSpeedMultiplier: roundTo(numberOr(stats.moveSpeedMultiplier, 1), 3),
    blockWindowFrames: Math.max(0, Math.round(numberOr(stats.blockWindowFrames, 0))),
    damageVariance: clamp(roundTo(numberOr(stats.damageVariance, 0), 3), 0, 1),
  };
}




