import { getWeaponArchetype } from "./WeaponArchetypes.js?v=32";
import { applyWeaponModifiers, getWeaponModifier } from "./WeaponModifiers.js";
import { applyTraitsToStats, normalizeTraits } from "../features/drawing/TraitGenerator.js?v=25";

export const classification = {
  type: "sword",
  weaponArchetype: "sword",
  attackPattern: "arcSlash",
};

export function createWeaponProfile({ archetypeId, imageDataUrl, strokes, metrics, investment, traits = [], traitReasons = [], modifiers = [], drawingTendency = null }) {
  const archetype = getWeaponArchetype(archetypeId);
  const weaponType = normalizeProfileWeaponType(archetype.id);
  const normalizedModifiers = normalizeModifiers(modifiers);
  const normalizedTraits = normalizeTraits(traits);
  const baseStats = createBaseStats(archetype);
  const finalStats = normalizeFinalStats(applyTraitsToStats(applyMetricBonus(applyWeaponModifiers(baseStats, normalizedModifiers), metrics), normalizedTraits));
  const name = buildWeaponName(archetype, normalizedModifiers);
  const safeMetrics = metrics ?? {};

  // Derive weapon visuals from actual drawing metrics so combat reflects the shape.
  const visual = buildWeaponVisual(archetype, safeMetrics);

  return {
    id: `weapon-${Date.now()}`,
    name,
    archetype,
    weaponType,
    attackPattern: archetype.attackPattern,
    imageDataUrl: typeof imageDataUrl === "string" ? imageDataUrl : "",
    weaponVisual: visual,
    strokes: Array.isArray(strokes) ? strokes : [],
    metrics: safeMetrics,
    investment: normalizeInvestment(investment),
    confidence: archetype._confidence ?? 0,
    drawingTendency, // <-- Store drawing tendency
    baseStats,
    traits: normalizedTraits,
    traitReasons: normalizeTraitReasons(traitReasons),
    modifiers: normalizedModifiers,
    finalStats,

    // Transitional fields for existing scene feedback/HUD code.
    weaponArchetype: archetype.id,
    combat: {
      type: archetype.id,
      weaponArchetype: archetype.id,
      attackPattern: archetype.attackPattern,
      damage: finalStats.damage,
      range: finalStats.range,
      attackSpeed: finalStats.attackSpeed,
      inkCost: finalStats.inkCost,
      traits: normalizedTraits.map((trait) => trait.id),
      combatPreset: {
        ...archetype.hitbox,
        range: archetype.baseStats.range,
        damage: archetype.baseStats.damage,
        attackDuration: finalStats.useTime,
        attackArc: archetype.hitbox.arc,
      },
    },
    damage: finalStats.damage,
    reach: finalStats.range,
    inkCost: finalStats.inkCost,
    trait: normalizedModifiers[0]?.id ?? "plain",
  };
}

// Derive weaponVisual from the drawing's actual proportions.
function buildWeaponVisual(archetype, metrics) {
  const aspect = metrics.aspectRatio ?? 1;
  const com = metrics.centerOfMass ?? { x: 0.5, y: 0.5 };
  const coverage = metrics.coverage ?? 0;

  // Length: longer drawings = longer weapon, with archetype baseline.
  const lengthBase = archetype.baseRange ?? 52;
  const lengthScale = clamp(28 + aspect * 14, 28, 82);
  const idleLen = Math.round(lengthScale * 0.62);
  const attackLen = Math.round(lengthScale);

  // Anchor: where the hand grips relative to the image, from center-of-mass.
  const anchorX = clamp(com.x * 0.55 + 0.08, 0.05, 0.5);
  const anchorY = clamp(com.y * 0.6 + 0.3, 0.35, 0.85);

  // Swing arc: denser shapes = wider swings; pointed shapes = tighter.
  const arc = clamp(70 + coverage * 40 - (metrics.pointedness ?? 0) * 35, 35, 110);

  return {
    displayLength: idleLen,
    idleLength: idleLen,
    attackLength: attackLen,
    handOffsetX: archetype.visualPreset?.pivotX !== undefined ? Math.round(archetype.visualPreset.pivotX * 32) : 8,
    handOffsetY: -2,
    anchorX,
    anchorY,
    idleTiltDegrees: 15,
    swingArcDegrees: Math.round(arc),
    startupEase: "easeOut",
    activeEase: "easeOut",
    recoveryEase: "easeInOut",
    trailEnabled: true,
  };
}

function createBaseStats(archetype) {
  return {
    moveSpeedMultiplier: 1,
    blockWindowFrames: archetype.blockWindow ?? archetype.animationPreset?.blockWindow ?? 0,
    damageVariance: 0,
    ...archetype.baseStats,
  };
}

export function validateWeaponProfile(profile, context = "unknown") {
  const warnings = [];
  const requiredFields = ["id", "archetype", "attackPattern", "imageDataUrl", "metrics", "finalStats"];
  for (const field of requiredFields) {
    if (!hasField(profile, field)) warnings.push(`missing weapon.${field}`);
  }

  const requiredStats = ["damage", "range", "attackSpeed", "inkCost", "crit"];
  for (const stat of requiredStats) {
    if (!hasField(profile?.finalStats, stat)) warnings.push(`missing weapon.finalStats.${stat}`);
  }

  if (warnings.length > 0) {
    console.warn(`[WeaponProfileValidation] ${context}`, {
      warnings,
      id: profile?.id,
      archetype: profile?.archetype?.id ?? profile?.weaponArchetype ?? profile?.combat?.type,
      attackPattern: profile?.attackPattern ?? profile?.archetype?.attackPattern ?? profile?.combat?.attackPattern,
    });
  }

  return {
    ok: warnings.length === 0,
    warnings,
  };
}

function normalizeInvestment(investment) {
  const score = clampNumber(investment?.investmentScore, 0, 100, 0);
  return {
    investmentScore: Math.round(score),
    investmentRank: normalizeInvestmentRank(investment?.investmentRank, score),
    reasons: Array.isArray(investment?.reasons) ? investment.reasons.filter((reason) => typeof reason === "string") : [],
  };
}

function normalizeInvestmentRank(rank, score) {
  if (["S", "A", "B", "C", "D"].includes(rank)) return rank;
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 50) return "B";
  if (score >= 30) return "C";
  return "D";
}

function normalizeModifiers(modifiers) {
  return modifiers.map((modifier) => getWeaponModifier(modifier.id ?? modifier)).filter(Boolean);
}

function normalizeTraitReasons(reasons) {
  return Array.isArray(reasons) ? reasons.filter((reason) => typeof reason === "string") : [];
}

function applyMetricBonus(stats, metrics = {}) {
  const investment = metrics.investmentScore ?? 0;
  const pointCount = metrics.pointCount ?? metrics.points ?? 0;
  return {
    ...stats,
    damage: Math.max(1, Math.round(stats.damage + Math.min(4, investment * 4))),
    range: Math.max(1, Math.round(stats.range + Math.min(5, pointCount / 100))),
  };
}

function normalizeFinalStats(stats) {
  const useTime = Math.max(1, Math.round(stats.useTime ?? 13));
  const criticalChance = clampNumber(stats.criticalChance, 0, 1, 0);
  return {
    ...stats,
    useTime,
    attackSpeed: clampNumber(stats.attackSpeed, 0.01, 60, 60 / useTime),
    inkCost: Math.max(0, Math.round(stats.inkCost ?? 0)),
    crit: clampNumber(stats.crit, 0, 1, criticalChance),
    criticalChance,
  };
}

function buildWeaponName(archetype, modifiers) {
  const meaningful = modifiers.find((modifier) => modifier.id !== "plain");
  return meaningful ? `${meaningful.displayName} ${archetype.displayName}` : archetype.displayName;
}

function normalizeProfileWeaponType(type) {
  const key = String(type || "sword").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    blade: "sword",
    hammer: "axe",
    maul: "axe",
    magicstaff: "staff",
    magic_staff: "staff",
    paper_boomerang: "bow",
    charcoal_hammer: "axe",
    sketch_sword: "sword",
    ink_spear: "spear",
    brush_wave: "staff",
  };
  return aliases[key] ?? key;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function hasField(value, key) {
  return Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);
}



