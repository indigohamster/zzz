import { Tile, WORLD_H, WORLD_W } from "../core/config.js";
import { hash01, smoothNoise } from "./Noise.js";

const TUNNEL_HALF_HEIGHT = 5;
const VERTICAL_HALF_WIDTH = 9;
const VERTICAL_CLEAR_HALF_WIDTH = 3;

export function generateInkwellWorld(tileMap) {
  clearWorld(tileMap);
  fillDungeonMass(tileMap);
  const rooms = createDungeonRooms();
  carveRooms(tileMap, rooms);
  addRoomDetails(tileMap, rooms);
  reinforceMainRoute(tileMap, rooms);
  connectRooms(tileMap, rooms);
  addInkVeins(tileMap);
  ensureRoomConnections(tileMap, rooms);
  tileMap.setRooms(rooms);
}

function clearWorld(tileMap) {
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      tileMap.setTile(x, y, Tile.Air);
      tileMap.setVariant(x, y, hash01(x, y) > 0.66 ? 2 : hash01(x + 31, y - 17) > 0.45 ? 1 : 0);
    }
  }
}

function fillDungeonMass(tileMap) {
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const deep = y > 86 + Math.sin(x * 0.025) * 10;
      tileMap.setTile(x, y, deep ? Tile.Graphite : Tile.Paper);
    }
  }
}

function createDungeonRooms() {
  const rooms = [];
  const middleTypes = ["combat", "treasure", "resource", "combat", "rift", "combat", "treasure"];
  const middleCount = 11 + Math.floor(Math.random() * 8);
  let x = 24;
  let y = 54 + Math.floor(Math.random() * 30);

  rooms.push(makeRoom("entrance", x, y, 62, 32));
  x += 88;

  for (let i = 0; i < middleCount; i++) {
    const type = middleTypes[Math.floor(Math.random() * middleTypes.length)];
    const w = type === "rift" ? 50 + Math.floor(Math.random() * 22) : type === "treasure" ? 46 + Math.floor(Math.random() * 18) : 62 + Math.floor(Math.random() * 30);
    const h = type === "rift" ? 58 + Math.floor(Math.random() * 28) : 32 + Math.floor(Math.random() * 20);
    y = Math.max(28, Math.min(WORLD_H - h - 18, y + Math.floor(Math.random() * 43) - 21));
    rooms.push(makeRoom(type, x, y, w, h));
    x += w + 28 + Math.floor(Math.random() * 34);
    if (x > WORLD_W - 150) break;
  }

  const bossW = 86 + Math.floor(Math.random() * 34);
  const bossH = 46 + Math.floor(Math.random() * 26);
  y = Math.max(30, Math.min(WORLD_H - bossH - 18, y + Math.floor(Math.random() * 37) - 18));
  rooms.push(makeRoom("boss", Math.min(x, WORLD_W - bossW - 20), y, bossW, bossH));
  return rooms;
}

function makeRoom(type, x, y, w, h) {
  const names = {
    entrance: "Draft Gate",
    combat: "Copied Pose Room",
    treasure: "Supply Sketch",
    resource: "Ink Reservoir",
    rift: "Torn Paper Shaft",
    boss: "Boss Chamber",
  };
  return {
    id: `${type}-${x}-${y}`,
    type,
    name: names[type],
    x,
    y,
    w,
    h,
    hasRewardTriggered: false,
    rewardClaimed: false,
  };
}

function carveRooms(tileMap, rooms) {
  for (const room of rooms) carveRoom(tileMap, room);
}

function carveRoom(tileMap, room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      const border = x === room.x || y === room.y || x === room.x + room.w - 1 || y === room.y + room.h - 1;
      tileMap.setTile(x, y, border ? Tile.Paper : Tile.Air);
    }
  }
  for (let x = room.x + 2; x < room.x + room.w - 2; x++) {
    tileMap.setTile(x, room.y + room.h - 3, Tile.Paper);
    tileMap.setTile(x, room.y + room.h - 2, room.type === "template" ? Tile.Ink : Tile.Graphite);
  }
}

function connectRooms(tileMap, rooms) {
  for (let i = 0; i < rooms.length - 1; i++) {
    carveTunnel(tileMap, rooms[i], rooms[i + 1]);
  }
}

function carveTunnel(tileMap, a, b) {
  const ax = Math.floor(a.x + a.w - 3);
  const bx = Math.floor(b.x + 3);
  const ay = passageY(a);
  const by = passageY(b);
  const turnX = Math.floor((ax + bx) / 2);
  openRoomDoor(tileMap, a, 1);
  openRoomDoor(tileMap, b, -1);
  carveHorizontalTunnel(tileMap, ax, turnX, ay);
  if (Math.abs(ay - by) > 2) carveVerticalTunnel(tileMap, turnX, Math.min(ay, by), Math.max(ay, by));
  carveHorizontalTunnel(tileMap, turnX, bx, by);
}

function carveHorizontalTunnel(tileMap, x1, x2, y) {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    for (let yy = y - TUNNEL_HALF_HEIGHT; yy <= y + TUNNEL_HALF_HEIGHT; yy++) tileMap.setTile(x, yy, Tile.Air);
    tileMap.setTile(x, y + 6, Tile.Paper);
    tileMap.setTile(x, y + 7, Tile.Graphite);
  }
}

function carveVerticalTunnel(tileMap, x, y1, y2) {
  const start = Math.max(1, y1 - TUNNEL_HALF_HEIGHT);
  const end = Math.min(WORLD_H - 2, y2 + TUNNEL_HALF_HEIGHT);
  for (let y = start; y <= end; y++) {
    for (let xx = x - VERTICAL_HALF_WIDTH; xx <= x + VERTICAL_HALF_WIDTH; xx++) tileMap.setTile(xx, y, Tile.Air);
    const localY = y - start;
    if (localY > 7 && localY < end - start - 7 && localY % 6 === 0) {
      const left = Math.floor(localY / 6) % 2 === 0;
      const ledgeStart = left ? x - VERTICAL_HALF_WIDTH : x + VERTICAL_CLEAR_HALF_WIDTH + 1;
      const ledgeEnd = left ? x - VERTICAL_CLEAR_HALF_WIDTH - 1 : x + VERTICAL_HALF_WIDTH;
      for (let xx = ledgeStart; xx <= ledgeEnd; xx++) tileMap.setTile(xx, y, Tile.Paper);
    }
    for (let xx = x - VERTICAL_CLEAR_HALF_WIDTH; xx <= x + VERTICAL_CLEAR_HALF_WIDTH; xx++) tileMap.setTile(xx, y, Tile.Air);
  }
}

function reinforceMainRoute(tileMap, rooms) {
  for (const room of rooms) carveRoomMainPath(tileMap, room);
}

function carveRoomMainPath(tileMap, room) {
  const y = passageY(room);
  for (let x = room.x + 2; x <= room.x + room.w - 3; x++) {
    for (let yy = y - TUNNEL_HALF_HEIGHT; yy <= y + TUNNEL_HALF_HEIGHT; yy++) tileMap.setTile(x, yy, Tile.Air);
    tileMap.setTile(x, y + 6, Tile.Paper);
    tileMap.setTile(x, y + 7, Tile.Graphite);
  }
}

function openRoomDoor(tileMap, room, dir) {
  const y = passageY(room);
  const x = dir > 0 ? room.x + room.w - 1 : room.x;
  for (let xx = x - 3; xx <= x + 3; xx++) {
    for (let yy = y - TUNNEL_HALF_HEIGHT - 1; yy <= y + TUNNEL_HALF_HEIGHT; yy++) tileMap.setTile(xx, yy, Tile.Air);
    tileMap.setTile(xx, y + 6, Tile.Paper);
    tileMap.setTile(xx, y + 7, Tile.Graphite);
  }
}

function passageY(room) {
  return Math.floor(room.y + room.h - 11);
}

function roomPathPoint(room) {
  return { x: Math.floor(room.x + room.w / 2), y: passageY(room) };
}

function ensureRoomConnections(tileMap, rooms) {
  for (let pass = 0; pass < 2; pass++) {
    let repaired = false;
    for (let i = 0; i < rooms.length - 1; i++) {
      if (areRoomsConnected(tileMap, rooms[i], rooms[i + 1])) continue;
      carveRoomMainPath(tileMap, rooms[i]);
      carveRoomMainPath(tileMap, rooms[i + 1]);
      carveTunnel(tileMap, rooms[i], rooms[i + 1]);
      repaired = true;
    }
    if (!repaired) return;
  }
}

function areRoomsConnected(tileMap, a, b) {
  const start = roomPathPoint(a);
  const goal = roomPathPoint(b);
  if (!hasPlayerClearance(tileMap, start.x, start.y) || !hasPlayerClearance(tileMap, goal.x, goal.y)) return false;

  const minX = Math.max(0, Math.min(a.x, b.x) - 24);
  const maxX = Math.min(WORLD_W - 1, Math.max(a.x + a.w, b.x + b.w) + 24);
  const minY = Math.max(0, Math.min(a.y, b.y) - 44);
  const maxY = Math.min(WORLD_H - 1, Math.max(a.y + a.h, b.y + b.h) + 44);
  const width = maxX - minX + 1;
  const visited = new Uint8Array(width * (maxY - minY + 1));
  const queue = [start];
  visited[(start.y - minY) * width + start.x - minX] = 1;

  for (let head = 0; head < queue.length; head++) {
    const point = queue[head];
    if (point.x === goal.x && point.y === goal.y) return true;
    visit(point.x + 1, point.y);
    visit(point.x - 1, point.y);
    visit(point.x, point.y + 1);
    visit(point.x, point.y - 1);
  }
  return false;

  function visit(x, y) {
    if (x < minX || x > maxX || y < minY || y > maxY || !hasPlayerClearance(tileMap, x, y)) return;
    const index = (y - minY) * width + x - minX;
    if (visited[index]) return;
    visited[index] = 1;
    queue.push({ x, y });
  }
}

function hasPlayerClearance(tileMap, x, y) {
  for (let yy = y - 3; yy <= y + 1; yy++) {
    for (let xx = x - 1; xx <= x + 1; xx++) {
      if (tileMap.tileAt(xx, yy) !== Tile.Air) return false;
    }
  }
  return true;
}

function addRoomDetails(tileMap, rooms) {
  for (const room of rooms) {
    if (room.type === "entrance") addEntranceDetails(tileMap, room);
    if (room.type === "combat") addCombatDetails(tileMap, room);
    if (room.type === "treasure") addTreasureDetails(tileMap, room);
    if (room.type === "resource") addResourceDetails(tileMap, room);
    if (room.type === "rift") addRiftDetails(tileMap, room);
    if (room.type === "boss") addBossDetails(tileMap, room);
  }
}

function addEntranceDetails(tileMap, room) {
  for (let x = room.x + 8; x < room.x + room.w - 8; x += 9) tileMap.setTile(x, room.y + room.h - 7, Tile.Paper);
}

function addCombatDetails(tileMap, room) {
  for (let i = 0; i < 3; i++) {
    const y = room.y + 12 + i * 6;
    for (let x = room.x + 10 + i * 8; x < room.x + room.w - 10; x += 2) tileMap.setTile(x, y, Tile.Paper);
  }
}

function addTreasureDetails(tileMap, room) {
  for (let i = 0; i < 10; i++) {
    const x = room.x + 8 + Math.floor(hash01(i + room.x, room.y + 3) * (room.w - 16));
    const y = room.y + 8 + Math.floor(hash01(i + room.y, room.x + 7) * (room.h - 14));
    tileMap.setTile(x, y, Tile.Ink);
    if (hash01(i + room.x, 11) > 0.45) tileMap.setTile(x + 1, y, Tile.Ink);
    if (hash01(i + room.y, 13) > 0.55) tileMap.setTile(x, y + 1, Tile.Ink);
  }
}

function addResourceDetails(tileMap, room) {
  for (let i = 0; i < 22; i++) {
    const x = room.x + 7 + Math.floor(hash01(i + room.x, 3) * (room.w - 14));
    const y = room.y + 7 + Math.floor(hash01(i + room.y, 7) * (room.h - 12));
    tileMap.setTile(x, y, Tile.Ink);
    if (hash01(i, room.x) > 0.5) tileMap.setTile(x + 1, y, Tile.Ink);
  }
}

function addRiftDetails(tileMap, room) {
  for (let y = room.y + 5; y < room.y + room.h - 8; y += 8) {
    const start = room.x + 6 + Math.floor(hash01(y, room.x) * 16);
    for (let x = start; x < start + 14; x++) tileMap.setTile(x, y, Tile.Paper);
  }
  for (let y = room.y + 3; y < room.y + room.h - 4; y++) tileMap.setTile(room.x + Math.floor(room.w / 2), y, y % 3 === 0 ? Tile.Ink : Tile.Air);
}

function addBossDetails(tileMap, room) {
  for (let y = room.y + 5; y < room.y + room.h - 5; y += 6) {
    for (let x = room.x + 5; x < room.x + room.w - 5; x += 6) {
      tileMap.setTile(x, y, Tile.Ink);
      tileMap.setTile(x + 1, y, Tile.Ink);
      tileMap.setTile(x, y + 1, Tile.Ink);
      tileMap.setTile(x + 1, y + 1, Tile.Ink);
    }
  }
}

function buildSurface(tileMap) {
  for (let x = 0; x < WORLD_W; x++) {
    const surface = Math.floor(
        64 +
        Math.sin(x * 0.065) * 7.2 +
        Math.sin(x * 0.0205) * 12.4 +
        (hash01(x, 9) - 0.5) * 2.6
    );
    const paperDepth = 10 + Math.floor(hash01(x, 21) * 12);
    for (let y = surface; y < WORLD_H; y++) tileMap.setTile(x, y, y - surface > paperDepth ? Tile.Graphite : Tile.Paper);
  }
}

function carveCaves(tileMap) {
  for (let y = 60; y < WORLD_H - 8; y++) {
    for (let x = 3; x < WORLD_W - 3; x++) {
      if (tileMap.tileAt(x, y) === Tile.Air) continue;
      const large = smoothNoise(x * 0.0325, y * 0.055);
      const small = smoothNoise(x * 0.09 + 40, y * 0.1 - 12);
      const depthBias = Math.min(0.14, Math.max(0, (y - 68) * 0.003));
      if (large + small * 0.35 + depthBias > 0.82) tileMap.setTile(x, y, Tile.Air);
    }
  }
}

function addInkVeins(tileMap) {
  const veinCount = Math.max(14, Math.floor(WORLD_W / 34));
  for (let i = 0; i < veinCount; i++) {
    let x = 36 + Math.floor(hash01(i * 9, 4) * (WORLD_W - 72));
    let y = 76 + Math.floor(hash01(i * 13, 8) * Math.max(44, WORLD_H - 128));
    const length = 20 + Math.floor(hash01(i, 99) * 36);
    for (let step = 0; step < length; step++) {
      const radius = 2 + Math.floor(hash01(i * 7, step) * 3);
      for (let yy = y - radius; yy <= y + radius; yy++) {
        for (let xx = x - radius; xx <= x + radius; xx++) {
          if (xx <= 1 || yy <= 1 || xx >= WORLD_W - 1 || yy >= WORLD_H - 1) continue;
          if (tileMap.tileAt(xx, yy) !== Tile.Air && Math.hypot(xx - x, yy - y) <= radius + 0.25) tileMap.setTile(xx, yy, Tile.Ink);
        }
      }
      x += Math.floor(hash01(i, step * 3) * 3) - 1;
      y += Math.floor(hash01(i + 5, step * 2) * 3) - 1;
    }
  }
}

function addPocketDetail(tileMap) {
  for (let y = 1; y < WORLD_H - 1; y++) {
    for (let x = 1; x < WORLD_W - 1; x++) {
      if (tileMap.tileAt(x, y) === Tile.Air) continue;
      const exposed =
        tileMap.tileAt(x, y - 1) === Tile.Air ||
        tileMap.tileAt(x, y + 1) === Tile.Air ||
        tileMap.tileAt(x - 1, y) === Tile.Air ||
        tileMap.tileAt(x + 1, y) === Tile.Air;
      if (exposed && tileMap.tileAt(x, y) === Tile.Graphite && hash01(x * 2, y * 2) > 0.86) tileMap.setTile(x, y, Tile.Paper);
    }
  }
}

function carveSmallPockets(tileMap) {
  for (let i = 0; i < 10; i++) {
    const cx = 32 + Math.floor(Math.random() * (WORLD_W - 64));
    const cy = 68 + Math.floor(Math.random() * 44);
    const r = 4 + Math.floor(Math.random() * 8);
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (x <= 0 || y <= 0 || x >= WORLD_W || y >= WORLD_H) continue;
        if (Math.hypot(x - cx, y - cy) < r + hash01(x * 3 + i, y * 5) * 0.7) tileMap.setTile(x, y, Tile.Air);
      }
    }
  }
}

function flattenSpawn(tileMap) {
  for (let x = 36; x <= 84; x++) {
    for (let y = 62; y < WORLD_H; y++) tileMap.setTile(x, y, y > 78 ? Tile.Graphite : Tile.Paper);
    for (let y = 0; y < 62; y++) tileMap.setTile(x, y, Tile.Air);
  }
}
