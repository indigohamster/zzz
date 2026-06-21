import { H, W } from "../core/config.js?v=27";
import { hash01 } from "./Noise.js";
import { getLayerThemeByCameraY } from "./VisualThemes.js";

export function drawInkwellBackground(ctx, camera, dayCarryover = null) {
  const theme = getLayerThemeByCameraY(camera.y);
  const depth = Math.min(1, Math.max(0, camera.y / 900));
  drawSkyGradient(ctx, theme, depth);
  drawDitheredHaze(ctx, camera, theme);
  drawParallaxLayer(ctx, camera, 0.06, 424, theme.parallax[0], theme.outline, depth, 58);
  drawParallaxLayer(ctx, camera, 0.13, 354, theme.parallax[1], theme.outline, depth, 74);
  drawParallaxLayer(ctx, camera, 0.22, 292, theme.parallax[2], theme.outline, depth, 96);
  drawFloatingPaperScraps(ctx, camera, theme);
  drawOfficeResidue(ctx, camera, theme, dayCarryover);
  drawPixelMist(ctx, camera, theme);
}

function drawSkyGradient(ctx, theme, depth) {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  const top = mixColor(theme.bands[0][0], theme.bands[0][1], depth);
  const mid = mixColor(theme.bands[1][0], theme.bands[1][1], depth);
  const bottom = mixColor(theme.bands[3][0], theme.bands[3][1], depth);
  gradient.addColorStop(0, rgb(top));
  gradient.addColorStop(0.56, rgb(mid));
  gradient.addColorStop(1, rgb(bottom));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = theme.haze;
  for (let y = 0; y < H; y += 12) ctx.fillRect(0, y, W, 4);
}

function drawDitheredHaze(ctx, camera, theme) {
  ctx.save();
  for (let i = 0; i < 520; i++) {
    const x = Math.floor(positiveMod(i * 83 - camera.x * 0.035, W) / 2) * 2;
    const y = Math.floor(positiveMod(i * 47 - camera.y * 0.018, H) / 2) * 2;
    const size = i % 9 === 0 ? 4 : 2;
    const alpha = i % 7 === 0 ? 0.13 : 0.055;
    ctx.fillStyle = rgba(i % 5 === 0 ? theme.accent : theme.particle, alpha);
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function drawParallaxLayer(ctx, camera, factor, baseline, lightColor, darkColor, depth, amplitude) {
  ctx.fillStyle = blendHex(lightColor, darkColor, 0.22 + depth * 0.56);
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let sx = -48; sx <= W + 48; sx += 8) {
    const wx = (sx + camera.x * factor) / 34;
    const block = Math.floor(wx);
    const rough = Math.sin(wx * 0.74) * amplitude * 0.34 + Math.sin(wx * 0.22) * amplitude * 0.54 + hash01(block, 3) * amplitude * 0.38;
    const y = Math.floor((baseline - rough + camera.y * factor * 0.22) / 4) * 4;
    ctx.lineTo(sx, y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = rgba(lightColor, 0.10);
  for (let sx = -32; sx < W + 32; sx += 32) {
    const y = Math.floor((baseline - 38 + Math.sin((sx + camera.x * factor) * 0.018) * 18) / 4) * 4;
    ctx.fillRect(sx, y, 16, 4);
  }
}

function drawFloatingPaperScraps(ctx, camera, theme) {
  for (let i = 0; i < 28; i++) {
    const x = Math.floor(positiveMod(i * 119 - camera.x * (0.05 + (i % 4) * 0.025), W + 80) - 40);
    const y = Math.floor(positiveMod(i * 71 - camera.y * 0.04, H + 60) - 30);
    const w = 6 + (i % 3) * 4;
    const h = 3 + (i % 2) * 3;
    ctx.fillStyle = rgba(i % 4 === 0 ? theme.accent : theme.tileLight, 0.18);
    ctx.fillRect(x, y, w, h);
    if (i % 5 === 0) {
      ctx.fillStyle = rgba(theme.outline, 0.18);
      ctx.fillRect(x, y + h, w, 1);
    }
  }
}

function drawOfficeResidue(ctx, camera, theme, carry) {
  if (!carry) return;
  const pressure = Math.max(carry.stress ?? 0, carry.fatigue ?? 0, carry.inspiration ?? 0, carry.deadline ?? 0, carry.scope ?? 0);
  if (pressure <= 0 && !carry.choice) return;
  const intensity = Math.max(0.18, Math.min(0.62, pressure / 140));
  const accent = carry.color ?? theme.accent;

  ctx.save();
  ctx.globalAlpha = intensity;
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(positiveMod(i * 137 - camera.x * 0.045, W + 80) - 40);
    const y = Math.floor(positiveMod(i * 61 - camera.y * 0.028, H + 50) - 25);
    ctx.fillStyle = rgba("#05070b", 0.42);
    ctx.fillRect(x - 4, y - 4, 54, 34);
    ctx.fillStyle = rgba(accent, i % 3 === 0 ? 0.42 : 0.26);
    ctx.fillRect(x, y, 46, 26);
    ctx.fillStyle = rgba(theme.tileLight, 0.18);
    ctx.fillRect(x + 6, y + 6, 34, 3);
    ctx.fillRect(x + 6, y + 15, 22, 3);
  }

  if (Math.max(carry.stress ?? 0, carry.deadline ?? 0) >= 35) {
    ctx.fillStyle = rgba("#b23b48", 0.34);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(positiveMod(i * 173 - camera.x * 0.08, W + 70) - 30);
      const y = Math.floor(positiveMod(i * 89 - camera.y * 0.04, H + 70) - 30);
      ctx.fillRect(x, y, 38, 8);
      ctx.fillRect(x + 12, y - 10, 8, 28);
    }
  }

  if ((carry.inspiration ?? 0) >= 35) {
    ctx.fillStyle = rgba("#7dd3fc", 0.34);
    for (let i = 0; i < 18; i++) {
      const x = Math.floor(positiveMod(i * 97 - camera.x * 0.11, W));
      const y = Math.floor(positiveMod(i * 53 - camera.y * 0.06, H));
      ctx.fillRect(x, y, i % 2 === 0 ? 8 : 4, 2);
      ctx.fillRect(x + 2, y - 2, 2, 6);
    }
  }

  if ((carry.fatigue ?? 0) >= 35) {
    ctx.fillStyle = rgba("#d8cfb8", 0.16);
    for (let y = 34; y < H; y += 42) {
      const drift = Math.floor(positiveMod(camera.x * 0.02 + y, 48));
      ctx.fillRect(-drift, y, W + 48, 3);
    }
  }
  if ((carry.reputation ?? 0) >= 40) {
    ctx.fillStyle = rgba("#f2b84b", 0.24);
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(positiveMod(i * 149 - camera.x * 0.07, W + 64) - 32);
      const y = Math.floor(positiveMod(i * 77 - camera.y * 0.035, H + 40) - 20);
      ctx.fillRect(x, y, 48, 4);
      ctx.fillRect(x + 8, y + 8, 32, 3);
    }
  }
  ctx.restore();
}

function drawPixelMist(ctx, camera, theme) {
  ctx.save();
  ctx.globalAlpha = theme.id === "deep" ? 0.34 : 0.22;
  ctx.fillStyle = theme.scan;
  for (let y = 18; y < H; y += 30) {
    const drift = Math.floor(positiveMod(camera.x * 0.03 + y * 1.7, 56));
    for (let x = -drift; x < W; x += 56) ctx.fillRect(x, y, 28, 2);
  }
  ctx.restore();
}

function positiveMod(value, mod) {
  return ((value % mod) + mod) % mod;
}

function blendHex(a, b, t) {
  return rgb(mixColor(parseHex(a), parseHex(b), t));
}

function parseHex(hex) {
  const raw = hex.replace("#", "");
  return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
}

function mixColor(a, b, t) {
  const clamped = Math.max(0, Math.min(1, t));
  return a.map((channel, index) => Math.round(channel + (b[index] - channel) * clamped));
}

function rgb(color) {
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

function rgba(hex, alpha) {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}
