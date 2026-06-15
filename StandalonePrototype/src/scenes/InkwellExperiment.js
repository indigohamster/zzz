// InkwellExperiment.js v3 — Canvas Rift 集成版本
// 画稿裂口系统：探索发现 → 进入陌生画稿 → 从另一位置返回

import { H, TILE, W, WORLD_H, WORLD_W, Tile, tileColors } from "../core/config.js";
import { label, drawPaperBackground } from "../core/render.js";
import { drawInkwellBackground } from "../inkwell/Background.js";
import { drawInkwellLighting } from "../inkwell/Lighting.js";
import { createPlayer } from "../inkwell/Player.js?v=32";
import { createTileMap } from "../inkwell/TileMap.js";
import { createPhysics } from "../inkwell/Physics.js";
import { CREATURE_CATALOG } from "../ecology/CreatureCatalog.js";
import { createCreatureInstance, updateCreatureAI, damageCreature } from "../ecology/CreatureAI.js";
import { createInspirationSystem } from "../ecology/InspirationSystem.js";
import { createDiscoveryJournal } from "../ecology/DiscoveryJournal.js";
import {
  RIFT_TYPES, RIFT_VISUALS, shouldSpawnRift, rollRiftType,
  createRiftInstance, findNearestRift, updateRifts, drawRifts,
} from "../ecology/CanvasRift.js";
import { createRiftWorld } from "../ecology/RiftWorld.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// 地图结构：纵向分层
const LAYER_DEF = {
  shallow: { name: "浅层草稿区", yMin: 2, yMax: 14, color: "#d8cfb8", dangerLevel: "低" },
  middle:  { name: "中层废稿区", yMin: 18, yMax: 32, color: "#67665f", dangerLevel: "中" },
  deep:    { name: "深层模板污染区", yMin: 36, yMax: 48, color: "#1c1c22", dangerLevel: "高" },
};

function getLayerAtTileY(ty) {
  if (ty <= LAYER_DEF.shallow.yMax) return "shallow";
  if (ty <= LAYER_DEF.middle.yMax) return "middle";
  return "deep";
}

export function createInkwellExperiment({ keys, mouse, weapon, getFrame, onFinish }) {
  const camera = { x: 0, y: 0 };
  const run = {
    discoveries: 0, chasedFox: false, foundNook: false,
    enteredDark: false, enteredDeep: false, enteredRift: false,
    riftsEntered: 0, riftTypes: [], totalRiftDiscoveries: 0,
    currentLayer: "shallow",
  };

  const tileMap = createTileMap(ctx);
  const physics = createPhysics(tileMap);
  const inspiration = createInspirationSystem(100);
  const journal = createDiscoveryJournal();

  let rifts = [];               // 画稿裂口列表
  let inRiftWorld = false;      // 当前是否在裂口子世界
  let currentRiftWorld = null;  // 当前裂口子世界实例
  let exitFromRiftPos = null;   // 从裂口返回的位置 { x, y }
  let nestedRiftPending = null; // 嵌套裂口待处理

  function buildExplorationMap() {
    tileMap.generate();

    const rooms = [
      // === 浅层 y: 2-14 ===
      { id: "entrance", x: 3,  y: 3,  w: 16, h: 12, type: "entrance" },
      { id: "meadow",   x: 22, y: 3,  w: 50, h: 12, type: "explore" },
      { id: "passage",  x: 75, y: 5,  w: 12, h: 10, type: "passage" },
      { id: "nook",     x: 90, y: 3,  w: 12, h: 9,  type: "nook" },
      { id: "exit",     x: 105,y: 3,  w: 10, h: 10, type: "exit" },

      // === 中层 y: 18-32 ===
      { id: "darkzone", x: 22, y: 18, w: 48, h: 16, type: "dark" },

      // === 深层 y: 36-48 ===
      { id: "deepink",  x: 22, y: 36, w: 42, h: 14, type: "deep_ink" },
    ];

    function fillRoom(room, fillType) {
      for (let ty = room.y; ty < room.y + room.h; ty++) {
        for (let tx = room.x; tx < room.x + room.w; tx++) {
          const isEdge = ty === room.y || ty === room.y + room.h - 1 || tx === room.x || tx === room.x + room.w - 1;
          if (fillType === "dark" || fillType === "deep_ink") {
            tileMap.setTile(tx, ty, isEdge ? Tile.Paper : Tile.Ink);
            tileMap.setVariant(tx, ty, Math.random() < 0.5 ? 0 : 1);
          } else {
            tileMap.setTile(tx, ty, Tile.Paper);
            tileMap.setVariant(tx, ty, Math.random() < 0.3 ? 0 : 1);
          }
        }
      }
    }

    for (const room of rooms) {
      const t = room.type === "dark" || room.type === "deep_ink" ? "dark" : "paper";
      fillRoom(room, t);
    }

    // 通道
    function carveH(x, y, w) { for (let tx = x; tx < x + w; tx++) { tileMap.setTile(tx, y, Tile.Air); tileMap.setTile(tx, y+1, Tile.Air); } }
    function carveV(x, y, h) { for (let ty = y; ty < y + h; ty++) { tileMap.setTile(x, ty, Tile.Air); tileMap.setTile(x+1, ty, Tile.Air); } }

    carveH(19, 8, 4);    // entrance → meadow
    carveH(72, 9, 4);    // meadow → passage
    carveH(87, 9, 4);    // passage → nook
    carveH(102, 8, 3);   // passage → exit
    carveV(45, 15, 4);   // meadow ↓ darkzone
    carveV(42, 34, 3);   // darkzone ↓ deepink
    // 中层到深层的另一个通道
    carveH(65, 25, 6);   // darkzone 横向
    carveV(80, 28, 9);   // 向下到深层

    tileMap.setRooms(rooms);

    // === 画稿裂口生成 ===
    rifts = [];
    spawnRiftsOnMap();
  }

  function spawnRiftsOnMap() {
    // 按层级概率生成裂口，使用确定性位置
    const candidates = [
      // 浅层 (10%)
      { x: 28 * TILE, y: 8 * TILE, layer: "shallow" },
      { x: 50 * TILE, y: 6 * TILE, layer: "shallow" },
      { x: 65 * TILE, y: 10 * TILE, layer: "shallow" },
      { x: 85 * TILE, y: 7 * TILE, layer: "shallow" },
      // 中层 (20%)
      { x: 30 * TILE, y: 24 * TILE, layer: "middle" },
      { x: 50 * TILE, y: 22 * TILE, layer: "middle" },
      { x: 60 * TILE, y: 28 * TILE, layer: "middle" },
      { x: 70 * TILE, y: 20 * TILE, layer: "middle" },
      { x: 80 * TILE, y: 26 * TILE, layer: "middle" },
      // 深层 (35%)
      { x: 30 * TILE, y: 42 * TILE, layer: "deep" },
      { x: 45 * TILE, y: 40 * TILE, layer: "deep" },
      { x: 55 * TILE, y: 44 * TILE, layer: "deep" },
      { x: 78 * TILE, y: 42 * TILE, layer: "deep" },
    ];

    for (const c of candidates) {
      if (shouldSpawnRift(c.layer, "explore")) {
        const typeId = rollRiftType(c.layer);
        const rift = createRiftInstance(typeId, c.x, c.y, c.layer);
        if (rift) rifts.push(rift);
      }
    }

    // 深层危险区域必定有一个
    const deepRift = createRiftInstance(rollRiftType("deep"), 62 * TILE, 44 * TILE, "deep");
    if (deepRift) rifts.push(deepRift);
  }

  const playerController = createPlayer({
    canvas, keys, mouse, weapon, tileMap, physics,
    getCamera: () => camera,
    getToolMode: () => 1,
    getFrame,
    onAttack: () => {},
    run,
  });
  const player = playerController.state;

  const creatures = [];
  let strangeBlob = null;
  let sketchFox = null;
  let darkPresence = null;
  let deepEntity = null;
  const particles = [];
  let messageText = "";
  let messageTimer = 0;
  let showJournal = false;
  let finished = false;

  function start() {
    finished = false; inRiftWorld = false; currentRiftWorld = null;
    exitFromRiftPos = null; nestedRiftPending = null;
    creatures.length = 0; particles.length = 0;
    messageText = ""; messageTimer = 0; showJournal = false;
    run.discoveries = 0; run.chasedFox = false; run.foundNook = false;
    run.enteredDark = false; run.enteredDeep = false; run.enteredRift = false;
    run.riftsEntered = 0; run.riftTypes = []; run.totalRiftDiscoveries = 0;
    run.currentLayer = "shallow";

    buildExplorationMap();
    playerController.reset();
    inspiration.reset(100);
    camera.x = 0; camera.y = 0;

    // 奇怪生物
    strangeBlob = createCreatureInstance(CREATURE_CATALOG.ink_blob, 8 * TILE, 9 * TILE);
    strangeBlob.glowPhase = 0; strangeBlob.isStrange = true;
    journal.entries[CREATURE_CATALOG.ink_blob.id] = "unseen";

    // 线稿狐
    sketchFox = createCreatureInstance(CREATURE_CATALOG.sketch_fox, 40 * TILE, 9 * TILE);
    sketchFox.fleeingToNook = false;
    sketchFox.nookX = 93 * TILE; sketchFox.nookY = 8 * TILE;

    // 黑暗存在
    darkPresence = { x: 45 * TILE, y: 24 * TILE, active: false, pulse: 0, rewardFound: false };

    // 深层实体
    deepEntity = { x: 40 * TILE, y: 42 * TILE, pulse: 0, observed: false };

    creatures.push(strangeBlob, sketchFox);
    updateLayerHUD();
  }

  function updateLayerHUD() {
    const px = player.centerX ?? player.x;
    const py = player.centerY ?? player.y;
    const ty = Math.floor(py / TILE);
    run.currentLayer = getLayerAtTileY(ty);
  }

  function update() {
    if (finished) return;

    // 裂口子世界
    if (inRiftWorld) {
      updateRiftWorld();
      return;
    }

    playerController.update();
    const px = player.centerX ?? player.x;
    const py = player.centerY ?? player.y;
    updateLayerHUD();

    for (const c of creatures) {
      if (!c.alive) continue;
      updateCreatureAI(c, { x: px, y: py }, 1);
    }

    // 线稿狐追逐
    if (sketchFox.alive && !sketchFox.fleeingToNook) {
      const d = Math.hypot(sketchFox.x - px, sketchFox.y - py);
      if (d < 120) { sketchFox.fleeingToNook = true; run.chasedFox = true; showMessage("线稿狐被惊动了！它往深处跑去..."); }
    }
    if (sketchFox.fleeingToNook && sketchFox.alive) {
      const fdx = sketchFox.x - sketchFox.nookX, fdy = sketchFox.y - sketchFox.nookY;
      const fd = Math.hypot(fdx, fdy);
      if (fd < 20) {
        sketchFox.x = sketchFox.nookX; sketchFox.y = sketchFox.nookY;
        sketchFox.alive = false; run.foundNook = true; run.discoveries++;
        inspiration.onDiscover(sketchFox.catalog);
        showMessage("线稿狐消失了，留下一间隐藏的速写室。", "#f0d9a5", 250);
        spawnParticles(sketchFox.nookX, sketchFox.nookY, "#f0d9a5", 15);
      } else {
        const s = 2.5;
        sketchFox.x -= (fdx / fd) * s; sketchFox.y -= (fdy / fd) * s;
      }
    }

    // 奇怪生物观察
    if (strangeBlob.alive) {
      strangeBlob.glowPhase += 0.03;
      const d = Math.hypot(strangeBlob.x - px, strangeBlob.y - py);
      if (d < 50 && journal.entries[CREATURE_CATALOG.ink_blob.id] === "unseen") {
        journal.markSeen(CREATURE_CATALOG.ink_blob.id);
        inspiration.onDiscover(strangeBlob.catalog);
        run.discoveries++;
        showMessage("发现奇怪生物：墨团兽。它不攻击，只是好奇地看着你。", "#c9a846", 250);
      }
    }

    // 黑暗区域
    const inDark = px > 22*TILE && px < 70*TILE && py > 20*TILE && py < 32*TILE;
    darkPresence.active = inDark;
    if (inDark) {
      darkPresence.pulse += 0.05; inspiration.tick(0.12);
      if (!run.enteredDark) { run.enteredDark = true; showMessage("进入中层废稿区 [危险等级: 中]", "#8d1d25", 200); }
      if (Math.random() < 0.003 && !darkPresence.rewardFound) {
        darkPresence.rewardFound = true; run.discoveries++;
        inspiration.onDiscover({ discoveryReward: { inspiration: 25, recordInspiration: 0, captureInspiration: 0 } });
        showMessage("在黑暗中摸到了一张被删除的角色设定稿！", "#c9a846", 300);
        spawnParticles(px, py, "#c9a846", 20);
      }
    }

    // 深层
    const inDeep = px > 22*TILE && px < 64*TILE && py > 38*TILE && py < 50*TILE;
    if (inDeep) {
      deepEntity.pulse += 0.04;
      inspiration.tick(0.18);
      if (!run.enteredDeep) { run.enteredDeep = true; showMessage("深入模板污染区 [危险等级: 高] — 完美但生硬的图像在周围重复", "#6b3a6b", 250); }
      if (!deepEntity.observed && Math.random() < 0.004) {
        deepEntity.observed = true; run.discoveries += 2;
        inspiration.onDiscover({ discoveryReward: { inspiration: 35, recordInspiration: 0, captureInspiration: 0 } });
        showMessage("你发现了一个畸变体：半手绘半模板的生物在痛苦地闪烁。", "#c9a846", 350);
        spawnParticles(px, py, "#d8a0d8", 25);
      }
    }

    // 画稿裂口动画
    updateRifts(rifts);

    inspiration.tick(0.03);
    for (const p of particles) { p.life--; p.x += p.vx; p.y += p.vy; }
    for (let i = particles.length - 1; i >= 0; i--) { if (particles[i].life <= 0) particles.splice(i, 1); }
    if (messageTimer > 0) messageTimer--; else messageText = "";
    updateCamera();
  }

  // === 裂口子世界 ===
  function enterRiftWorld(rift) {
    rift.entered = true;
    run.enteredRift = true;
    run.riftsEntered++;
    if (!run.riftTypes.includes(rift.type)) run.riftTypes.push(rift.type);

    currentRiftWorld = createRiftWorld(rift.type, onRiftComplete, rift.nestDepth || 0);
    currentRiftWorld.start();
    inRiftWorld = true;

    // 记录玩家退出位置（从裂口附近的另一个位置返回）
    exitFromRiftPos = {
      x: rift.x + (Math.random() - 0.5) * 6 * TILE,
      y: rift.y + (Math.random() - 0.5) * 4 * TILE,
    };
    showMessage(`进入 ${rift.config.name}：${rift.config.desc}`, rift.config.color, 200);
  }

  function updateRiftWorld() {
    if (!currentRiftWorld) return;
    currentRiftWorld.update(keys);
    // onRiftComplete callback handles all exit + reward processing
  }

  function onRiftComplete(reward) {
    run.totalRiftDiscoveries += (reward.itemsCollected || 0);
    run.discoveries += (reward.itemsCollected || 0);
    if (reward.jackpot) {
      showMessage(`!!! 头奖！${reward.jackpot.name}`, "#c9a846", 300);
      run.discoveries += 5;
    }
    exitRiftWorld();
  }

  function exitRiftWorld() {
    inRiftWorld = false;
    currentRiftWorld = null;

    // 玩家从裂口附近的另一个位置出现
    if (exitFromRiftPos) {
      player.x = exitFromRiftPos.x;
      player.y = exitFromRiftPos.y;
    }
    showMessage("从画稿中返回墨境... 你出现在了一个不同的位置。", "#8b8173", 200);
    exitFromRiftPos = null;
    updateCamera();
  }

  function handleKey(key) {
    if (showJournal) { if (key === "j") showJournal = false; return; }
    if (key === "j") { showJournal = true; return; }

    // 裂口子世界内
    if (inRiftWorld && currentRiftWorld) {
      const result = currentRiftWorld.handleKey(key);
      if (result === true) {
        exitRiftWorld();
      } else if (result?.nestRift) {
        // 嵌套裂口：进入更深的画稿
        const nestType = rollRiftType("deep");
        currentRiftWorld = createRiftWorld(nestType, onRiftComplete, result.nestDepth);
        currentRiftWorld.start();
        showMessage(`在画稿中发现了另一个裂口... 你进入了第 ${result.nestDepth + 1} 层。`, "#c084fc", 250);
        nestedRiftPending = null;
      }
      return;
    }

    const px = player.centerX ?? player.x;
    const py = player.centerY ?? player.y;

    // 画稿裂口交互
    if (key === "e") {
      const nearest = findNearestRift(rifts, px, py, 60);
      if (nearest) {
        enterRiftWorld(nearest);
        return;
      }
    }

    // 撤离点
    if (key === "e") {
      const inExit = px > 105*TILE && px < 115*TILE && py > 4*TILE && py < 12*TILE;
      if (inExit) finish();
    }
  }

  function finish() { finished = true; onFinish?.(run); }

  function updateCamera() {
    const px = player.centerX ?? player.x, py = player.centerY ?? player.y;
    camera.x += (px - W*0.45 - camera.x) * 0.14;
    camera.y += (py - H*0.48 - camera.y) * 0.1;
    camera.x = Math.max(0, Math.min(WORLD_W*TILE - W, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_H*TILE - H, camera.y));
  }

  function draw() {
    if (finished) { drawSummary(); return; }
    if (inRiftWorld) { drawRiftWorldView(); return; }

    const dc = { x: camera.x, y: camera.y };
    drawInkwellBackground(ctx, dc);
    tileMap.draw(dc.x, dc.y);

    // 深度层遮罩
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(22*TILE-dc.x, 18*TILE-dc.y, 48*TILE, 16*TILE);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(22*TILE-dc.x, 36*TILE-dc.y, 42*TILE, 14*TILE);

    // 奇怪生物
    if (strangeBlob.alive) {
      const sx=strangeBlob.x-dc.x, sy=strangeBlob.y-dc.y, g=strangeBlob.glowPhase||0;
      const grad=ctx.createRadialGradient(sx,sy,6,sx,sy,24);
      grad.addColorStop(0,`rgba(201,168,70,${0.4+Math.sin(g)*0.2})`); grad.addColorStop(1,"rgba(201,168,70,0)");
      ctx.fillStyle=grad; ctx.fillRect(sx-24,sy-24,48,48);
      ctx.fillStyle="#4a3a2a"; ctx.beginPath(); ctx.ellipse(sx,sy+Math.sin(g)*1.5,16,10,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#f5efe0"; ctx.beginPath(); ctx.arc(sx+4,sy-2,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#1a1816"; ctx.beginPath(); ctx.arc(sx+5,sy-2,1.5,0,Math.PI*2); ctx.fill();
    }

    // 线稿狐
    if (sketchFox.alive) {
      const sx=sketchFox.x-dc.x, sy=sketchFox.y-dc.y;
      ctx.fillStyle="#5a5a4a"; ctx.fillRect(sx-12,sy-8,24,16);
      ctx.fillStyle="#f5efe0"; ctx.fillRect(sx+3,sy-3,3,3);
    }

    // 隐藏速写室
    if (run.foundNook) {
      const nx=90*TILE-dc.x, ny=3*TILE-dc.y;
      ctx.fillStyle="rgba(240,217,165,0.12)"; ctx.fillRect(nx,ny,12*TILE,9*TILE);
      ctx.fillStyle="#e8dcc8"; ctx.fillRect(nx+30,ny+20,18,12);
      ctx.strokeStyle="#8b8173"; ctx.lineWidth=1; ctx.strokeRect(nx+30,ny+20,18,12);
      ctx.fillStyle="#4a4a4a"; ctx.fillRect(nx+36,ny+42,14,8);
      ctx.fillStyle="#f5efe0"; ctx.fillRect(nx+40,ny+43,2,2);
    }

    // 黑暗存在
    if (darkPresence.active) {
      const dx=darkPresence.x-dc.x, dy=darkPresence.y-dc.y, p=Math.sin(darkPresence.pulse)*0.2+0.3;
      ctx.fillStyle=`rgba(20,10,20,${p})`; ctx.beginPath();
      ctx.ellipse(dx,dy,30+Math.sin(darkPresence.pulse*2)*8,40,0,0,Math.PI*2); ctx.fill();
    }

    // 深层实体
    if (deepEntity.pulse > 2) {
      const dx=deepEntity.x-dc.x, dy=deepEntity.y-dc.y, p=Math.sin(deepEntity.pulse)*0.15+0.15;
      ctx.fillStyle=`rgba(100,40,120,${p})`;
      ctx.beginPath(); ctx.ellipse(dx,dy,55+Math.sin(deepEntity.pulse)*15,30,0,0,Math.PI*2); ctx.fill();
    }

    // === 画稿裂口 ===
    drawRifts(ctx, rifts, dc.x, dc.y);

    // 裂口交互提示
    const pp = player.centerX ?? player.x;
    const ppy = player.centerY ?? player.y;
    const nearRift = findNearestRift(rifts, pp, ppy, 60);
    if (nearRift) {
      const rx = nearRift.x - dc.x, ry = nearRift.y - dc.y;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      const labelText = `E 进入 ${nearRift.config.name}`;
      const tw = ctx.measureText(labelText).width;
      ctx.fillRect(rx - tw/2 - 6, ry - 40, tw + 12, 16);
      ctx.fillStyle = nearRift.config.color;
      ctx.font = "10px Segoe UI, Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labelText, rx, ry - 28);
      ctx.textAlign = "start";
    }

    // 撤离点
    const ex=110*TILE-dc.x, ey=7*TILE-dc.y;
    ctx.fillStyle="rgba(100,200,100,0.15)"; ctx.fillRect(ex-16,ey-16,32,32);
    ctx.strokeStyle="rgba(100,200,100,0.4)"; ctx.lineWidth=1; ctx.setLineDash([3,5]); ctx.strokeRect(ex-16,ey-16,32,32); ctx.setLineDash([]);

    drawInkwellLighting(ctx, { camera:dc, player, tileMap, npcs:[] });
    playerController.draw(ctx, dc.x, dc.y);

    for (const p of particles) {
      ctx.globalAlpha=Math.min(1,p.life/30); ctx.fillStyle=p.color;
      ctx.fillRect(p.x-dc.x-p.size/2,p.y-dc.y-p.size/2,p.size,p.size);
    }
    ctx.globalAlpha=1;

    drawHUD();

    if (messageText && messageTimer > 0) {
      const a=Math.min(1,messageTimer/30); ctx.globalAlpha=a;
      ctx.fillStyle="rgba(26,24,22,0.88)";
      const mw=Math.min(600,ctx.measureText(messageText).width+30);
      ctx.fillRect(W/2-mw/2,H-64,mw,26);
      ctx.fillStyle="#f0d9a5"; ctx.font="12px Segoe UI, Microsoft YaHei, sans-serif";
      ctx.textAlign="center"; ctx.fillText(messageText,W/2,H-46); ctx.textAlign="start";
      ctx.globalAlpha=1;
    }
    if (showJournal) drawJournal();
  }

  function drawRiftWorldView() {
    if (!currentRiftWorld) return;
    // 将裂口世界的 640x360 渲染到 960x540 画布中央
    const ox = (W - 640) / 2;
    const oy = (H - 360) / 2;

    // 暗色边框
    ctx.fillStyle = "#0a0806";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(ox, oy);
    currentRiftWorld.draw(ctx);
    ctx.restore();

    // 边框
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 2, oy - 2, 644, 364);

    // 裂口世界 HUD
    ctx.fillStyle = "rgba(192,132,252,0.8)";
    ctx.font = "bold 11px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText("画稿裂口", ox + 8, oy + 18);
  }

  function drawHUD() {
    const bx = 8, by = H - 28;
    const layerInfo = LAYER_DEF[run.currentLayer] || LAYER_DEF.shallow;

    // 精力条
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx, by, 100, 8);
    ctx.fillStyle = inspiration.state.energy > 30 ? "#4a9e4a" : "#d32f2f";
    ctx.fillRect(bx, by, 100 * inspiration.state.energy / 100, 8);

    // 灵感条
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx, by + 11, 100, 8);
    ctx.fillStyle = inspiration.state.inspiration > 50 ? "#c9a846" : "#6b5a3a";
    ctx.fillRect(bx, by + 11, inspiration.state.inspiration, 8);

    // 深度标签
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(W - 220, 8, 212, 40);
    ctx.fillStyle = layerInfo.color;
    ctx.font = "bold 11px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(`深度: ${layerInfo.name}`, W - 210, 24);
    ctx.fillStyle = run.currentLayer === "deep" ? "#d32f2f" : run.currentLayer === "middle" ? "#c9a846" : "#4a9e4a";
    ctx.fillText(`危险: ${layerInfo.dangerLevel}`, W - 210, 40);

    // 发现物
    ctx.fillStyle = "#8b8173";
    ctx.font = "9px sans-serif";
    ctx.fillText(`发现 ${run.discoveries}`, W - 70, H - 12);
    ctx.fillText("J 图鉴", W - 70, H - 2);

    // 裂口提示
    if (run.riftsEntered > 0) {
      ctx.fillStyle = "#c084fc";
      ctx.font = "9px sans-serif";
      ctx.fillText(`裂口 ${run.riftsEntered}`, W - 70, H - 26);
    }
  }

  function drawJournal() {
    ctx.fillStyle = "rgba(26,24,22,0.9)"; ctx.fillRect(0, 0, W, H);
    const px = 100, py = 80, pw = W - 200, ph = H - 160;
    ctx.fillStyle = "#f5efe0"; ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#2d2d2d"; ctx.lineWidth = 2; ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = "#1a1816";
    ctx.font = "bold 16px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText("发现图鉴", px + 20, py + 28);

    const entries = journal.getAllEntries().filter(e => e.status !== "unseen");
    if (entries.length === 0) {
      ctx.fillStyle = "#555"; ctx.font = "13px sans-serif"; ctx.fillText("尚未发现任何生物", px + 20, py + 60);
    } else {
      let y = py + 60;
      for (const e of entries) {
        ctx.fillStyle = "#c9a846"; ctx.font = "bold 13px sans-serif"; ctx.fillText(e.name, px + 20, y); y += 20;
        ctx.fillStyle = "#3a3630"; ctx.font = "11px sans-serif";
        ctx.fillText((e.note || e.summary || "").slice(0, 60), px + 20, y); y += 26;
      }
    }

    // 裂口记录
    if (run.riftsEntered > 0) {
      ctx.fillStyle = "#c084fc";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`已探索裂口: ${run.riftsEntered} (${run.riftTypes.length} 种类型)`, px + 20, py + ph - 40);
    }
    ctx.fillStyle = "#8b8173"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("J 关闭", W / 2, py + ph - 8); ctx.textAlign = "start";
  }

  function drawSummary() {
    ctx.fillStyle = "rgba(26,24,22,0.95)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f0d9a5"; ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("探索结束", W / 2, 70);
    ctx.fillStyle = "#8b8173"; ctx.font = "14px sans-serif";
    ctx.fillText(`发现 ${run.discoveries} 项`, W / 2, 110);

    const items = [
      run.foundNook ? "发现隐藏速写室" : null,
      run.enteredDark ? "进入中层废稿区" : null,
      run.enteredDeep ? "深入模板污染区" : null,
      run.enteredRift ? `探索 ${run.riftsEntered} 个画稿裂口 (${run.totalRiftDiscoveries} 发现物)` : null,
    ].filter(Boolean);

    let y = 160;
    for (const item of items) { ctx.fillStyle = "#2e7d32"; ctx.fillText(item, W / 2, y); y += 30; }

    if (run.riftTypes.length > 0) {
      ctx.fillStyle = "#c084fc";
      ctx.fillText(`裂口类型: ${run.riftTypes.map(t => RIFT_TYPES[t]?.name || t).join(", ")}`, W / 2, y);
      y += 40;
    }

    ctx.fillStyle = "#555"; ctx.font = "12px sans-serif"; ctx.fillText("Enter 返回", W / 2, y + 40); ctx.textAlign = "start";
  }

  function showMessage(text, color, duration) { messageText = text; messageTimer = duration || 150; }
  function spawnParticles(x, y, color, count) { for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.8) * 2, life: 18 + Math.random() * 18, color, size: 2 + Math.random() * 3 }); }

  return { start, update, draw, handleKey, finish: () => finish() };
}
