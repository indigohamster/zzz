// SubMapScene.js — 画稿子世界场景
// 3 种子地图类型：温馨涂鸦 / 恐怖草图 / AI 模板画稿

import { CREATURE_CATALOG } from "./CreatureCatalog.js?v=1";
import { createCreatureInstance, updateCreatureAI, damageCreature } from "./CreatureAI.js";
import { rollDiscovery, tryJackpot } from "./DiscoveryItems.js";
import { GATE_TYPES } from "./CanvasGate.js";
import { drawCenteredModelSprite } from "../core/SpriteAssets.js?v=3";
import { drawProtagonistAt } from "../characters/protagonist/ProtagonistSprite.js?v=28";

const SW = 640;  // 子地图视口宽度
const SH = 360;  // 子地图视口高度
const MW = 800;  // 地图世界宽度
const MH = 480;  // 地图世界高度

const CONTENT_RULES = {
  warm_doodle: [
    { name: "会跑的太阳", required: 4, intro: "太阳在纸边乱跑，笑声会把碎片弹起来。" },
    { name: "蜡笔星座", required: 4, intro: "孩子把星星画在白天，线条之间藏着回忆。" },
    { name: "纸船下午", required: 3, intro: "一条蜡笔河穿过画面，纸船载着没人署名的愿望。" },
  ],
  horror_sketch: [
    { name: "橡皮擦巡逻", required: 3, intro: "一块看不见的橡皮在巡逻，被擦到会丢失时间。" },
    { name: "门缝里的眼睛", required: 3, intro: "门缝会盯着你，停太久会被画面往回拽。" },
    { name: "反复描黑", required: 4, intro: "线条越描越黑，安全的空白正在缩小。" },
  ],
  ai_template: [
    { name: "完美网格", required: 3, intro: "网格试图把你吸回标准位置，异常碎片藏在错位处。" },
    { name: "复制层", required: 4, intro: "每个东西都有影印版本，只有不对称的那一个是真的。" },
    { name: "提示词墓碑", required: 3, intro: "关键词像墓碑一样排队，错误的像素正在长出来。" },
  ],
};

const ROOM_KIND_LABELS = {
  explore: "探索房",
  combat: "战斗房",
  anomaly: "异常房",
  reward: "奖励房",
  event: "事件房",
  hazard: "危险房",
  chase: "追逐房",
};

const CONTRACTS = {
  warm_doodle: [
    { name: "找回纸船愿望", goal: "完成 3 个房间目标，让纸船把出口画出来。", requiredRooms: 3 },
    { name: "记录会跑的太阳", goal: "调查事件房和追逐房，带回一段会动的童年线条。", requiredRooms: 3 },
  ],
  horror_sketch: [
    { name: "关掉门缝里的眼睛", goal: "清理战斗房并稳定异常房，否则出口不会出现。", requiredRooms: 3 },
    { name: "保住被圈出的空白", goal: "拆除危险源，拿走空白里的发现物。", requiredRooms: 3 },
  ],
  ai_template: [
    { name: "破坏完美网格", goal: "解码异常房，击退复制训练室里的模板生物。", requiredRooms: 3 },
    { name: "偷出越界像素", goal: "在模板规则发现你之前完成 3 个房间目标。", requiredRooms: 3 },
  ],
};

const OBJECTIVE_LABELS = {
  explore: "调查线索",
  event: "修复事件核心",
  anomaly: "稳定异常",
  hazard: "拆除危险源",
  chase: "标记移动轨迹",
  reward: "选择奖励",
};

const OBJECTIVE_KEYS = ["e", "r", "f"];
const KEY_LABELS = { e: "E", r: "R", f: "F" };

export function createSubMapScene(gateType, onComplete) {
  const config = GATE_TYPES[gateType];
  let creatures = [];
  let items = [];        // 可采集的发现物
  let collected = [];    // 已收集
  let player = { x: 60, y: MH / 2, w: 14, h: 22, vx: 0, vy: 0, speed: 2.8, facing: 1, walkFrame: 0 };
  let camera = { x: 0, y: 0 };
  let finished = false;
  let messageText = "";
  let messageColor = "#f0d9a5";
  let messageTimer = 0;
  let particles = [];
  let features = [];
  let hazards = [];
  let rooms = [];
  let currentRoomId = null;
  let roomVisits = new Set();
  let roomMessageCooldown = 0;
  let backgroundMarks = [];
  let worldRule = null;
  let contract = null;
  let objectiveNodes = [];
  let completedRoomIds = new Set();
  let contractBonus = 0;
  let outcome = null;
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
    player.facing = 1;
    player.walkFrame = 0;
    finished = false;
    messageText = "";
    messageColor = "#f0d9a5";
    messageTimer = 0;
    particles = [];
    features = [];
    hazards = [];
    rooms = [];
    currentRoomId = null;
    roomVisits = new Set();
    roomMessageCooldown = 0;
    backgroundMarks = [];
    worldRule = pickRule(gateType);
    contract = pickContract(gateType);
    objectiveNodes = [];
    completedRoomIds = new Set();
    contractBonus = 0;
    outcome = createOutcomeTracker();
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
    showMessage(`${contract.name}：${contract.goal}`, config.color, 180);
  }

  function buildWarmDoodle() {
    addRoom("event", "会跑的太阳操场", 86, 48, 255, 150, "#f2b84b", "太阳会换位置，笑声碎片藏在光线旁。");
    addRoom("explore", "蜡笔河岸", 76, 258, 330, 125, "#7dd3fc", "沿着河边找纸船，水流会把愿望冲到出口。");
    addRoom("reward", "纸片野餐桌", 424, 138, 230, 135, "#f0d9a5", "安全但古怪的小奖励区，桌布下面常有故事碎片。");
    addRoom("chase", "墨团追逐场", 510, 282, 220, 120, "#6d5b4f", "墨团会乱窜，靠近时可以观察、记录或捕获。");

    creatures.push(createCreatureInstance(CREATURE_CATALOG.ink_blob, 200, 120));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.ink_blob, 575, 330));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.sketch_fox, 500, 180));

    addFeature("sun", 180 + Math.random() * 120, 86, 58, 58, "#f2b84b", "乱跑太阳");
    addFeature("river", 92, 320, 620, 58, "#7dd3fc", "蜡笔河");
    addFeature("picnic", 470, 185, 80, 50, "#f0d9a5", "纸片野餐");
    addBackgroundMarks("#d8a84c", 26, 18);

    addItem("笑声贴纸", 160, 170, "#f7c76b", 9, "emotion");
    addItem("歪太阳角", 275, 105, "#f2b84b", 8, "color");
    addItem("纸船愿望", 395, 322, "#f5efe0", 8, "story");
    addItem("蜡笔星星", 560, 128, "#f0d9a5", 7, "line");
    addItem("不成比例的小猫", 650, 270, "#d8cfb8", 9, "character");

    exitPortal = { x: MW - 60, y: MH / 2, active: false };
  }

  function buildHorrorSketch() {
    addRoom("hazard", "橡皮擦巡逻区", 70, 158, 240, 164, "#d8cfb8", "巡逻橡皮会蹭掉时间，别被它贴住。");
    addRoom("combat", "涂改走廊", 248, 56, 250, 126, "#8d1d25", "涂改鬼在黑线下巡逻，按 F 可以把它驱散。");
    addRoom("anomaly", "门缝观察室", 472, 72, 190, 156, "#6f1d2a", "门缝会把你往回看，站太久会被拖住。");
    addRoom("reward", "被圈出的空白", 596, 305, 155, 112, "#f5efe0", "最干净的地方反而藏着最吓人的留白。");

    creatures.push(createCreatureInstance(CREATURE_CATALOG.revision_wraith, 330, 132));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.revision_wraith, 500, 320));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.sketch_fox, 600, 100));

    addFeature("door", 118, 145, 54, 94, "#2a1418", "门缝");
    addFeature("black_line", 260, 64, 380, 16, "#050508", "描黑线");
    addFeature("mirror", 610, 250, 72, 110, "#8d6b7d", "不对劲的镜子");
    addHazard("eraser", 180, 230, 34, "#d8cfb8", "橡皮擦巡逻", { range: 430, speed: 0.018 });
    addHazard("eye", 520, 130, 54, "#8d1d25", "门缝凝视", { pull: 0.08 });
    addBackgroundMarks("#050508", 32, 35);

    addItem("门缝影子", 150, 98, "#8d1d25", 8, "fear");
    addItem("擦不掉的脸", 320, 185, "#b23b48", 8, "motif");
    addItem("冷汗墨滴", 470, 330, "#1d1b25", 7, "emotion");
    addItem("断掉的逃跑线", 625, 92, "#d8cfb8", 7, "line");
    addItem("被圈出的空白", 705, 385, "#f5efe0", 9, "composition");

    exitPortal = { x: MW - 60, y: MH / 2, active: false };
  }

  function buildAITemplate() {
    addRoom("explore", "提示词墓碑群", 58, 48, 235, 132, "#d0d8e0", "错误关键词排成碑林，找出不服从模板的那一个。");
    addRoom("anomaly", "完美网格间", 314, 154, 215, 178, "#6b8fa3", "网格会把你吸回标准坐标，移动会变得不听话。");
    addRoom("combat", "复制训练室", 454, 58, 215, 130, "#8b6b9e", "模板狼在这里复制巡逻路线，按 F 可以打断。");
    addRoom("reward", "越界像素库", 588, 248, 165, 150, "#5a4a6a", "奖励都长在画框外，越不对称越有价值。");

    creatures.push(createCreatureInstance(CREATURE_CATALOG.template_wolf, 390, 240));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.template_wolf, 540, 120));
    creatures.push(createCreatureInstance(CREATURE_CATALOG.half_sketched_fox, 550, 200));

    addFeature("grid_core", 395, 235, 160, 120, "#6b8fa3", "完美构图框");
    addFeature("prompt_wall", 92, 90, 180, 72, "#d0d8e0", "提示词墓碑");
    addFeature("broken_pixel", 632, 168, 86, 86, "#5a4a6a", "错位像素");
    addHazard("grid_clamp", 400, 240, 96, "#6b8fa3", "网格夹持", { cell: 24 });
    addHazard("copy_scan", 520, 120, 40, "#d0d8e0", "复制扫描线", { range: 260, speed: 0.026 });
    addBackgroundMarks("#ffffff", 36, 20);

    addItem("越界像素", 210, 126, "#f5efe0", 7, "error");
    addItem("反模板核心", 365, 240, "#6b8fa3", 9, "motif");
    addItem("错误提示词", 538, 108, "#d0d8e0", 7, "story");
    addItem("手绘噪点", 640, 312, "#5a4a6a", 8, "line");
    addItem("不对称样本", 720, 200, "#8b6b9e", 8, "character");

    exitPortal = { x: MW - 60, y: MH / 2, active: false };
  }

  function pickRule(type) {
    const rules = CONTENT_RULES[type] || CONTENT_RULES.warm_doodle;
    return { ...rules[Math.floor(Math.random() * rules.length)] };
  }

  function pickContract(type) {
    const pool = CONTRACTS[type] || CONTRACTS.warm_doodle;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  function createOutcomeTracker() {
    return {
      stableChoices: 0,
      riskyChoices: 0,
      carefulActions: 0,
      recordActions: 0,
      forceActions: 0,
      templateMistakes: 0,
      hazardsSoftened: 0,
      risksSpawned: 0,
      contactHits: 0,
    };
  }

  function addItem(name, x, y, color, size, kind) {
    items.push({
      name,
      kind,
      x,
      y,
      collected: false,
      color,
      size,
      pulse: Math.random() * Math.PI * 2,
      drift: Math.random() * Math.PI * 2,
    });
  }

  function addFeature(type, x, y, w, h, color, label, extra = {}) {
    features.push({ type, x, y, w, h, color, label, pulse: Math.random() * Math.PI * 2, ...extra });
  }

  function addHazard(type, x, y, radius, color, label, extra = {}) {
    hazards.push({ type, x, y, baseX: x, baseY: y, radius, color, label, pulse: Math.random() * Math.PI * 2, cooldown: 0, ...extra });
  }

  function addRoom(kind, name, x, y, w, h, color, desc, extra = {}) {
    const room = {
      id: `${kind}_${rooms.length}`,
      kind,
      name,
      x,
      y,
      w,
      h,
      color,
      desc,
      pulse: Math.random() * Math.PI * 2,
      pressure: 0,
      ...extra,
    };
    rooms.push(room);
    createObjectiveForRoom(room);
    return room.id;
  }

  function createObjectiveForRoom(room) {
    if (room.kind === "combat") return;
    const type = room.kind === "reward" ? "reward_choice" : "room_task";
    const mode = type === "reward_choice" ? "reward_choice" : objectiveModeForRoom(room);
    objectiveNodes.push({
      id: `objective_${room.id}`,
      roomId: room.id,
      type,
      mode,
      x: room.x + room.w * 0.5,
      y: room.y + room.h * 0.52,
      label: objectiveLabelForRoom(room),
      progress: 0,
      completed: false,
      riskyTaken: false,
      expectedKey: mode === "template_decode" ? pickObjectiveKey() : null,
      instability: 0,
      color: room.color,
    });
  }

  function addBackgroundMarks(color, count, spread) {
    for (let i = 0; i < count; i++) {
      backgroundMarks.push({
        x: Math.random() * MW,
        y: Math.random() * MH,
        w: 8 + Math.random() * spread,
        h: 1 + Math.random() * 3,
        color,
        alpha: 0.03 + Math.random() * 0.1,
        rot: (Math.random() - 0.5) * 0.5,
      });
    }
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
    const moving = mx !== 0 || my !== 0;
    const len = Math.sqrt(mx * mx + my * my) || 1;
    player.vx = (mx / len) * player.speed;
    player.vy = (my / len) * player.speed;
    if (Math.abs(player.vx) > 0.05) player.facing = player.vx < 0 ? -1 : 1;
    player.walkFrame += moving ? Math.hypot(player.vx, player.vy) + 0.5 : 0.08;
    player.x = Math.max(20, Math.min(MW - 20, player.x + player.vx));
    player.y = Math.max(30, Math.min(MH - 30, player.y + player.vy));
    updateRoomState();
    updateWorldEffects();

    // 委托完成后才激活出口，不再只是捡够数量就走。
    if (exitPortal && !exitPortal.active && contractReady()) {
      exitPortal.active = true;
      exitActive = true;
      showMessage("委托完成，出口被重新画出来了 — E 返回墨境", "#f0d9a5", 120);
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
        showMessage(`获得 ${item.name}`, item.color, 80);
      }
    }

    // 更新生物
    for (const c of creatures) {
      if (!c.alive) continue;
      c.contactCooldown = Math.max(0, (c.contactCooldown ?? 0) - 1);
      updateCreatureAI(c, player, 1);
      c.x = Math.max(30, Math.min(MW - 30, c.x));
      c.y = Math.max(30, Math.min(MH - 30, c.y));
      applyCreatureContact(c);
    }

    // 交互提示
    interactionHint = null;
    const node = nearestObjectiveNode();
    if (node) {
      interactionHint = { node, text: objectiveHint(node) };
    }
    for (const c of creatures) {
      if (!c.alive) continue;
      const dx = c.x - player.x;
      const dy = c.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (interactionHint?.node && dist >= 28) continue;
      if (dist < 50 && c.catalog.class === "inspiration") {
        interactionHint = { creature: c, text: "E 观察  R 记录  F 捕获" };
      } else if (dist < 55 && c.catalog.class === "hybrid") {
        interactionHint = { creature: c, text: "F 净化" };
      } else if (dist < 55 && (c.catalog.class === "negative" || c.catalog.class === "template")) {
        interactionHint = { creature: c, text: "F 驱散" };
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

  function updateWorldEffects() {
    for (const feature of features) feature.pulse += 0.025;
    for (const hazard of hazards) {
      if (hazard.disabled) continue;
      hazard.pulse += hazard.speed ?? 0.02;
      hazard.cooldown = Math.max(0, hazard.cooldown - 1);
      if (hazard.type === "eraser" || hazard.type === "copy_scan") {
        hazard.x = hazard.baseX + Math.sin(hazard.pulse) * (hazard.range ?? 220);
      }
      const dist = Math.hypot(player.x - hazard.x, player.y - hazard.y);
      if (dist < hazard.radius) triggerHazard(hazard, dist);
    }
  }

  function updateRoomState() {
    roomMessageCooldown = Math.max(0, roomMessageCooldown - 1);
    const room = roomAt(player.x, player.y);
    const nextRoomId = room?.id ?? null;
    if (nextRoomId !== currentRoomId) {
      currentRoomId = nextRoomId;
      if (room) {
        const firstVisit = !roomVisits.has(room.id);
        roomVisits.add(room.id);
        roomMessageCooldown = firstVisit ? 130 : 80;
        showMessage(`${roomKindLabel(room.kind)}：${room.name} - ${room.desc}`, room.color, firstVisit ? 150 : 90);
      }
    }
    if (!room) return;

    room.pulse += 0.03;
    if (room.pendingRisk) {
      const riskLeft = creatures.some(c => c.alive && c.riskSpawn && c.riskRoomId === room.id);
      if (!riskLeft) {
        room.pendingRisk = false;
        completeRoom(room, "冒险奖励已夺回");
      } else if (roomMessageCooldown <= 0) {
        showMessage(`${room.name} 的隐藏夹层被惊动了，先处理追出来的东西`, room.color, 90);
        roomMessageCooldown = 120;
      }
    }
    if (room.kind === "combat") {
      room.pressure = Math.min(1, room.pressure + 0.012);
      const hostileCount = creatures.filter(c => c.alive && isHostile(c) && thingInRoom(c, room)).length;
      if (hostileCount <= 0 && roomVisits.has(room.id)) {
        completeRoom(room, "战斗房清空");
      } else if (hostileCount > 0 && roomMessageCooldown <= 0) {
        showMessage(`${room.name} 里还有 ${hostileCount} 个麻烦，贴近后按 F 驱散`, room.color, 90);
        roomMessageCooldown = 140;
      }
    } else {
      room.pressure = Math.max(0, room.pressure - 0.02);
    }
  }

  function roomAt(x, y) {
    return rooms.find(room => x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) ?? null;
  }

  function currentRoom() {
    return rooms.find(room => room.id === currentRoomId) ?? null;
  }

  function thingInRoom(thing, room) {
    return thing.x >= room.x && thing.x <= room.x + room.w && thing.y >= room.y && thing.y <= room.y + room.h;
  }

  function roomKindLabel(kind) {
    return ROOM_KIND_LABELS[kind] ?? "特殊房";
  }

  function objectiveModeForRoom(room) {
    if (gateType === "warm_doodle") {
      return room.kind === "chase" ? "chase_memory" : "memory_repair";
    }
    if (gateType === "horror_sketch") {
      return room.kind === "hazard" ? "danger_disarm" : "fear_seal";
    }
    if (gateType === "ai_template") {
      return "template_decode";
    }
    return "room_task";
  }

  function objectiveLabelForRoom(room) {
    if (gateType === "warm_doodle") {
      if (room.kind === "event") return "追回会跑的太阳";
      if (room.kind === "explore") return "拼回纸船愿望";
      if (room.kind === "chase") return "记录乱跑墨团";
      if (room.kind === "reward") return "选择野餐奖励";
    }
    if (gateType === "horror_sketch") {
      if (room.kind === "hazard") return "拆掉巡逻橡皮";
      if (room.kind === "anomaly") return "封住门缝凝视";
      if (room.kind === "reward") return "选择留白奖励";
    }
    if (gateType === "ai_template") {
      if (room.kind === "explore") return "找出错误提示词";
      if (room.kind === "anomaly") return "破解完美网格";
      if (room.kind === "reward") return "偷取越界像素";
    }
    return OBJECTIVE_LABELS[room.kind] ?? "处理房间目标";
  }

  function pickObjectiveKey(exceptKey = null) {
    const pool = OBJECTIVE_KEYS.filter((item) => item !== exceptKey);
    return pool[Math.floor(Math.random() * pool.length)] ?? "e";
  }

  function nearestObjectiveNode() {
    let best = null;
    let bestDist = 46;
    for (const node of objectiveNodes) {
      if (node.completed) continue;
      const dist = Math.hypot(player.x - node.x, player.y - node.y);
      if (dist < bestDist) {
        best = node;
        bestDist = dist;
      }
    }
    return best;
  }

  function objectiveHint(node) {
    if (node.type === "reward_choice") return "E 稳拿奖励  F 冒险换更多发现";
    if (node.mode === "template_decode") {
      return `模板解码：按 ${KEY_LABELS[node.expectedKey] || "E"}  错了会触发扫描`;
    }
    if (node.mode === "memory_repair") return "E 安抚  R 记录  F 硬拽";
    if (node.mode === "chase_memory") return "贴近移动目标后 R 记录，F 截停";
    if (node.mode === "danger_disarm") return "E 找轨迹  R 标安全线  F 拆危险源";
    if (node.mode === "fear_seal") return "E 盯住  R 画安全线  F 强行封住";
    return "E 调查  R 记录  F 强行处理";
  }

  function contractReady() {
    return completedRoomIds.size >= exitRequirement();
  }

  function completeRoom(room, reason) {
    if (!room || completedRoomIds.has(room.id)) return;
    completedRoomIds.add(room.id);
    room.completed = true;
    room.pendingRisk = false;
    const evidenceName = `${room.name}：${reason}`;
    collected.push({
      name: evidenceName,
      kind: "contract",
      color: room.color,
      isContractEvidence: true,
      collected: true,
    });
    spawnParticles(player.x, player.y, room.color, 16);
    disableRoomHazards(room);
    showMessage(`房间目标完成：${room.name} (${completedRoomIds.size}/${exitRequirement()})`, room.color, 120);
  }

  function disableRoomHazards(room) {
    for (const hazard of hazards) {
      if (thingInRoom(hazard, room)) hazard.disabled = true;
    }
  }

  function isHostile(creature) {
    return creature.catalog.class === "negative" || creature.catalog.class === "template";
  }

  function applyCreatureContact(creature) {
    const damage = creature.catalog.contactDamage ?? 0;
    if (damage <= 0) return;
    const dx = player.x - creature.x;
    const dy = player.y - creature.y;
    const contactRange = Math.max(creature.catalog.size.w, creature.catalog.size.h) * 0.65 + 10;
    if (Math.hypot(dx, dy) >= contactRange) return;

    timeLeft = Math.max(0, timeLeft - damage);
    repelFromPoint(creature.x, creature.y, 2.8);
    if (creature.contactCooldown <= 0) {
      creature.contactCooldown = 55;
      if (outcome) outcome.contactHits++;
      showMessage(`${creature.catalog.name} 撞散线条，时间 -${damage}`, creature.catalog.color, 70);
    }
  }

  function triggerHazard(hazard, dist) {
    if (hazard.type === "eraser") {
      timeLeft = Math.max(0, timeLeft - 7);
      repelFrom(hazard, 2.2);
      if (hazard.cooldown <= 0) showHazardMessage(hazard, "被橡皮擦蹭到了，画面少了一截时间");
      return;
    }
    if (hazard.type === "eye") {
      const pull = hazard.pull ?? 0.06;
      player.x += (hazard.x - player.x) * pull;
      player.y += (hazard.y - player.y) * pull;
      timeLeft = Math.max(0, timeLeft - 2);
      if (hazard.cooldown <= 0) showHazardMessage(hazard, "门缝在看你，别停在视线里");
      return;
    }
    if (hazard.type === "grid_clamp") {
      const cell = hazard.cell ?? 24;
      player.x += (Math.round(player.x / cell) * cell - player.x) * 0.1;
      player.y += (Math.round(player.y / cell) * cell - player.y) * 0.1;
      if (hazard.cooldown <= 0) showHazardMessage(hazard, "模板网格在把你对齐");
      return;
    }
    if (hazard.type === "copy_scan") {
      timeLeft = Math.max(0, timeLeft - 3);
      player.x += Math.sign(player.x - hazard.x || 1) * 1.4;
      if (hazard.cooldown <= 0) showHazardMessage(hazard, "复制扫描线扫过来了");
    }
  }

  function repelFrom(hazard, force) {
    repelFromPoint(hazard.x, hazard.y, force);
  }

  function repelFromPoint(x, y, force) {
    const dx = player.x - x;
    const dy = player.y - y;
    const len = Math.hypot(dx, dy) || 1;
    player.x = Math.max(20, Math.min(MW - 20, player.x + (dx / len) * force));
    player.y = Math.max(30, Math.min(MH - 30, player.y + (dy / len) * force));
  }

  function showHazardMessage(hazard, text) {
    hazard.cooldown = 70;
    showMessage(text, hazard.color, 80);
  }

  function exitRequirement() {
    return contract?.requiredRooms ?? worldRule?.required ?? 3;
  }

  function handleKey(key) {
    if (key === "e" && interactionHint?.exit) {
      finish();
      return true;
    }
    if (interactionHint?.node) {
      return handleObjectiveNodeKey(interactionHint.node, key);
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
      if (isHostile(c)) {
        const defeated = damageCreature(c, 12);
        spawnParticles(c.x, c.y, c.catalog.color, defeated ? 18 : 9);
        if (defeated) {
          showMessage(`驱散成功！${c.catalog.name}`, "#f0d9a5", 100);
        } else {
          showMessage(`驱散中 ${c.catalog.name} HP ${Math.max(0, c.hp)}`, c.catalog.color, 70);
        }
        return true;
      }
      const verb = c.catalog.class === "hybrid" ? "净化" : "捕获";
      c.captureProgress += 30;
      if (c.captureProgress >= 100) {
        showMessage(`${verb}成功！${c.catalog.name}`, "#2e7d32");
        c.alive = false;
        spawnParticles(c.x, c.y, "#f0d9a5", 15);
        // 头奖检测
        const jackpot = tryJackpot(c.catalog.id);
        if (jackpot) {
          collected.push({ item: jackpot, isJackpot: true });
          showMessage(`！！！头奖！${jackpot.name}`, "#c9a846", 200);
        }
      } else {
        showMessage(`${verb}中 ${Math.round(c.captureProgress)}%`);
      }
      return true;
    }
    return false;
  }

  function handleObjectiveNodeKey(node, key) {
    if (!node || node.completed) return false;
    const room = rooms.find((item) => item.id === node.roomId);
    if (!room) return false;

    if (node.type === "reward_choice") {
      if (key === "e") {
        contractBonus += 1;
        if (outcome) outcome.stableChoices++;
        node.completed = true;
        completeRoom(room, "稳妥带走奖励");
        showMessage("你选了稳妥奖励：带回一份可用素材。", room.color, 110);
        return true;
      }
      if (key === "f") {
        contractBonus += 2;
        if (outcome) outcome.riskyChoices++;
        node.completed = true;
        node.riskyTaken = true;
        spawnRiskEncounter(room);
        room.pendingRisk = true;
        showMessage("你撬开隐藏夹层，奖励更多；先处理追出来的东西才算完成。", "#c9a846", 140);
        return true;
      }
      return false;
    }

    const result = resolveObjectiveAction(node, room, key);
    if (!result) return false;

    recordObjectiveChoice(key, result);
    node.progress = Math.min(100, node.progress + result.gain);
    timeLeft = Math.max(0, Math.min(4200, timeLeft - result.cost + (result.bonusTime ?? 0)));
    spawnParticles(node.x, node.y, result.color ?? node.color, result.particles ?? (key === "f" ? 10 : 6));

    if (result.disableHazard) softenRoomHazard(room);
    if (result.spawnRisk) spawnRiskEncounter(room);
    if (result.nextExpectedKey) node.expectedKey = result.nextExpectedKey;

    if (node.progress >= 100) {
      node.completed = true;
      completeRoom(room, `${result.action}${node.label}`);
    } else {
      showMessage(result.message ?? `${result.action}${node.label}：${Math.round(node.progress)}%`, result.color ?? node.color, result.duration ?? 75);
    }
    return true;
  }

  function recordObjectiveChoice(key, result) {
    if (!outcome) return;
    if (key === "e") outcome.carefulActions++;
    if (key === "r") outcome.recordActions++;
    if (key === "f") outcome.forceActions++;
    if (result.action === "误触") outcome.templateMistakes++;
    if (result.disableHazard) outcome.hazardsSoftened++;
  }

  function resolveObjectiveAction(node, room, key) {
    if (!OBJECTIVE_KEYS.includes(key)) return null;

    if (node.mode === "template_decode") {
      if (key !== node.expectedKey) {
        node.instability += 1;
        const shouldSpawnScan = node.instability >= 2 && !node.errorScanSpawned;
        if (shouldSpawnScan) {
          node.errorScanSpawned = true;
          addHazard("copy_scan", node.x, node.y, 34, "#d0d8e0", "错误扫描线", { range: 110, speed: 0.035 });
        }
        return {
          action: "误触",
          gain: 4,
          cost: 18,
          color: "#d0d8e0",
          particles: 12,
          message: shouldSpawnScan
            ? "模板判定错误，新的扫描线被激活了"
            : `模板判定错误，下一次看准 ${KEY_LABELS[node.expectedKey]}`,
          duration: 95,
        };
      }
      const nextKey = pickObjectiveKey(node.expectedKey);
      return {
        action: "解码",
        gain: 36,
        cost: 5,
        color: node.color,
        nextExpectedKey: nextKey,
        message: `解码成功：${Math.round(Math.min(100, node.progress + 36))}%  下一步 ${KEY_LABELS[nextKey]}`,
        duration: 85,
      };
    }

    if (node.mode === "memory_repair") {
      if (key === "e") return { action: "安抚", gain: 24, cost: 0, bonusTime: 5, color: "#f2b84b", message: `安抚${node.label}：${Math.round(Math.min(100, node.progress + 24))}%` };
      if (key === "r") return { action: "记录", gain: 34, cost: 5, color: node.color };
      return { action: "硬拽", gain: 18, cost: 14, color: "#c9a846", particles: 12, message: `硬拽会让线条乱跑：${Math.round(Math.min(100, node.progress + 18))}%` };
    }

    if (node.mode === "chase_memory") {
      const closeCreature = closestRoomCreature(room, 82);
      if (key === "r") {
        return closeCreature
          ? { action: "贴身记录", gain: 44, cost: 7, color: closeCreature.catalog.color, message: `贴身记录到了移动轨迹：${Math.round(Math.min(100, node.progress + 44))}%` }
          : { action: "远距离记录", gain: 16, cost: 8, color: node.color, message: "离移动目标太远，只记到一小段轨迹" };
      }
      if (key === "f") {
        return closeCreature
          ? { action: "截停", gain: 34, cost: 12, color: closeCreature.catalog.color, particles: 14, message: `截停了一段乱跑线条：${Math.round(Math.min(100, node.progress + 34))}%` }
          : { action: "扑空", gain: 8, cost: 16, color: "#c9a846", particles: 10, message: "没有贴近移动目标，扑空了" };
      }
      return { action: "观察", gain: 20, cost: 2, color: node.color };
    }

    if (node.mode === "danger_disarm") {
      if (key === "f") return { action: "拆除", gain: 44, cost: 14, color: "#f0d9a5", disableHazard: true, particles: 14 };
      if (key === "r") return { action: "标记安全线", gain: 30, cost: 7, color: node.color };
      return { action: "观察轨迹", gain: 18, cost: 3, color: node.color };
    }

    if (node.mode === "fear_seal") {
      if (key === "f") {
        node.instability += 1;
        const spawnRisk = node.instability >= 2 && !node.forceSealSpawned;
        if (spawnRisk) node.forceSealSpawned = true;
        return {
          action: "强行封住",
          gain: 42,
          cost: 18,
          color: "#b23b48",
          spawnRisk,
          particles: 16,
          message: spawnRisk
            ? "门缝被强行封住，但涂改鬼被惊醒了"
            : `强行封住门缝：${Math.round(Math.min(100, node.progress + 42))}%`,
          duration: 100,
        };
      }
      if (key === "r") return { action: "画安全线", gain: 30, cost: 8, color: node.color };
      return { action: "盯住", gain: 20, cost: 5, color: node.color };
    }

    const action = key === "e" ? "调查" : key === "r" ? "记录" : "强行处理";
    return {
      action,
      gain: key === "e" ? 30 : key === "r" ? 42 : 24,
      cost: key === "f" ? 18 : key === "e" ? 4 : 8,
      color: node.color,
    };
  }

  function closestRoomCreature(room, range) {
    let best = null;
    let bestDist = range;
    for (const creature of creatures) {
      if (!creature.alive || !thingInRoom(creature, room)) continue;
      const dist = Math.hypot(creature.x - player.x, creature.y - player.y);
      if (dist < bestDist) {
        best = creature;
        bestDist = dist;
      }
    }
    return best;
  }

  function softenRoomHazard(room) {
    let best = null;
    let bestDist = Infinity;
    for (const hazard of hazards) {
      if (hazard.disabled || !thingInRoom(hazard, room)) continue;
      const dist = Math.hypot(hazard.x - player.x, hazard.y - player.y);
      if (dist < bestDist) {
        best = hazard;
        bestDist = dist;
      }
    }
    if (!best) return;
    best.radius = Math.max(18, best.radius * 0.72);
    best.cooldown = 50;
  }

  function spawnRiskEncounter(room) {
    if (outcome) outcome.risksSpawned++;
    const x = room.x + room.w * 0.5;
    const y = room.y + room.h * 0.5;
    const catalog = gateType === "ai_template"
      ? CREATURE_CATALOG.template_wolf
      : gateType === "horror_sketch"
        ? CREATURE_CATALOG.revision_wraith
        : CREATURE_CATALOG.ink_blob;
    const creature = createCreatureInstance(catalog, x, y);
    creature.hp = Math.max(creature.hp, Math.round(catalog.hp * 1.25));
    creature.riskSpawn = true;
    creature.riskRoomId = room.id;
    creatures.push(creature);
  }

  function finish() {
    finished = true;
    // 结算发现物
    const discoveryCount = Math.max(3, collected.length + completedRoomIds.size + contractBonus);
    const discoveries = rollDiscovery(gateType, discoveryCount);
    // 把采集物也加入
    const allDiscoveries = [...discoveries];
    for (const c of collected) {
      if (c.isJackpot) allDiscoveries.push({ ...c.item, isJackpot: true });
    }
    onComplete(allDiscoveries, gateType, buildOutcomeReport());
  }

  function buildOutcomeReport() {
    const choices = { ...(outcome ?? createOutcomeTracker()) };
    const riskScore =
      choices.riskyChoices * 3 +
      choices.forceActions +
      choices.templateMistakes * 2 +
      choices.risksSpawned * 2 +
      choices.contactHits;
    const careScore =
      choices.stableChoices * 2 +
      choices.carefulActions +
      choices.recordActions +
      choices.hazardsSoftened * 2;
    const completedRooms = completedRoomIds.size;
    const requiredRooms = exitRequirement();
    const overclear = Math.max(0, completedRooms - requiredRooms);
    const intensity = Math.max(1, Math.min(4, Math.ceil((riskScore + overclear) / 3)));
    return {
      gateType,
      contractName: contract?.name ?? "",
      ruleName: worldRule?.name ?? "",
      completedRooms,
      requiredRooms,
      contractBonus,
      choices,
      riskScore,
      careScore,
      intensity,
      profile: pickOutcomeProfile(riskScore, careScore),
    };
  }

  function pickOutcomeProfile(riskScore, careScore) {
    const risky = riskScore > careScore + 1;
    if (gateType === "warm_doodle") {
      return risky
        ? { id: "runaway_sun", name: "逃跑太阳债", color: "#f2b84b", effect: "pursuit" }
        : { id: "paper_boat_route", name: "纸船捷径", color: "#7dd3fc", effect: "settle" };
    }
    if (gateType === "horror_sketch") {
      return risky
        ? { id: "door_eye_pursuit", name: "门缝追视", color: "#b23b48", effect: "pursuit" }
        : { id: "sealed_blank", name: "封住的留白", color: "#f5efe0", effect: "settle" };
    }
    return risky
      ? { id: "template_desync", name: "模板反同步", color: "#7dd3fc", effect: "glitch" }
      : { id: "crooked_grid", name: "歪掉的网格", color: "#d0d8e0", effect: "settle" };
  }

  function draw(ctx) {
    const cx = camera.x;
    const cy = camera.y;

    // 背景
    ctx.fillStyle = config.tileColor;
    ctx.fillRect(0, 0, SW, SH);

    if (gateType === "ai_template") {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      for (let x = -(cx % 32); x < SW; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SH); ctx.stroke();
      }
      for (let y = -(cy % 32); y < SH; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SW, y); ctx.stroke();
      }
    }
    drawRooms(ctx, cx, cy);
    drawBackgroundMarks(ctx, cx, cy);
    drawFeatures(ctx, cx, cy);
    drawHazards(ctx, cx, cy);
    drawObjectiveNodes(ctx, cx, cy);

    // 物品
    for (const item of items) {
      if (item.collected) continue;
      const jitter = gateType === "ai_template" ? Math.sin(item.drift + Date.now() / 180) * 3 : 0;
      const sx = item.x - cx + jitter;
      const sy = item.y - cy - jitter * 0.4;
      if (sx < -20 || sx > SW + 20 || sy < -20 || sy > SH + 20) continue;

      item.pulse += 0.05;
      const scale = 1 + Math.sin(item.pulse) * 0.3;

      drawPixelCollectible(ctx, sx, sy, item.color, item.size * scale);

      if (Math.hypot(player.x - item.x, player.y - item.y) < 72) {
        ctx.font = "9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#f5efe0";
        ctx.fillText(fitText(ctx, item.name, 76), sx, sy - 12);
        ctx.textAlign = "start";
      }
    }

    // 生物
    for (const c of creatures) {
      if (!c.alive) continue;
      const sx = c.x - cx;
      const sy = c.y - cy;
      if (sx < -40 || sx > SW + 40 || sy < -40 || sy > SH + 40) continue;

      const cat = c.catalog;
      drawSubCreature(ctx, sx, sy, cat, isHostile(c));

      if (isHostile(c)) {
        const hpRatio = Math.max(0, c.hp / cat.hp);
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillRect(sx - 16, sy + cat.size.h / 2 + 4, 32, 4);
        ctx.fillStyle = hpRatio > 0.4 ? "#f0d9a5" : "#b23b48";
        ctx.fillRect(sx - 16, sy + cat.size.h / 2 + 4, 32 * hpRatio, 4);
      }

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
      drawPixelExit(ctx, ex, ey, exitActive);
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
    drawSubPlayer(ctx, px, py);

    // 交互提示
    if (interactionHint) {
      let hx = SW / 2;
      let hy = SH / 2;
      if (interactionHint.creature) {
        hx = interactionHint.creature.x - cx;
        hy = interactionHint.creature.y - 30 - cy;
      } else if (interactionHint.node) {
        hx = interactionHint.node.x - cx;
        hy = interactionHint.node.y - 32 - cy;
      } else if (exitPortal) {
        hx = exitPortal.x - cx;
        hy = exitPortal.y - 30 - cy;
      }
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
      ctx.font = "12px sans-serif";
      const displayText = fitText(ctx, messageText, SW - 48);
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      const tw = ctx.measureText(displayText).width;
      ctx.fillRect(SW / 2 - tw / 2 - 12, SH - 50, tw + 24, 24);
      ctx.fillStyle = messageColor;
      ctx.textAlign = "center";
      ctx.fillText(displayText, SW / 2, SH - 33);
      ctx.textAlign = "start";
    }

    // HUD
    const room = currentRoom();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(8, 8, 292, 72);
    ctx.fillStyle = "#fff";
    ctx.font = "11px sans-serif";
    ctx.fillText(fitText(ctx, `${config.name} / ${contract?.name || worldRule?.name || "未知委托"}`, 270), 16, 23);
    ctx.fillText(`委托 ${completedRoomIds.size}/${exitRequirement()}  发现 ${collected.length + contractBonus}  时间 ${Math.ceil(timeLeft / 60)}s`, 16, 39);
    ctx.fillText(fitText(ctx, room ? `${roomKindLabel(room.kind)}：${room.name}` : "画纸边缘：寻找特殊房间", 270), 16, 55);
    ctx.fillText("WASD 移动  E/R/F 处理房间  完成委托后出口开启", 16, 71);
  }

  function drawRooms(ctx, cx, cy) {
    for (const room of rooms) {
      const sx = room.x - cx;
      const sy = room.y - cy;
      if (sx > SW + 40 || sy > SH + 40 || sx + room.w < -40 || sy + room.h < -40) continue;

      const active = room.id === currentRoomId;
      ctx.save();
      ctx.globalAlpha = active ? 0.24 : 0.12;
      ctx.fillStyle = room.color;
      ctx.fillRect(sx, sy, room.w, room.h);

      if (room.kind === "combat" && room.pressure > 0) {
        ctx.globalAlpha = 0.08 + room.pressure * 0.1;
        ctx.fillStyle = "#ffffff";
        for (let x = sx + 10; x < sx + room.w; x += 26) {
          ctx.fillRect(x, sy + 8, 2, room.h - 16);
        }
      }

      ctx.globalAlpha = active ? 0.95 : 0.5;
      ctx.strokeStyle = room.color;
      ctx.lineWidth = active ? 2 : 1;
      if (room.kind === "anomaly" || room.kind === "hazard") ctx.setLineDash([5, 5]);
      if (room.kind === "combat") ctx.setLineDash([10, 4]);
      ctx.strokeRect(sx, sy, room.w, room.h);

      ctx.setLineDash([]);
      ctx.font = "9px sans-serif";
      const label = fitText(ctx, `${roomKindLabel(room.kind)} ${room.name}`, Math.max(60, room.w - 18));
      const tw = ctx.measureText(label).width;
      ctx.globalAlpha = active ? 0.9 : 0.72;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(sx + 8, sy + 8, tw + 10, 16);
      ctx.fillStyle = "#f5efe0";
      ctx.fillText(label, sx + 13, sy + 20);

      if (room.completed || room.pendingRisk) {
        const badgeX = sx + room.w - 24;
        const badgeY = sy + 10;
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = "rgba(0,0,0,0.62)";
        ctx.fillRect(badgeX, badgeY, 16, 16);
        ctx.fillStyle = room.completed ? "#7dd3fc" : "#c9a846";
        ctx.fillRect(badgeX + 3, badgeY + 3, 10, 10);
        ctx.fillStyle = "#05070b";
        if (room.completed) {
          ctx.fillRect(badgeX + 6, badgeY + 8, 2, 3);
          ctx.fillRect(badgeX + 8, badgeY + 10, 2, 2);
          ctx.fillRect(badgeX + 10, badgeY + 5, 2, 7);
        } else {
          ctx.fillRect(badgeX + 7, badgeY + 5, 2, 5);
          ctx.fillRect(badgeX + 7, badgeY + 11, 2, 2);
        }
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
  }

  function drawObjectiveNodes(ctx, cx, cy) {
    for (const node of objectiveNodes) {
      if (node.completed) continue;
      const sx = Math.floor(node.x - cx);
      const sy = Math.floor(node.y - cy);
      if (sx < -40 || sx > SW + 40 || sy < -40 || sy > SH + 40) continue;

      const near = Math.hypot(player.x - node.x, player.y - node.y) < 82;
      const pulse = Math.sin(Date.now() / 220 + node.progress * 0.04);
      ctx.save();
      ctx.globalAlpha = near ? 1 : 0.84;
      ctx.fillStyle = "rgba(5,7,11,0.78)";
      ctx.fillRect(sx - 15, sy - 15, 30, 30);
      ctx.strokeStyle = node.color;
      ctx.lineWidth = near ? 2 : 1;
      ctx.strokeRect(sx - 15, sy - 15, 30, 30);

      ctx.fillStyle = node.color;
      if (node.type === "reward_choice") {
        ctx.fillRect(sx - 10, sy - 5, 20, 13);
        ctx.fillRect(sx - 8, sy - 10, 16, 6);
        ctx.fillStyle = "#f0d9a5";
        ctx.fillRect(sx - 1, sy - 10, 2, 18);
        ctx.fillRect(sx - 10, sy - 2, 20, 2);
      } else {
        const size = 12 + Math.round(pulse * 2);
        ctx.fillRect(sx - Math.floor(size / 2), sy - Math.floor(size / 2), size, size);
        ctx.fillStyle = "rgba(5,7,11,0.42)";
        ctx.fillRect(sx - 2, sy - 8, 4, 16);
        ctx.fillRect(sx - 8, sy - 2, 16, 4);
      }

      if (node.mode === "template_decode" && node.expectedKey) {
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#05070b";
        ctx.fillText(KEY_LABELS[node.expectedKey] || "E", sx, sy + 4);
        ctx.textAlign = "start";
      }

      if (node.progress > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(sx - 18, sy + 20, 36, 5);
        ctx.fillStyle = "#f0d9a5";
        ctx.fillRect(sx - 17, sy + 21, 34 * (node.progress / 100), 3);
      }

      if (near) {
        const label = fitText(ctx, node.label, 92);
        ctx.font = "9px sans-serif";
        ctx.textAlign = "center";
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(sx - tw / 2 - 5, sy - 31, tw + 10, 14);
        ctx.fillStyle = "#f5efe0";
        ctx.fillText(label, sx, sy - 21);
        ctx.textAlign = "start";
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
  }

  function drawPixelCollectible(ctx, sx, sy, color, size) {
    const s = Math.max(6, Math.floor(size));
    const x = Math.floor(sx - s / 2);
    const y = Math.floor(sy - s / 2);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 1, y + 1, s + 2, s - 2);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = "#f5efe0";
    ctx.fillRect(x + 1, y + 1, Math.max(2, Math.floor(s / 3)), 2);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x + s - 2, y + 2, 2, s - 2);
    ctx.globalAlpha = 1;
  }

  function drawSubCreature(ctx, sx, sy, cat, hostile) {
    if (cat.spriteId && drawCenteredModelSprite(ctx, cat.spriteId, sx, sy, {
      height: cat.spriteHeight ?? Math.max(cat.size.w, cat.size.h) * 2,
      alpha: hostile ? 1 : 0.92,
    })) {
      return;
    }
    const w = Math.floor(cat.size.w);
    const h = Math.floor(cat.size.h);
    const x = Math.floor(sx - w / 2);
    const y = Math.floor(sy - h / 2);
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = cat.color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = hostile ? "#b23b48" : "#f5efe0";
    ctx.fillRect(x + Math.max(3, w - 8), y + 4, 3, 3);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(x + 2, y + 2, Math.max(4, w - 8), 2);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x + 2, y + h - 3, w - 4, 2);
  }

  function drawPixelExit(ctx, ex, ey, active) {
    const x = Math.floor(ex - 12);
    const y = Math.floor(ey - 18);
    if (active) {
      ctx.fillStyle = "rgba(240,217,165,0.22)";
      ctx.fillRect(x - 8, y - 8, 40, 52);
      ctx.fillStyle = "rgba(125,211,252,0.22)";
      ctx.fillRect(x - 2, y - 14, 28, 64);
    }
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 2, y - 2, 28, 40);
    ctx.fillStyle = active ? "#f0d9a5" : "#5c554c";
    ctx.fillRect(x, y, 24, 36);
    ctx.fillStyle = active ? "#1e3a5f" : "#24211f";
    ctx.fillRect(x + 5, y + 5, 14, 26);
    ctx.fillStyle = active ? "#7dd3fc" : "#8b8173";
    ctx.fillRect(x + 8, y + 8, 8, 2);
    ctx.fillRect(x + 8, y + 14, 8, 2);
    ctx.fillRect(x + 8, y + 20, 8, 2);
  }

  function drawSubPlayer(ctx, px, py) {
    drawProtagonistAt(ctx, {
      x: px,
      footY: py + player.h / 2 + 8,
      facing: player.facing,
      frame: player.walkFrame,
      walkSpeed: Math.hypot(player.vx, player.vy),
      showTank: false,
    });
  }

  function drawBackgroundMarks(ctx, cx, cy) {
    for (const mark of backgroundMarks) {
      const sx = mark.x - cx;
      const sy = mark.y - cy;
      if (sx < -80 || sx > SW + 80 || sy < -80 || sy > SH + 80) continue;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(mark.rot);
      ctx.globalAlpha = mark.alpha;
      ctx.fillStyle = mark.color;
      ctx.fillRect(-mark.w / 2, -mark.h / 2, mark.w, mark.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawFeatures(ctx, cx, cy) {
    for (const feature of features) {
      const sx = feature.x - cx;
      const sy = feature.y - cy;
      if (sx < -120 || sx > SW + 120 || sy < -120 || sy > SH + 120) continue;
      if (feature.type === "sun") {
        const pulse = Math.sin(Date.now() / 350 + feature.pulse) * 5;
        ctx.fillStyle = feature.color;
        ctx.beginPath();
        ctx.arc(sx, sy, 22 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(242,184,75,0.55)";
        for (let i = 0; i < 10; i++) {
          const a = i * Math.PI * 0.2 + feature.pulse;
          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(a) * 32, sy + Math.sin(a) * 32);
          ctx.lineTo(sx + Math.cos(a) * 48, sy + Math.sin(a) * 48);
          ctx.stroke();
        }
      } else if (feature.type === "river") {
        ctx.strokeStyle = "rgba(125,211,252,0.45)";
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx + 120, sy - 36, sx + 260, sy + 36, sx + feature.w, sy - 8);
        ctx.stroke();
        ctx.lineWidth = 1;
      } else if (feature.type === "black_line") {
        ctx.strokeStyle = "rgba(5,5,8,0.8)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + feature.w, sy + Math.sin(Date.now() / 400) * 10);
        ctx.stroke();
      } else if (feature.type === "prompt_wall") {
        drawFeatureBox(ctx, feature, sx, sy, ["masterpiece", "trending", "perfect"]);
      } else if (feature.type === "grid_core") {
        drawFeatureBox(ctx, feature, sx, sy, ["1:1", "clean", "aligned"]);
      } else {
        drawFeatureBox(ctx, feature, sx, sy, [feature.label]);
      }
    }
  }

  function drawFeatureBox(ctx, feature, sx, sy, lines) {
    ctx.fillStyle = feature.color;
    ctx.globalAlpha = 0.22;
    ctx.fillRect(sx - feature.w / 2, sy - feature.h / 2, feature.w, feature.h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = feature.color;
    ctx.strokeRect(sx - feature.w / 2, sy - feature.h / 2, feature.w, feature.h);
    ctx.fillStyle = "#f5efe0";
    ctx.font = "9px sans-serif";
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], sx - feature.w / 2 + 8, sy - feature.h / 2 + 16 + i * 13);
    }
  }

  function drawHazards(ctx, cx, cy) {
    for (const hazard of hazards) {
      if (hazard.disabled) continue;
      const sx = hazard.x - cx;
      const sy = hazard.y - cy;
      if (sx < -120 || sx > SW + 120 || sy < -120 || sy > SH + 120) continue;
      ctx.save();
      if (hazard.type === "eraser") {
        ctx.fillStyle = "rgba(216,207,184,0.72)";
        ctx.fillRect(sx - 22, sy - 12, 44, 24);
        ctx.fillStyle = "rgba(80,75,70,0.35)";
        ctx.fillRect(sx - 18, sy - 8, 36, 4);
      } else if (hazard.type === "eye") {
        ctx.fillStyle = "rgba(141,29,37,0.22)";
        ctx.beginPath();
        ctx.arc(sx, sy, hazard.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = hazard.color;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#050508";
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (hazard.type === "grid_clamp") {
        ctx.strokeStyle = "rgba(107,143,163,0.65)";
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(sx - hazard.radius, sy - hazard.radius, hazard.radius * 2, hazard.radius * 2);
      } else if (hazard.type === "copy_scan") {
        ctx.strokeStyle = "rgba(208,216,224,0.72)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy - hazard.radius);
        ctx.lineTo(sx, sy + hazard.radius);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function showMessage(text, color, duration) {
    messageText = text;
    messageColor = color || config.color || "#f0d9a5";
    messageTimer = duration || 80;
  }

  function fitText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let trimmed = text;
    while (trimmed.length > 1 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    return `${trimmed}...`;
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
