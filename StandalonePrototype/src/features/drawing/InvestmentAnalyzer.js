import { numberOr, integerOr, clamp } from "../../core/math.js?v=24";
const MAX_DRAW_TIME_SECONDS = 30 * 60;

export function analyzeInvestment(input = {}) {
  const metrics = normalizeInput(input);
  const timeScore = Math.min(35, (Math.min(metrics.drawTime, MAX_DRAW_TIME_SECONDS) / MAX_DRAW_TIME_SECONDS) * 35);
  const strokeScore = getStrokeScore(metrics.strokeCount);
  const pointScore = Math.min(14, (metrics.pointCount / 180) * 14);
  const revisionScore = getRevisionScore(metrics);
  const pauseScore = Math.min(6, metrics.pauseCount * 2);
  const overdrawPenalty = getOverdrawPenalty(metrics);
  const coveragePenalty = getCoveragePenalty(metrics.coverage);

  const score = clamp(Math.round(timeScore + strokeScore + pointScore + revisionScore + pauseScore - overdrawPenalty - coveragePenalty), 0, 100);

  return {
    investmentScore: score,
    investmentRank: getInvestmentRank(score),
    reasons: buildReasons(metrics, {
      timeScore,
      strokeScore,
      revisionScore,
      pauseScore,
      overdrawPenalty,
      coveragePenalty,
    }),
  };
}

function normalizeInput(input) {
  const drawTime = numberOr(input.drawTime ?? input.seconds, 0);
  const strokeCount = integerOr(input.strokeCount, 0);
  const pointCount = integerOr(input.pointCount ?? input.points, 0);
  const undoCount = integerOr(input.undoCount, 0);
  const redoCount = integerOr(input.redoCount, 0);
  const eraseCount = integerOr(input.eraseCount, 0);
  const pauseCount = integerOr(input.pauseCount, 0);
  const overdraw = numberOr(input.overdraw ?? input.overdrawScore, 0);
  const coverage = clamp(numberOr(input.coverage, 0), 0, 1);

  return {
    drawTime: Math.max(0, drawTime),
    strokeCount: Math.max(0, strokeCount),
    pointCount: Math.max(0, pointCount),
    undoCount: Math.max(0, undoCount),
    redoCount: Math.max(0, redoCount),
    eraseCount: Math.max(0, eraseCount),
    pauseCount: Math.max(0, pauseCount),
    overdraw: Math.max(0, overdraw),
    coverage,
  };
}

function getStrokeScore(strokeCount) {
  if (strokeCount <= 0) return 0;
  if (strokeCount === 1) return 3;
  if (strokeCount < 4) return 7;
  return Math.min(18, (strokeCount / 12) * 18);
}

function getRevisionScore(metrics) {
  const revisionCount = metrics.undoCount + metrics.redoCount + metrics.eraseCount;
  if (revisionCount <= 0) return 0;
  if (revisionCount <= 6) return 6 + revisionCount * 2;
  return Math.max(6, 18 - (revisionCount - 6) * 1.5);
}

function getOverdrawPenalty(metrics) {
  if (metrics.overdraw <= 0) return 0;
  const normalizedOverdraw = metrics.overdraw <= 1
    ? metrics.overdraw
    : metrics.overdraw / Math.max(60, metrics.pointCount * 0.45);
  if (normalizedOverdraw <= 0.45) return 0;
  return Math.min(22, (normalizedOverdraw - 0.45) * 28);
}

function getCoveragePenalty(coverage) {
  if (coverage >= 0.18) return 0;
  if (coverage >= 0.08) return 8;
  if (coverage > 0) return 16;
  return 22;
}

function buildReasons(metrics, scores) {
  const reasons = [];

  if (metrics.drawTime >= MAX_DRAW_TIME_SECONDS) {
    reasons.push("draw time reached the 30 minute cap");
  } else if (metrics.drawTime >= 180) {
    reasons.push("longer draw time increased investment");
  } else if (metrics.drawTime < 20) {
    reasons.push("very short draw time limited investment");
  }

  if (metrics.strokeCount < 4) {
    reasons.push("too few strokes reduced investment");
  } else if (scores.strokeScore >= 14) {
    reasons.push("stroke count shows deliberate construction");
  }

  if (scores.revisionScore > 0) {
    reasons.push("moderate revisions added investment");
  }

  if (scores.pauseScore > 0) {
    reasons.push("pauses suggest planning between marks");
  }

  if (scores.overdrawPenalty > 0) {
    reasons.push("heavy overdraw reduced investment");
  }

  if (scores.coveragePenalty > 0) {
    reasons.push("low canvas coverage reduced investment");
  }

  if (reasons.length === 0) reasons.push("balanced drawing process");
  return reasons;
}

function getInvestmentRank(score) {
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 50) return "B";
  if (score >= 30) return "C";
  return "D";
}





