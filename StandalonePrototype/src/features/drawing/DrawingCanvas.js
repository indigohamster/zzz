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
      ctx.strokeStyle = tool === "eraser" ? "rgba(0,0,0,1)" : "#111";
      ctx.lineWidth = tool === "eraser" ? 18 : 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
      ctx.restore();
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



