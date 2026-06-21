import { TILE } from "../core/config.js?v=27";
import { getLayerThemeByTileY } from "./VisualThemes.js";

export function drawLayerLandmark(ctx, room, cameraX, cameraY, frame = 0) {
  if (!room) return;
  const theme = getLayerThemeByTileY(room.y);
  const cx = Math.floor((room.x + room.w / 2) * TILE - cameraX);
  const cy = Math.floor((room.y + room.h / 2) * TILE - cameraY);
  const pulse = Math.floor(Math.sin(frame * 0.045 + room.x) * 2);

  ctx.save();
  ctx.fillStyle = "rgba(5,7,11,0.46)";
  ctx.fillRect(cx - 20, cy + 18, 40, 6);
  ctx.fillStyle = theme.outline;
  ctx.fillRect(cx - 10, cy - 24 + pulse, 20, 42);
  ctx.fillRect(cx - 18, cy - 12 + pulse, 36, 14);
  ctx.fillStyle = theme.tileMid;
  ctx.fillRect(cx - 6, cy - 20 + pulse, 12, 34);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(cx - 3, cy - 28 + pulse, 6, 6);
  ctx.fillRect(cx - 14, cy - 8 + pulse, 4, 4);
  ctx.fillRect(cx + 10, cy - 8 + pulse, 4, 4);
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.fillRect(cx - 4, cy - 16 + pulse, 2, 26);
  ctx.restore();
}

export function drawLayerLandmarks(ctx, rooms = [], cameraX = 0, cameraY = 0, frame = 0) {
  for (const room of rooms) {
    if (room.type === "entrance" || room.type === "exit" || room.type === "boss") drawLayerLandmark(ctx, room, cameraX, cameraY, frame);
  }
}
