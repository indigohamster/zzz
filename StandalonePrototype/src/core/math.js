// Shared math and point utilities used across drawing, analysis, and weapon modules.

/** Clamp a number to [min, max], falling back to `fallback` on NaN/Infinity. */
export function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

/** Clamp to [min, max] with no fallback (assumes valid). */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Coerce to number, falling back on NaN/Infinity. */
export function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/** Coerce to integer, falling back on NaN/Infinity. */
export function integerOr(value, fallback) {
  return Math.floor(numberOr(value, fallback));
}

/** Round to `places` decimal places. */
export function roundTo(value, places) {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

/**
 * Extract point array from a stroke object or array.
 * Handles legacy flat-array strokes, current {points: [...]} strokes,
 * and already-extracted arrays.
 */
export function getStrokePoints(stroke) {
  return Array.isArray(stroke) ? stroke : Array.isArray(stroke?.points) ? stroke.points : [];
}
