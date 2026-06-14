import { H, W } from "../core/config.js";
import { hash01 } from "./Noise.js";

export function drawInkwellBackground(ctx, camera) {
  const depth = Math.min(1, Math.max(0, camera.y / 520));
  const skyTop = mixColor([229, 221, 205], [24, 23, 28], depth);
  const skyBottom = mixColor([242, 234, 217], [54, 48, 54], depth);
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, rgb(skyTop));
  gradient.addColorStop(1, rgb(skyBottom));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  drawPaperFibers(ctx, camera, depth);
  drawParallaxLayer(ctx, camera, 0.08, 380, "#c9bea8", "#6b6062", depth);
  drawParallaxLayer(ctx, camera, 0.16, 305, "#b4a78e", "#3e3940", depth);
  drawParallaxLayer(ctx, camera, 0.28, 250, "#8f836f", "#26242c", depth);
}

function drawPaperFibers(ctx, camera, depth) {
  ctx.fillStyle = `rgba(65, 58, 49, ${0.09 + depth * 0.05})`;
  for (let i = 0; i < 150; i++) {
    const x = positiveMod(i * 97 - camera.x * 0.05, W);
    const y = positiveMod(i * 43 - camera.y * 0.03, H);
    ctx.fillRect(x, y, 1 + (i % 3 === 0 ? 1 : 0), 1);
  }
}

function drawParallaxLayer(ctx, camera, factor, baseline, lightColor, darkColor, depth) {
  ctx.fillStyle = blendHex(lightColor, darkColor, depth);
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let sx = -32; sx <= W + 32; sx += 16) {
    const wx = (sx + camera.x * factor) / 34;
    const height = Math.sin(wx * 0.8) * 28 + Math.sin(wx * 0.27) * 56 + hash01(Math.floor(wx), 3) * 28;
    ctx.lineTo(sx, baseline - height + camera.y * factor * 0.22);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

function positiveMod(value, mod) {
  return ((value % mod) + mod) % mod;
}

function blendHex(a, b, t) {
  const ar = parseHex(a);
  const br = parseHex(b);
  return rgb(mixColor(ar, br, t));
}

function parseHex(hex) {
  const raw = hex.replace("#", "");
  return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
}

function mixColor(a, b, t) {
  return a.map((channel, index) => Math.round(channel + (b[index] - channel) * t));
}

function rgb(color) {
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}
