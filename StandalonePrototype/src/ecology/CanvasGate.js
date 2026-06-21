// CanvasGate.js — 画稿入口系统
// 在墨境主地图中随机生成通往子画稿世界的入口

export const GATE_TYPES = {
  warm_doodle: {
    id: "warm_doodle",
    name: "温馨涂鸦",
    desc: "蜡笔的甜味从画框里飘出来。里面可能是一个孩子的下午。",
    color: "#f0d9a5",
    glowColor: "rgba(240,217,165,",
    icon: "🖼",
    dangerLevel: 0,    // 0=安全, 1=中等, 2=危险
    tileColor: "#f5efe0",
  },
  horror_sketch: {
    id: "horror_sketch",
    name: "恐怖草图",
    desc: "边缘在渗墨。你能听到橡皮擦反复摩擦的声音——但没有人拿着橡皮。",
    color: "#8d1d25",
    glowColor: "rgba(141,29,37,",
    icon: "🌑",
    dangerLevel: 2,
    tileColor: "#1a1412",
  },
  ai_template: {
    id: "ai_template",
    name: "模板画稿",
    desc: "画面精致得不像人画的。所有线条都太直了，所有颜色都太对了。太对了。",
    color: "#6b8fa3",
    glowColor: "rgba(107,143,163,",
    icon: "🔲",
    dangerLevel: 1,
    tileColor: "#d0d8e0",
  },
};

const GATE_ROOM_TYPES = new Set(["explore", "resource", "treasure", "event", "shop", "combat"]);
const ROOM_GATE_SCORE = {
  explore: 6,
  resource: 5,
  treasure: 5,
  event: 4,
  shop: 4,
  combat: 2,
};

// 生成画稿入口实例
export function createCanvasGate(type, worldX, worldY) {
  const config = GATE_TYPES[type];
  if (!config) return null;

  return {
    type: type,
    config: config,
    x: worldX,
    y: worldY,
    w: 48,
    h: 64,
    state: "closed",       // closed | opening | open | completed
    animFrame: 0,
    animTimer: 0,
    completed: false,
  };
}

// 在墨境地图中随机放置入口
export function placeGatesOnMap(tileMap, unlockedTypes, count = 3) {
  const rooms = tileMap.getRooms();
  const gates = [];
  const availableTypes = (unlockedTypes || ["warm_doodle"]).filter((type) => GATE_TYPES[type]);

  const validRooms = rooms
    .filter(isValidGateRoom)
    .map((room) => ({ room, score: weightedRoomScore(room) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.room);

  if (validRooms.length === 0 || availableTypes.length === 0) return gates;

  const placed = Math.min(count, validRooms.length, availableTypes.length);

  for (let i = 0; i < placed; i++) {
    const room = validRooms[i];
    const gateType = availableTypes[i % availableTypes.length];
    const gx = (room.x + room.w / 2) * 8;
    const gy = (room.y + room.h / 2) * 8;
    const gate = createCanvasGate(gateType, gx, gy);
    if (gate) {
      gate.roomId = room.id;
      gate.roomType = room.type;
      gate.layerId = room.layerId ?? null;
      gate.layerName = room.layerName ?? "";
      gate.riskTier = room.riskTier ?? gate.config.dangerLevel;
      gates.push(gate);
    }
  }

  return gates;
}

function isValidGateRoom(room) {
  if (!room || room.rewardClaimed || room.completed) return false;
  return GATE_ROOM_TYPES.has(room.type);
}

function weightedRoomScore(room) {
  const base = ROOM_GATE_SCORE[room.type] ?? 1;
  const branchBonus = room.routeHint === "branch" ? 1.5 : 0;
  const depthBonus = Math.min(1.5, (room.depthRank ?? 0) * 0.6);
  return base + branchBonus + depthBonus + Math.random();
}

// 检测玩家是否靠近入口
export function findNearestGate(gates, playerX, playerY, range = 50) {
  let best = null;
  let bestDist = range;
  for (const gate of gates) {
    if (gate.completed) continue;
    const dx = gate.x - playerX;
    const dy = gate.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = gate;
    }
  }
  return best;
}

// 更新入口动画
export function updateGates(gates) {
  for (const gate of gates) {
    gate.animTimer++;
    gate.animFrame = Math.sin(gate.animTimer * 0.05) * 0.5 + 0.5;
  }
}

// 绘制入口
export function drawGates(ctx, gates, cameraX, cameraY) {
  for (const gate of gates) {
    if (gate.completed) continue;
    const sx = gate.x - cameraX;
    const sy = gate.y - cameraY;
    if (sx < -60 || sx > 1020 || sy < -60 || sy > 600) continue;

    const glow = gate.animFrame;
    const config = gate.config;
    const x = Math.floor(sx - gate.w / 2);
    const y = Math.floor(sy - gate.h / 2);

    // Pixel bloom
    ctx.fillStyle = config.glowColor + (0.12 + glow * 0.08) + ")";
    ctx.fillRect(x - 10, y - 10, gate.w + 20, gate.h + 20);
    ctx.fillStyle = config.glowColor + (0.18 + glow * 0.12) + ")";
    ctx.fillRect(x - 4, y - 4, gate.w + 8, gate.h + 8);
    for (let i = 0; i < 8; i++) {
      const px = Math.floor(sx + Math.sin(gate.animTimer * 0.05 + i) * (30 + i * 2));
      const py = Math.floor(sy + Math.cos(gate.animTimer * 0.04 + i * 1.7) * (36 + (i % 3) * 4));
      ctx.fillStyle = i % 2 === 0 ? config.color : "#f5efe0";
      ctx.fillRect(px, py, 2, 2);
    }

    // Chunky frame
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 4, y - 4, gate.w + 8, gate.h + 8);
    ctx.fillStyle = config.color;
    ctx.fillRect(x, y, gate.w, gate.h);
    ctx.fillStyle = "#f5efe0";
    ctx.fillRect(x + 4, y + 4, gate.w - 8, gate.h - 8);
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x + 8, y + 8, gate.w - 16, gate.h - 16);

    // Inner animated picture
    const inner = config.tileColor;
    ctx.fillStyle = inner;
    ctx.globalAlpha = 0.72 + glow * 0.2;
    ctx.fillRect(x + 11, y + 11, gate.w - 22, gate.h - 22);
    ctx.globalAlpha = 1;
    ctx.fillStyle = config.color;
    for (let yy = y + 14; yy < y + gate.h - 12; yy += 8) {
      const lineW = gate.w - 28 - ((yy + gate.animTimer) % 3) * 3;
      ctx.fillRect(x + 14, yy, lineW, 2);
    }

    drawGateGlyph(ctx, gate.type, sx, sy, config.color);

    // Label
    ctx.fillStyle = "rgba(5,7,11,0.78)";
    const labelW = Math.max(56, ctx.measureText(config.name).width + 10);
    ctx.fillRect(Math.floor(sx - labelW / 2), Math.floor(sy + gate.h / 2 + 6), labelW, 14);
    ctx.fillStyle = config.color;
    ctx.font = "10px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(config.name, sx, sy + gate.h / 2 + 14);
    ctx.textAlign = "start";

    ctx.globalAlpha = 1;
  }
}

function drawGateGlyph(ctx, type, sx, sy, color) {
  const x = Math.floor(sx);
  const y = Math.floor(sy);
  ctx.fillStyle = "#05070b";
  ctx.fillRect(x - 7, y - 7, 14, 14);
  ctx.fillStyle = color;
  if (type === "warm_doodle") {
    ctx.fillRect(x - 5, y - 3, 10, 6);
    ctx.fillRect(x - 2, y - 6, 4, 12);
    ctx.fillStyle = "#f5efe0";
    ctx.fillRect(x - 1, y - 1, 2, 2);
    return;
  }
  if (type === "horror_sketch") {
    ctx.fillRect(x - 6, y - 2, 12, 4);
    ctx.fillRect(x - 3, y - 5, 6, 10);
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 1, y - 1, 2, 2);
    return;
  }
  ctx.fillRect(x - 5, y - 5, 4, 4);
  ctx.fillRect(x + 1, y - 5, 4, 4);
  ctx.fillRect(x - 5, y + 1, 4, 4);
  ctx.fillRect(x + 1, y + 1, 4, 4);
}
