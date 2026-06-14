import { TILE, WORLD_H, WORLD_W } from "../core/config.js";

export function createPhysics(tileMap) {
  function moveEntity(entity) {
    entity.x += entity.vx;
    collideAxis(entity, "x");
    entity.y += entity.vy;
    entity.onGround = false;
    collideAxis(entity, "y");
  }

  function collideAxis(entity, axis) {
    const inset = 0.08;
    const left = entity.x - entity.w / 2 + inset;
    const right = entity.x + entity.w / 2 - inset;
    const top = entity.y - entity.h / 2 + inset;
    const bottom = entity.y + entity.h / 2 - inset;

    for (let py = top; py <= bottom; py += 6) {
      for (let px = left; px <= right; px += 6) {
        if (!tileMap.solidAtPixel(px, py)) continue;
        const tx = Math.floor(px / TILE);
        const ty = Math.floor(py / TILE);
        const tileLeft = tx * TILE;
        const tileRight = tileLeft + TILE;
        const tileTop = ty * TILE;
        const tileBottom = tileTop + TILE;

        if (axis === "x") {
          if (entity.vx > 0) entity.x = tileLeft - entity.w / 2 - 0.01;
          if (entity.vx < 0) entity.x = tileRight + entity.w / 2 + 0.01;
          entity.vx = 0;
        } else {
          if (entity.vy > 0) {
            entity.y = tileTop - entity.h / 2 - 0.01;
            entity.onGround = true;
          }
          if (entity.vy < 0) entity.y = tileBottom + entity.h / 2 + 0.01;
          entity.vy = 0;
        }
        return;
      }
    }
  }

  function probeGround(entity) {
    const y = entity.y + entity.h / 2 + 1;
    return tileMap.solidAtPixel(entity.x - entity.w / 2 + 1, y) || tileMap.solidAtPixel(entity.x + entity.w / 2 - 1, y);
  }

  return { moveEntity, probeGround };
}

export function inWorld(tx, ty) {
  return tx >= 0 && ty >= 0 && tx < WORLD_W && ty < WORLD_H;
}
