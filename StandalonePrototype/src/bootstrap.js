(async function boot() {
  try {
    await import("./main.js?v=33");
  } catch (error) {
    const canvas = document.getElementById("game");
    const ctx = canvas?.getContext("2d");
    if (!ctx) {
      console.error(error);
      return;
    }

    ctx.fillStyle = "#f1ead9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8d1d25";
    ctx.font = "18px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText("Startup error:", 40, 60);
    ctx.fillStyle = "#24211f";
    ctx.font = "14px Consolas, monospace";
    const lines = String(error?.stack || error?.message || error).split("\n").slice(0, 10);
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i].slice(0, 110), 40, 96 + i * 22);
    console.error(error);
  }
})();
