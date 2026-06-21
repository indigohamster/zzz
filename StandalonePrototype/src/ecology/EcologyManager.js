// EcologyManager.js — 墨境生态系统管理器
// 轻量集成层，挂载到现有 inkwell 场景

import { CREATURE_CATALOG, getAllCreatureIds } from "./CreatureCatalog.js?v=1";
import { createCreatureInstance, updateCreatureAI, damageCreature, canInteract, getToolBonus } from "./CreatureAI.js";
import { createInspirationSystem } from "./InspirationSystem.js";
import { createDiscoveryJournal } from "./DiscoveryJournal.js";
import { CREATURE_CLASS, INTERACTION } from "./CreatureTypes.js";

export function createEcologyManager({ player, run, getCamera }) {
  const inspiration = createInspirationSystem(100);
  const journal = createDiscoveryJournal();
  const ecoCreatures = [];
  const particles = [];
  let messageText = "";
  let messageTimer = 0;
  let messageColor = "#f0d9a5";
  let showJournal = false;
  let interactionHint = null;

  function reset() {
    ecoCreatures.length = 0;
    particles.length = 0;
    messageText = "";
    messageTimer = 0;
    showJournal = false;
    interactionHint = null;
    inspiration.reset(player.maxHp ?? 100);
  }

  // 在当前房间生成生态生物
  function spawnForRoom(room) {
    if (!room) return;
    const cx = room.x * 8 + room.w * 4;
    const cy = room.y * 8 + room.h * 4;

    // 根据房间类型决定生成什么
    if (room.type === "draft_gate" || room.id === "entrance" || room.x < 30) {
      // Draft Gate：灵感生物
      ecoCreatures.push(createCreatureInstance(CREATURE_CATALOG.ink_blob, cx - 60, cy - 20));
      ecoCreatures.push(createCreatureInstance(CREATURE_CATALOG.ink_blob, cx + 40, cy + 30));
    }
    if (room.type === "combat") {
      // Combat room 旁边可能有线稿狐
      if (Math.random() < 0.5) {
        ecoCreatures.push(createCreatureInstance(CREATURE_CATALOG.sketch_fox, cx + Math.random() * 80 - 40, cy - 30));
      }
    }
    if (room.type === "resource") {
      // 资源房可能有速写鸟飞过
      ecoCreatures.push(createCreatureInstance(CREATURE_CATALOG.gesture_bird, cx + 200, cy - 60));
    }
    if (room.type === "boss") {
      // Boss 房周围有模板生物和畸变体
      ecoCreatures.push(createCreatureInstance(CREATURE_CATALOG.template_wolf, cx + 120, cy));
      ecoCreatures.push(createCreatureInstance(CREATURE_CATALOG.half_sketched_fox, cx + 200, cy - 40));
    }
  }

  // 生成 Draft Gate 入口生物（游戏开始时调用）
  function spawnEntranceCreatures(worldX = 200, worldY = 260) {
    ecoCreatures.push(createCreatureInstance(CREATURE_CATALOG.ink_blob, worldX + 40, worldY - 40));
    ecoCreatures.push(createCreatureInstance(CREATURE_CATALOG.ink_blob, worldX - 30, worldY + 20));
    ecoCreatures.push(createCreatureInstance(CREATURE_CATALOG.revision_wraith, worldX + 200, worldY + 60));
  }

  function update() {
    if (showJournal) return;

    // 灵感流逝
    inspiration.tick(0.04);

    // 更新生物
    for (const c of ecoCreatures) {
      if (!c.alive) continue;
      const px = player.centerX ?? player.x;
      const py = player.centerY ?? player.y;
      updateCreatureAI(c, { x: px, y: py }, 1);
    }

    // 交互提示
    interactionHint = null;
    const px = player.centerX ?? player.x;
    const py = player.centerY ?? player.y;
    for (const c of ecoCreatures) {
      if (!c.alive) continue;
      const dx = c.x - px;
      const dy = c.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      c.lastPlayerDistance = dist;

      if (dist < 60 && c.catalog.class === CREATURE_CLASS.INSPIRATION) {
        interactionHint = { creature: c, text: "E 观察  R 记录  F 捕获" };
      } else if (dist < 70 && c.catalog.class === CREATURE_CLASS.HYBRID) {
        interactionHint = { creature: c, text: "F 净化 (需毛笔)  空格 击败" };
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
  }

  function handleKey(key) {
    if (key === "j") { showJournal = !showJournal; return true; }
    if (showJournal) return false;
    if (!interactionHint || !interactionHint.creature.alive) return false;

    const c = interactionHint.creature;
    if (key === "e") { handleObserve(c); return true; }
    if (key === "r") { handleRecord(c); return true; }
    if (key === "f") { handleCapture(c); return true; }
    return false;
  }

  function handleObserve(creature) {
    const cat = creature.catalog;
    const isFirst = journal.markSeen(cat.id);
    const reward = inspiration.onDiscover(cat);
    showMessage(`${isFirst ? "新发现！" : ""}${cat.name}：${cat.codexEntry.summary.slice(0, 25)}... 灵感+${reward.inspirationGained}`);
  }

  function handleRecord(creature) {
    const cat = creature.catalog;
    if (cat.captureDifficulty < 1) { showMessage(`${cat.name} 无法记录`, "#d32f2f"); return; }
    const toolId = "brush"; // 暂时默认毛笔
    const bonus = getToolBonus(creature, toolId);
    creature.recordProgress += 35 * bonus;
    if (creature.recordProgress >= 100) {
      const isFirst = journal.markRecorded(cat.id);
      const reward = inspiration.onRecord(cat);
      showMessage(`${isFirst ? "录入图鉴！" : ""}${cat.name} 灵感+${reward.inspirationGained}`, "#2e7d32");
      creature.recordProgress = 0;
      if (isFirst) spawnParticles(creature.x, creature.y, "#f0d9a5", 12);
    } else {
      showMessage(`记录 ${cat.name} ${Math.round(creature.recordProgress)}%`, "#f0d9a5", 40);
    }
  }

  function handleCapture(creature) {
    const cat = creature.catalog;
    if (cat.class === CREATURE_CLASS.HYBRID) {
      if (inspiration.state.inspiration < 60) { showMessage("灵感不足，无法净化（需>60）", "#d32f2f"); return; }
      creature.captureProgress += 30;
      if (creature.captureProgress >= 100) {
        journal.markCaptured(cat.id);
        const reward = inspiration.onCapture(cat);
        showMessage(`净化成功！${cat.name} 灵感+${reward.inspirationGained} 母题碎片+${cat.discoveryReward.fragments}`, "#2e7d32");
        creature.alive = false;
        spawnParticles(creature.x, creature.y, "#a0d9a5", 20);
      } else {
        showMessage(`净化中 ${Math.round(creature.captureProgress)}%`, "#a0d9a5", 40);
      }
    } else {
      creature.captureProgress += 25;
      if (creature.captureProgress >= 100) {
        journal.markCaptured(cat.id);
        const reward = inspiration.onCapture(cat);
        showMessage(`捕获成功！${cat.name} 灵感+${reward.inspirationGained}`, "#2e7d32");
        creature.alive = false;
        spawnParticles(creature.x, creature.y, "#f0d9a5", 15);
      } else {
        showMessage(`捕获中 ${Math.round(creature.captureProgress)}%`, "#f0d9a5", 40);
      }
    }
  }

  function onAttackHit(worldX, worldY) {
    // 检测是否击中生态生物
    for (const c of ecoCreatures) {
      if (!c.alive) continue;
      const dx = c.x - worldX;
      const dy = c.y - worldY;
      if (Math.sqrt(dx * dx + dy * dy) < 36) {
        damageCreature(c, 6);
        if (!c.alive) {
          inspiration.onRepeatKill();
          spawnParticles(c.x, c.y, c.catalog.color, 8);
        }
        return c;
      }
    }
    return null;
  }

  function draw(ctx, cameraX, cameraY) {
    if (showJournal) { drawJournal(ctx); return; }

    // 生物
    for (const c of ecoCreatures) {
      if (!c.alive) continue;
      const sx = c.x - cameraX;
      const sy = c.y - cameraY;
      if (sx < -50 || sx > 1010 || sy < -50 || sy > 590) continue;
      drawCreature(ctx, c, sx, sy);
    }

    // 交互提示
    if (interactionHint && interactionHint.creature.alive) {
      const c = interactionHint.creature;
      const sx = c.x - cameraX;
      const sy = c.y - cameraY - 26;
      const text = interactionHint.text;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.font = "11px Segoe UI, Microsoft YaHei, sans-serif";
      const tw = ctx.measureText(text).width;
      ctx.fillRect(sx - tw / 2 - 6, sy - 10, tw + 12, 18);
      ctx.fillStyle = "#f0d9a5";
      ctx.textAlign = "center";
      ctx.fillText(text, sx, sy + 3);
      ctx.textAlign = "start";
    }

    // 粒子
    for (const p of particles) {
      ctx.globalAlpha = Math.min(1, p.life / 40);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cameraX - p.size / 2, p.y - cameraY - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // 消息
    if (messageText && messageTimer > 0) {
      const alpha = Math.min(1, messageTimer / 30);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(26,24,22,0.85)";
      const mw = Math.min(600, ctx.measureText(messageText).width + 30);
      ctx.fillRect(480 - mw / 2, 460, mw, 28);
      ctx.fillStyle = messageColor;
      ctx.font = "13px Segoe UI, Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(messageText, 480, 480);
      ctx.textAlign = "start";
      ctx.globalAlpha = 1;
    }

    // HUD
    drawEcoHud(ctx);
  }

  function drawCreature(ctx, c, sx, sy) {
    const cat = c.catalog;
    const { w, h } = cat.size;
    const status = journal.entries[cat.id] || "unseen";

    ctx.save();
    ctx.translate(sx, sy);
    if (c.facing < 0) ctx.scale(-1, 1);

    // 阴影
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w, h);

    // 主体
    ctx.fillStyle = cat.color;

    switch (cat.class) {
      case CREATURE_CLASS.INSPIRATION: {
        const bob = Math.sin(Date.now() / 500 + (cat.id?.length || 1)) * 1.5;
        ctx.beginPath();
        ctx.ellipse(0, bob, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // 眼睛
        ctx.fillStyle = "#f5efe0";
        ctx.fillRect(3, -h * 0.2, 4, 4);
        ctx.fillStyle = "#1a1816";
        ctx.fillRect(4, -h * 0.2 + 1, 2, 2);
        break;
      }
      case CREATURE_CLASS.NEGATIVE: {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = i % 2 === 0 ? w * 0.45 : w * 0.3;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * h * 0.45);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#f5efe0";
        ctx.fillRect(3, -3, 5, 5);
        ctx.fillStyle = "#1a1816";
        ctx.fillRect(4, -2, 3, 3);
        break;
      }
      case CREATURE_CLASS.TEMPLATE: {
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 0.5;
        for (let i = -w / 2; i < w / 2; i += 5) {
          ctx.beginPath(); ctx.moveTo(i, -h / 2); ctx.lineTo(i, h / 2); ctx.stroke();
        }
        ctx.fillStyle = "#f5efe0";
        ctx.fillRect(5, -3, 4, 4);
        break;
      }
      case CREATURE_CLASS.HYBRID: {
        ctx.beginPath();
        ctx.ellipse(-w * 0.12, 0, w * 0.28, h * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(2, -h / 2, w * 0.32, h);
        const flicker = Math.sin(Date.now() / 300) * 0.3 + 0.5;
        ctx.strokeStyle = `rgba(255,180,180,${flicker})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(2, -h / 2); ctx.lineTo(2, h / 2); ctx.stroke();
        ctx.fillStyle = "#f5efe0";
        ctx.fillRect(5, -3, 3, 3);
        break;
      }
    }

    ctx.restore();

    // 名字标签
    const markers = { captured: " ★", recorded: " ✓", seen: " ○", unseen: "" };
    const classColors = { inspiration: "#4a9e4a", negative: "#d32f2f", template: "#1565c0", hybrid: "#e65100" };
    ctx.fillStyle = classColors[cat.class] || "#888";
    ctx.font = "9px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(cat.name + (markers[status] || ""), sx, sy + h / 2 + 12);
    ctx.textAlign = "start";
  }

  function drawEcoHud(ctx) {
    const W = 960, H = 540;
    const bx = 10, by = H - 50, barW = 140, barH = 10;

    // 精力
    ctx.fillStyle = "#1a1816";
    ctx.fillRect(bx, by, barW, barH);
    const ep = inspiration.state.energy / inspiration.state.maxEnergy;
    ctx.fillStyle = ep > 0.3 ? "#4a9e4a" : "#d32f2f";
    ctx.fillRect(bx, by, barW * ep, barH);
    ctx.strokeStyle = "#5c554c"; ctx.strokeRect(bx, by, barW, barH);
    ctx.fillStyle = "#ccc"; ctx.font = "9px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(`精力 ${Math.round(inspiration.state.energy)}`, bx + 2, by + 9);

    // 灵感
    const iy = by + 14;
    ctx.fillStyle = "#1a1816";
    ctx.fillRect(bx, iy, barW, barH);
    const ip = inspiration.state.inspiration / 100;
    ctx.fillStyle = ip > 0.5 ? "#c9a846" : "#6b5a3a";
    ctx.fillRect(bx, iy, barW * ip, barH);
    ctx.strokeStyle = "#5c554c"; ctx.strokeRect(bx, iy, barW, barH);
    ctx.fillStyle = "#ccc"; ctx.font = "9px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(`灵感 ${Math.round(inspiration.state.inspiration)}`, bx + 2, iy + 9);

    // 图鉴完成度
    const comp = journal.getCompletion();
    ctx.fillStyle = "#8b8173";
    ctx.font = "10px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(`图鉴 ${comp}%  J`, bx + barW + 10, iy + 9);

    // 稀有事件提示
    if (inspiration.canTriggerRareEvent()) {
      ctx.fillStyle = "rgba(201,168,70,0.7)";
      ctx.fillText("✦ 稀有事件可能", bx, iy + 26);
    }
  }

  function drawJournal(ctx) {
    const W = 960, H = 540;
    ctx.fillStyle = "rgba(26,24,22,0.88)";
    ctx.fillRect(0, 0, W, H);

    const px = 80, py = 40, pw = W - 160, ph = H - 80;
    ctx.fillStyle = "#f5efe0";
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#2d2d2d"; ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    ctx.fillStyle = "#1a1816";
    ctx.font = "bold 18px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText("发现图鉴", px + 20, py + 30);

    const entries = journal.getAllEntries();
    const cols = 2, colW = (pw - 60) / cols;
    entries.forEach((e, i) => {
      const cx = px + 20 + (i % cols) * colW;
      const cy = py + 55 + Math.floor(i / cols) * 65;
      const icons = { captured: "★", recorded: "✓", seen: "○", unseen: "？" };
      const sColors = { captured: "#2e7d32", recorded: "#c9a846", seen: "#8b8173", unseen: "#555" };
      ctx.fillStyle = sColors[e.status] || "#555";
      ctx.font = "bold 13px Segoe UI, Microsoft YaHei, sans-serif";
      ctx.fillText(`${icons[e.status]} ${e.name}`, cx, cy);
      ctx.fillStyle = "#8b8173";
      ctx.font = "9px sans-serif";
      ctx.fillText(`${e.nameEn} · ${e.rarity}`, cx, cy + 15);
      if (e.status !== "unseen") {
        ctx.fillStyle = "#3a3630";
        ctx.font = "10px sans-serif";
        const s = e.summary || "";
        ctx.fillText(s.slice(0, 32) + (s.length > 32 ? "..." : ""), cx, cy + 30);
      }
    });

    ctx.fillStyle = "#8b8173"; ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("按 J 关闭", W / 2, py + ph - 10);
    ctx.textAlign = "start";
  }

  function showMessage(text, color, duration) {
    messageText = text; messageColor = color || "#f0d9a5"; messageTimer = duration || 120;
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.8) * 2,
        life: 18 + Math.random() * 18, color, size: 2 + Math.random() * 3,
      });
    }
  }

  return {
    inspiration,
    journal,
    ecoCreatures,
    reset,
    spawnForRoom,
    spawnEntranceCreatures,
    update,
    handleKey,
    onAttackHit,
    draw,
  };
}
