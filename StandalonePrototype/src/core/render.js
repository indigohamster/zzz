import { H, W } from "./config.js?v=27";

export function drawPaperBackground(ctx, cameraX = 0, cameraY = 0) {
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, "#f5ecd7");
  gradient.addColorStop(0.56, "#ded0ad");
  gradient.addColorStop(1, "#a9926a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(67, 52, 36, 0.10)";
  for (let y = 0; y < H; y += 8) {
    const offset = Math.floor((y * 0.27 - cameraX * 0.04) % 16);
    for (let x = -16 + offset; x < W; x += 16) ctx.fillRect(x, y, 7, 1);
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  for (let i = 0; i < 210; i++) {
    const x = positiveMod(i * 97 - cameraX * 0.18, W);
    const y = positiveMod(i * 43 - cameraY * 0.08, H);
    ctx.fillRect(Math.floor(x / 2) * 2, Math.floor(y / 2) * 2, i % 5 === 0 ? 3 : 2, 2);
  }

  drawPixelVignette(ctx, "rgba(54, 38, 24, 0.16)");
}

export function label(ctx, text, x, y, size = 16, color = "#24211f") {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Courier New", "Microsoft YaHei", "Segoe UI", monospace`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

export function pixelText(ctx, text, x, y, size = 14, color = "#f7f0df", shadow = "#05070b") {
  const sx = Math.max(1, Math.floor(size / 8));
  label(ctx, text, x + sx, y + sx, size, shadow);
  label(ctx, text, x, y, size, color);
}

export function drawPixelPanel(ctx, x, y, w, h, options = {}) {
  const {
    fill = "#111823",
    border = "#05070b",
    accent = "#f0d9a5",
    shine = "rgba(255,255,255,0.12)",
    grid = "rgba(125,211,252,0.055)",
  } = options;
  ctx.fillStyle = border;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, w, 4);
  ctx.fillRect(x, y, 4, h);
  ctx.fillStyle = shine;
  ctx.fillRect(x + 8, y + 8, w - 16, 2);
  ctx.fillStyle = grid;
  for (let yy = y + 18; yy < y + h - 10; yy += 12) ctx.fillRect(x + 8, yy, w - 16, 1);
}

export function drawPixelFrame(ctx, frame = 0, mood = "neutral") {
  const accent = mood === "inkwell" ? "#7dd3fc" : "#f0d9a5";
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = "#000000";
  for (let y = frame % 4; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  ctx.globalAlpha = 1;
  drawPixelVignette(ctx, mood === "inkwell" ? "rgba(0, 0, 0, 0.30)" : "rgba(0, 0, 0, 0.18)");
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.45;
  ctx.fillRect(14, 14, 34, 3);
  ctx.fillRect(14, 14, 3, 34);
  ctx.fillRect(W - 48, 14, 34, 3);
  ctx.fillRect(W - 17, 14, 3, 34);
  ctx.fillRect(14, H - 17, 34, 3);
  ctx.fillRect(14, H - 48, 3, 34);
  ctx.fillRect(W - 48, H - 17, 34, 3);
  ctx.fillRect(W - 17, H - 48, 3, 34);
  ctx.restore();
}

function drawPixelVignette(ctx, color) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < 9; i++) {
    const inset = i * 8;
    ctx.globalAlpha = 1 - i / 9;
    ctx.fillRect(inset, inset, W - inset * 2, 4);
    ctx.fillRect(inset, H - inset - 4, W - inset * 2, 4);
    ctx.fillRect(inset, inset, 4, H - inset * 2);
    ctx.fillRect(W - inset - 4, inset, 4, H - inset * 2);
  }
  ctx.restore();
}

function positiveMod(value, mod) {
  return ((value % mod) + mod) % mod;
}
