// Modifiers map to how the player drew the weapon.
// Names describe drawing style rather than arbitrary fantasy adjectives.
export const WEAPON_MODIFIERS = {
  plain: {
    id: "plain",
    displayName: "Plain",
    statMultipliers: {},
    statAdd: {},
  },
  precise: {
    id: "precise",
    displayName: "Precise",
    statMultipliers: { useTime: 0.9 },
    statAdd: { criticalChance: 0.03 },
  },
  dense: {
    id: "dense",
    displayName: "Dense",
    statMultipliers: { damage: 1.14, useTime: 1.1, knockback: 1.15 },
    statAdd: {},
  },
  keen: {
    id: "keen",
    displayName: "Keen",
    statMultipliers: { damage: 1.08 },
    statAdd: { criticalChance: 0.05 },
  },
  sparse: {
    id: "sparse",
    displayName: "Sparse",
    statMultipliers: { inkCost: 0.65, useTime: 0.94 },
    statAdd: {},
  },
  labored: {
    id: "labored",
    displayName: "Labored",
    statMultipliers: { damage: 1.2, useTime: 1.16 },
    statAdd: {},
  },
  elongated: {
    id: "elongated",
    displayName: "Elongated",
    statMultipliers: { range: 1.14 },
    statAdd: {},
  },
  frantic: {
    id: "frantic",
    displayName: "Frantic",
    statMultipliers: { useTime: 0.82, damage: 0.88 },
    statAdd: { criticalChance: 0.04 },
  },
};

const STAT_KEYS = ["damage", "useTime", "knockback", "range", "inkCost", "criticalChance"];

export function getWeaponModifier(id = "plain") {
  return WEAPON_MODIFIERS[id] ?? WEAPON_MODIFIERS.plain;
}

export function applyWeaponModifiers(baseStats, modifiers = []) {
  const finalStats = { ...baseStats };

  for (const modifier of modifiers) {
    const data = getWeaponModifier(modifier.id ?? modifier);
    for (const key of STAT_KEYS) {
      if (data.statMultipliers[key] !== undefined) finalStats[key] *= data.statMultipliers[key];
      if (data.statAdd[key] !== undefined) finalStats[key] += data.statAdd[key];
    }
  }

  finalStats.damage = Math.max(1, Math.round(finalStats.damage));
  finalStats.useTime = Math.max(1, Math.round(finalStats.useTime));
  finalStats.knockback = roundTo(finalStats.knockback, 1);
  finalStats.range = Math.max(1, Math.round(finalStats.range));
  finalStats.inkCost = Math.max(0, Math.round(finalStats.inkCost));
  finalStats.criticalChance = clamp(roundTo(finalStats.criticalChance, 3), 0, 0.75);
  return finalStats;
}

// Choose modifier based on drawing style.
// Each modifier gets scored; the highest score above a threshold wins.
export function chooseModifierFromMetrics(metrics) {
  const coverage = metrics.coverage ?? 0;
  const aspect = metrics.aspectRatio ?? 1;
  const overdraw = metrics.overdraw ?? 0;
  const investment = metrics.investmentScore ?? 0;
  const hesitation = metrics.hesitationScore ?? metrics.jitter ?? 0;
  const strokeCount = metrics.strokeCount ?? 0;
  const pointCount = metrics.pointCount ?? metrics.points ?? 0;

  const scores = [];

  // Dense: high coverage, many strokes filling space.
  if (coverage > 0.3) scores.push({ id: "dense", score: (coverage - 0.2) * 3 + Math.min(strokeCount / 15, 1) });

  // Elongated: tall thin shapes.
  if (aspect > 2.0) scores.push({ id: "elongated", score: (aspect - 1.5) * 0.6 });

  // Precise: low hesitation, decent investment, confident strokes.
  if (hesitation < 0.2 && investment > 0.15) scores.push({ id: "precise", score: (0.25 - hesitation) * 4 + investment * 0.5 });

  // Keen: high pointedness + moderate aspect.
  if ((metrics.pointedness ?? 0) > 0.2) scores.push({ id: "keen", score: (metrics.pointedness ?? 0) * 2.5 + Math.min(aspect / 5, 1) });

  // Sparse: few strokes, low coverage, economical.
  if (strokeCount > 0 && strokeCount <= 6 && coverage < 0.2) scores.push({ id: "sparse", score: (0.22 - coverage) * 4 + (7 - strokeCount) / 6 });

  // Labored: heavy overdraw or many stroke revisions.
  if (overdraw > 50 || (metrics.undoCount ?? 0) > 3) scores.push({ id: "labored", score: Math.min(overdraw / 120, 1) + Math.min((metrics.undoCount ?? 0) / 8, 1) });

  // Frantic: high hesitation + many strokes, rushed but energetic.
  if (hesitation > 0.4 && strokeCount > 8) scores.push({ id: "frantic", score: hesitation * 1.5 + Math.min(strokeCount / 20, 1) });

  if (scores.length === 0) return getWeaponModifier("plain");

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  // Require a minimum score to avoid assigning a modifier for weak signals.
  if (best.score < 0.4) return getWeaponModifier("plain");

  return getWeaponModifier(best.id);
}

function roundTo(value, places) {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
