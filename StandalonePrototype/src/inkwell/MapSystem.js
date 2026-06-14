import { TILE, W, H, WORLD_W, WORLD_H, Tile } from "../core/config.js";
import { label } from "../core/render.js";

const EXPLORE_RADIUS = 24;
const MINIMAP_W = 192;
const MINIMAP_H = 40;
const MINIMAP_X = W - MINIMAP_W - 16;
const MINIMAP_Y = 16;
const FULL_MAP_MARGIN = 48;
const FULL_MAP_STEP = 3;

const ROOM_COLORS = {
  entrance: "#4ea1ff",
  combat: "#d4a56a",
  treasure: "#f4d35e",
  resource: "#35d07f",
  rift: "#c084fc",
  boss: "#e23b3b",
};

const TILE_COLORS = {
  [Tile.Paper]: "#c4b898",
  [Tile.Graphite]: "#4a4944",
  [Tile.Ink]: "#1a1a22",
};

export function createMapSystem(tileMap, getPlayer) {
  const explored = Array.from({ length: WORLD_H }, () => new Uint8Array(WORLD_W));
  let fullMapOpen = false;
  let minimapDirty = true;
  let prevExploreHash = 0;

  const minimapCanvas = document.createElement("canvas");
  minimapCanvas.width = MINIMAP_W;
  minimapCanvas.height = MINIMAP_H;
  const minimapCtx = minimapCanvas.getContext("2d");

  const scaleX = MINIMAP_W / WORLD_W;
  const scaleY = MINIMAP_H / WORLD_H;

  function update() {
    const player = getPlayer();
    if (!player) return;
    const cx = Math.floor(player.x / TILE);
    const cy = Math.floor(player.y / TILE);
    let revealed = 0;

    const minY = Math.max(0, cy - EXPLORE_RADIUS);
    const maxY = Math.min(WORLD_H - 1, cy + EXPLORE_RADIUS);
    const minX = Math.max(0, cx - EXPLORE_RADIUS);
    const maxX = Math.min(WORLD_W - 1, cx + EXPLORE_RADIUS);

    for (let ty = minY; ty <= maxY; ty++) {
      const row = explored[ty];
      const dy = ty - cy;
      for (let tx = minX; tx <= maxX; tx++) {
        if (row[tx]) continue;
        const dx = tx - cx;
        if (dx * dx + dy * dy > EXPLORE_RADIUS * EXPLORE_RADIUS) continue;
        row[tx] = 1;
        revealed++;
      }
    }

    if (revealed > 0) {
      minimapDirty = true;
      prevExploreHash += revealed;
    }
  }

  function rebuildMinimap() {
    if (!minimapDirty) return;
    minimapDirty = false;

    minimapCtx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);
    minimapCtx.fillStyle = "rgba(12, 10, 14, 0.92)";
    minimapCtx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);

    for (let sy = 0; sy < MINIMAP_H; sy++) {
      const ty = Math.floor(sy / scaleY);
      const row = explored[ty];
      if (!row) continue;
      for (let sx = 0; sx < MINIMAP_W; sx++) {
        const tx = Math.floor(sx / scaleX);
        if (!row[tx]) continue;
        const color = TILE_COLORS[tileMap.tileAt(tx, ty)] || "#2a2820";
        minimapCtx.fillStyle = color;
        minimapCtx.fillRect(sx, sy, 1, 1);
      }
    }
  }

  function drawMinimap(ctx) {
    rebuildMinimap();

    ctx.fillStyle = "rgba(8, 7, 10, 0.78)";
    ctx.fillRect(MINIMAP_X - 2, MINIMAP_Y - 2, MINIMAP_W + 4, MINIMAP_H + 4);

    ctx.drawImage(minimapCanvas, MINIMAP_X, MINIMAP_Y);

    const player = getPlayer();
    if (player) {
      const px = MINIMAP_X + (player.x / TILE) * scaleX;
      const py = MINIMAP_Y + (player.y / TILE) * scaleY;
      ctx.fillStyle = "#f7f0df";
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#5c554c";
    ctx.lineWidth = 1;
    ctx.strokeRect(MINIMAP_X - 1, MINIMAP_Y - 1, MINIMAP_W + 2, MINIMAP_H + 2);
  }

  function toggleFullMap() {
    fullMapOpen = !fullMapOpen;
  }

  function closeFullMap() {
    fullMapOpen = false;
  }

  function isFullMapOpen() {
    return fullMapOpen;
  }

  function drawFullMap(ctx, rooms) {
    if (!fullMapOpen) return;

    ctx.fillStyle = "rgba(4, 3, 6, 0.88)";
    ctx.fillRect(0, 0, W, H);

    const mapW = W - FULL_MAP_MARGIN * 2;
    const mapH = H - FULL_MAP_MARGIN * 2;
    const mapX = FULL_MAP_MARGIN;
    const mapY = FULL_MAP_MARGIN;
    const mScaleX = mapW / WORLD_W;
    const mScaleY = mapH / WORLD_H;

    ctx.fillStyle = "rgba(20, 18, 24, 0.92)";
    ctx.fillRect(mapX, mapY, mapW, mapH);

    for (let ty = 0; ty < WORLD_H; ty += FULL_MAP_STEP) {
      const row = explored[ty];
      if (!row) continue;
      const ry = mapY + ty * mScaleY;
      const rh = FULL_MAP_STEP * mScaleY + 1;
      for (let tx = 0; tx < WORLD_W; tx += FULL_MAP_STEP) {
        if (!row[tx]) continue;
        const color = TILE_COLORS[tileMap.tileAt(tx, ty)] || "#2a2820";
        ctx.fillStyle = color;
        ctx.fillRect(mapX + tx * mScaleX, ry, FULL_MAP_STEP * mScaleX + 1, rh);
      }
    }

    if (rooms) {
      for (const room of rooms) {
        const rx = mapX + room.x * mScaleX;
        const ry = mapY + room.y * mScaleY;
        const rw = room.w * mScaleX;
        const rh = room.h * mScaleY;
        const color = ROOM_COLORS[room.type] || "#5c554c";

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = color;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.globalAlpha = 1;
        ctx.setLineDash([2, 3]);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.setLineDash([]);

        const labelX = rx + Math.max(0, rw / 2);
        const labelY = ry + Math.max(8, rh / 2);
        label(ctx, room.name, labelX, labelY, 10, "#f1ead9");
      }
    }

    const player = getPlayer();
    if (player) {
      const px = mapX + (player.x / TILE) * mScaleX;
      const py = mapY + (player.y / TILE) * mScaleY;

      ctx.fillStyle = "rgba(247, 240, 223, 0.3)";
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f7f0df";
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#24211f";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.strokeStyle = "#5c554c";
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    label(ctx, "Map", mapX + 10, mapY + 22, 16, "#f1ead9");
    label(ctx, "Press M to close", mapX + 10, mapY + 40, 11, "#8b8173");

    const lx = mapX + mapW - 148;
    const ly = mapY + 12;
    const legend = [
      { color: "#c4b898", label: "Paper" },
      { color: "#4a4944", label: "Graphite" },
      { color: "#1a1a22", label: "Ink" },
    ];
    legend.forEach((item, i) => {
      const y = ly + i * 16;
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, y, 8, 8);
      label(ctx, item.label, lx + 14, y + 8, 11, "#a09888");
    });

    const rlEntries = Object.entries(ROOM_COLORS);
    const rly = ly + legend.length * 16 + 6;
    rlEntries.forEach(([type, color], i) => {
      const y = rly + i * 13;
      ctx.fillStyle = color;
      ctx.fillRect(lx, y, 6, 6);
      label(ctx, type[0].toUpperCase() + type.slice(1), lx + 12, y + 6, 10, "#a09888");
    });
  }

  function reset() {
    for (let y = 0; y < WORLD_H; y++) explored[y].fill(0);
    fullMapOpen = false;
    minimapDirty = true;
    prevExploreHash = 0;
  }

  return {
    update,
    drawMinimap,
    drawFullMap,
    toggleFullMap,
    closeFullMap,
    isFullMapOpen,
    reset,
  };
}
