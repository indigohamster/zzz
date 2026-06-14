import { getStrokePoints } from "../../core/math.js?v=24";
export function createStrokeRecorder(drawPanel) {
  const strokes = [];
  const redoStack = [];
  const overdrawCells = new Map();
  const state = {
    active: false,
    tool: "pencil",
    activeStroke: null,
    startedAt: null,
    lastPoint: null,
    prevAngle: undefined,
    strokeCount: 0,
    pointCount: 0,
    totalDistance: 0,
    angleChange: 0,
    bounds: null,
    undoCount: 0,
    redoCount: 0,
    eraseCount: 0,
    pauseCount: 0,
    lastStrokeEndedAt: null,
  };

  function clear() {
    strokes.length = 0;
    redoStack.length = 0;
    overdrawCells.clear();
    state.active = false;
    state.activeStroke = null;
    state.startedAt = null;
    state.lastPoint = null;
    state.prevAngle = undefined;
    state.undoCount = 0;
    state.redoCount = 0;
    state.pauseCount = 0;
    state.lastStrokeEndedAt = null;
    recalculateState();
  }

  function setTool(tool) {
    state.tool = tool === "eraser" ? "eraser" : "pencil";
  }

  function beginStroke(x, y, tool = state.tool) {
    const now = performance.now();
    if (state.lastStrokeEndedAt !== null && now - state.lastStrokeEndedAt > 2000) state.pauseCount++;
    const stroke = {
      tool: tool === "eraser" ? "eraser" : "pencil",
      points: [],
      startTime: now,
      endTime: now,
    };
    state.active = true;
    state.activeStroke = stroke;
    if (state.startedAt === null) state.startedAt = now;
    state.lastPoint = null;
    state.prevAngle = undefined;
    redoStack.length = 0;
    strokes.push(stroke);
    addPoint(x, y);
  }

  function endStroke() {
    if (state.activeStroke) {
      state.activeStroke.endTime = performance.now();
      state.lastStrokeEndedAt = state.activeStroke.endTime;
    }
    state.active = false;
    state.activeStroke = null;
    state.lastPoint = null;
    state.prevAngle = undefined;
    recalculateState();
  }

  function addPoint(x, y) {
    const point = { x, y, t: performance.now() };
    const stroke = state.activeStroke ?? strokes[strokes.length - 1];
    if (!stroke) return;
    stroke.points.push(point);
    stroke.endTime = point.t;
    updateMetricsWithPoint(point, stroke.tool);
    state.lastPoint = point;
  }

  function update(x, y) {
    if (!state.active) return;
    const current = state.activeStroke?.points ?? [];
    const last = current[current.length - 1];
    if (!last || Math.hypot(x - last.x, y - last.y) > 2.2) addPoint(x, y);
  }

  function undo() {
    if (state.active) endStroke();
    const stroke = strokes.pop();
    if (!stroke) return false;
    redoStack.push(stroke);
    state.undoCount++;
    recalculateState();
    return true;
  }

  function redo() {
    if (state.active) endStroke();
    const stroke = redoStack.pop();
    if (!stroke) return false;
    strokes.push(stroke);
    state.redoCount++;
    recalculateState();
    return true;
  }

  function canUndo() {
    return strokes.length > 0;
  }

  function canRedo() {
    return redoStack.length > 0;
  }

  function getMetrics() {
    recalculateState();
    let overdraw = 0;
    for (const count of overdrawCells.values()) overdraw += Math.max(0, count - 1);

    const width = state.bounds ? state.bounds.maxX - state.bounds.minX : 0;
    const height = state.bounds ? state.bounds.maxY - state.bounds.minY : 0;
    const coverage = state.bounds ? (width * height) / (drawPanel.w * drawPanel.h) : 0;
    const aspectRatio = height > 0 ? width / height : 1;
    const jitter = state.totalDistance > 0 ? state.angleChange / Math.max(1, state.pointCount) : 0;
    const revisions = Math.max(0, state.strokeCount - 1);
    const seconds = state.startedAt === null ? 0 : Math.max(0.1, (performance.now() - state.startedAt) / 1000);
    const closedness = estimateClosedness();
    const investmentScore = Math.min(1, seconds / 30) * 0.45
      + Math.min(1, state.strokeCount / 10) * 0.2
      + Math.min(1, state.pointCount / 160) * 0.2
      + Math.min(1, overdraw / 90) * 0.15;

    return {
      drawTime: seconds,
      strokeCount: state.strokeCount,
      pointCount: state.pointCount,
      undoCount: state.undoCount,
      redoCount: state.redoCount,
      eraseCount: state.eraseCount,
      pauseCount: state.pauseCount,
      boundingBox: state.bounds ? { ...state.bounds } : null,
      coverage,
      aspectRatio,
      closedness,
      hesitationScore: jitter,
      investmentScore,
      seconds,
      revisions,
      overdraw,
      
      jitter,
      points: state.pointCount,
    };
  }

  function estimateClosedness() {
    if (strokes.length === 0) return 0;
    let best = 0;
    for (const stroke of strokes) {
      if (stroke.tool === "eraser") continue;
      const points = getStrokePoints(stroke);
      if (points.length < 6) continue;
      const first = points[0];
      const last = points[points.length - 1];
      const distance = Math.hypot(first.x - last.x, first.y - last.y);
      best = Math.max(best, 1 - Math.min(1, distance / 72));
    }
    return best;
  }

  function cloneStrokes() {
    return strokes.map(cloneStroke);
  }

  function cloneStroke(stroke) {
    if (Array.isArray(stroke)) {
      return {
        tool: "pencil",
        points: stroke.map((point) => ({ ...point })),
        startTime: stroke[0]?.t ?? 0,
        endTime: stroke[stroke.length - 1]?.t ?? stroke[0]?.t ?? 0,
      };
    }
    return {
      tool: stroke.tool === "eraser" ? "eraser" : "pencil",
      points: getStrokePoints(stroke).map((point) => ({ ...point })),
      startTime: stroke.startTime ?? stroke.points?.[0]?.t ?? 0,
      endTime: stroke.endTime ?? stroke.points?.[stroke.points.length - 1]?.t ?? stroke.startTime ?? 0,
    };
  }

  function recalculateState() {
    overdrawCells.clear();
    state.strokeCount = strokes.length;
    state.pointCount = 0;
    state.totalDistance = 0;
    state.angleChange = 0;
    state.eraseCount = 0;
    state.bounds = null;
    state.prevAngle = undefined;
    state.lastPoint = null;

    for (const stroke of strokes) {
      if (stroke.tool === "eraser") state.eraseCount++;
      state.prevAngle = undefined;
      state.lastPoint = null;
      for (const point of getStrokePoints(stroke)) updateMetricsWithPoint(point, stroke.tool);
    }
    state.prevAngle = undefined;
    state.lastPoint = null;
  }

  function updateMetricsWithPoint(point, tool) {
    state.pointCount++;
    if (tool !== "eraser") {
      const cell = `${Math.floor((point.x - drawPanel.x) / 12)},${Math.floor((point.y - drawPanel.y) / 12)}`;
      overdrawCells.set(cell, (overdrawCells.get(cell) || 0) + 1);

      if (!state.bounds) state.bounds = { minX: point.x, minY: point.y, maxX: point.x, maxY: point.y };
      state.bounds.minX = Math.min(state.bounds.minX, point.x);
      state.bounds.minY = Math.min(state.bounds.minY, point.y);
      state.bounds.maxX = Math.max(state.bounds.maxX, point.x);
      state.bounds.maxY = Math.max(state.bounds.maxY, point.y);
    }

    if (state.lastPoint) {
      const dx = point.x - state.lastPoint.x;
      const dy = point.y - state.lastPoint.y;
      state.totalDistance += Math.hypot(dx, dy);
      if (state.prevAngle !== undefined) {
        const angle = Math.atan2(dy, dx);
        let diff = Math.abs(angle - state.prevAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        state.angleChange += diff;
        state.prevAngle = angle;
      } else if (Math.abs(dx) + Math.abs(dy) > 1) {
        state.prevAngle = Math.atan2(dy, dx);
      }
    }
    state.lastPoint = point;
  }


  clear();
  return { state, strokes, clear, setTool, beginStroke, endStroke, update, undo, redo, canUndo, canRedo, getMetrics, cloneStrokes };
}

