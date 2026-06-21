import { Tile, WORLD_H, WORLD_W } from "../core/config.js?v=27";
import { TUNING } from "../core/TuningConfig.js?v=3";
import { MAP_LAYERS, ROOM_TYPES, rollRoomTypes } from "./MapLayers.js?v=4";
import { hash01, smoothNoise } from "./Noise.js";

const TUNNEL_HALF_HEIGHT = 5;
const VERTICAL_HALF_WIDTH = 9;
const VERTICAL_CLEAR_HALF_WIDTH = 3;
const SHAFT_BASE_X = Math.floor(WORLD_W / 2);
const DEFAULT_MAP_RULE_ID = TUNING.mapGeneration.defaultRuleId ?? "ink_spine";

const MAP_GENERATION_RULES = [
  {
    id: "blue_hole_descent",
    name: "Blue-Hole Descent",
    shortName: "Blue Hole",
    desc: "A broad vertical dive route with readable depth bands, reef shelves, and side caves.",
    roomBonus: 1,
    laneScale: 0.78,
    waveAmp: 0.72,
    openWaterWidth: 34,
    sidePocketEvery: 22,
    ledgeEvery: 15,
    loopChance: 0.58,
    shortcutBonus: 0.16,
    reefCaves: 1.1,
    bias: "dive",
  },
  {
    id: "coral_labyrinth",
    name: "Coral Labyrinth",
    shortName: "Coral Maze",
    desc: "A wider reef maze with more side caves, optional loops, and hidden resource pockets.",
    roomBonus: 2,
    laneScale: 1.05,
    waveAmp: 0.95,
    openWaterWidth: 30,
    sidePocketEvery: 18,
    ledgeEvery: 13,
    loopChance: 0.72,
    shortcutBonus: 0.24,
    reefCaves: 1.55,
    roomScatter: 44,
    bias: "explore",
  },
  {
    id: "thermal_split",
    name: "Thermal Split",
    shortName: "Thermal",
    desc: "Two descent currents split and reconnect, creating route choices and return loops.",
    roomBonus: 1,
    laneScale: 0.72,
    waveAmp: 0.82,
    openWaterWidth: 25,
    sidePocketEvery: 20,
    ledgeEvery: 15,
    loopChance: 0.66,
    shortcutBonus: 0.18,
    twinShafts: true,
    crosslinkEvery: 36,
    reefCaves: 0.95,
    bias: "split",
  },
  {
    id: "pressure_drop",
    name: "Pressure Drop",
    shortName: "Drop",
    desc: "A steep risky descent with fewer safe shelves and more pressure side rooms.",
    roomBonus: 0,
    laneScale: 0.62,
    waveAmp: 0.48,
    openWaterWidth: 24,
    sidePocketEvery: 27,
    ledgeEvery: 23,
    loopChance: 0.36,
    shortcutBonus: 0.06,
    reefCaves: 0.65,
    bias: "danger",
  },
  {
    id: "ink_spine",
    name: "墨脊下潜",
    shortName: "墨脊",
    desc: "一条弯曲主竖井串起左右房间，路线稳定但仍有少量岔洞。",
    roomBonus: 0,
    laneScale: 1,
    waveAmp: 1,
    sidePocketEvery: 37,
    ledgeEvery: 20,
    loopChance: 0.42,
    shortcutBonus: 0,
    bias: "balanced",
  },
  {
    id: "split_current",
    name: "双流裂谷",
    shortName: "双流",
    desc: "左右两条下潜流交替出现，横向穿梭和随机传送后的迷路感更强。",
    roomBonus: 1,
    laneScale: 0.55,
    waveAmp: 0.78,
    sidePocketEvery: 29,
    ledgeEvery: 18,
    loopChance: 0.56,
    shortcutBonus: 0.1,
    twinShafts: true,
    crosslinkEvery: 44,
    bias: "split",
  },
  {
    id: "reef_maze",
    name: "碎礁群洞",
    shortName: "碎礁",
    desc: "房间更分散，支路和侧袋更多，适合找资源但更容易绕路。",
    roomBonus: 2,
    laneScale: 1.28,
    waveAmp: 1.22,
    sidePocketEvery: 24,
    ledgeEvery: 16,
    loopChance: 0.64,
    shortcutBonus: 0.18,
    roomScatter: 72,
    bias: "explore",
  },
  {
    id: "collapsed_chute",
    name: "塌陷墨井",
    shortName: "塌井",
    desc: "主路更陡，危险房和裂口更多，适合短时间高风险下潜。",
    roomBonus: 0,
    laneScale: 0.72,
    waveAmp: 0.55,
    sidePocketEvery: 19,
    ledgeEvery: 28,
    loopChance: 0.31,
    shortcutBonus: 0.04,
    bias: "danger",
  },
];

export function generateInkwellWorld(tileMap) {
  const mapRule = pickMapRule();
  tileMap.setMapRule?.(mapRule);
  clearWorld(tileMap);
  fillDungeonMass(tileMap, mapRule);
  carveDiveWaterRoutes(tileMap, mapRule);
  const rooms = createLayeredRooms(mapRule);
  carveRooms(tileMap, rooms);
  addRoomDetails(tileMap, rooms);
  reinforceMainRoute(tileMap, rooms);
  connectLayeredRooms(tileMap, rooms, mapRule);
  addInkVeins(tileMap);
  ensureRoomConnections(tileMap, rooms);
  clearRoomValidationPoints(tileMap, rooms);
  tileMap.setRooms(rooms);
}

export function listMapGenerationRules() {
  return MAP_GENERATION_RULES.map((rule) => ({ ...rule }));
}

function pickMapRule() {
  const weights = TUNING.mapGeneration.ruleWeights ?? {};
  const weightedRules = MAP_GENERATION_RULES
    .map((rule) => ({ rule, weight: Math.max(0, weights[rule.id] ?? 1) }))
    .filter((entry) => entry.weight > 0);
  const pool = weightedRules.length > 0 ? weightedRules : MAP_GENERATION_RULES.map((rule) => ({ rule, weight: 1 }));
  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;
  let rule = pool[0]?.rule ?? MAP_GENERATION_RULES[0];
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) {
      rule = entry.rule;
      break;
    }
  }
  return { ...rule };
}

function clearWorld(tileMap) {
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      tileMap.setTile(x, y, Tile.Air);
      tileMap.setVariant(x, y, hash01(x, y) > 0.66 ? 2 : hash01(x + 31, y - 17) > 0.45 ? 1 : 0);
    }
  }
}

function fillDungeonMass(tileMap, mapRule) {
  const wave = mapRule.waveAmp ?? 1;
  const middleStart = MAP_LAYERS.find((layer) => layer.id === "middle")?.yRange[0] ?? 135;
  const deepStart = MAP_LAYERS.find((layer) => layer.id === "deep")?.yRange[0] ?? 260;
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const middle = y > middleStart - 8 + Math.sin(x * 0.025) * 10 * wave;
      const deep = y > deepStart - 10 + Math.sin(x * 0.018 + 2) * 14 * wave;
      tileMap.setTile(x, y, deep ? Tile.Ink : middle ? Tile.Graphite : Tile.Paper);
    }
  }
}

function carveDiveWaterRoutes(tileMap, mapRule) {
  const lanes = mapRule.twinShafts ? [0, 1] : [0];
  const top = 22;
  const bottom = WORLD_H - 18;
  for (let y = top; y <= bottom; y++) {
    for (const lane of lanes) {
      const center = routeXAt(y, mapRule, lane);
      const halfWidth = getDiveRouteHalfWidth(mapRule, y, lane);
      carveDiveColumnAt(tileMap, center, y, halfWidth);
      if (y > top + 10 && y % (mapRule.ledgeEvery ?? 15) === 0) addDiveShaftLedge(tileMap, center, y, halfWidth);
      if (y > top + 18 && y % (mapRule.sidePocketEvery ?? 22) === 0) {
        const dir = hash01(y + lane * 31, center) > 0.5 ? 1 : -1;
        carveSidePocket(tileMap, center, y, dir, mapRule);
      }
    }
  }
  addReefCaves(tileMap, mapRule);
}

function carveDiveColumnAt(tileMap, center, y, halfWidth) {
  const wobble = smoothNoise(center * 0.011, y * 0.05) * 0.18;
  for (let xx = center - halfWidth; xx <= center + halfWidth; xx++) {
    const edge = Math.abs(xx - center) / Math.max(1, halfWidth);
    const edgeNoise = smoothNoise(xx * 0.045 + 3, y * 0.035 - 7);
    if (edge < 0.66 + wobble || edgeNoise > 0.72 + edge * 0.18) tileMap.setTile(xx, y, Tile.Air);
  }
  for (let xx = center - 3; xx <= center + 3; xx++) tileMap.setTile(xx, y, Tile.Air);
}

function getDiveRouteHalfWidth(mapRule, y, lane = 0) {
  const base = mapRule.openWaterWidth ?? 30;
  const pulse = Math.sin(y * 0.041 + lane * 1.7) * 5 + Math.sin(y * 0.013 + lane) * 7;
  const noise = (smoothNoise(y * 0.02, lane * 11.3) - 0.5) * 9;
  const depthNarrowing = y > WORLD_H * 0.72 ? -4 : 0;
  return Math.max(18, Math.floor(base + pulse + noise + depthNarrowing));
}

function addReefCaves(tileMap, mapRule) {
  const caveScale = mapRule.reefCaves ?? 1;
  const caveCount = Math.max(10, Math.floor((WORLD_H / 38) * caveScale));
  for (let i = 0; i < caveCount; i++) {
    const y = 42 + Math.floor(hash01(i * 13, 71) * (WORLD_H - 92));
    const lane = mapRule.twinShafts && hash01(i, 19) > 0.5 ? 1 : 0;
    const routeX = routeXAt(y, mapRule, lane);
    const dir = hash01(i * 7, y) > 0.5 ? 1 : -1;
    const cx = Math.max(28, Math.min(WORLD_W - 28, routeX + dir * (44 + Math.floor(hash01(i, y) * 118))));
    const cy = y + Math.floor((hash01(y, i) - 0.5) * 24);
    const rx = 16 + Math.floor(hash01(i + 3, y + 5) * 32);
    const ry = 8 + Math.floor(hash01(i + 11, y + 17) * 18);
    carveOrganicCave(tileMap, cx, cy, rx, ry);
    carveHorizontalTunnel(tileMap, routeX, cx - dir * Math.floor(rx * 0.55), cy);
  }
}

function carveOrganicCave(tileMap, cx, cy, rx, ry) {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      if (x <= 2 || y <= 2 || x >= WORLD_W - 2 || y >= WORLD_H - 2) continue;
      const nx = (x - cx) / Math.max(1, rx);
      const ny = (y - cy) / Math.max(1, ry);
      const edge = nx * nx + ny * ny;
      const noise = smoothNoise(x * 0.09 + cx, y * 0.07 - cy);
      if (edge < 0.86 + noise * 0.34) tileMap.setTile(x, y, Tile.Air);
    }
  }
  const shelfY = cy + Math.floor(ry * 0.52);
  for (let x = cx - Math.floor(rx * 0.7); x <= cx + Math.floor(rx * 0.7); x++) {
    if (hash01(x, shelfY) < 0.16) continue;
    tileMap.setTile(x, shelfY, Tile.Paper);
    if (shelfY + 1 < WORLD_H) tileMap.setTile(x, shelfY + 1, Tile.Graphite);
  }
  for (let x = cx - 3; x <= cx + 3; x++) {
    for (let y = cy - 3; y <= cy + 2; y++) tileMap.setTile(x, y, Tile.Air);
  }
}

function createLayeredRooms(mapRule) {
  const rooms = [];
  const worldWidth = WORLD_W;
  const margin = 20;

  // === ENTRANCE: top-center ===
  const entX = Math.floor(worldWidth / 2 - 30);
  rooms.push(makeRoom("entrance", entX, 6, 60, 22));
  rooms.push(makeRoom("exit", entX + 45, 5, 16, 14));

  // === Build dive layers ===
  MAP_LAYERS.forEach((layer, layerIndex) => {
    const [yMin, yMax] = layer.yRange;
    const extraRooms = TUNING.mapGeneration.extraRoomsPerLayer ?? 0;
    const roomCount = layer.minRooms + 1 + extraRooms + (mapRule.roomBonus ?? 0) + Math.floor(Math.random() * (layer.maxRooms - layer.minRooms + 1));
    const types = buildDiveRoomTypes(layer, roomCount, layerIndex, mapRule);
    const verticalSpacing = (yMax - yMin) / (roomCount + 1);
    const laneOffsets = layerIndex === 0
      ? [-180, 160, -330, 320, -70, 70]
      : layerIndex === 1
        ? [220, -230, 380, -390, 95, -110]
        : [-250, 260, -430, 430, 120, -120];

    for (let i = 0; i < roomCount; i++) {
      const type = types[i];
      const routeLane = mapRule.twinShafts ? (i + layerIndex) % 2 : 0;
      const w = type === "danger" ? 42 + Math.floor(Math.random() * 18)
              : type === "event"  ? 36 + Math.floor(Math.random() * 16)
              : type === "shop"   ? 30 + Math.floor(Math.random() * 12)
              : type === "rift"   ? 38 + Math.floor(Math.random() * 16)
              : type === "explore" ? 54 + Math.floor(Math.random() * 28)
              : 44 + Math.floor(Math.random() * 24);
      const h = type === "danger" ? 28 + Math.floor(Math.random() * 14)
              : type === "event"  ? 22 + Math.floor(Math.random() * 12)
              : type === "rift"   ? 36 + Math.floor(Math.random() * 14)
              : type === "explore" ? 30 + Math.floor(Math.random() * 16)
              : 20 + Math.floor(Math.random() * 14);

      const ry = Math.floor(yMin + verticalSpacing * (i + 1) - h / 2 + (Math.random() - 0.5) * 10);
      const shaftX = routeXAt(ry, mapRule, routeLane);
      const offset = laneOffsets[i % laneOffsets.length] * (mapRule.laneScale ?? 1) + (Math.random() - 0.5) * (54 + (mapRule.roomScatter ?? 0));
      const centerBias = type === "shop" || type === "event" ? 0.45 : type === "danger" || type === "rift" ? 1.08 : 0.9;
      const rx = Math.floor(shaftX + offset * centerBias - w / 2);
      rooms.push(makeRoom(type, Math.max(4, Math.min(worldWidth - w - 4, rx)), Math.max(yMin, Math.min(yMax - h, ry)), w, h, layer, layerIndex, i, {
        mapRuleId: mapRule.id,
        mapRuleName: mapRule.name,
        routeLane,
        routeHint: mapRule.twinShafts ? (routeLane === 0 ? "main" : "branch") : i % 2 === 0 ? "main" : "branch",
      }));
    }
  });

  // === BOSS: bottom ===
  const bossW = 72 + Math.floor(Math.random() * 30);
  const bossH = 40 + Math.floor(Math.random() * 20);
  const bossX = Math.floor(worldWidth / 2 - bossW / 2);
  rooms.push(makeRoom("boss", Math.max(10, bossX), WORLD_H - bossH - 12, bossW, bossH, MAP_LAYERS[MAP_LAYERS.length - 1], MAP_LAYERS.length, 0, {
    mapRuleId: mapRule.id,
    mapRuleName: mapRule.name,
  }));

  return rooms;
}

function buildDiveRoomTypes(layer, count, layerIndex, mapRule) {
  const rolled = rollRoomTypes(layer, count);
  const required = layerIndex === 0
    ? ["explore", "resource", "shop"]
    : layerIndex === 1
      ? ["combat", "treasure", "danger"]
      : ["danger", "combat", "rift"];
  for (let i = 0; i < Math.min(required.length, count); i++) rolled[i] = required[i];
  applyMapRuleRoomBias(rolled, layerIndex, mapRule);
  return rolled;
}

function applyMapRuleRoomBias(types, layerIndex, mapRule) {
  if (!mapRule || types.length === 0) return;
  if (mapRule.bias === "danger" && layerIndex >= 1) {
    types[Math.max(0, types.length - 1)] = "danger";
    if (layerIndex >= 2 && types.length > 2) types[1] = "rift";
  }
  if (mapRule.bias === "explore") {
    types[Math.max(0, types.length - 1)] = layerIndex === 0 ? "treasure" : "resource";
    if (layerIndex === 1 && types.length > 3) types[2] = "event";
  }
  if (mapRule.bias === "split" && layerIndex >= 1 && types.length > 3) {
    types[types.length - 2] = layerIndex === 1 ? "event" : "rift";
  }
}

function connectLayeredRooms(tileMap, rooms, mapRule) {
  const entrance = rooms.find(r => r.type === "entrance");
  const boss = rooms.find(r => r.type === "boss");

  if (entrance) {
    // Winding descent spine: reads like a dive route rather than a straight elevator.
    const lanes = mapRule.twinShafts ? [0, 1] : [0];
    for (const lane of lanes) {
      for (let y = entrance.y + entrance.h; y < WORLD_H - 16; y++) {
        const shaftX = routeXAt(y, mapRule, lane);
        const shaftW = getDiveRouteHalfWidth(mapRule, y, lane);
        for (let xx = shaftX - shaftW; xx <= shaftX + shaftW; xx++) {
          tileMap.setTile(xx, y, Tile.Air);
        }
        if (y % (mapRule.ledgeEvery ?? 20) === 0) addDiveShaftLedge(tileMap, shaftX, y, shaftW);
        if (y % (mapRule.sidePocketEvery ?? 37) === 0) carveSidePocket(tileMap, shaftX, y, hash01(y, 3 + lane) > 0.5 ? 1 : -1, mapRule);
      }
    }
    if (mapRule.twinShafts) {
      for (let y = entrance.y + entrance.h + 18; y < WORLD_H - 28; y += mapRule.crosslinkEvery ?? 44) {
        carveHorizontalTunnel(tileMap, routeXAt(y, mapRule, 0), routeXAt(y, mapRule, 1), y);
      }
    }
  }

  for (const room of rooms) {
    if (room.type === "entrance" || room.type === "exit") continue;
    const ry = Math.floor(room.y + room.h / 2);
    const shaftX = routeXAt(ry, mapRule, room.routeLane ?? 0);

    if (room.x > shaftX) {
      carveHorizontalTunnel(tileMap, shaftX, room.x - 2, ry);
    } else {
      carveHorizontalTunnel(tileMap, room.x + room.w + 2, shaftX, ry);
    }

    // Open room door on the shaft side
    const doorX = room.x > shaftX ? room.x : room.x + room.w - 1;
    for (let yy = ry - 5; yy <= ry + 5; yy++) {
      for (let xx = doorX - 2; xx <= doorX + 2; xx++) {
        tileMap.setTile(xx, yy, Tile.Air);
      }
    }
  }

  if (boss && entrance) {
    const by = Math.floor(boss.y + boss.h / 2);
    const lanes = mapRule.twinShafts ? [0, 1] : [0];
    for (const lane of lanes) {
      const shaftX = routeXAt(by, mapRule, lane);
      for (let y = by - 3; y < boss.y + boss.h; y++) {
        for (let xx = shaftX - 5; xx <= shaftX + 5; xx++) {
          if (tileMap.tileAt(xx, y) !== Tile.Air) tileMap.setTile(xx, y, Tile.Air);
        }
      }
      carveHorizontalTunnel(tileMap, shaftX, boss.x + Math.floor(boss.w / 2), by);
    }
    // Boss door
    for (let yy = by - 3; yy <= by + 3; yy++) {
      for (let xx = boss.x - 2; xx <= boss.x + 2; xx++) {
        tileMap.setTile(xx, yy, Tile.Air);
      }
    }
  }

  connectLayerLoops(tileMap, rooms, mapRule);
  addLayerShortcuts(tileMap, rooms, mapRule);
}

function makeRoom(type, x, y, w, h, layer = null, layerIndex = 0, order = 0, meta = {}) {
  const names = {
    entrance: "Draft Gate",
    combat: "Copied Pose Room",
    treasure: "Supply Sketch",
    resource: "Ink Reservoir",
    rift: "Torn Paper Shaft",
    boss: "Boss Chamber",
    danger: "Pressure Tear",
    event: "Forgotten Draft",
    shop: "Inkdot's Nook",
    explore: "Open Page",
    exit: "Return Portal",
  };
  return {
    id: `${type}-${x}-${y}`,
    type,
    name: ROOM_TYPES[type]?.name ?? names[type] ?? type,
    x,
    y,
    w,
    h,
    layerId: layer?.id ?? null,
    layerName: layer?.name ?? "",
    depthRank: layerIndex,
    routeHint: meta.routeHint ?? (order % 2 === 0 ? "main" : "branch"),
    routeLane: meta.routeLane ?? 0,
    mapRuleId: meta.mapRuleId ?? DEFAULT_MAP_RULE_ID,
    mapRuleName: meta.mapRuleName ?? "墨脊下潜",
    riskTier: getRoomRisk(type, layerIndex),
    hasRewardTriggered: false,
    rewardClaimed: false,
  };
}

function getRoomRisk(type, layerIndex) {
  if (type === "boss") return 4;
  if (type === "danger" || type === "rift") return Math.min(4, 2 + layerIndex);
  if (type === "combat") return Math.min(3, 1 + layerIndex);
  if (type === "treasure" || type === "resource") return Math.max(1, layerIndex);
  return layerIndex;
}

function carveRooms(tileMap, rooms) {
  for (const room of rooms) carveRoom(tileMap, room);
}

function carveRoom(tileMap, room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      const border = x === room.x || y === room.y || x === room.x + room.w - 1 || y === room.y + room.h - 1;
      tileMap.setTile(x, y, border ? roomBorderTile(room) : Tile.Air);
    }
  }
  for (let x = room.x + 2; x < room.x + room.w - 2; x++) {
    tileMap.setTile(x, room.y + room.h - 3, Tile.Paper);
    tileMap.setTile(x, room.y + room.h - 2, room.depthRank >= 2 || room.type === "danger" ? Tile.Ink : Tile.Graphite);
  }
}

function roomBorderTile(room) {
  if (room.depthRank >= 2 || room.type === "danger" || room.type === "boss") return Tile.Ink;
  if (room.depthRank === 1) return Tile.Graphite;
  return Tile.Paper;
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

function clearRoomValidationPoints(tileMap, rooms) {
  for (const room of rooms) {
    const x = Math.floor(room.x + room.w / 2);
    const y = Math.floor(room.y + room.h - 6);
    clearPlayerClearance(tileMap, x, y);
  }
}

function clearPlayerClearance(tileMap, x, y) {
  for (let yy = y - 3; yy <= y + 1; yy++) {
    for (let xx = x - 1; xx <= x + 1; xx++) tileMap.setTile(xx, yy, Tile.Air);
  }
}

function addRoomDetails(tileMap, rooms) {
  for (const room of rooms) {
    if (room.type === "entrance") addEntranceDetails(tileMap, room);
    if (room.type === "combat") addCombatDetails(tileMap, room);
    if (room.type === "treasure") addTreasureDetails(tileMap, room);
    if (room.type === "resource") addResourceDetails(tileMap, room);
    if (room.type === "rift") addRiftDetails(tileMap, room);
    if (room.type === "danger") addDangerDetails(tileMap, room);
    if (room.type === "explore") addExploreDetails(tileMap, room);
    if (room.type === "shop") addShopDetails(tileMap, room);
    if (room.type === "event") addEventDetails(tileMap, room);
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

function addDangerDetails(tileMap, room) {
  for (let y = room.y + 5; y < room.y + room.h - 6; y += 5) {
    const start = room.x + 5 + Math.floor(hash01(room.x, y) * Math.max(4, room.w - 16));
    for (let x = start; x < Math.min(room.x + room.w - 4, start + 8); x++) tileMap.setTile(x, y, Tile.Ink);
  }
}

function addExploreDetails(tileMap, room) {
  for (let x = room.x + 8; x < room.x + room.w - 8; x += 14) {
    const y = room.y + 8 + Math.floor(hash01(x, room.y) * Math.max(4, room.h - 16));
    tileMap.setTile(x, y, Tile.Paper);
    tileMap.setTile(x + 1, y, Tile.Paper);
  }
}

function addShopDetails(tileMap, room) {
  const cx = Math.floor(room.x + room.w / 2);
  const floorY = room.y + room.h - 6;
  for (let x = cx - 5; x <= cx + 5; x++) tileMap.setTile(x, floorY, Tile.Paper);
  tileMap.setTile(cx - 4, floorY - 1, Tile.Paper);
  tileMap.setTile(cx + 4, floorY - 1, Tile.Paper);
}

function addEventDetails(tileMap, room) {
  const cx = Math.floor(room.x + room.w / 2);
  for (let y = room.y + 6; y < room.y + room.h - 8; y += 4) {
    tileMap.setTile(cx - 1, y, Tile.Paper);
    tileMap.setTile(cx + 1, y, Tile.Paper);
  }
}

function routeXAt(y, mapRule, lane = 0) {
  if (mapRule?.twinShafts) return splitShaftXAt(y, mapRule, lane);
  return shaftXAt(y, mapRule);
}

function splitShaftXAt(y, mapRule, lane) {
  const depthBlend = Math.min(1, Math.max(0, (y - 32) / 52));
  const base = lane === 0 ? WORLD_W * 0.34 : WORLD_W * 0.66;
  const phase = lane === 0 ? 0.4 : 2.2;
  const drift = (Math.sin(y * 0.028 + phase) * 34 + Math.sin(y * 0.012 + phase) * 24) * depthBlend * (mapRule.waveAmp ?? 1);
  return Math.max(72, Math.min(WORLD_W - 72, Math.floor(base + drift)));
}

function shaftXAt(y, mapRule = MAP_GENERATION_RULES[0]) {
  const depthBlend = Math.min(1, Math.max(0, (y - 32) / 52));
  const wave = mapRule.waveAmp ?? 1;
  const drift = (Math.sin(y * 0.035) * 78 + Math.sin(y * 0.011 + 1.7) * 44) * depthBlend * wave;
  return Math.max(84, Math.min(WORLD_W - 84, Math.floor(SHAFT_BASE_X + drift)));
}

function addDiveShaftLedge(tileMap, x, y, shaftW) {
  const left = Math.floor(y / 20) % 2 === 0;
  const start = left ? x - shaftW : x + VERTICAL_CLEAR_HALF_WIDTH + 1;
  const end = left ? x - VERTICAL_CLEAR_HALF_WIDTH - 1 : x + shaftW;
  for (let xx = start; xx <= end; xx++) tileMap.setTile(xx, y, Tile.Paper);
  for (let xx = x - VERTICAL_CLEAR_HALF_WIDTH; xx <= x + VERTICAL_CLEAR_HALF_WIDTH; xx++) tileMap.setTile(xx, y, Tile.Air);
}

function carveSidePocket(tileMap, shaftX, y, dir, mapRule = MAP_GENERATION_RULES[0]) {
  const len = 34 + Math.floor(hash01(shaftX, y) * (42 + (mapRule.reefCaves ?? 1) * 24));
  const cx = shaftX + dir * Math.floor(len * 0.68);
  const cy = y + Math.floor((hash01(shaftX + 5, y + 9) - 0.5) * 12);
  const rx = Math.max(14, Math.floor(len * 0.42));
  const ry = 8 + Math.floor(hash01(shaftX - 3, y + 2) * 13);
  carveHorizontalTunnel(tileMap, shaftX + dir * 4, cx - dir * Math.floor(rx * 0.45), cy);
  carveOrganicCave(tileMap, cx, cy, rx, ry);
}

function connectLayerLoops(tileMap, rooms, mapRule = MAP_GENERATION_RULES[0]) {
  for (const layer of MAP_LAYERS) {
    const layerRooms = rooms
      .filter((room) => room.layerId === layer.id)
      .sort((a, b) => a.y - b.y);
    for (let i = 0; i < layerRooms.length - 1; i++) {
      if (Math.abs(layerRooms[i].y - layerRooms[i + 1].y) > 34) continue;
      if (hash01(layerRooms[i].x, layerRooms[i + 1].y) < (mapRule.loopChance ?? 0.42)) carveTunnel(tileMap, layerRooms[i], layerRooms[i + 1]);
    }
  }
}

function addLayerShortcuts(tileMap, rooms, mapRule = MAP_GENERATION_RULES[0]) {
  for (const room of rooms) {
    if (room.type === "entrance" || room.type === "exit" || room.type === "boss") continue;
    const chance = (room.type === "danger" || room.type === "rift" ? 0.48 : 0.28) + (mapRule.shortcutBonus ?? 0);
    if (Math.random() >= chance) continue;
    const vx = Math.floor(room.x + room.w / 2 + (Math.random() - 0.5) * room.w * 0.45);
    const startY = room.y + room.h;
    const endY = Math.min(WORLD_H - 10, startY + 26 + Math.floor(Math.random() * 42));
    carveVerticalTunnel(tileMap, vx, startY, endY);
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
