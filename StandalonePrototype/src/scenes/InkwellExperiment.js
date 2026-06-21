// InkwellExperiment.js v3 �� Canvas Rift ���ɰ汾
// �����ѿ�ϵͳ��̽������ �� ����İ������ �� ����һλ�÷���

import { H, TILE, W, WORLD_H, WORLD_W, Tile, tileColors } from "../core/config.js?v=27";
import { label, drawPaperBackground } from "../core/render.js";
import { drawInkwellBackground } from "../inkwell/Background.js";
import { drawInkwellLighting } from "../inkwell/Lighting.js";
import { createPlayer } from "../inkwell/Player.js?v=36";
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
import { createRiftWorld } from "../ecology/RiftWorld.js?v=3";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// ��ͼ�ṹ������ֲ�
const LAYER_DEF = {
  shallow: { name: "ǳ��ݸ���", yMin: 2, yMax: 14, color: "#d8cfb8", dangerLevel: "��" },
  middle:  { name: "�в�ϸ���", yMin: 18, yMax: 32, color: "#67665f", dangerLevel: "��" },
  deep:    { name: "���ģ����Ⱦ��", yMin: 36, yMax: 48, color: "#1c1c22", dangerLevel: "��" },
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

  let rifts = [];               // �����ѿ��б�
  let inRiftWorld = false;      // ��ǰ�Ƿ����ѿ�������
  let currentRiftWorld = null;  // ��ǰ�ѿ�������ʵ��
  let exitFromRiftPos = null;   // ���ѿڷ��ص�λ�� { x, y }
  let nestedRiftPending = null; // Ƕ���ѿڴ�����

  function buildExplorationMap() {
    tileMap.generate();

    const rooms = [
      // === ǳ�� y: 2-14 ===
      { id: "entrance", x: 3,  y: 3,  w: 16, h: 12, type: "entrance" },
      { id: "meadow",   x: 22, y: 3,  w: 50, h: 12, type: "explore" },
      { id: "passage",  x: 75, y: 5,  w: 12, h: 10, type: "passage" },
      { id: "nook",     x: 90, y: 3,  w: 12, h: 9,  type: "nook" },
      { id: "exit",     x: 105,y: 3,  w: 10, h: 10, type: "exit" },

      // === �в� y: 18-32 ===
      { id: "darkzone", x: 22, y: 18, w: 48, h: 16, type: "dark" },

      // === ��� y: 36-48 ===
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

    // ͨ��
    function carveH(x, y, w) { for (let tx = x; tx < x + w; tx++) { tileMap.setTile(tx, y, Tile.Air); tileMap.setTile(tx, y+1, Tile.Air); } }
    function carveV(x, y, h) { for (let ty = y; ty < y + h; ty++) { tileMap.setTile(x, ty, Tile.Air); tileMap.setTile(x+1, ty, Tile.Air); } }

    carveH(19, 8, 4);    // entrance �� meadow
    carveH(72, 9, 4);    // meadow �� passage
    carveH(87, 9, 4);    // passage �� nook
    carveH(102, 8, 3);   // passage �� exit
    carveV(45, 15, 4);   // meadow �� darkzone
    carveV(42, 34, 3);   // darkzone �� deepink
    // �в㵽������һ��ͨ��
    carveH(65, 25, 6);   // darkzone ����
    carveV(80, 28, 9);   // ���µ����

    tileMap.setRooms(rooms);

    // === �����ѿ����� ===
    rifts = [];
    spawnRiftsOnMap();
  }

  function spawnRiftsOnMap() {
    // ���㼶���������ѿڣ�ʹ��ȷ����λ��
    const candidates = [
      // ǳ�� (10%)
      { x: 28 * TILE, y: 8 * TILE, layer: "shallow" },
      { x: 50 * TILE, y: 6 * TILE, layer: "shallow" },
      { x: 65 * TILE, y: 10 * TILE, layer: "shallow" },
      { x: 85 * TILE, y: 7 * TILE, layer: "shallow" },
      // �в� (20%)
      { x: 30 * TILE, y: 24 * TILE, layer: "middle" },
      { x: 50 * TILE, y: 22 * TILE, layer: "middle" },
      { x: 60 * TILE, y: 28 * TILE, layer: "middle" },
      { x: 70 * TILE, y: 20 * TILE, layer: "middle" },
      { x: 80 * TILE, y: 26 * TILE, layer: "middle" },
      // ��� (35%)
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

    // ���Σ������ض���һ��
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

    // �������
    strangeBlob = createCreatureInstance(CREATURE_CATALOG.ink_blob, 8 * TILE, 9 * TILE);
    strangeBlob.glowPhase = 0; strangeBlob.isStrange = true;
    journal.entries[CREATURE_CATALOG.ink_blob.id] = "unseen";

    // �߸��
    sketchFox = createCreatureInstance(CREATURE_CATALOG.sketch_fox, 40 * TILE, 9 * TILE);
    sketchFox.fleeingToNook = false;
    sketchFox.nookX = 93 * TILE; sketchFox.nookY = 8 * TILE;

    // �ڰ�����
    darkPresence = { x: 45 * TILE, y: 24 * TILE, active: false, pulse: 0, rewardFound: false };

    // ���ʵ��
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

    // �ѿ�������
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

    // �߸��׷��
    if (sketchFox.alive && !sketchFox.fleeingToNook) {
      const d = Math.hypot(sketchFox.x - px, sketchFox.y - py);
      if (d < 120) { sketchFox.fleeingToNook = true; run.chasedFox = true; showMessage("�߸���������ˣ��������ȥ..."); }
    }
    if (sketchFox.fleeingToNook && sketchFox.alive) {
      const fdx = sketchFox.x - sketchFox.nookX, fdy = sketchFox.y - sketchFox.nookY;
      const fd = Math.hypot(fdx, fdy);
      if (fd < 20) {
        sketchFox.x = sketchFox.nookX; sketchFox.y = sketchFox.nookY;
        sketchFox.alive = false; run.foundNook = true; run.discoveries++;
        inspiration.onDiscover(sketchFox.catalog);
        showMessage("�߸����ʧ�ˣ�����һ�����ص���д�ҡ�", "#f0d9a5", 250);
        spawnParticles(sketchFox.nookX, sketchFox.nookY, "#f0d9a5", 15);
      } else {
        const s = 2.5;
        sketchFox.x -= (fdx / fd) * s; sketchFox.y -= (fdy / fd) * s;
      }
    }

    // �������۲�
    if (strangeBlob.alive) {
      strangeBlob.glowPhase += 0.03;
      const d = Math.hypot(strangeBlob.x - px, strangeBlob.y - py);
      if (d < 50 && journal.entries[CREATURE_CATALOG.ink_blob.id] === "unseen") {
        journal.markSeen(CREATURE_CATALOG.ink_blob.id);
        inspiration.onDiscover(strangeBlob.catalog);
        run.discoveries++;
        showMessage("����������ī���ޡ�����������ֻ�Ǻ���ؿ����㡣", "#c9a846", 250);
      }
    }

    // �ڰ�����
    const inDark = px > 22*TILE && px < 70*TILE && py > 20*TILE && py < 32*TILE;
    darkPresence.active = inDark;
    if (inDark) {
      darkPresence.pulse += 0.05; inspiration.tick(0.12);
      if (!run.enteredDark) { run.enteredDark = true; showMessage("�����в�ϸ��� [Σ�յȼ�: ��]", "#8d1d25", 200); }
      if (Math.random() < 0.003 && !darkPresence.rewardFound) {
        darkPresence.rewardFound = true; run.discoveries++;
        inspiration.onDiscover({ discoveryReward: { inspiration: 25, recordInspiration: 0, captureInspiration: 0 } });
        showMessage("�ںڰ���������һ�ű�ɾ���Ľ�ɫ�趨�壡", "#c9a846", 300);
        spawnParticles(px, py, "#c9a846", 20);
      }
    }

    // ���
    const inDeep = px > 22*TILE && px < 64*TILE && py > 38*TILE && py < 50*TILE;
    if (inDeep) {
      deepEntity.pulse += 0.04;
      inspiration.tick(0.18);
      if (!run.enteredDeep) { run.enteredDeep = true; showMessage("����ģ����Ⱦ�� [Σ�յȼ�: ��] �� ��������Ӳ��ͼ������Χ�ظ�", "#6b3a6b", 250); }
      if (!deepEntity.observed && Math.random() < 0.004) {
        deepEntity.observed = true; run.discoveries += 2;
        inspiration.onDiscover({ discoveryReward: { inspiration: 35, recordInspiration: 0, captureInspiration: 0 } });
        showMessage("�㷢����һ�������壺���ֻ��ģ���������ʹ�����˸��", "#c9a846", 350);
        spawnParticles(px, py, "#d8a0d8", 25);
      }
    }

    // �����ѿڶ���
    updateRifts(rifts);

    inspiration.tick(0.03);
    for (const p of particles) { p.life--; p.x += p.vx; p.y += p.vy; }
    for (let i = particles.length - 1; i >= 0; i--) { if (particles[i].life <= 0) particles.splice(i, 1); }
    if (messageTimer > 0) messageTimer--; else messageText = "";
    updateCamera();
  }

  // === �ѿ������� ===
  function enterRiftWorld(rift) {
    rift.entered = true;
    run.enteredRift = true;
    run.riftsEntered++;
    if (!run.riftTypes.includes(rift.type)) run.riftTypes.push(rift.type);

    currentRiftWorld = createRiftWorld(rift.type, onRiftComplete, rift.nestDepth || 0);
    currentRiftWorld.start();
    inRiftWorld = true;

    // ��¼����˳�λ�ã����ѿڸ�������һ��λ�÷��أ�
    exitFromRiftPos = {
      x: rift.x + (Math.random() - 0.5) * 6 * TILE,
      y: rift.y + (Math.random() - 0.5) * 4 * TILE,
    };
    showMessage(`���� ${rift.config.name}��${rift.config.desc}`, rift.config.color, 200);
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
      showMessage(`!!! ͷ����${reward.jackpot.name}`, "#c9a846", 300);
      run.discoveries += 5;
    }
    exitRiftWorld();
  }

  function exitRiftWorld() {
    inRiftWorld = false;
    currentRiftWorld = null;

    // ��Ҵ��ѿڸ�������һ��λ�ó���
    if (exitFromRiftPos) {
      player.x = exitFromRiftPos.x;
      player.y = exitFromRiftPos.y;
    }
    showMessage("�ӻ����з���ī��... ���������һ����ͬ��λ�á�", "#8b8173", 200);
    exitFromRiftPos = null;
    updateCamera();
  }

  function handleKey(key) {
    if (showJournal) { if (key === "j") showJournal = false; return; }
    if (key === "j") { showJournal = true; return; }

    // �ѿ���������
    if (inRiftWorld && currentRiftWorld) {
      const result = currentRiftWorld.handleKey(key);
      if (result === true) {
        exitRiftWorld();
      } else if (result?.nestRift) {
        // Ƕ���ѿڣ��������Ļ���
        const nestType = rollRiftType("deep");
        currentRiftWorld = createRiftWorld(nestType, onRiftComplete, result.nestDepth);
        currentRiftWorld.start();
        showMessage(`�ڻ����з�������һ���ѿ�... ������˵� ${result.nestDepth + 1} �㡣`, "#c084fc", 250);
        nestedRiftPending = null;
      }
      return;
    }

    const px = player.centerX ?? player.x;
    const py = player.centerY ?? player.y;

    // �����ѿڽ���
    if (key === "e") {
      const nearest = findNearestRift(rifts, px, py, 60);
      if (nearest) {
        enterRiftWorld(nearest);
        return;
      }
    }

    // �����
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

    // ��Ȳ�����
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(22*TILE-dc.x, 18*TILE-dc.y, 48*TILE, 16*TILE);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(22*TILE-dc.x, 36*TILE-dc.y, 42*TILE, 14*TILE);

    // �������
    if (strangeBlob.alive) {
      const sx=strangeBlob.x-dc.x, sy=strangeBlob.y-dc.y, g=strangeBlob.glowPhase||0;
      const grad=ctx.createRadialGradient(sx,sy,6,sx,sy,24);
      grad.addColorStop(0,`rgba(201,168,70,${0.4+Math.sin(g)*0.2})`); grad.addColorStop(1,"rgba(201,168,70,0)");
      ctx.fillStyle=grad; ctx.fillRect(sx-24,sy-24,48,48);
      ctx.fillStyle="#4a3a2a"; ctx.beginPath(); ctx.ellipse(sx,sy+Math.sin(g)*1.5,16,10,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#f5efe0"; ctx.beginPath(); ctx.arc(sx+4,sy-2,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#1a1816"; ctx.beginPath(); ctx.arc(sx+5,sy-2,1.5,0,Math.PI*2); ctx.fill();
    }

    // �߸��
    if (sketchFox.alive) {
      const sx=sketchFox.x-dc.x, sy=sketchFox.y-dc.y;
      ctx.fillStyle="#5a5a4a"; ctx.fillRect(sx-12,sy-8,24,16);
      ctx.fillStyle="#f5efe0"; ctx.fillRect(sx+3,sy-3,3,3);
    }

    // ������д��
    if (run.foundNook) {
      const nx=90*TILE-dc.x, ny=3*TILE-dc.y;
      ctx.fillStyle="rgba(240,217,165,0.12)"; ctx.fillRect(nx,ny,12*TILE,9*TILE);
      ctx.fillStyle="#e8dcc8"; ctx.fillRect(nx+30,ny+20,18,12);
      ctx.strokeStyle="#8b8173"; ctx.lineWidth=1; ctx.strokeRect(nx+30,ny+20,18,12);
      ctx.fillStyle="#4a4a4a"; ctx.fillRect(nx+36,ny+42,14,8);
      ctx.fillStyle="#f5efe0"; ctx.fillRect(nx+40,ny+43,2,2);
    }

    // �ڰ�����
    if (darkPresence.active) {
      const dx=darkPresence.x-dc.x, dy=darkPresence.y-dc.y, p=Math.sin(darkPresence.pulse)*0.2+0.3;
      ctx.fillStyle=`rgba(20,10,20,${p})`; ctx.beginPath();
      ctx.ellipse(dx,dy,30+Math.sin(darkPresence.pulse*2)*8,40,0,0,Math.PI*2); ctx.fill();
    }

    // ���ʵ��
    if (deepEntity.pulse > 2) {
      const dx=deepEntity.x-dc.x, dy=deepEntity.y-dc.y, p=Math.sin(deepEntity.pulse)*0.15+0.15;
      ctx.fillStyle=`rgba(100,40,120,${p})`;
      ctx.beginPath(); ctx.ellipse(dx,dy,55+Math.sin(deepEntity.pulse)*15,30,0,0,Math.PI*2); ctx.fill();
    }

    // === �����ѿ� ===
    drawRifts(ctx, rifts, dc.x, dc.y);

    // �ѿڽ�����ʾ
    const pp = player.centerX ?? player.x;
    const ppy = player.centerY ?? player.y;
    const nearRift = findNearestRift(rifts, pp, ppy, 60);
    if (nearRift) {
      const rx = nearRift.x - dc.x, ry = nearRift.y - dc.y;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      const labelText = `E ���� ${nearRift.config.name}`;
      const tw = ctx.measureText(labelText).width;
      ctx.fillRect(rx - tw/2 - 6, ry - 40, tw + 12, 16);
      ctx.fillStyle = nearRift.config.color;
      ctx.font = "10px Segoe UI, Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labelText, rx, ry - 28);
      ctx.textAlign = "start";
    }

    // �����
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
    // ���ѿ������ 640x360 ��Ⱦ�� 960x540 ��������
    const ox = (W - 640) / 2;
    const oy = (H - 360) / 2;

    // ��ɫ�߿�
    ctx.fillStyle = "#0a0806";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(ox, oy);
    currentRiftWorld.draw(ctx);
    ctx.restore();

    // �߿�
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 2, oy - 2, 644, 364);

    // �ѿ����� HUD
    ctx.fillStyle = "rgba(192,132,252,0.8)";
    ctx.font = "bold 11px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText("�����ѿ�", ox + 8, oy + 18);
  }

  function drawHUD() {
    const bx = 8, by = H - 28;
    const layerInfo = LAYER_DEF[run.currentLayer] || LAYER_DEF.shallow;

    // ������
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx, by, 100, 8);
    ctx.fillStyle = inspiration.state.energy > 30 ? "#4a9e4a" : "#d32f2f";
    ctx.fillRect(bx, by, 100 * inspiration.state.energy / 100, 8);

    // �����
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx, by + 11, 100, 8);
    ctx.fillStyle = inspiration.state.inspiration > 50 ? "#c9a846" : "#6b5a3a";
    ctx.fillRect(bx, by + 11, inspiration.state.inspiration, 8);

    // ��ȱ�ǩ
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(W - 220, 8, 212, 40);
    ctx.fillStyle = layerInfo.color;
    ctx.font = "bold 11px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(`���: ${layerInfo.name}`, W - 210, 24);
    ctx.fillStyle = run.currentLayer === "deep" ? "#d32f2f" : run.currentLayer === "middle" ? "#c9a846" : "#4a9e4a";
    ctx.fillText(`Σ��: ${layerInfo.dangerLevel}`, W - 210, 40);

    // ������
    ctx.fillStyle = "#8b8173";
    ctx.font = "9px sans-serif";
    ctx.fillText(`���� ${run.discoveries}`, W - 70, H - 12);
    ctx.fillText("J ͼ��", W - 70, H - 2);

    // �ѿ���ʾ
    if (run.riftsEntered > 0) {
      ctx.fillStyle = "#c084fc";
      ctx.font = "9px sans-serif";
      ctx.fillText(`�ѿ� ${run.riftsEntered}`, W - 70, H - 26);
    }
  }

  function drawJournal() {
    ctx.fillStyle = "rgba(26,24,22,0.9)"; ctx.fillRect(0, 0, W, H);
    const px = 100, py = 80, pw = W - 200, ph = H - 160;
    ctx.fillStyle = "#f5efe0"; ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#2d2d2d"; ctx.lineWidth = 2; ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = "#1a1816";
    ctx.font = "bold 16px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText("����ͼ��", px + 20, py + 28);

    const entries = journal.getAllEntries().filter(e => e.status !== "unseen");
    if (entries.length === 0) {
      ctx.fillStyle = "#555"; ctx.font = "13px sans-serif"; ctx.fillText("��δ�����κ�����", px + 20, py + 60);
    } else {
      let y = py + 60;
      for (const e of entries) {
        ctx.fillStyle = "#c9a846"; ctx.font = "bold 13px sans-serif"; ctx.fillText(e.name, px + 20, y); y += 20;
        ctx.fillStyle = "#3a3630"; ctx.font = "11px sans-serif";
        ctx.fillText((e.note || e.summary || "").slice(0, 60), px + 20, y); y += 26;
      }
    }

    // �ѿڼ�¼
    if (run.riftsEntered > 0) {
      ctx.fillStyle = "#c084fc";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`��̽���ѿ�: ${run.riftsEntered} (${run.riftTypes.length} ������)`, px + 20, py + ph - 40);
    }
    ctx.fillStyle = "#8b8173"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("J �ر�", W / 2, py + ph - 8); ctx.textAlign = "start";
  }

  function drawSummary() {
    ctx.fillStyle = "rgba(26,24,22,0.95)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f0d9a5"; ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("̽������", W / 2, 70);
    ctx.fillStyle = "#8b8173"; ctx.font = "14px sans-serif";
    ctx.fillText(`���� ${run.discoveries} ��`, W / 2, 110);

    const items = [
      run.foundNook ? "����������д��" : null,
      run.enteredDark ? "�����в�ϸ���" : null,
      run.enteredDeep ? "����ģ����Ⱦ��" : null,
      run.enteredRift ? `̽�� ${run.riftsEntered} �������ѿ� (${run.totalRiftDiscoveries} ������)` : null,
    ].filter(Boolean);

    let y = 160;
    for (const item of items) { ctx.fillStyle = "#2e7d32"; ctx.fillText(item, W / 2, y); y += 30; }

    if (run.riftTypes.length > 0) {
      ctx.fillStyle = "#c084fc";
      ctx.fillText(`�ѿ�����: ${run.riftTypes.map(t => RIFT_TYPES[t]?.name || t).join(", ")}`, W / 2, y);
      y += 40;
    }

    ctx.fillStyle = "#555"; ctx.font = "12px sans-serif"; ctx.fillText("Enter ����", W / 2, y + 40); ctx.textAlign = "start";
  }

  function showMessage(text, color, duration) { messageText = text; messageTimer = duration || 150; }
  function spawnParticles(x, y, color, count) { for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.8) * 2, life: 18 + Math.random() * 18, color, size: 2 + Math.random() * 3 }); }

  return { start, update, draw, handleKey, finish: () => finish() };
}
