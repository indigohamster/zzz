import { TILE, Tile, tileColors, WORLD_H, WORLD_W } from "../core/config.js?v=27";
import { hash01 } from "./Noise.js";

export function drawTile(ctx, tileMap, x, y, sx, sy) {
  const t = tileMap.tileAt(x, y);
  const [base, edge] = tileColors[t];
  const v = tileMap.variantAt(x, y);
  const aboveAir = y <= 0 || tileMap.tileAt(x, y - 1) === Tile.Air;
  const belowAir = y >= WORLD_H - 1 || tileMap.tileAt(x, y + 1) === Tile.Air;
  const leftAir = x <= 0 || tileMap.tileAt(x - 1, y) === Tile.Air;
  const rightAir = x >= WORLD_W - 1 || tileMap.tileAt(x + 1, y) === Tile.Air;

  ctx.fillStyle = tint(base, v === 0 ? 0 : v === 1 ? 8 : -7);
  ctx.fillRect(sx, sy, TILE, TILE);
  ctx.fillStyle = tint(edge, v === 2 ? -8 : 0);
  ctx.fillRect(sx, sy + TILE - 2, TILE, 2);
  ctx.fillRect(sx, sy, 1, TILE);
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.fillRect(sx + TILE - 1, sy, 1, TILE);
  ctx.fillRect(sx, sy + TILE - 1, TILE, 1);

  if (aboveAir) {
    ctx.fillStyle = t === Tile.Ink ? "#34313d" : "#eee6d2";
    ctx.fillRect(sx, sy, TILE, 2);
    if (t === Tile.Paper) {
      ctx.fillStyle = "#8f846f";
      for (let i = 0; i < 3; i++) ctx.fillRect(sx + 2 + Math.floor(hash01(x + i, y) * 12), sy - 2, 1, 3);
    }
  }

  if (aboveAir || leftAir || rightAir || belowAir) {
    ctx.strokeStyle = "rgba(12, 11, 10, 0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);
  }

  if (leftAir) {
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(sx, sy, 2, TILE);
  }
  if (rightAir || belowAir) {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    if (rightAir) ctx.fillRect(sx + TILE - 2, sy, 2, TILE);
    if (belowAir) ctx.fillRect(sx, sy + TILE - 2, TILE, 2);
  }

  drawTileTexture(ctx, x, y, sx, sy, t, v);
}

function drawTileTexture(ctx, x, y, sx, sy, t, v) {
  if (t === Tile.Paper) {
    ctx.fillStyle = v === 1 ? "#b8ad97" : "#c8bea8";
    ctx.fillRect(sx + 1 + ((x + y) % 3), sy + 2, 3, 1);
    ctx.fillRect(sx + 3, sy + 5 + (v % 2), 4, 1);
    if (hash01(x, y) > 0.72) ctx.fillRect(sx + 1, sy + 6, 2, 1);
    return;
  }
  if (t === Tile.Graphite) {
    ctx.fillStyle = v === 1 ? "#77756e" : "#504f4b";
    ctx.fillRect(sx + 1, sy + 2 + Math.min(v, 1), 4, 1);
    ctx.fillRect(sx + 3, sy + 5, 4, 1);
    ctx.fillStyle = "rgba(20,20,20,0.22)";
    ctx.fillRect(sx + 6, sy + 1, 1, 6);
    if (hash01(x * 4, y) > 0.6) ctx.fillRect(sx + 1, sy + 6, 5, 1);
    return;
  }
  if (t === Tile.Ink) {
    ctx.fillStyle = "#2f2b3b";
    ctx.fillRect(sx + 2, sy + 2, 3, 1);
    if (hash01(x, y * 3) > 0.5) ctx.fillRect(sx + 5, sy + 4, 2, 1);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(sx + 1, sy + 6, 6, 1);
  }
}

function tint(hex, amount) {
  const raw = hex.replace("#", "");
  const r = clampColor(parseInt(raw.slice(0, 2), 16) + amount);
  const g = clampColor(parseInt(raw.slice(2, 4), 16) + amount);
  const b = clampColor(parseInt(raw.slice(4, 6), 16) + amount);
  return `rgb(${r},${g},${b})`;
}

function clampColor(value) {
  return Math.max(0, Math.min(255, value));
}
