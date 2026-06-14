import { H, W } from "./config.js";

export function drawPaperBackground(ctx, cameraX = 0, cameraY = 0) {
  ctx.fillStyle = "#f1ead9";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#d8cfbd";
  for (let i = 0; i < 170; i++) {
    const x = (i * 97 - cameraX * 0.18) % W;
    const y = (i * 43 - cameraY * 0.08) % H;
    ctx.fillRect(x, y, 1, 1);
  }
}

export function label(ctx, text, x, y, size = 16, color = "#24211f") {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.fillText(text, x, y);
}
