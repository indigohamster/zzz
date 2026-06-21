import { TILE, W, H, WORLD_W, WORLD_H, Tile } from "../core/config.js?v=27";
import { label } from "../core/render.js";
import { MAP_LAYERS, ROOM_TYPES } from "./MapLayers.js?v=4";

const EXPLORE_RADIUS = 24;
const MINIMAP_W = 92;
const MINIMAP_H = 152;
const MINIMAP_X = W - MINIMAP_W - 18;
const MINIMAP_Y = H - MINIMAP_H - 24;
const FULL_MAP_MARGIN = 48;
const FULL_MAP_STEP = 3;

const ROOM_COLORS = {
  entrance: "#4ea1ff",
  combat: "#d4a56a",
  treasure: "#f4d35e",
  resource: "#35d07f",
  rift: "#c084fc",
  event: "#7dd3fc",
  shop: "#f2b84b",
  danger: "#ff5d6c",
  explore: "#9fb0b8",
  exit: "#f7f0df",
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
    drawLayerBands(minimapCtx, 0, 0, MINIMAP_W, MINIMAP_H, scaleY, 0.22);

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
    ctx.fillRect(MINIMAP_X - 8, MINIMAP_Y - 24, MINIMAP_W + 16, MINIMAP_H + 32);
    label(ctx, "DEPTH", MINIMAP_X, MINIMAP_Y - 9, 11, "#7dd3fc");

    ctx.drawImage(minimapCanvas, MINIMAP_X, MINIMAP_Y);
    drawMinimapDepthTicks(ctx);

    const player = getPlayer();
    if (player) {
      const px = MINIMAP_X + (player.x / TILE) * scaleX;
      const py = MINIMAP_Y + (player.y / TILE) * scaleY;
      ctx.fillStyle = "#f7f0df";
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
      const meters = Math.max(0, Math.floor((player.y / TILE) * 0.7));
      label(ctx, meters + "m", MINIMAP_X + 36, Math.max(MINIMAP_Y + 12, Math.min(MINIMAP_Y + MINIMAP_H - 6, py + 4)), 9, "#f7f0df");
    }

    ctx.strokeStyle = "#5c554c";
    ctx.lineWidth = 1;
    ctx.strokeRect(MINIMAP_X - 1, MINIMAP_Y - 1, MINIMAP_W + 2, MINIMAP_H + 2);
  }

  function drawMinimapDepthTicks(ctx) {
    for (const layer of MAP_LAYERS) {
      const y = MINIMAP_Y + layer.yRange[0] * scaleY;
      ctx.strokeStyle = "rgba(247,240,223,0.22)";
      ctx.beginPath();
      ctx.moveTo(MINIMAP_X - 4, y);
      ctx.lineTo(MINIMAP_X + MINIMAP_W + 4, y);
      ctx.stroke();
      label(ctx, layer.shortName ?? layer.id, MINIMAP_X + 4, y + 10, 8, "#a09888");
    }
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
    drawLayerBands(ctx, mapX, mapY, mapW, mapH, mScaleY, 0.36);

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
        const knownRoom = room.type === "entrance" || room.type === "exit" || isRoomExplored(room);
        if (!knownRoom) {
          if (hasExploredNearRoom(room)) drawUnknownRoomMarker(ctx, room, mapX, mapY, mScaleX, mScaleY);
          continue;
        }
        const color = ROOM_COLORS[room.type] || "#5c554c";
        const icon = ROOM_TYPES[room.type]?.icon ?? "";

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = room.routeHint === "branch" ? 0.4 : 0.58;
        ctx.fillStyle = color;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.globalAlpha = 1;
        ctx.setLineDash(room.routeHint === "branch" ? [2, 3] : []);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.setLineDash([]);

        const labelX = rx + Math.max(0, rw / 2);
        const labelY = ry + Math.max(8, rh / 2);
        label(ctx, icon, labelX, labelY - 5, 12, "#f1ead9");
        label(ctx, room.name, labelX, labelY + 7, 9, "#f1ead9");
        if (room.riskTier >= 3) label(ctx, "RISK", labelX, labelY + 19, 8, "#ffb3ba");
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

    const mapRule = tileMap.getMapRule?.();
    label(ctx, `Ink Dive Map / ${mapRule?.shortName || "unknown"}`, mapX + 10, mapY + 22, 16, "#f1ead9");
    label(ctx, mapRule?.desc || "Depth routes, side caves, pressure rooms", mapX + 10, mapY + 40, 11, "#8b8173");

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
      const icon = ROOM_TYPES[type]?.icon ?? "";
      label(ctx, `${icon} ${type[0].toUpperCase() + type.slice(1)}`, lx + 12, y + 6, 10, "#a09888");
    });
  }

  function drawLayerBands(ctx, x, y, w, h, yScale, alpha) {
    for (const layer of MAP_LAYERS) {
      const bandY = y + layer.yRange[0] * yScale;
      const bandH = Math.max(2, (layer.yRange[1] - layer.yRange[0]) * yScale);
      ctx.fillStyle = layer.bgTint.replace(/[\d.]+\)$/, `${alpha})`);
      ctx.fillRect(x, bandY, w, bandH);
      if (w > 300) {
        ctx.strokeStyle = "rgba(241,234,217,0.1)";
        ctx.beginPath();
        ctx.moveTo(x, bandY);
        ctx.lineTo(x + w, bandY);
        ctx.stroke();
        label(ctx, layer.name, x + 12, bandY + 16, 10, "#a09888");
      }
    }
  }

  function isRoomExplored(room) {
    const samples = [
      [room.x + room.w / 2, room.y + room.h / 2],
      [room.x + 2, room.y + 2],
      [room.x + room.w - 2, room.y + 2],
      [room.x + 2, room.y + room.h - 2],
      [room.x + room.w - 2, room.y + room.h - 2],
    ];
    return samples.some(([x, y]) => {
      const tx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(x)));
      const ty = Math.max(0, Math.min(WORLD_H - 1, Math.floor(y)));
      return Boolean(explored[ty]?.[tx]);
    });
  }

  function hasExploredNearRoom(room) {
    const minX = Math.max(0, room.x - 8);
    const maxX = Math.min(WORLD_W - 1, room.x + room.w + 8);
    const minY = Math.max(0, room.y - 8);
    const maxY = Math.min(WORLD_H - 1, room.y + room.h + 8);
    for (let y = minY; y <= maxY; y += 4) {
      if (explored[y]?.[minX] || explored[y]?.[maxX]) return true;
    }
    for (let x = minX; x <= maxX; x += 4) {
      if (explored[minY]?.[x] || explored[maxY]?.[x]) return true;
    }
    return false;
  }

  function drawUnknownRoomMarker(ctx, room, mapX, mapY, mScaleX, mScaleY) {
    const cx = mapX + (room.x + room.w / 2) * mScaleX;
    const cy = mapY + (room.y + room.h / 2) * mScaleY;
    const w = Math.max(14, Math.min(24, room.w * mScaleX * 0.5));
    const h = Math.max(10, Math.min(18, room.h * mScaleY * 0.5));
    const hash = Math.abs((room.x * 37 + room.y * 53 + room.w * 11 + room.h * 17) % 5);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#d8cfb8";
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.globalAlpha = 0.36;
    ctx.fillStyle = "#05070b";
    ctx.fillRect(cx - w / 2 - 2, cy - h / 2 - 2, w + 4, 2);
    ctx.fillRect(cx - w / 2 - 2, cy + h / 2, w + 4, 2);
    ctx.fillRect(cx - w / 2 - 2, cy - h / 2, 2, h);
    ctx.fillRect(cx + w / 2, cy - h / 2, 2, h);
    ctx.globalAlpha = 0.62;
    ctx.strokeStyle = "#8b8173";
    ctx.setLineDash([2, 3]);
    ctx.strokeRect(cx - w / 2 - 4, cy - h / 2 - 4, w + 8, h + 8);
    ctx.setLineDash([]);
    ctx.fillStyle = "#f2b84b";
    ctx.fillRect(cx - w / 2 - 6 + hash, cy - h / 2 - 6, 4, 2);
    ctx.fillRect(cx + w / 2 + 2 - hash, cy + h / 2 + 4, 4, 2);
    ctx.fillStyle = "#d8cfb8";
    ctx.fillRect(cx - 1, cy - 5, 4, 2);
    ctx.fillRect(cx + 1, cy - 3, 2, 4);
    ctx.fillRect(cx - 1, cy + 3, 3, 2);
    label(ctx, "?", cx - 3, cy + 5, 12, "#f7f0df");
    ctx.restore();
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
