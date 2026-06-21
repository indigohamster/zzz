// RiftWorld.js — 裂口子世界 v2
// 5 种画稿世界：温馨/废稿/AI污染/记忆/未知作者
// 更新：添加 worldState.finished 信号供父场景检测完成

import { createCreatureInstance, updateCreatureAI, damageCreature } from "./CreatureAI.js";
import { CREATURE_CATALOG } from "./CreatureCatalog.js?v=1";
import { tryJackpot } from "./DiscoveryItems.js";
import { RIFT_TYPES } from "./CanvasRift.js";
import { drawCenteredModelSprite } from "../core/SpriteAssets.js?v=2";
import { drawProtagonistAt } from "../characters/protagonist/ProtagonistSprite.js?v=28";

const SW = 640, SH = 360;

export function createRiftWorld(typeId, onComplete, nestDepth = 0) {
  const config = RIFT_TYPES[typeId];
  let creatures = [];
  let items = [];
  let collected = [];
  let player = { x: 60, y: 200, w: 14, h: 22, speed: 3, facing: 1, walkFrame: 0, vx: 0, vy: 0 };
  let exitPortal = null;
  let exitActive = false;
  let finished = false;
  let messageText = "";
  let messageTimer = 0;
  let particles = [];
  let subRift = null;
  let timeLeft = 3600;
  const worldState = {};

  function start() {
    finished = false;
    creatures = []; items = []; collected = [];
    player.x = 60; player.y = 200; player.facing = 1; player.walkFrame = 0; player.vx = 0; player.vy = 0;
    messageText = ""; messageTimer = 0;
    particles = []; subRift = null;
    exitActive = false; resetWorldState();
    worldState.finished = false;
    timeLeft = 3600;

    switch (typeId) {
      case "warm":        buildWarmWorld(); break;
      case "waste":       buildWasteWorld(); break;
      case "ai_tainted":  buildAITaintedWorld(); break;
      case "memory":      buildMemoryWorld(); break;
      case "unknown":     buildUnknownWorld(); break;
    }
  }

  function buildWarmWorld() {
    creatures.push(createCreatureInstance(CREATURE_CATALOG.ink_blob, 200, 120));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.ink_blob, 400, 250));
    for (let i = 0; i < 5; i++) {
      items.push({ x: 80 + Math.random() * 500, y: 40 + Math.random() * 280, collected: false, color: "#f0d9a5", name: "蜡笔碎片" });
    }
    exitPortal = { x: 580, y: 180, active: false };
    worldState.atmosphere = "温暖的光从画纸纤维里透出来。";
  }

  function resetWorldState() {
    for (const key of Object.keys(worldState)) delete worldState[key];
  }

  function buildWasteWorld() {
    creatures.push(createCreatureInstance(CREATURE_CATALOG.revision_wraith, 300, 180));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.revision_wraith, 450, 280));
    for (let i = 0; i < 4; i++) {
      items.push({ x: 80 + Math.random() * 500, y: 40 + Math.random() * 280, collected: false, color: "#8d6b4a", name: "废弃设定碎片" });
    }
    exitPortal = { x: 580, y: 180, active: false };
    worldState.instability = 0;
    worldState.atmosphere = "结构在崩塌。被删除的角色在虚空里看着你。";
  }

  function buildAITaintedWorld() {
    for (let i = 0; i < 4; i++) {
      creatures.push(createCreatureInstance(CREATURE_CATALOG.template_wolf, 150 + i * 120, 100 + (i % 2) * 140));
    }
    creatures.push(createCreatureInstance(CREATURE_CATALOG.half_sketched_fox, 350, 200));
    for (let i = 0; i < 3; i++) {
      items.push({ x: 100 + Math.random() * 450, y: 50 + Math.random() * 260, collected: false, color: "#6b8fa3", name: "反模板核心" });
    }
    exitPortal = { x: 580, y: 180, active: false };
    worldState.atmosphere = "完美。整齐。重复。每一帧都和上一帧一样。";
  }

  function buildMemoryWorld() {
    for (let i = 0; i < 6; i++) {
      items.push({ x: 60 + Math.random() * 500, y: 40 + Math.random() * 280, collected: false, color: "#c9a8d8", name: ["褪色照片","旧钥匙","泛黄信纸","大学课本","第一次投稿的草稿","墨点小时候的画"][i] });
    }
    exitPortal = { x: 580, y: 180, active: false };
    worldState.memoriesFound = 0;
    worldState.atmosphere = "你认得这里。但你不记得来过。";
  }

  function buildUnknownWorld() {
    const rules = [
      { name: "重力反转", gravity: -1 },
      { name: "像素世界", pixelated: true },
      { name: "水彩渗透", bleed: true },
      { name: "时间冻结", frozen: true },
      { name: "二维平面", flat: true },
    ];
    worldState.rule = rules[Math.floor(Math.random() * rules.length)];

    creatures.push(createCreatureInstance(CREATURE_CATALOG.sketch_fox, 250, 180));
    if (Math.random() < 0.5) creatures.push(createCreatureInstance(CREATURE_CATALOG.half_sketched_fox, 400, 220));
    for (let i = 0; i < 4; i++) {
      items.push({ x: 80 + Math.random() * 500, y: 40 + Math.random() * 280, collected: false, color: "#5a8a7a", name: "未知画法碎片" });
    }
    exitPortal = { x: 580, y: 180, active: false };
    worldState.atmosphere = `规则：${worldState.rule.name}`;
  }

  function update(keys) {
    if (finished) return;
    timeLeft--;
    if (timeLeft <= 0) { finish(); return; }

    if (typeId === "waste") {
      worldState.instability += 0.02;
      if (worldState.instability > 5 && Math.random() < 0.01) {
        exitPortal.x += (Math.random() - 0.5) * 40;
        exitPortal.y += (Math.random() - 0.5) * 30;
        exitPortal.x = Math.max(20, Math.min(620, exitPortal.x));
        exitPortal.y = Math.max(20, Math.min(340, exitPortal.y));
      }
    }

    let mx = 0, my = 0;
    if (keys.has("w") || keys.has("arrowup")) my = -1;
    if (keys.has("s") || keys.has("arrowdown")) my = 1;
    if (keys.has("a") || keys.has("arrowleft")) mx = -1;
    if (keys.has("d") || keys.has("arrowright")) mx = 1;

    if (worldState.rule?.gravity === -1) my = -my;

    const moving = mx !== 0 || my !== 0;
    const len = Math.sqrt(mx * mx + my * my) || 1;
    player.vx = (mx / len) * player.speed;
    player.vy = (my / len) * player.speed;
    if (Math.abs(player.vx) > 0.05) player.facing = player.vx < 0 ? -1 : 1;
    player.walkFrame += moving ? Math.hypot(player.vx, player.vy) + 0.5 : 0.08;
    player.x = Math.max(10, Math.min(630, player.x + player.vx));
    player.y = Math.max(10, Math.min(350, player.y + player.vy));

    // 收集物品
    for (const item of items) {
      if (item.collected) continue;
      if (Math.hypot(player.x - item.x, player.y - item.y) < 20) {
        item.collected = true; collected.push(item);
        spawnParticles(item.x, item.y, item.color, 8);
        if (typeId === "memory") worldState.memoriesFound++;
      }
    }

    // 更新生物
    for (const c of creatures) {
      if (!c.alive) continue;
      updateCreatureAI(c, player, 1);
      c.x = Math.max(20, Math.min(620, c.x));
      c.y = Math.max(20, Math.min(340, c.y));
    }

    // 出口激活
    if (!exitActive) {
      if (typeId === "memory") {
        exitActive = worldState.memoriesFound >= 4;
      } else if (typeId === "ai_tainted") {
        exitActive = creatures.filter(c => !c.alive).length >= 3 || collected.length >= 2;
      } else {
        exitActive = collected.length >= 2 || creatures.filter(c => !c.alive).length >= 2;
      }
      if (exitActive) showMessage("出口已开启 — E 键返回墨境");
    }

    // 出口交互
    if (exitActive && exitPortal) {
      const ed = Math.hypot(player.x - exitPortal.x, player.y - exitPortal.y);
      if (ed < 30 && keys.has("e")) {
        finish();
      }
    }

    // 粒子
    for (const p of particles) { p.life--; p.x += p.vx; p.y += p.vy; }
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
    if (messageTimer > 0) messageTimer--;

    // 嵌套裂口生成
    if (!subRift && Math.random() < config.nestChance * 0.0008 && collected.length >= 1) {
      subRift = {
        x: 300 + Math.random() * 200,
        y: 80 + Math.random() * 200,
        glow: 0,
        active: true,
      };
      showMessage("画稿深处还有一个入口...", "#c084fc", 250);
    }
  }

  function handleKey(key) {
    // 嵌套裂口
    if (key === "e" && subRift?.active) {
      const d = Math.hypot(player.x - subRift.x, player.y - subRift.y);
      if (d < 30) {
        subRift.active = false;
        worldState.nestTriggered = true;
        return { nestRift: true, nestDepth: nestDepth + 1 };
      }
    }
    return false;
  }

  function finish() {
    finished = true;
    const reward = {
      type: config.rewardType,
      typeId: typeId,
      itemsCollected: collected.length,
      creaturesDefeated: creatures.filter(c => !c.alive).length,
      nestDepth: nestDepth,
    };
    let jackpot = null;
    for (const c of creatures) {
      if (!c.alive) {
        const jp = tryJackpot(c.catalog.id);
        if (jp) { jackpot = jp; break; }
      }
    }
    if (jackpot) reward.jackpot = jackpot;
    worldState.finished = true;
    worldState.reward = reward;
    if (onComplete) onComplete(reward);
  }

  function draw(ctx) {
    const bgColors = {
      warm: "#f5efe0", waste: "#2a2218", ai_tainted: "#d0d8e0",
      memory: "#e8ddf0", unknown: "#d8e8e0",
    };
    ctx.fillStyle = bgColors[typeId] || "#f5efe0";
    ctx.fillRect(0, 0, SW, SH);

    if (typeId === "waste") {
      ctx.strokeStyle = "rgba(200,150,100,0.15)";
      for (let i = 0; i < 8; i++) {
        const y = 30 + i * 42 + Math.sin(Date.now() / 500 + i) * worldState.instability * 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SW, y + Math.sin(Date.now() / 600 + i) * 5); ctx.stroke();
      }
    }

    if (typeId === "ai_tainted") {
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      for (let x = 0; x < SW; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SH); ctx.stroke(); }
      for (let y = 0; y < SH; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SW, y); ctx.stroke(); }
    }

    for (const item of items) {
      if (item.collected) continue;
      const p = Math.sin(Date.now() / 500 + item.x * 0.1) * 0.3 + 0.7;
      drawRiftCollectible(ctx, item.x, item.y, item.color, p);
    }

    for (const c of creatures) {
      if (!c.alive) continue;
      const cat = c.catalog;
      drawRiftCreature(ctx, c.x, c.y, cat, typeId === "ai_tainted" && cat.class === "template");
    }

    if (exitActive && exitPortal) {
      const p2 = Math.sin(Date.now() / 400) * 0.3 + 0.7;
      drawRiftExit(ctx, exitPortal.x, exitPortal.y, p2);
      ctx.fillStyle = "#fff";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("E 返回", exitPortal.x, exitPortal.y - 20);
      ctx.textAlign = "start";
    }

    if (subRift?.active) {
      const p3 = Math.sin(Date.now() / 500) * 0.3 + 0.7;
      drawNestedRift(ctx, subRift.x, subRift.y, p3);
      ctx.fillStyle = "#c084fc";
      ctx.font = "9px sans-serif";
      ctx.fillText("E 深入", subRift.x - 12, subRift.y - 26);
    }

    drawRiftPlayer(ctx, player.x, player.y);

    for (const p of particles) {
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    if (messageText && messageTimer > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      const mw = Math.min(500, ctx.measureText(messageText).width + 20);
      ctx.fillRect(SW / 2 - mw / 2, SH - 46, mw, 22);
      ctx.fillStyle = "#f0d9a5";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(messageText, SW / 2, SH - 30);
      ctx.textAlign = "start";
    }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(4, 4, 300, 36);
    ctx.fillStyle = "#ccc";
    ctx.font = "10px sans-serif";
    ctx.fillText(`${config.name}${nestDepth > 0 ? " (第" + (nestDepth+1) + "层)" : ""}  收集 ${collected.length}  时间 ${Math.ceil(timeLeft/60)}s`, 10, 18);
    ctx.fillText(worldState.atmosphere || "", 10, 32);
    ctx.fillStyle = "#8b8173";
    ctx.font = "9px sans-serif";
    ctx.fillText("WASD 移动  E 交互/返回  收集够后出口激活", 10, SH - 6);
  }

  function showMessage(text, color, duration) {
    messageText = text; messageTimer = duration || 120;
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({ x, y, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.8)*2, life: 18+Math.random()*18, color, size: 2+Math.random()*3 });
    }
  }

  function drawRiftCollectible(ctx, x, y, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 5, y - 5, 10, 10);
    ctx.fillStyle = color;
    ctx.fillRect(x - 4, y - 6, 8, 8);
    ctx.fillStyle = "#f5efe0";
    ctx.fillRect(x - 2, y - 4, 3, 2);
    ctx.globalAlpha = 1;
  }

  function drawRiftCreature(ctx, x, y, cat, template) {
    if (cat.spriteId && drawCenteredModelSprite(ctx, cat.spriteId, x, y, {
      height: cat.spriteHeight ?? Math.max(cat.size.w, cat.size.h) * 2,
      alpha: template ? 0.92 : 1,
    })) {
      return;
    }
    const w = Math.floor(cat.size.w);
    const h = Math.floor(cat.size.h);
    const sx = Math.floor(x - w / 2);
    const sy = Math.floor(y - h / 2);
    ctx.fillStyle = "#05070b";
    ctx.fillRect(sx - 1, sy - 1, w + 2, h + 2);
    ctx.fillStyle = cat.color;
    ctx.fillRect(sx, sy, w, h);
    ctx.fillStyle = template ? "#d0d8e0" : "#f5efe0";
    ctx.fillRect(sx + w - 7, sy + 4, 3, 3);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(sx + 2, sy + h - 3, w - 4, 2);
    if (template) {
      ctx.fillStyle = "#05070b";
      for (let yy = sy + 3; yy < sy + h - 2; yy += 6) ctx.fillRect(sx + 2, yy, w - 4, 1);
    }
  }

  function drawRiftExit(ctx, x, y, pulse) {
    ctx.fillStyle = `rgba(100,200,100,${Math.max(0.18, pulse * 0.22)})`;
    ctx.fillRect(x - 21, y - 25, 42, 50);
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 11, y - 17, 22, 34);
    ctx.fillStyle = "#64c864";
    ctx.fillRect(x - 8, y - 14, 16, 28);
    ctx.fillStyle = "#e8ffd8";
    ctx.fillRect(x - 4, y - 8, 8, 2);
    ctx.fillRect(x - 4, y, 8, 2);
  }

  function drawNestedRift(ctx, x, y, pulse) {
    ctx.fillStyle = `rgba(192,132,252,${Math.max(0.18, pulse * 0.24)})`;
    ctx.fillRect(x - 24, y - 30, 48, 60);
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 16, y - 22, 32, 44);
    ctx.fillStyle = "#c084fc";
    ctx.fillRect(x - 13, y - 19, 26, 38);
    ctx.fillStyle = "#f5efe0";
    ctx.fillRect(x - 2, y - 8, 4, 14);
    ctx.fillRect(x - 5, y + 9, 10, 3);
  }

  function drawRiftPlayer(ctx, x, y) {
    drawProtagonistAt(ctx, {
      x,
      footY: y + player.h / 2 + 8,
      facing: player.facing,
      frame: player.walkFrame,
      walkSpeed: Math.hypot(player.vx, player.vy),
      showTank: false,
    });
  }

  return { start, update, handleKey, draw, worldState };
}
