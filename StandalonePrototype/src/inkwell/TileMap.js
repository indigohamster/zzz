import { TILE, Tile, WORLD_H, WORLD_W } from "../core/config.js";
import { drawTile } from "./TileDrawing.js";
import { createMapValidator } from "./MapValidator.js";
import { generateInkwellWorld } from "./WorldGen.js";

export function createTileMap(ctx) {
  const world = Array.from({ length: WORLD_H }, () => Array(WORLD_W).fill(Tile.Air));
  const tileVariant = Array.from({ length: WORLD_H }, () => Array(WORLD_W).fill(0));
  let rooms = [];

  const validator = createMapValidator();

  function generate() {
    validator.validateWithRetry(api, () => generateInkwellWorld(api));
  }

  function solidAtPixel(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return true;
    return world[ty][tx] !== Tile.Air;
  }

  function tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return Tile.Air;
    return world[ty][tx];
  }

  function variantAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return 0;
    return tileVariant[ty][tx];
  }

  function setTile(tx, ty, tile) {
    if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return false;
    world[ty][tx] = tile;
    return true;
  }

  function setVariant(tx, ty, variant) {
    if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return false;
    tileVariant[ty][tx] = variant;
    return true;
  }

  function setRooms(nextRooms) {
    rooms = nextRooms;
  }

  function getRooms() {
    return rooms;
  }

  function getRoomByType(type) {
    return rooms.find((room) => room.type === type) || null;
  }

  function draw(cameraX, cameraY) {
    const startX = Math.floor(cameraX / TILE);
    const endX = Math.ceil((cameraX + 960) / TILE);
    const startY = Math.floor(cameraY / TILE);
    const endY = Math.ceil((cameraY + 540) / TILE);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const t = tileAt(x, y);
        if (t === Tile.Air) continue;
        drawTile(ctx, api, x, y, Math.floor(x * TILE - cameraX), Math.floor(y * TILE - cameraY));
      }
    }
  }

  const api = { generate, solidAtPixel, tileAt, variantAt, setTile, setVariant, setRooms, getRooms, getRoomByType, draw };
  return api;
}
