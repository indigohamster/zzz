import { getStrokePoints, clampNumber } from "../core/math.js?v=24";
export function analyzeDrawingShape({ strokes = [], metrics = {} } = {}) {
  const points = flattenPoints(strokes);
  const boundingBox = metrics.boundingBox ?? getBoundingBox(points);
  const width = boundingBox ? Math.max(0, boundingBox.maxX - boundingBox.minX) : 0;
  const height = boundingBox ? Math.max(0, boundingBox.maxY - boundingBox.minY) : 0;
  const aspectRatio = clampNumber(metrics.aspectRatio ?? (height > 0 ? width / height : 1), 0.05, 20, 1);
  const coverage = clampNumber(metrics.coverage, 0, 1, 0);
  const centerOfMass = getCenterOfMass(points, boundingBox);
  const closedShapeScore = estimateClosedShapeScore(strokes, metrics);
  const pointedness = estimatePointedness(points, boundingBox);
  const strokeDirection = estimateStrokeDirection(points);
  const symmetryScore = estimateSymmetry(points, boundingBox);
  const complexity = estimateComplexity(strokes, metrics);

  return {
    ...metrics,
    boundingBox,
    aspectRatio,
    coverage,
    centerOfMass,
    closedShapeScore,
    closedness: closedShapeScore,
    pointedness,
    strokeDirection,
    symmetryScore,
    complexity,
  };
}

function flattenPoints(strokes) {
  if (!Array.isArray(strokes)) return [];
  return strokes
    .filter((stroke) => stroke?.tool !== "eraser")
    .flatMap((stroke) => getStrokePoints(stroke))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function getBoundingBox(points) {
  if (points.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { minX, minY, maxX, maxY };
}

function getCenterOfMass(points, boundingBox) {
  if (points.length === 0 || !boundingBox) return { x: 0.5, y: 0.5 };
  const width = Math.max(1, boundingBox.maxX - boundingBox.minX);
  const height = Math.max(1, boundingBox.maxY - boundingBox.minY);
  let sumX = 0;
  let sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  return {
    x: clampNumber((sumX / points.length - boundingBox.minX) / width, 0, 1, 0.5),
    y: clampNumber((sumY / points.length - boundingBox.minY) / height, 0, 1, 0.5),
  };
}

function estimateClosedShapeScore(strokes, metrics) {
  let best = clampNumber(metrics.closedShapeScore ?? metrics.closedness, 0, 1, 0);
  if (!Array.isArray(strokes)) return best;
  for (const stroke of strokes) {
    if (stroke?.tool === "eraser") continue;
    const points = getStrokePoints(stroke);
    if (points.length < 6) continue;
    const first = points[0];
    const last = points[points.length - 1];
    const bounds = getBoundingBox(points);
    const diagonal = bounds ? Math.hypot(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) : 72;
    const distance = Math.hypot(first.x - last.x, first.y - last.y);
    best = Math.max(best, 1 - Math.min(1, distance / Math.max(24, diagonal * 0.35)));
  }
  return clampNumber(best, 0, 1, 0);
}

function estimatePointedness(points, boundingBox) {
  if (points.length < 3 || !boundingBox) return 0;
  const width = Math.max(1, boundingBox.maxX - boundingBox.minX);
  const height = Math.max(1, boundingBox.maxY - boundingBox.minY);
  const farRightCount = points.filter((point) => (point.x - boundingBox.minX) / width > 0.82).length;
  const verticalSpread = height / Math.max(1, width);
  return clampNumber((farRightCount / points.length) * 2.2 - verticalSpread * 0.25, 0, 1, 0);
}

function estimateStrokeDirection(points) {
  if (points.length < 2) return { x: 1, y: 0, angle: 0 };
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length, angle: Math.atan2(dy, dx) };
}

function estimateSymmetry(points, boundingBox) {
  if (points.length < 4 || !boundingBox) return 0;
  const centerX = (boundingBox.minX + boundingBox.maxX) / 2;
  const halfWidth = Math.max(1, (boundingBox.maxX - boundingBox.minX) / 2);
  let balance = 0;
  for (const point of points) balance += point.x < centerX ? -1 : 1;
  return clampNumber(1 - Math.abs(balance / points.length) - Math.abs(0.5 - getCenterOfMass(points, boundingBox).x) / 0.5, 0, 1, 0) * clampNumber(halfWidth / 20, 0, 1, 0);
}

function estimateComplexity(strokes, metrics) {
  const strokeCount = clampNumber(metrics.strokeCount ?? strokes.length, 0, 1000, 0);
  const pointCount = clampNumber(metrics.pointCount ?? metrics.points, 0, 10000, 0);
  const overdraw = clampNumber(metrics.overdraw, 0, 10000, 0);
  const jitter = clampNumber(metrics.jitter ?? metrics.hesitationScore, 0, 10, 0);
  return clampNumber(strokeCount / 8 + pointCount / 180 + overdraw / 120 + jitter / 5, 0, 1, 0);
}

// --- Drawing Tendency Calculation ---
// Calculates which drawing tendency the player's drawing has.
// Returns: { type: string, strength: number (0-1) }
export function calculateDrawingTendency(metrics = {}) {
  const closedness = clampNumber(metrics.closedness ?? metrics.closedShapeScore ?? 0, 0, 1, 0);
  const pointedness = clampNumber(metrics.pointedness ?? 0, 0, 1, 0);
  const complexity = clampNumber(metrics.complexity ?? 0, 0, 1, 0);
  const aspectRatio = clampNumber(metrics.aspectRatio ?? 1, 0.05, 20, 1);
  const symmetry = clampNumber(metrics.symmetryScore ?? 0, 0, 1, 0);

  // Calculate tendency scores (0-1 each)
  const scores = {
    circular: calculateCircularScore(closedness, complexity, symmetry),
    sharp: calculateSharpScore(pointedness, closedness, complexity),
    chaotic: calculateChaoticScore(complexity, closedness, symmetry),
    longStraight: calculateLongStraightScore(aspectRatio, complexity, pointedness),
  };

  // Find the strongest tendency
  let bestType = "circular";
  let bestScore = scores.circular;

  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestType = type;
      bestScore = score;
    }
  }

  // If no clear tendency (all scores < 0.3), return null
  if (bestScore < 0.3) {
    return { type: null, strength: 0 };
  }

  return {
    type: bestType,
    strength: Math.round(bestScore * 100) / 100, // Round to 2 decimal places
  };
}

function calculateCircularScore(closedness, complexity, symmetry) {
  // Circular: high closedness, moderate complexity, some symmetry
  const closednessScore = closedness * 0.6;
  const complexityPenalty = complexity > 0.7 ? (complexity - 0.7) * 0.3 : 0;
  const symmetryBonus = symmetry * 0.1;
  return Math.max(0, Math.min(1, closednessScore - complexityPenalty + symmetryBonus));
}

function calculateSharpScore(pointedness, closedness, complexity) {
  // Sharp: high pointedness, low closedness, low complexity
  const pointednessScore = pointedness * 0.7;
  const closednessPenalty = closedness > 0.5 ? (closedness - 0.5) * 0.3 : 0;
  const complexityPenalty = complexity > 0.6 ? (complexity - 0.6) * 0.2 : 0;
  return Math.max(0, Math.min(1, pointednessScore - closednessPenalty - complexityPenalty));
}

function calculateChaoticScore(complexity, closedness, symmetry) {
  // Chaotic: high complexity, low closedness, low symmetry
  const complexityScore = complexity * 0.6;
  const closednessPenalty = closedness > 0.4 ? (closedness - 0.4) * 0.25 : 0;
  const symmetryPenalty = symmetry > 0.5 ? (symmetry - 0.5) * 0.15 : 0;
  return Math.max(0, Math.min(1, complexityScore - closednessPenalty - symmetryPenalty));
}

function calculateLongStraightScore(aspectRatio, complexity, pointedness) {
  // Long straight: extreme aspect ratio, low complexity, some pointedness
  const ratio = aspectRatio;
  const isLong = ratio >= 2.5;
  const isTall = ratio <= 0.4;
  const ratioScore = isLong || isTall ? 0.5 : 0;
  const extremityBonus = isLong ? Math.min(0.3, (ratio - 2.5) * 0.05) : isTall ? Math.min(0.3, (0.4 - ratio) * 0.1) : 0;
  const complexityPenalty = complexity > 0.5 ? (complexity - 0.5) * 0.3 : 0;
  const pointednessBonus = pointedness * 0.1;
  return Math.max(0, Math.min(1, ratioScore + extremityBonus - complexityPenalty + pointednessBonus));
}



