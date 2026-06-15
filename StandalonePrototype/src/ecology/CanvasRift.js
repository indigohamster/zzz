// CanvasRift.js — 异常入口系统
// 墨境探索中随机出现的"画稿裂口"：通往他人画作的入口

import { MAP_LAYERS } from "./MapLayers.js";

// ========== 裂口类型定义 ==========
export const RIFT_TYPES = {
  warm: {
    id: "warm",
    name: "温馨画稿",
    desc: "蜡笔的甜味从裂缝里飘出来。",
    visual: "torn_paper",       // 视觉预设
    color: "#f0d9a5",
    glowColor: "rgba(240,217,165,",
    dangerLevel: 0,             // 0=无战斗 1=少量 2=中等 3=危险
    rewardType: "inspiration",  // inspiration / xp / material / story / random
    nestChance: 0.1,            // 内部再生成裂口的概率
    spawnWeight: 4,             // 生成权重
    completed: false,
  },
  waste: {
    id: "waste",
    name: "废稿世界",
    desc: "被删除的角色在裂缝另一边呼吸。",
    visual: "burning_sketch",
    color: "#8d6b4a",
    glowColor: "rgba(141,107,74,",
    dangerLevel: 1,
    rewardType: "xp",
    nestChance: 0.2,
    spawnWeight: 3,
  },
  ai_tainted: {
    id: "ai_tainted",
    name: "AI 污染区",
    desc: "完美的六根手指在画框里整齐排列。",
    visual: "twisted_frame",
    color: "#6b8fa3",
    glowColor: "rgba(107,143,163,",
    dangerLevel: 3,
    rewardType: "material",
    nestChance: 0.15,
    spawnWeight: 2,
  },
  memory: {
    id: "memory",
    name: "记忆画稿",
    desc: "你认得这个房间。但你不记得来过。",
    visual: "floating_page",
    color: "#8b6b9e",
    glowColor: "rgba(139,107,158,",
    dangerLevel: 0,
    rewardType: "story",
    nestChance: 0.05,
    spawnWeight: 1,
  },
  unknown: {
    id: "unknown",
    name: "未知作者",
    desc: "风格不属于任何你认识的画家。",
    visual: "inverted_sketchbook",
    color: "#5a8a7a",
    glowColor: "rgba(90,138,122,",
    dangerLevel: 2,
    rewardType: "random",
    nestChance: 0.3,            // 未知画稿最容易嵌套
    spawnWeight: 2,
  },
};

// ========== 视觉预设 ==========
export const RIFT_VISUALS = {
  torn_paper: {
    name: "撕裂画纸",
    draw(ctx, x, y, glow, color) {
      ctx.save();
      ctx.globalAlpha = 0.3 + glow * 0.3;
      // 锯齿状边缘
      ctx.fillStyle = color;
      ctx.beginPath();
      const w = 28, h = 40;
      ctx.moveTo(x - w, y - h);
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(x - w + (i + 0.5) * w * 0.4, y - h + (i % 2 === 0 ? h * 0.1 : -h * 0.1));
      }
      ctx.lineTo(x + w, y - h);
      ctx.lineTo(x + w + h * 0.12, y);
      ctx.lineTo(x + w, y + h);
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(x + w - (i + 0.5) * w * 0.5, y + h + (i % 2 === 0 ? -h * 0.08 : h * 0.08));
      }
      ctx.lineTo(x - w, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    },
  },
  burning_sketch: {
    name: "燃烧草稿",
    draw(ctx, x, y, glow, color) {
      ctx.save();
      const flicker = Math.sin(Date.now() / 200 + x) * 4;
      // 火焰光晕
      for (let r = 30; r > 8; r -= 6) {
        ctx.fillStyle = `rgba(200,120,40,${0.08 + glow * 0.06})`;
        ctx.beginPath();
        ctx.arc(x, y + flicker * 0.5, r + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // 烧焦边缘
      ctx.fillStyle = "#3a2010";
      ctx.fillRect(x - 16, y - 22, 32, 44);
      ctx.fillStyle = color;
      ctx.fillRect(x - 12, y - 18, 24, 36);
      // 火星
      for (let i = 0; i < 3; i++) {
        const mx = x + (Math.sin(Date.now() / 300 + i * 2) * 18);
        const my = y - 18 - i * 8 - Math.random() * 6;
        ctx.fillStyle = `rgba(255,180,40,${0.6 + Math.random() * 0.4})`;
        ctx.fillRect(mx - 1, my - 1, 2 + Math.random(), 2 + Math.random());
      }
      ctx.restore();
    },
  },
  twisted_frame: {
    name: "扭曲画框",
    draw(ctx, x, y, glow, color) {
      ctx.save();
      const skew = Math.sin(Date.now() / 800) * 3;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5 + glow * 0.3;
      ctx.beginPath();
      ctx.moveTo(x - 22 + skew, y - 28);
      ctx.lineTo(x + 22 - skew, y - 26);
      ctx.lineTo(x + 20, y + 26 + skew);
      ctx.lineTo(x - 20, y + 24 - skew);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
      // 完美网格内部
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(x - 14, y - 18, 28, 36);
      for (let i = x - 14; i < x + 14; i += 5) {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath(); ctx.moveTo(i, y - 18); ctx.lineTo(i, y + 18); ctx.stroke();
      }
      ctx.restore();
    },
  },
  floating_page: {
    name: "漂浮画页",
    draw(ctx, x, y, glow, color) {
      ctx.save();
      const floatY = Math.sin(Date.now() / 600 + x * 0.1) * 5;
      ctx.globalAlpha = 0.4 + glow * 0.3;
      // 画页
      ctx.fillStyle = "#f5efe0";
      ctx.fillRect(x - 18, y - 24 + floatY, 36, 48);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 18, y - 24 + floatY, 36, 48);
      // 上面的潦草内容
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(x - 8, y - 10 + floatY, 8, 1);
      ctx.fillRect(x - 4, y - 4 + floatY, 12, 1);
      ctx.fillRect(x - 10, y + 2 + floatY, 6, 1);
      // 记忆光点
      for (let i = 0; i < 5; i++) {
        const px = x - 20 + Math.random() * 40;
        const py = y - 28 + Math.random() * 56 + floatY;
        ctx.fillStyle = `rgba(200,180,240,${0.3 + Math.random() * 0.4})`;
        ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },
  },
  inverted_sketchbook: {
    name: "倒置速写本",
    draw(ctx, x, y, glow, color) {
      ctx.save();
      ctx.globalAlpha = 0.35 + glow * 0.3;
      // 倒置的速写本
      ctx.fillStyle = "#e8dcc8";
      ctx.fillRect(x - 20, y - 28, 40, 56);
      // 螺旋装订
      ctx.strokeStyle = "#8b8173";
      for (let i = y - 22; i < y + 22; i += 8) {
        ctx.beginPath(); ctx.arc(x - 14, i, 3, 0, Math.PI * 1.5); ctx.stroke();
      }
      // 倒置的线条
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 16); ctx.lineTo(x + 14, y - 8); ctx.lineTo(x - 4, y - 16);
      ctx.stroke();
      // 问号标记
      ctx.fillStyle = color;
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("?", x, y + 2);
      ctx.textAlign = "start";
      ctx.restore();
    },
  },
};

// ========== 生成逻辑 ==========

// 根据层级概率决定是否生成裂口
export function shouldSpawnRift(layerId, roomType) {
  const probabilities = {
    shallow: 0.10,
    middle: 0.20,
    deep: 0.35,
  };
  let chance = probabilities[layerId] || 0.10;
  if (roomType === "danger") chance = 0.50;
  return Math.random() < chance;
}

// 按权重随机裂口类型
export function rollRiftType(layerId) {
  const types = Object.values(RIFT_TYPES);
  // 浅层偏向温馨画稿
  const layerWeights = {
    shallow: { warm: 8, waste: 2, ai_tainted: 0, memory: 3, unknown: 1 },
    middle:  { warm: 3, waste: 4, ai_tainted: 2, memory: 2, unknown: 3 },
    deep:    { warm: 1, waste: 2, ai_tainted: 5, memory: 1, unknown: 3 },
  };
  const weights = layerWeights[layerId] || layerWeights.middle;
  
  const pool = [];
  for (const t of types) {
    const w = weights[t.id] || t.spawnWeight;
    for (let i = 0; i < w; i++) pool.push(t.id);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// 创建裂口实例
export function createRiftInstance(typeId, worldX, worldY, layerId) {
  const config = RIFT_TYPES[typeId];
  if (!config) return null;
  return {
    id: `rift-${typeId}-${worldX}-${worldY}`,
    type: typeId,
    config: { ...config },
    x: worldX, y: worldY,
    w: 40, h: 52,
    glow: Math.random(),
    entered: false,
    completed: false,
    layerId: layerId,
    nestDepth: 0,              // 嵌套深度（裂口中的裂口）
  };
}

// 查找最近的裂口
export function findNearestRift(rifts, px, py, range = 50) {
  let best = null, bestDist = range;
  for (const r of rifts) {
    if (r.completed || r.entered) continue;
    const d = Math.hypot(r.x - px, r.y - py);
    if (d < bestDist) { bestDist = d; best = r; }
  }
  return best;
}

// 更新裂口动画
export function updateRifts(rifts) {
  for (const r of rifts) {
    r.glow = (Math.sin(Date.now() / 500 + r.x * 0.01) + 1) / 2;
  }
}

// 绘制裂口
export function drawRifts(ctx, rifts, cameraX, cameraY) {
  for (const r of rifts) {
    if (r.completed) continue;
    const sx = r.x - cameraX, sy = r.y - cameraY;
    if (sx < -60 || sx > 1020 || sy < -60 || sy > 600) continue;

    const visual = RIFT_VISUALS[r.config.visual];
    if (visual) {
      visual.draw(ctx, sx, sy, r.glow, r.config.color);
    }

    // 光晕
    const grad = ctx.createRadialGradient(sx, sy, 8, sx, sy, 50);
    grad.addColorStop(0, r.config.glowColor + (0.4 + r.glow * 0.25) + ")");
    grad.addColorStop(1, r.config.glowColor + "0)");
    ctx.fillStyle = grad;
    ctx.fillRect(sx - 50, sy - 50, 100, 100);

    // 类型标签
    ctx.fillStyle = r.config.color;
    ctx.font = "9px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(r.config.name, sx, sy + 36);
    ctx.textAlign = "start";
  }
}
