import { Tile, WORLD_H, WORLD_W } from "../core/config.js?v=27";

// ── 玩家 clearance（与 WorldGen.js hasPlayerClearance 一致）─────────
function hasPlayerClearance(tileMap, x, y) {
  for (let yy = y - 3; yy <= y + 1; yy++) {
    for (let xx = x - 1; xx <= x + 1; xx++) {
      if (tileMap.tileAt(xx, yy) !== Tile.Air) return false;
    }
  }
  return true;
}

// ── BFS 移动（1 格步进 + 跳跃/下落模拟）─────────────────────────────
const BFS_MOVES = [
  [0, -1], [1, -1], [-1, -1],
  [0, 1],  [1, 1],  [-1, 1],
  [1, 0],  [-1, 0],
  [0, -2], [1, -2], [-1, -2],
  [0, -3], [1, -3], [-1, -3],
  [0, 2],  [1, 2],  [-1, 2],
  [0, 3],  [1, 3],  [-1, 3],
];

function bfsReachable(tileMap, sx, sy, gx, gy, margin) {
  if (!hasPlayerClearance(tileMap, sx, sy)) return false;
  if (!hasPlayerClearance(tileMap, gx, gy)) return false;

  const minX = Math.max(0, Math.min(sx, gx) - margin);
  const maxX = Math.min(WORLD_W - 1, Math.max(sx, gx) + margin);
  const minY = Math.max(0, Math.min(sy, gy) - margin);
  const maxY = Math.min(WORLD_H - 1, Math.max(sy, gy) + margin);
  const width = maxX - minX + 1;
  const visited = new Uint8Array(width * (maxY - minY + 1));
  const queue = [{ x: sx, y: sy }];
  visited[(sy - minY) * width + (sx - minX)] = 1;

  for (let head = 0; head < queue.length; head++) {
    const p = queue[head];
    if (p.x === gx && p.y === gy) return true;

    for (const [dx, dy] of BFS_MOVES) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (nx < minX || nx > maxX || ny < minY || ny > maxY) continue;
      const idx = (ny - minY) * width + (nx - minX);
      if (visited[idx]) continue;
      if (!hasPlayerClearance(tileMap, nx, ny)) continue;
      visited[idx] = 1;
      queue.push({ x: nx, y: ny });
    }
  }
  return false;
}

function adjacentReachable(tileMap, a, b) {
  const sx = Math.floor(a.x + a.w / 2);
  const sy = Math.floor(a.y + a.h - 6);
  const gx = Math.floor(b.x + b.w / 2);
  const gy = Math.floor(b.y + b.h - 6);
  return bfsReachable(tileMap, sx, sy, gx, gy, 48);
}

// ── 保底地图 ───────────────────────────────────────────────────────
function generateFallbackMap(tileMap) {
  tileMap.setMapRule?.({
    id: "fallback_corridor",
    name: "保底横廊",
    shortName: "保底",
    desc: "生成器重试失败后的可达横向保底图。",
  });
  for (let y = 0; y < WORLD_H; y++)
    for (let x = 0; x < WORLD_W; x++)
      tileMap.setTile(x, y, Tile.Air);

  const floorY = Math.floor(WORLD_H * 0.62);

  for (let x = 0; x < WORLD_W; x++) {
    for (let y = floorY; y < WORLD_H; y++)
      tileMap.setTile(x, y, y < floorY + 7 ? Tile.Paper : Tile.Graphite);
  }

  const rooms = [
    { id: "entrance-fb", type: "entrance", name: "Draft Gate",
      x: 18, y: floorY - 34, w: 54, h: 34, hasRewardTriggered: false, rewardClaimed: false },
    { id: "combat-fb",    type: "combat",    name: "Copied Pose Room",
      x: 280, y: floorY - 34, w: 64, h: 34, hasRewardTriggered: false, rewardClaimed: false },
    { id: "boss-fb",      type: "boss",      name: "Boss Chamber",
      x: 620, y: floorY - 40, w: 78, h: 40, hasRewardTriggered: false, rewardClaimed: false },
  ];

  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.h; y++)
      for (let x = room.x; x < room.x + room.w; x++)
        tileMap.setTile(x, y, Tile.Air);
    for (let x = room.x + 2; x < room.x + room.w - 2; x++) {
      tileMap.setTile(x, room.y + room.h - 3, Tile.Paper);
      tileMap.setTile(x, room.y + room.h - 2, Tile.Graphite);
    }
  }

  const tunnelTop = floorY - 5;
  for (let pass = 0; pass < rooms.length - 1; pass++) {
    const a = rooms[pass];
    const b = rooms[pass + 1];
    for (let x = a.x + a.w; x < b.x; x++) {
      for (let y = tunnelTop; y <= floorY + 7; y++)
        tileMap.setTile(x, y, Tile.Air);
      tileMap.setTile(x, floorY + 6, Tile.Paper);
      tileMap.setTile(x, floorY + 7, Tile.Graphite);
    }
  }

  tileMap.setRooms(rooms);
}

// ── 公开 API ───────────────────────────────────────────────────────
const MAX_RETRIES = 20;

export function createMapValidator() {
  let retryCount = 0;

  function validate(tileMap) {
    const rooms = tileMap.getRooms();
    const entrance = rooms.find((r) => r.type === "entrance");

    if (!entrance || rooms.length < 2) {
      console.log("[MapValidator] reachable=false retry=" + retryCount);
      return false;
    }

    // 检查出生点是否被堵
    const sx = Math.floor(entrance.x + entrance.w / 2);
    const sy = Math.floor(entrance.y + entrance.h - 6);
    if (!hasPlayerClearance(tileMap, sx, sy)) {
      console.log("[MapValidator] reachable=false retry=" + retryCount);
      return false;
    }

    // 逐对检查房间连通性
    for (let i = 0; i < rooms.length - 1; i++) {
      if (!adjacentReachable(tileMap, rooms[i], rooms[i + 1])) {
        console.log("[MapValidator] reachable=false retry=" + retryCount);
        return false;
      }
    }

    console.log("[MapValidator] reachable=true");
    return true;
  }

  function validateWithRetry(tileMap, regenerateFn) {
    retryCount = 0;

    for (let i = 0; i < MAX_RETRIES; i++) {
      retryCount = i;
      regenerateFn();
      if (validate(tileMap)) return true;
    }

    console.log("[MapValidator] fallback used");
    generateFallbackMap(tileMap);
    retryCount = MAX_RETRIES;
    validate(tileMap); // fallback 保证可达，此处必定输出 reachable=true
    return true;
  }

  return { validateWithRetry };
}
