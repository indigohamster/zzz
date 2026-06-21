// PixelPolish.js — screen-space and foreground pixel details for the inkwell scene.

import { H, W } from "../core/config.js?v=27";
import { hash01 } from "./Noise.js";
import { getLayerThemeById } from "./VisualThemes.js";

export function drawForegroundPixels(ctx, camera, layerId = "shallow") {
  const theme = getLayerThemeById(layerId);
  drawForegroundStalactites(ctx, camera, theme);
  drawForegroundReeds(ctx, camera, theme);
}

export function drawPixelPostProcess(ctx, frame = 0, layerId = "shallow") {
  const theme = getLayerThemeById(layerId);
  drawDitherVignette(ctx, theme);
  drawPixelScanlines(ctx, frame, theme);
  drawCornerNoise(ctx, frame, theme);
}

function drawForegroundStalactites(ctx, camera, theme) {
  ctx.save();
  ctx.globalAlpha = theme.id === "deep" ? 0.42 : theme.id === "middle" ? 0.34 : 0.26;
  for (let i = 0; i < 18; i++) {
    const x = Math.floor(positiveMod(i * 91 - camera.x * 0.38, W + 72) - 36);
    const h = 18 + Math.floor(hash01(i, 13) * 54);
    const w = 8 + Math.floor(hash01(i, 27) * 14);
    const y = -4 + Math.floor(hash01(i, 31) * 22);
    ctx.fillStyle = theme.outline;
    ctx.fillRect(x, y, w, Math.floor(h * 0.45));
    ctx.fillRect(x + 2, y + Math.floor(h * 0.45), Math.max(3, w - 4), Math.floor(h * 0.34));
    ctx.fillRect(x + Math.floor(w / 2) - 1, y + Math.floor(h * 0.78), 3, Math.floor(h * 0.22));
    ctx.fillStyle = rgba(theme.tileLight, 0.12);
    ctx.fillRect(x + 1, y + 2, 2, Math.max(6, Math.floor(h * 0.36)));
  }
  ctx.restore();
}

function drawForegroundReeds(ctx, camera, theme) {
  ctx.save();
  ctx.globalAlpha = theme.id === "deep" ? 0.36 : 0.24;
  for (let i = 0; i < 28; i++) {
    const x = Math.floor(positiveMod(i * 57 - camera.x * 0.52, W + 48) - 24);
    const h = 20 + Math.floor(hash01(i, 44) * 46);
    const baseY = H - Math.floor(hash01(i, 51) * 18);
    const bend = Math.floor(Math.sin((camera.x + i * 37) * 0.01) * 4);
    ctx.fillStyle = rgba(theme.outline, 0.82);
    ctx.fillRect(x, baseY - h, 3, h);
    ctx.fillRect(x + bend, baseY - h, 7, 3);
    ctx.fillStyle = rgba(theme.accent, 0.18);
    ctx.fillRect(x + 1, baseY - h + 4, 1, Math.max(4, h - 8));
  }
  ctx.restore();
}

function drawDitherVignette(ctx, theme) {
  const edge = 68;
  ctx.save();
  ctx.fillStyle = theme.id === "deep" ? "rgba(0,0,0,0.34)" : "rgba(0,0,0,0.24)";
  for (let y = 0; y < H; y += 4) {
    for (let x = 0; x < W; x += 4) {
      const dx = Math.min(x, W - x);
      const dy = Math.min(y, H - y);
      const dist = Math.min(dx, dy);
      if (dist > edge) continue;
      const threshold = 1 - dist / edge;
      if (hash01(x * 0.17, y * 0.19) < threshold * 0.62) ctx.fillRect(x, y, 4, 4);
    }
  }
  ctx.restore();
}

function drawPixelScanlines(ctx, frame, theme) {
  ctx.save();
  ctx.globalAlpha = theme.id === "deep" ? 0.16 : 0.09;
  ctx.fillStyle = theme.id === "deep" ? theme.secondary : theme.outline;
  const offset = frame % 4;
  for (let y = offset; y < H; y += 8) {
    ctx.fillRect(0, y, W, 1);
  }
  ctx.restore();
}

function drawCornerNoise(ctx, frame, theme) {
  ctx.save();
  for (let i = 0; i < 44; i++) {
    const x = Math.floor(hash01(i, frame * 0.03) * W / 4) * 4;
    const y = Math.floor(hash01(frame * 0.05, i) * H / 4) * 4;
    const nearEdge = x < 90 || x > W - 90 || y < 70 || y > H - 70;
    if (!nearEdge) continue;
    ctx.fillStyle = rgba(i % 3 === 0 ? theme.accent : theme.particle, 0.08);
    ctx.fillRect(x, y, i % 5 === 0 ? 6 : 3, i % 7 === 0 ? 2 : 3);
  }
  ctx.restore();
}

function positiveMod(value, mod) {
  return ((value % mod) + mod) % mod;
}

function rgba(hex, alpha) {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}
