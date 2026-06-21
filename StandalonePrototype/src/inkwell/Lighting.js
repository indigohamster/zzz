import { H, TILE, Tile, W } from "../core/config.js?v=27";

export function drawInkwellLighting(ctx, { camera, player, tileMap, npcs }) {
  ctx.save();
  ctx.fillStyle = "rgba(4, 4, 7, 0.48)";
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "destination-out";
  punchLight(ctx, player.x - camera.x, player.y - camera.y, 128, 0.58);
  for (const npc of npcs) {
    if (npc.hp > 0 && npc.hurt > 0) punchLight(ctx, npc.x - camera.x, npc.y - camera.y, 58, 0.46);
  }
  drawVisibleInkGlows(ctx, camera, tileMap);

  ctx.globalCompositeOperation = "source-over";
  drawWarmCore(ctx, player.x - camera.x, player.y - camera.y, 92, "rgba(246, 210, 126, 0.08)");
  drawVisibleInkHighlights(ctx, camera, tileMap);
  ctx.restore();
}

function drawVisibleInkGlows(ctx, camera, tileMap) {
  const startX = Math.floor(camera.x / TILE);
  const endX = Math.ceil((camera.x + W) / TILE);
  const startY = Math.floor(camera.y / TILE);
  const endY = Math.ceil((camera.y + H) / TILE);
  let count = 0;
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (tileMap.tileAt(x, y) !== Tile.Ink || (x + y) % 5 !== 0) continue;
      punchLight(ctx, x * TILE + 8 - camera.x, y * TILE + 8 - camera.y, 34, 0.28);
      count++;
      if (count > 28) return;
    }
  }
}

function drawVisibleInkHighlights(ctx, camera, tileMap) {
  const startX = Math.floor(camera.x / TILE);
  const endX = Math.ceil((camera.x + W) / TILE);
  const startY = Math.floor(camera.y / TILE);
  const endY = Math.ceil((camera.y + H) / TILE);
  let count = 0;
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (tileMap.tileAt(x, y) !== Tile.Ink || (x + y) % 5 !== 0) continue;
      drawWarmCore(ctx, x * TILE + 8 - camera.x, y * TILE + 8 - camera.y, 28, "rgba(70, 62, 120, 0.16)");
      count++;
      if (count > 28) return;
    }
  }
}

function punchLight(ctx, x, y, radius, alpha) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
  gradient.addColorStop(0.55, `rgba(255,255,255,${alpha * 0.42})`);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawWarmCore(ctx, x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
