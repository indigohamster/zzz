export const DEBUG_WEAPON_CLASSIFIER = false;

// Scoring-based weapon classifier: 6 weapon types, each scored continuously
// from shape metrics so classification feels responsive instead of binary.
export function classifyWeapon(metrics = {}) {
  const closed = metrics.closedShapeScore ?? 0;
  const aspect = metrics.aspectRatio ?? 1;
  const coverage = metrics.coverage ?? 0;
  const com = metrics.centerOfMass ?? { x: 0.5, y: 0.5 };
  const sharp = metrics.pointedness ?? 0;
  const complex = metrics.complexity ?? 0;
  const sym = metrics.symmetryScore ?? 0;

  // Each scorer returns [type, confidence] where 1.0 = perfect match.
  const entries = [
    scoreDagger({ aspect, coverage, sharp, complex }),
    scoreSword({ aspect, coverage, com, complex, sym }),
    scoreSpear({ aspect, coverage, sharp }),
    scoreHammer({ aspect, coverage, com, complex }),
    scoreShield({ closed, coverage, com, sym }),
    scoreStaff({ aspect, coverage, com, complex, sym }),
  ];

  entries.sort((a, b) => b.confidence - a.confidence);
  const best = entries[0];

  // Require a minimum confidence to override the default sword fallback.
  const type = best.confidence >= 0.22 ? best.type : "sword";

  if (DEBUG_WEAPON_CLASSIFIER) {
    const detail = Object.fromEntries(entries.map((e) => [e.type, e.confidence.toFixed(3)]));
    console.debug("[WeaponClassifier]", { type, reason: best.reason, ...detail });
  }

  if (DEBUG_WEAPON_CLASSIFIER) {
    console.debug("[DrawRecognize]", { type, confidence: best.confidence.toFixed(3), reason: best.reason, scores: Object.fromEntries(entries.map((e) => [e.type, e.confidence.toFixed(3)])) });
  }
  return { type, reason: best.reason, confidence: best.confidence, scores: Object.fromEntries(entries.map((e) => [e.type, e.confidence])) };
}

// --- Individual scorers -------------------------------------------------

function scoreDagger({ aspect, coverage, sharp, complex }) {
  // Small, compact, pointed: aspect near 0.6-1.2, low coverage, decent pointedness.
  let s = 0;
  s += gaussian(aspect, 0.85, 0.3);       // compact shape
  s += 1 - clamp(coverage, 0, 0.35) / 0.35; // sparse
  s += sharp * 0.6;
  s += (1 - complex) * 0.4;
  const confidence = Math.min(1, s / 2.4);
  return { type: "dagger", confidence, reason: `dagger s=${confidence.toFixed(2)}` };
}

function scoreSword({ aspect, coverage, com, complex, sym }) {
  // Balanced catch-all: moderate aspect (0.8-2.0), medium coverage, near-centered mass.
  let s = 0;
  s += gaussian(aspect, 1.5, 0.55);
  s += gaussian(coverage, 0.22, 0.18);
  s += (1 - Math.abs(com.x - 0.5) * 1.8);
  s += sym * 0.7;
  s += (1 - complex) * 0.3;
  const confidence = Math.min(1, s / 5.0); // tighter divisor so ambiguous shapes score < 0.6
  return { type: "sword", confidence, reason: `sword s=${confidence.toFixed(2)}` };
}

function scoreSpear({ aspect, coverage, sharp }) {
  // Long and thin: high aspect ratio, very low coverage, pointed.
  let s = 0;
  s += ramp(aspect, 1.8, 3.5);
  s += 1 - ramp(coverage, 0.05, 0.28);
  s += sharp * 1.2;
  const confidence = Math.min(1, s / 3.0);
  return { type: "spear", confidence, reason: `spear s=${confidence.toFixed(2)}` };
}

function scoreHammer({ aspect, coverage, com, complex }) {
  // Dense, right-heavy, chunky: high coverage or shifted com, moderate-to-low aspect.
  let s = 0;
  s += gaussian(aspect, 1.1, 0.4);
  s += ramp(coverage, 0.25, 0.55);
  s += Math.max(0, com.x - 0.52) * 4.0;
  s += complex * 0.7;
  const confidence = Math.min(1, s / 2.8);
  return { type: "hammer", confidence, reason: `hammer s=${confidence.toFixed(2)}` };
}

function scoreShield({ closed, coverage, com, sym }) {
  // Round/closed shapes: high closedness, moderate coverage, centered.
  let s = 0;
  s += ramp(closed, 0.35, 0.75) * 1.8;
  s += gaussian(coverage, 0.35, 0.22);
  s += (1 - Math.abs(com.x - 0.5) * 2);
  s += sym * 0.5;
  const confidence = Math.min(1, s / 3.3);
  return { type: "shield", confidence, reason: `shield s=${confidence.toFixed(2)}` };
}

function scoreStaff({ aspect, coverage, com, complex, sym }) {
  // Tall, balanced, light: moderate-high aspect, low coverage, centered, symmetric.
  let s = 0;
  s += gaussian(aspect, 2.4, 1.0);
  s += 1 - ramp(coverage, 0.08, 0.32);
  s += (1 - Math.abs(com.x - 0.5) * 1.5);
  s += sym * 0.8;
  s += (1 - complex) * 0.3;
  const confidence = Math.min(1, s / 5.0);
  return { type: "staff", confidence, reason: `staff s=${confidence.toFixed(2)}` };
}

// --- Math helpers -------------------------------------------------------

// Gaussian-ish: 1.0 at peak, falls off with spread.
function gaussian(x, peak, spread) {
  const d = (x - peak) / Math.max(0.01, spread);
  return Math.exp(-d * d * 1.8);
}

// Ramp from 0 at 'low' to 1 at 'high', clamped.
function ramp(x, low, high) {
  return clamp((x - low) / Math.max(0.001, high - low), 0, 1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}





