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
  const availableTypes = unlockedTypes || ["warm_doodle"];

  // 排除入口房间和 Boss 房间
  const validRooms = rooms.filter(r =>
    r.type !== "draft_gate" && r.type !== "boss" && r.type !== "torn"
  );

  if (validRooms.length === 0) return gates;

  const shuffled = [...validRooms].sort(() => Math.random() - 0.5);
  const placed = Math.min(count, shuffled.length, availableTypes.length);

  for (let i = 0; i < placed; i++) {
    const room = shuffled[i];
    const gateType = availableTypes[i % availableTypes.length];
    const gx = (room.x + room.w / 2) * 8;
    const gy = (room.y + room.h / 2) * 8;
    const gate = createCanvasGate(gateType, gx, gy);
    if (gate) gates.push(gate);
  }

  return gates;
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

    // 光晕
    const gradient = ctx.createRadialGradient(sx, sy, 10, sx, sy, 60);
    gradient.addColorStop(0, config.glowColor + (0.4 + glow * 0.2) + ")");
    gradient.addColorStop(1, config.glowColor + "0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(sx - 60, sy - 60, 120, 120);

    // 画框
    ctx.fillStyle = config.color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(sx - gate.w / 2, sy - gate.h / 2, gate.w, gate.h);

    // 内部闪烁
    ctx.fillStyle = "#f5efe0";
    ctx.globalAlpha = 0.3 + glow * 0.3;
    ctx.fillRect(sx - gate.w / 2 + 4, sy - gate.h / 2 + 4, gate.w - 8, gate.h - 8);

    // 边框
    ctx.globalAlpha = 1;
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - gate.w / 2, sy - gate.h / 2, gate.w, gate.h);

    // 图标
    ctx.fillStyle = "#fff";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(config.icon, sx, sy + 2);

    // 标签
    ctx.fillStyle = config.color;
    ctx.font = "10px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(config.name, sx, sy + gate.h / 2 + 14);
    ctx.textAlign = "start";

    ctx.globalAlpha = 1;
  }
}
