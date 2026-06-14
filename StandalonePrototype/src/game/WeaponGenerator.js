import { clampNumber } from "../core/math.js?v=25";
import { getWeaponArchetype } from "./WeaponArchetypes.js?v=32";
import { classifyWeapon } from "./WeaponClassifier.js";
import { applyWeaponModifiers, chooseModifierFromMetrics } from "./WeaponModifiers.js";
import { normalizeWeaponType, weaponTypeToArchetypeId } from "./WeaponTypes.js?v=32";
import { generateTraits } from "../features/drawing/TraitGenerator.js?v=25";
import { analyzeDrawingShape } from "./ShapeAnalyzer.js?v=25";
import { createWeaponProfile } from "./WeaponProfile.js?v=32";

export function generateWeaponProfileFromDrawing({ imageDataUrl, strokes, metrics, investment }) {
  const safeMetrics = normalizeMetrics(analyzeDrawingShape({ strokes, metrics }));
  const archetype = chooseArchetypeFromMetrics(safeMetrics, { log: true });
  const modifier = chooseModifierFromMetrics(safeMetrics);
  const traitResult = generateTraits({
    ...safeMetrics,
    investmentScore: investment?.investmentScore ?? 0,
    hasSignature: false,
  });
  return createWeaponProfile({
    archetypeId: archetype.id,
    imageDataUrl,
    strokes,
    metrics: safeMetrics,
    investment,
    traits: traitResult.traits,
    traitReasons: traitResult.reasons,
    modifiers: [modifier],
  });
}

export function createDefaultWeaponProfile() {
  return createWeaponProfile({
    archetypeId: "sword",
    imageDataUrl: "",
    strokes: [],
    metrics: normalizeMetrics({}),
    modifiers: [],
  });
}

export function chooseArchetypeFromMetrics(metrics, options = {}) {
  const analyzedMetrics = metrics.centerOfMass ? metrics : analyzeDrawingShape({ strokes: metrics.strokes, metrics });
  const classification = classifyWeapon(analyzedMetrics);
  const weaponType = normalizeWeaponType(classification.type);
  const archetypeId = weaponTypeToArchetypeId(weaponType);
  const archetype = getWeaponArchetype(archetypeId);
  archetype._confidence = Math.min(1, Math.max(0, classification.confidence ?? 0));
  if (options.log) {
    console.log("[WeaponRecognized]", {
      rawType: classification.type,
      weaponType,
      archetypeId: archetype.id,
      attackPattern: archetype.attackPattern,
      confidence: archetype._confidence,
      reason: classification.reason,
    });
  }
  return archetype;
}

export function buildFinalStats(baseStats, modifiers) {
  return applyWeaponModifiers(baseStats, modifiers);
}



export function normalizeMetrics(metrics = {}) {
  return {
    ...metrics,
    aspectRatio: clampNumber(metrics.aspectRatio, 0.05, 20, 1),
    coverage: clampNumber(metrics.coverage, 0, 1, 0),
    closedness: clampNumber(metrics.closedness, 0, 1, 0),
    closedShapeScore: clampNumber(metrics.closedShapeScore ?? metrics.closedness, 0, 1, 0),
    centerOfMass: normalizePoint(metrics.centerOfMass),
    pointedness: clampNumber(metrics.pointedness, 0, 1, 0),
    strokeDirection: normalizeDirection(metrics.strokeDirection),
    symmetryScore: clampNumber(metrics.symmetryScore, 0, 1, 0),
    complexity: clampNumber(metrics.complexity, 0, 1, 0),
    hesitationScore: clampNumber(metrics.hesitationScore ?? metrics.jitter, 0, 10, 0),
    investmentScore: clampNumber(metrics.investmentScore, 0, 1, 0),
    overdraw: Math.max(0, Math.floor(clampNumber(metrics.overdraw, 0, 10000, 0))),
    overdrawScore: Math.max(0, clampNumber(metrics.overdrawScore ?? metrics.overdraw, 0, 10000, 0)),
    strokeCount: Math.max(0, Math.floor(clampNumber(metrics.strokeCount, 0, 1000, 0))),
    pointCount: Math.max(0, Math.floor(clampNumber(metrics.pointCount ?? metrics.points, 0, 10000, 0))),
  };
}
function normalizePoint(point) {
  return {
    x: clampNumber(point?.x, 0, 1, 0.5),
    y: clampNumber(point?.y, 0, 1, 0.5),
  };
}

function normalizeDirection(direction) {
  const x = clampNumber(direction?.x, -1, 1, 1);
  const y = clampNumber(direction?.y, -1, 1, 0);
  const length = Math.hypot(x, y) || 1;
  return {
    x: x / length,
    y: y / length,
    angle: clampNumber(direction?.angle, -Math.PI, Math.PI, Math.atan2(y, x)),
  };
}




