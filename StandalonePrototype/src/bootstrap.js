(async function boot() {
  try {
    await loadExternalTuning();
    await import("./main.js?v=60");
  } catch (error) {
    const canvas = document.getElementById("game");
    const ctx = canvas?.getContext("2d");
    if (!ctx) {
      console.error(error);
      return;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#05070b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#b23b48";
    ctx.font = "18px Courier New, Microsoft YaHei, monospace";
    ctx.fillText("Startup error:", 40, 60);
    ctx.fillStyle = "#f0d9a5";
    ctx.font = "14px Consolas, monospace";
    const lines = String(error?.stack || error?.message || error).split("\n").slice(0, 10);
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i].slice(0, 110), 40, 96 + i * 22);
    console.error(error);
  }
})();

async function loadExternalTuning() {
  try {
    const cacheBust = Date.now();
    const module = await import(`../tuning.config.js?ts=${cacheBust}`);
    globalThis.__INKWELL_TUNING__ = module.default ?? module.TUNING ?? {};
    console.info("[TuningConfig] external tuning loaded");
  } catch (error) {
    globalThis.__INKWELL_TUNING__ = {};
    console.warn("[TuningConfig] external tuning fallback", error);
  }
}
