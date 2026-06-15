// SubMapScene.js — 画稿子世界场景
// 3 种子地图类型：温馨涂鸦 / 恐怖草图 / AI 模板画稿

import { CREATURE_CATALOG } from "./CreatureCatalog.js";
import { createCreatureInstance, updateCreatureAI } from "./CreatureAI.js";
import { rollDiscovery, tryJackpot } from "./DiscoveryItems.js";
import { GATE_TYPES } from "./CanvasGate.js";

const SW = 640;  // 子地图视口宽度
const SH = 360;  // 子地图视口高度
const MW = 800;  // 地图世界宽度
const MH = 480;  // 地图世界高度

export function createSubMapScene(gateType, onComplete) {
  const config = GATE_TYPES[gateType];
  let creatures = [];
  let items = [];        // 可采集的发现物
  let collected = [];    // 已收集
  let player = { x: 60, y: MH / 2, w: 14, h: 22, vx: 0, vy: 0, speed: 2.8 };
  let camera = { x: 0, y: 0 };
  let finished = false;
  let messageText = "";
  let messageTimer = 0;
  let particles = [];
  let exitPortal = null;
  let exitActive = false;
  let timeLeft = 180;    // 3 分钟（60fps * 3 秒 = 180，实际上180帧太短...让我设成合理的）
  let interactionHint = null;

  function start() {
    creatures = [];
    items = [];
    collected = [];
    player.x = 60;
    player.y = MH / 2;
    player.vx = 0;
    player.vy = 0;
    finished = false;
    messageText = "";
    messageTimer = 0;
    particles = [];
    exitPortal = null;
    exitActive = false;
    timeLeft = 3600; // 60 秒 @ 60fps
    interactionHint = null;

    switch (gateType) {
      case "warm_doodle":
        buildWarmDoodle();
        break;
      case "horror_sketch":
        buildHorrorSketch();
        break;
      case "ai_template":
        buildAITemplate();
        break;
    }
  }

  function buildWarmDoodle() {
    // 温和生物
    creatures.push(createCreatureInstance(CREATURE_CATALOG.ink_blob, 200, 120));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.ink_blob, 350, 300));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.sketch_fox, 500, 180));

    // 可采集物
    for (let i = 0; i < 6; i++) {
      items.push({
        x: 100 + Math.random() * 600,
        y: 60 + Math.random() * 360,
        collected: false,
        color: "#f0d9a5",
        size: 8,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    exitPortal = { x: MW - 60, y: MH / 2, active: false };
  }

  function buildHorrorSketch() {
    creatures.push(createCreatureInstance(CREATURE_CATALOG.revision_wraith, 300, 200));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.revision_wraith, 500, 320));
    // 也会有一只线稿狐躲着
    creatures.push(createCreatureInstance(CREATURE_CATALOG.sketch_fox, 600, 100));

    for (let i = 0; i < 5; i++) {
      items.push({
        x: 100 + Math.random() * 600,
        y: 60 + Math.random() * 360,
        collected: false,
        color: "#d32f2f",
        size: 7,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    exitPortal = { x: MW - 60, y: MH / 2, active: false };
  }

  function buildAITemplate() {
    creatures.push(createCreatureInstance(CREATURE_CATALOG.template_wolf, 250, 200));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.template_wolf, 450, 300));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.half_sketched_fox, 550, 200));

    for (let i = 0; i < 4; i++) {
      items.push({
        x: 100 + Math.random() * 600,
        y: 60 + Math.random() * 360,
        collected: false,
        color: "#6b8fa3",
        size: 7,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    exitPortal = { x: MW - 60, y: MH / 2, active: false };
  }

  function update(keys) {
    if (finished) return;

    timeLeft--;
    if (timeLeft <= 0) {
      finish();
      return;
    }

    // 玩家移动
    let mx = 0, my = 0;
    if (keys.has("w") || keys.has("arrowup")) my = -1;
    if (keys.has("s") || keys.has("arrowdown")) my = 1;
    if (keys.has("a") || keys.has("arrowleft")) mx = -1;
    if (keys.has("d") || keys.has("arrowright")) mx = 1;
    const len = Math.sqrt(mx * mx + my * my) || 1;
    player.vx = (mx / len) * player.speed;
    player.vy = (my / len) * player.speed;
    player.x = Math.max(20, Math.min(MW - 20, player.x + player.vx));
    player.y = Math.max(30, Math.min(MH - 30, player.y + player.vy));

    // 入口激活
    if (exitPortal && !exitPortal.active && collected.length >= 3) {
      exitPortal.active = true;
      exitActive = true;
    }

    // 收集物品
    for (const item of items) {
      if (item.collected) continue;
      const dx = player.x - item.x;
      const dy = player.y - item.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        item.collected = true;
        collected.push(item);
        spawnParticles(item.x, item.y, item.color, 8);
      }
    }

    // 更新生物
    for (const c of creatures) {
      if (!c.alive) continue;
      updateCreatureAI(c, player, 1);
      c.x = Math.max(30, Math.min(MW - 30, c.x));
      c.y = Math.max(30, Math.min(MH - 30, c.y));
    }

    // 交互提示
    interactionHint = null;
    for (const c of creatures) {
      if (!c.alive) continue;
      const dx = c.x - player.x;
      const dy = c.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 50 && c.catalog.class === "inspiration") {
        interactionHint = { creature: c, text: "E 观察  R 记录  F 捕获" };
      } else if (dist < 55 && c.catalog.class === "hybrid") {
        interactionHint = { creature: c, text: "F 净化" };
      }
    }

    // 出口提示
    if (exitActive) {
      const dx = player.x - exitPortal.x;
      const dy = player.y - exitPortal.y;
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        interactionHint = { exit: true, text: "E 返回墨境" };
      }
    }

    // 粒子
    for (const p of particles) { p.life--; p.x += p.vx; p.y += p.vy; }
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }

    if (messageTimer > 0) messageTimer--;

    // 相机
    camera.x += (player.x - SW / 2 - camera.x) * 0.1;
    camera.y += (player.y - SH / 2 - camera.y) * 0.1;
    camera.x = Math.max(0, Math.min(MW - SW, camera.x));
    camera.y = Math.max(0, Math.min(MH - SH, camera.y));
  }

  function handleKey(key) {
    if (key === "e" && interactionHint?.exit) {
      finish();
      return true;
    }
    if (!interactionHint?.creature || !interactionHint.creature.alive) return false;

    const c = interactionHint.creature;
    if (key === "e") {
      showMessage(`观察 ${c.catalog.name}：${c.catalog.codexEntry.summary.slice(0, 30)}...`);
      return true;
    }
    if (key === "r") {
      c.recordProgress += 40;
      if (c.recordProgress >= 100) {
        showMessage(`记录成功！${c.catalog.name}`, "#2e7d32");
        c.recordProgress = 0;
      } else {
        showMessage(`记录中 ${Math.round(c.recordProgress)}%`);
      }
      return true;
    }
    if (key === "f") {
      c.captureProgress += 30;
      if (c.captureProgress >= 100) {
        showMessage(`捕获成功！${c.catalog.name}`, "#2e7d32");
        c.alive = false;
        spawnParticles(c.x, c.y, "#f0d9a5", 15);
        // 头奖检测
        const jackpot = tryJackpot(c.catalog.id);
        if (jackpot) {
          collected.push({ item: jackpot, isJackpot: true });
          showMessage(`！！！头奖！${jackpot.name}`, "#c9a846", 200);
        }
      } else {
        showMessage(`捕获中 ${Math.round(c.captureProgress)}%`);
      }
      return true;
    }
    return false;
  }

  function finish() {
    finished = true;
    // 结算发现物
    const discoveries = rollDiscovery(gateType, collected.length || 3);
    // 把采集物也加入
    const allDiscoveries = [...discoveries];
    for (const c of collected) {
      if (c.isJackpot) allDiscoveries.push(c.item);
    }
    onComplete(allDiscoveries, gateType);
  }

  function draw(ctx) {
    const cx = camera.x;
    const cy = camera.y;

    // 背景
    ctx.fillStyle = config.tileColor;
    ctx.fillRect(0, 0, SW, SH);

    // 网格纹理（根据类型）
    if (gateType === "ai_template") {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      for (let x = -(cx % 32); x < SW; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SH); ctx.stroke();
      }
      for (let y = -(cy % 32); y < SH; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SW, y); ctx.stroke();
      }
    } else if (gateType === "warm_doodle") {
      // 蜡笔纹理
      ctx.fillStyle = "rgba(0,0,0,0.02)";
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(Math.random() * SW, Math.random() * SH, Math.random() * 20 + 3, 1);
      }
    }

    // 物品
    for (const item of items) {
      if (item.collected) continue;
      const sx = item.x - cx;
      const sy = item.y - cy;
      if (sx < -20 || sx > SW + 20 || sy < -20 || sy > SH + 20) continue;

      item.pulse += 0.05;
      const scale = 1 + Math.sin(item.pulse) * 0.3;

      ctx.fillStyle = item.color;
      ctx.globalAlpha = 0.7 + Math.sin(item.pulse) * 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, item.size * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 生物
    for (const c of creatures) {
      if (!c.alive) continue;
      const sx = c.x - cx;
      const sy = c.y - cy;
      if (sx < -40 || sx > SW + 40 || sy < -40 || sy > SH + 40) continue;

      const cat = c.catalog;
      ctx.fillStyle = cat.color;
      ctx.fillRect(sx - cat.size.w / 2, sy - cat.size.h / 2, cat.size.w, cat.size.h);

      // 简单标签
      ctx.fillStyle = "#fff";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(cat.name, sx, sy - cat.size.h / 2 - 4);
      ctx.textAlign = "start";
    }

    // 出口
    if (exitPortal) {
      const ex = exitPortal.x - cx;
      const ey = exitPortal.y - cy;
      if (exitActive) {
        ctx.fillStyle = "rgba(240,217,165,0.6)";
        ctx.beginPath();
        ctx.arc(ex, ey, 20 + Math.sin(Date.now() / 300) * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = exitActive ? "#f0d9a5" : "#555";
      ctx.fillRect(ex - 8, ey - 8, 16, 16);
      if (exitActive) {
        ctx.fillStyle = "#fff";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("返回", ex, ey - 16);
        ctx.textAlign = "start";
      }
    }

    // 玩家
    const px = player.x - cx;
    const py = player.y - cy;
    ctx.fillStyle = "#2d2d2d";
    ctx.fillRect(px - player.w / 2, py - player.h / 2, player.w, player.h);
    ctx.fillStyle = "#f5efe0";
    ctx.fillRect(px + 1, py - 3, 3, 3);

    // 交互提示
    if (interactionHint) {
      const hx = interactionHint.creature
        ? interactionHint.creature.x - cx
        : exitPortal.x - cx;
      const hy = (interactionHint.creature
        ? interactionHint.creature.y - 30
        : exitPortal.y - 30) - cy;
      const text = interactionHint.text;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.font = "10px sans-serif";
      const tw = ctx.measureText(text).width;
      ctx.fillRect(hx - tw / 2 - 4, hy - 8, tw + 8, 15);
      ctx.fillStyle = "#f0d9a5";
      ctx.textAlign = "center";
      ctx.fillText(text, hx, hy + 3);
      ctx.textAlign = "start";
    }

    // 粒子
    for (const p of particles) {
      ctx.globalAlpha = p.life / 30;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cx - p.size / 2, p.y - cy - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // 消息
    if (messageText && messageTimer > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      const tw = ctx.measureText(messageText).width;
      ctx.fillRect(SW / 2 - tw / 2 - 12, SH - 50, tw + 24, 24);
      ctx.fillStyle = "#f0d9a5";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(messageText, SW / 2, SH - 33);
      ctx.textAlign = "start";
    }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(8, 8, 180, 40);
    ctx.fillStyle = "#fff";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${config.name}  |  已收集 ${collected.length}  时间 ${Math.ceil(timeLeft / 60)}s`, 16, 24);
    ctx.fillText("WASD 移动  E/R/F 交互  收集3个后出口开启", 16, 40);
  }

  function showMessage(text, color, duration) {
    messageText = text;
    messageTimer = duration || 80;
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.8) * 2,
        life: 15 + Math.random() * 15, color, size: 2 + Math.random() * 2,
      });
    }
  }

  return { start, update, handleKey, draw };
}
