import { getStrokePoints } from "../../core/math.js?v=25";
import { createStrokeRecorder } from "./StrokeRecorder.js?v=25";
import { analyzeInvestment } from "./InvestmentAnalyzer.js?v=25";
import { chooseArchetypeFromMetrics, generateWeaponProfileFromDrawing } from "../../game/WeaponGenerator.js?v=32";

export function createDrawingCanvas(drawPanel) {
  const recorder = createStrokeRecorder(drawPanel);

  function pointInBounds(x, y) {
    return x >= drawPanel.x && y >= drawPanel.y && x <= drawPanel.x + drawPanel.w && y <= drawPanel.y + drawPanel.h;
  }

  function beginStroke(x, y) {
    if (!pointInBounds(x, y)) return;
    recorder.beginStroke(x, y, recorder.state.tool);
  }

  function update(x, y) {
    if (!recorder.state.active || !pointInBounds(x, y)) return;
    recorder.update(x, y);
  }

  function draw(ctx) {
    const buffer = createStrokeBuffer();
    ctx.save();
    ctx.beginPath();
    ctx.rect(drawPanel.x, drawPanel.y, drawPanel.w, drawPanel.h);
    ctx.clip();
    ctx.drawImage(buffer, drawPanel.x, drawPanel.y);
    ctx.restore();
  }

  function exportImageDataUrl() {
    return createStrokeBuffer().toDataURL("image/png");
  }

  function finishWeaponProfile() {
    const metrics = recorder.getMetrics();
    return generateWeaponProfileFromDrawing({
      strokes: recorder.cloneStrokes(),
      metrics,
      investment: analyzeInvestment(metrics),
      imageDataUrl: exportImageDataUrl(),
    });
  }

  function previewWeaponProfile() {
    const metrics = recorder.getMetrics();
    const strokes = recorder.cloneStrokes();
    const previewMetrics = {
      ...metrics,
      strokes,
    };
    const archetype = chooseArchetypeFromMetrics(previewMetrics);
    return {
      metrics: previewMetrics,
      classification: {
        type: archetype.id,
        weaponArchetype: archetype.id,
        attackPattern: archetype.attackPattern,
      },
    };
  }

  function createStrokeBuffer() {
    const buffer = document.createElement("canvas");
    buffer.width = drawPanel.w;
    buffer.height = drawPanel.h;
    const bufferCtx = buffer.getContext("2d");
    bufferCtx.translate(-drawPanel.x, -drawPanel.y);
    drawStrokes(bufferCtx, recorder.strokes);
    return buffer;
  }

  function drawStrokes(ctx, strokes) {
    for (const stroke of strokes) {
      const points = getStrokePoints(stroke);
      if (points.length < 2) continue;
      const tool = stroke.tool === "eraser" ? "eraser" : "pencil";
      ctx.save();
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
      drawPixelStroke(ctx, points, tool === "eraser" ? 18 : 5, tool === "eraser" ? "rgba(0,0,0,1)" : "#05070b");
      ctx.restore();
    }
  }

  function drawPixelStroke(ctx, points, size, color) {
    const step = Math.max(2, Math.floor(size * 0.45));
    ctx.fillStyle = color;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const samples = Math.max(1, Math.ceil(distance / step));
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        stampPixel(ctx, a.x + dx * t, a.y + dy * t, size);
      }
    }
  }

  function stampPixel(ctx, x, y, size) {
    const snappedX = Math.floor(x / 2) * 2;
    const snappedY = Math.floor(y / 2) * 2;
    const half = Math.floor(size / 2);
    ctx.fillRect(snappedX - half, snappedY - half, size, size);
    if (size <= 6) {
      ctx.fillRect(snappedX - half + 1, snappedY - half - 1, Math.max(1, size - 2), 1);
      ctx.fillRect(snappedX - half + 1, snappedY + half, Math.max(1, size - 2), 1);
    }
  }


  function hasDrawablePoints() {
    return recorder.strokes.some((stroke) => stroke.tool !== "eraser" && getStrokePoints(stroke).length > 2);
  }

  return {
    clear: recorder.clear,
    setTool: recorder.setTool,
    undo: recorder.undo,
    redo: recorder.redo,
    canUndo: recorder.canUndo,
    canRedo: recorder.canRedo,
    beginStroke,
    endStroke: recorder.endStroke,
    update,
    draw,
    finishWeaponProfile,
    previewWeaponProfile,
    getMetrics: recorder.getMetrics,
    getTool: () => recorder.state.tool,
    hasEnoughPoints: hasDrawablePoints,
  };
}



