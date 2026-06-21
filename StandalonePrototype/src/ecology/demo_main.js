// demo_main.js — 墨境生态 Demo 主逻辑
// 独立可玩原型：6 种生物 + 灵感系统 + 图鉴

import { CREATURE_CATALOG, getAllCreatureIds } from "./CreatureCatalog.js?v=1";
import { createCreatureInstance, updateCreatureAI, damageCreature, canInteract, getToolBonus } from "./CreatureAI.js";
import { createInspirationSystem } from "./InspirationSystem.js";
import { createDiscoveryJournal } from "./DiscoveryJournal.js";
import { CREATURE_CLASS, INTERACTION, TOOL_PREFERENCE, DEPTH_LAYER } from "./CreatureTypes.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;

// --- 玩家 ---
const player = {
  x: 200, y: 300,
  w: 16, h: 24,
  vx: 0, vy: 0,
  speed: 2.5,
  onGround: true,
  facing: 1,
  tool: "brush",          // 当前工具
};

// --- 系统 ---
const inspiration = createInspirationSystem(100);
const journal = createDiscoveryJournal();

// --- 工具列表 ---
const tools = ["brush", "pen", "cutter", "paperweight_hammer", "ink_whip"];
const toolNames = { brush: "毛笔", pen: "钢笔", cutter: "裁纸刀", paperweight_hammer: "压纸锤", ink_whip: "墨鞭" };
const toolDesc = { brush: "安抚 / 净化", pen: "精准记录", cutter: "驱散负面", paperweight_hammer: "击退重敌", ink_whip: "捕捉高速" };

// --- 生物 ---
const creatures = [];

// --- 输入 ---
const keys = new Set();
const mouse = { x: 0, y: 0, left: false, justLeft: false };

// --- UI 状态 ---
let showJournal = false;
let messageText = "";
let messageTimer = 0;
let messageColor = "#f0d9a5";
let interactionHint = null; // { creature, type, text }

// --- 特效 ---
const particles = [];

// ========== 初始化 ==========

function spawnCreatures() {
  creatures.length = 0;

  // 纸面浅层生物 (左侧)
  const inkBlob1 = createCreatureInstance(CREATURE_CATALOG.ink_blob, 150, 120);
  const inkBlob2 = createCreatureInstance(CREATURE_CATALOG.ink_blob, 100, 380);
  creatures.push(inkBlob1, inkBlob2);

  // 石墨深层生物 (中间)
  const sketchFox = createCreatureInstance(CREATURE_CATALOG.sketch_fox, 400, 320);
  const gestureBird = createCreatureInstance(CREATURE_CATALOG.gesture_bird, 550, 100);
  const revisionWraith = createCreatureInstance(CREATURE_CATALOG.revision_wraith, 480, 420);
  creatures.push(sketchFox, gestureBird, revisionWraith);

  // 墨水深渊生物 (右侧)
  const templateWolf = createCreatureInstance(CREATURE_CATALOG.template_wolf, 650, 330);
  const halfFox = createCreatureInstance(CREATURE_CATALOG.half_sketched_fox, 750, 280);
  creatures.push(templateWolf, halfFox);
}

// ========== 更新 ==========

function update() {
  // 玩家移动
  let mx = 0, my = 0;
  if (keys.has("w") || keys.has("arrowup")) my = -1;
  if (keys.has("s") || keys.has("arrowdown")) my = 1;
  if (keys.has("a") || keys.has("arrowleft")) mx = -1;
  if (keys.has("d") || keys.has("arrowright")) mx = 1;

  const len = Math.sqrt(mx * mx + my * my) || 1;
  player.vx = (mx / len) * player.speed;
  player.vy = (my / len) * player.speed;

  if (mx !== 0) player.facing = mx > 0 ? 1 : -1;

  player.x += player.vx;
  player.y += player.vy;

  // 边界
  player.x = Math.max(20, Math.min(W - 20, player.x));
  player.y = Math.max(60, Math.min(H - 60, player.y));

  // 灵感流逝
  const tickResult = inspiration.tick(0.03);
  if (tickResult === "exhausted") {
    showMessage("精力耗尽，你被迫返回现实...", "#d32f2f", 180);
  }

  // 更新生物
  for (const c of creatures) {
    updateCreatureAI(c, player, 1);
    // 边界限制
    c.x = Math.max(30, Math.min(W - 30, c.x));
    c.y = Math.max(60, Math.min(H - 60, c.y));
  }

  // 攻击
  if (mouse.justLeft) {
    const mx2 = player.x + player.facing * 20;
    const my2 = player.y;
    for (const c of creatures) {
      if (!c.alive) continue;
      const dx = c.x - mx2;
      const dy = c.y - my2;
      if (Math.sqrt(dx * dx + dy * dy) < 36) {
        damageCreature(c, 6);
        if (!c.alive) {
          spawnParticles(c.x, c.y, c.catalog.color, 8);
          inspiration.onRepeatKill();
        }
        break;
      }
    }
  }

  // 交互提示
  interactionHint = null;
  for (const c of creatures) {
    if (!c.alive) continue;
    const dx = c.x - player.x;
    const dy = c.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    c.lastPlayerDistance = dist;

    if (dist < 50 && c.catalog.class === CREATURE_CLASS.INSPIRATION) {
      interactionHint = { creature: c, type: "any", text: "按 E 观察  R 记录  F 捕获" };
    } else if (dist < 60 && c.catalog.class === CREATURE_CLASS.NEGATIVE) {
      interactionHint = { creature: c, type: "disperse", text: "按 空格 驱散涂改鬼" };
    } else if (dist < 55 && c.catalog.class === CREATURE_CLASS.HYBRID) {
      interactionHint = { creature: c, type: "purify", text: "按 F 净化 (需毛笔)  按 空格 击败" };
    } else if (dist < 50 && c.catalog.class === CREATURE_CLASS.TEMPLATE) {
      interactionHint = { creature: c, type: "danger", text: "模板狼：主动攻击！按 空格 战斗" };
    }
  }

  // 消息计时
  if (messageTimer > 0) messageTimer--;
  else messageText = "";

  // 粒子
  for (const p of particles) { p.life--; p.x += p.vx; p.y += p.vy; }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }

  mouse.justLeft = false;
}

// ========== 交互 ==========

function handleObserve(creature) {
  const cat = creature.catalog;
  const isFirst = journal.markSeen(cat.id);
  const reward = inspiration.onDiscover(cat);
  const prefix = isFirst ? "首次发现！" : "";
  showMessage(`${prefix}观察 ${cat.name}：${cat.codexEntry.summary.slice(0, 30)}... 灵感 +${reward.inspirationGained}`, "#f0d9a5", 150);
}

function handleRecord(creature) {
  const cat = creature.catalog;
  if (cat.captureDifficulty < 1) {
    showMessage(`${cat.name} 无法被记录`, "#d32f2f", 90);
    return;
  }
  const bonus = getToolBonus(creature, player.tool);
  const recordTime = Math.max(30, 90 - bonus * 20);
  // 简化：直接记录
  creature.recordProgress += 40 * bonus;
  if (creature.recordProgress >= 100) {
    const isFirst = journal.markRecorded(cat.id);
    const reward = inspiration.onRecord(cat);
    const msg = isFirst ? "录入图鉴！" : "再次记录";
    showMessage(`${msg} ${cat.name} — ${cat.codexEntry.note.slice(0, 20)}... 灵感 +${reward.inspirationGained}`, "#2e7d32", 180);
    creature.recordProgress = 0;
    if (isFirst) spawnParticles(creature.x, creature.y, "#f0d9a5", 12);
  } else {
    showMessage(`正在记录 ${cat.name}... ${Math.round(creature.recordProgress)}% (工具加成 x${bonus.toFixed(1)})`, "#f0d9a5", 60);
  }
}

function handleCapture(creature) {
  const cat = creature.catalog;
  if (cat.class === CREATURE_CLASS.HYBRID) {
    // 净化
    if (player.tool !== "brush" && player.tool !== "crayon") {
      showMessage("净化畸变体需要使用毛笔或蜡笔", "#d32f2f", 120);
      return;
    }
    if (inspiration.state.inspiration < 60) {
      showMessage("灵感不足以净化畸变体（需要 > 60）", "#d32f2f", 120);
      return;
    }
    const bonus = getToolBonus(creature, player.tool);
    creature.captureProgress += 30 * bonus;
    if (creature.captureProgress >= 100) {
      journal.markCaptured(cat.id);
      const reward = inspiration.onCapture(cat);
      showMessage(`净化成功！${cat.name} 重获自由。灵感 +${reward.inspirationGained}，母题碎片 +${cat.discoveryReward.fragments}`, "#2e7d32", 200);
      creature.alive = false;
      spawnParticles(creature.x, creature.y, "#a0d9a5", 20);
    } else {
      showMessage(`正在净化 ${cat.name}... ${Math.round(creature.captureProgress)}%`, "#a0d9a5", 60);
    }
  } else if (cat.captureDifficulty >= 1) {
    const bonus = getToolBonus(creature, player.tool);
    creature.captureProgress += 25 * bonus;
    if (creature.captureProgress >= 100) {
      journal.markCaptured(cat.id);
      const reward = inspiration.onCapture(cat);
      showMessage(`捕获成功！${cat.name} 加入你的收藏。灵感 +${reward.inspirationGained}`, "#2e7d32", 180);
      creature.alive = false;
      spawnParticles(creature.x, creature.y, "#f0d9a5", 15);
    } else {
      showMessage(`正在捕获 ${cat.name}... ${Math.round(creature.captureProgress)}% (工具加成 x${bonus.toFixed(1)})`, "#f0d9a5", 60);
    }
  }
}

function showMessage(text, color, duration) {
  messageText = text;
  messageColor = color || "#f0d9a5";
  messageTimer = duration || 120;
}

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3 - 1,
      life: 20 + Math.random() * 20,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

// ========== 渲染 ==========

function draw() {
  // 背景：分层纸质感
  drawPaperBackground();

  // 深度层标识
  ctx.fillStyle = "rgba(0,0,0,0.03)";
  ctx.fillRect(0, 0, W / 3, H);
  ctx.fillStyle = "#8b8173";
  ctx.font = "11px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText("纸面浅层", 20, 30);
  ctx.fillText("石墨深层", W / 3 + 20, 30);
  ctx.fillText("墨水深渊", (W * 2) / 3 + 20, 30);

  // 层分隔线
  ctx.strokeStyle = "rgba(60,55,48,0.4)";
  ctx.setLineDash([4, 8]);
  ctx.beginPath(); ctx.moveTo(W / 3, 50); ctx.lineTo(W / 3, H - 50); ctx.stroke();
  ctx.beginPath(); ctx.moveTo((W * 2) / 3, 50); ctx.lineTo((W * 2) / 3, H - 50); ctx.stroke();
  ctx.setLineDash([]);

  // 生物
  for (const c of creatures) {
    if (!c.alive) continue;
    drawCreature(c);
    drawCreatureLabel(c);
  }

  // 玩家
  drawPlayer();

  // 交互提示
  if (interactionHint && interactionHint.creature.alive) {
    const cx = interactionHint.creature.x;
    const cy = interactionHint.creature.y - 30;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    const tw = ctx.measureText(interactionHint.text).width;
    ctx.fillRect(cx - tw / 2 - 8, cy - 10, tw + 16, 20);
    ctx.fillStyle = "#f0d9a5";
    ctx.font = "12px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(interactionHint.text, cx, cy + 4);
    ctx.textAlign = "start";
  }

  // 粒子
  for (const p of particles) {
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.globalAlpha = 1;
  }

  // HUD
  drawHUD();

  // 消息
  if (messageText && messageTimer > 0) {
    const alpha = Math.min(1, messageTimer / 30);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(26,24,22,0.9)";
    const mw = Math.min(700, ctx.measureText(messageText).width + 40);
    ctx.fillRect(W / 2 - mw / 2, H - 100, mw, 36);
    ctx.fillStyle = messageColor;
    ctx.font = "14px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(messageText, W / 2, H - 76);
    ctx.textAlign = "start";
    ctx.globalAlpha = 1;
  }

  // 图鉴
  if (showJournal) drawJournal();
}

function drawPaperBackground() {
  ctx.fillStyle = "#f5efe0";
  ctx.fillRect(0, 0, W, H);
  // 纸纹
  ctx.fillStyle = "rgba(0,0,0,0.02)";
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 30 + 5, 1);
  }
}

function drawCreature(c) {
  const cat = c.catalog;
  const { w, h } = cat.size;
  const x = c.x - w / 2;
  const y = c.y - h / 2;

  ctx.save();
  ctx.translate(c.x, c.y);
  if (c.facing < 0) ctx.scale(-1, 1);

  // 主体
  ctx.fillStyle = cat.color;
  ctx.globalAlpha = c.alive ? 1 : 0.4;

  // 根据类型轻微不同的形状
  switch (cat.class) {
    case CREATURE_CLASS.INSPIRATION:
      drawRoundedCreature(w, h, cat);
      break;
    case CREATURE_CLASS.NEGATIVE:
      drawJaggedCreature(w, h);
      break;
    case CREATURE_CLASS.TEMPLATE:
      drawGeometricCreature(w, h);
      break;
    case CREATURE_CLASS.HYBRID:
      drawHybridCreature(w, h, c.animFrame);
      break;
  }

  // 眼睛
  if (cat.class !== CREATURE_CLASS.NEGATIVE) {
    ctx.fillStyle = "#f5efe0";
    ctx.fillRect(w * 0.15, -h * 0.15, 4, 4);
    ctx.fillStyle = "#1a1816";
    ctx.fillRect(w * 0.15 + 1, -h * 0.15 + 1, 2, 2);
  } else {
    // 负面创意：空洞眼
    ctx.fillStyle = "#f5efe0";
    ctx.fillRect(w * 0.2, -h * 0.15, 5, 5);
    ctx.fillStyle = "#1a1816";
    ctx.fillRect(w * 0.2 + 1, -h * 0.15 + 1, 3, 3);
  }

  ctx.globalAlpha = 1;
  ctx.restore();

  // 交互状态指示器
  if (c.interactionState === "fleeing") {
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px sans-serif";
    ctx.fillText("!", c.x + w / 2 + 4, c.y - h / 2);
  }
}

function drawRoundedCreature(w, h, cat) {
  const bob = Math.sin(Date.now() / 400 + cat.id.length) * 2;
  ctx.beginPath();
  ctx.ellipse(0, bob, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawJaggedCreature(w, h) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = (i % 2 === 0 ? w * 0.5 : w * 0.35);
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * h * 0.5);
  }
  ctx.closePath();
  ctx.fill();
}

function drawGeometricCreature(w, h) {
  ctx.fillRect(-w / 2, -h / 2, w, h);
  // 完美网格纹理
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 0.5;
  for (let i = -w / 2; i < w / 2; i += 6) {
    ctx.beginPath(); ctx.moveTo(i, -h / 2); ctx.lineTo(i, h / 2); ctx.stroke();
  }
}

function drawHybridCreature(w, h, frame) {
  // 一半圆润（手绘），一半几何（模板）
  ctx.beginPath();
  ctx.ellipse(-w * 0.15, 0, w * 0.3, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(0, -h / 2, w * 0.35, h);
  // 闪烁线 — 两种存在方式之间的裂痕
  const flicker = Math.sin(frame * 0.5) * 0.3 + 0.5;
  ctx.strokeStyle = `rgba(255,200,200,${flicker})`;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, h / 2); ctx.stroke();
}

function drawCreatureLabel(c) {
  const cat = c.catalog;
  // 类型颜色
  const classColors = {
    inspiration: "#2e7d32",
    motif: "#6a1b9a",
    negative: "#d32f2f",
    template: "#1565c0",
    hybrid: "#e65100",
  };
  ctx.fillStyle = classColors[cat.class] || "#666";
  ctx.font = "10px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.textAlign = "center";

  // 状态标记
  const status = journal.entries[cat.id] || "unseen";
  let marker = "";
  if (status === "captured") marker = " ★";
  else if (status === "recorded") marker = " ✓";
  else if (status === "seen") marker = " ○";

  ctx.fillText(cat.name + marker, c.x, c.y + cat.size.h / 2 + 14);
  ctx.textAlign = "start";
}

function drawPlayer() {
  const px = player.x - player.w / 2;
  const py = player.y - player.h / 2;

  // 身体
  ctx.fillStyle = "#2d2d2d";
  ctx.fillRect(px, py, player.w, player.h);

  // 工具指示
  ctx.fillStyle = "#f0d9a5";
  const toolX = player.x + player.facing * 14;
  const toolY = player.y - 2;

  switch (player.tool) {
    case "brush":    ctx.fillRect(toolX - 1, toolY - 8, 3, 16); break;
    case "pen":      ctx.fillRect(toolX - 1, toolY - 10, 2, 20); break;
    case "cutter":   ctx.fillRect(toolX - 4, toolY - 3, 8, 4); break;
    case "paperweight_hammer": ctx.fillRect(toolX - 4, toolY - 6, 8, 8); break;
    case "ink_whip": ctx.fillRect(toolX - 1, toolY - 12, 2, 24); break;
  }

  // 朝向
  ctx.fillStyle = "#f5efe0";
  const eyeX = player.x + player.facing * 3;
  ctx.fillRect(eyeX - 1, player.y - 4, 3, 3);
}

function drawHUD() {
  const hudY = 10;
  const barW = 160, barH = 12;

  // 精力
  ctx.fillStyle = "#3a3630";
  ctx.fillRect(10, hudY, barW, barH);
  const energyPct = inspiration.state.energy / inspiration.state.maxEnergy;
  ctx.fillStyle = energyPct > 0.3 ? "#4a9e4a" : "#d32f2f";
  ctx.fillRect(10, hudY, barW * energyPct, barH);
  ctx.strokeStyle = "#5c554c";
  ctx.strokeRect(10, hudY, barW, barH);
  ctx.fillStyle = "#f5efe0";
  ctx.font = "10px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(`精力 ${Math.round(inspiration.state.energy)}`, 14, hudY + 10);

  // 灵感
  const inspY = hudY + 18;
  ctx.fillStyle = "#3a3630";
  ctx.fillRect(10, inspY, barW, barH);
  const inspPct = inspiration.state.inspiration / 100;
  ctx.fillStyle = inspPct > 0.5 ? "#c9a846" : "#8b7355";
  ctx.fillRect(10, inspY, barW * inspPct, barH);
  ctx.strokeStyle = "#5c554c";
  ctx.strokeRect(10, inspY, barW, barH);
  ctx.fillStyle = "#f5efe0";
  ctx.fillText(`灵感 ${Math.round(inspiration.state.inspiration)}`, 14, inspY + 10);

  // 稀有事件阈值标记
  if (inspiration.canTriggerRareEvent()) {
    ctx.fillStyle = "rgba(201,168,70,0.6)";
    ctx.font = "9px sans-serif";
    ctx.fillText("✦ 稀有事件可能", 14, inspY + 28);
  }

  // 当前工具
  const toolX = W - 180;
  ctx.fillStyle = "#3a3630";
  ctx.fillRect(toolX, hudY, 170, 40);
  ctx.strokeStyle = "#8b8173";
  ctx.strokeRect(toolX, hudY, 170, 40);
  ctx.fillStyle = "#f0d9a5";
  ctx.font = "bold 13px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(`工具：${toolNames[player.tool]}`, toolX + 10, hudY + 18);
  ctx.fillStyle = "#8b8173";
  ctx.font = "10px sans-serif";
  ctx.fillText(toolDesc[player.tool] || "", toolX + 10, hudY + 33);

  // 图鉴完成度
  const completion = journal.getCompletion();
  ctx.fillStyle = "#8b8173";
  ctx.font = "11px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(`图鉴 ${completion}%  按 J 打开`, toolX, hudY + 55);

  // 底部提示
  if (messageTimer <= 0 && !showJournal) {
    ctx.fillStyle = "#8b8173";
    ctx.font = "11px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("探索墨境，发现灵感生物。不是所有生物都应该击杀。", W / 2, H - 15);
    ctx.textAlign = "start";
  }
}

function drawJournal() {
  // 半透明遮罩
  ctx.fillStyle = "rgba(26,24,22,0.85)";
  ctx.fillRect(0, 0, W, H);

  // 图鉴面板
  const panelX = 80, panelY = 40, panelW = W - 160, panelH = H - 80;
  ctx.fillStyle = "#f5efe0";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "#2d2d2d";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = "#1a1816";
  ctx.font = "bold 20px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText("发现图鉴 Discovery Journal", panelX + 20, panelY + 35);

  const entries = journal.getAllEntries();
  const cols = 2;
  const colW = (panelW - 60) / cols;
  const startY = panelY + 60;

  entries.forEach((entry, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ex = panelX + 20 + col * colW;
    const ey = startY + row * 75;

    // 状态标记
    const statusIcons = { captured: "★", recorded: "✓", seen: "○", unseen: "？" };
    const statusColors = { captured: "#2e7d32", recorded: "#c9a846", seen: "#8b8173", unseen: "#555" };

    ctx.fillStyle = statusColors[entry.status] || "#555";
    ctx.font = "bold 14px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(`${statusIcons[entry.status]} ${entry.name}`, ex, ey);
    ctx.fillStyle = "#8b8173";
    ctx.font = "10px sans-serif";
    ctx.fillText(`${entry.nameEn}  ·  ${entry.rarity}`, ex, ey + 16);

    if (entry.status !== "unseen") {
      ctx.fillStyle = "#3a3630";
      ctx.font = "11px sans-serif";
      const summary = entry.summary || "";
      ctx.fillText(summary.slice(0, 35) + (summary.length > 35 ? "..." : ""), ex, ey + 32);
    } else {
      ctx.fillStyle = "#555";
      ctx.font = "11px sans-serif";
      ctx.fillText("尚未发现", ex, ey + 32);
    }
  });

  ctx.fillStyle = "#8b8173";
  ctx.font = "12px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("按 J 关闭图鉴", W / 2, panelY + panelH - 10);
  ctx.textAlign = "start";
}

// ========== 事件 ==========

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  keys.add(key);

  // 工具切换
  if (key === "1") { player.tool = tools[0]; showMessage(`切换到 ${toolNames[tools[0]]}`, "#f0d9a5", 30); }
  if (key === "2") { player.tool = tools[1]; showMessage(`切换到 ${toolNames[tools[1]]}`, "#f0d9a5", 30); }
  if (key === "3") { player.tool = tools[2]; showMessage(`切换到 ${toolNames[tools[2]]}`, "#f0d9a5", 30); }
  if (key === "4") { player.tool = tools[3]; showMessage(`切换到 ${toolNames[tools[3]]}`, "#f0d9a5", 30); }
  if (key === "5") { player.tool = tools[4]; showMessage(`切换到 ${toolNames[tools[4]]}`, "#f0d9a5", 30); }

  // 图鉴
  if (key === "j") { showJournal = !showJournal; e.preventDefault(); }

  // 交互
  if (key === "e" && !showJournal && interactionHint && interactionHint.creature.alive) {
    handleObserve(interactionHint.creature);
  }
  if (key === "r" && !showJournal && interactionHint && interactionHint.creature.alive) {
    handleRecord(interactionHint.creature);
  }
  if (key === "f" && !showJournal && interactionHint && interactionHint.creature.alive) {
    handleCapture(interactionHint.creature);
  }

  // 重置 Demo
  if (key === "0") {
    spawnCreatures();
    inspiration.reset(100);
    for (const id of getAllCreatureIds()) journal.entries[id] = "unseen";
    journal.stats.totalSeen = 0;
    journal.stats.totalRecorded = 0;
    journal.stats.totalCaptured = 0;
    showMessage("Demo 已重置", "#f0d9a5", 60);
  }
});

window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

canvas.addEventListener("mousedown", (e) => {
  if (e.button === 0) {
    mouse.left = true;
    mouse.justLeft = true;
    updateMousePos(e);
  }
});
canvas.addEventListener("mouseup", () => { mouse.left = false; });
canvas.addEventListener("mousemove", updateMousePos);

function updateMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
  mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
}

// 防止右键菜单
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

// ========== 主循环 ==========

spawnCreatures();
showMessage("墨境生态 Demo — 探索、观察、记录、捕获灵感生物", "#f0d9a5", 300);

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
