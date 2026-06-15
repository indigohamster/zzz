// ExperimentMap.js — 墨境行为实验 Vertical Slice
// 验证 5 个核心问题：
// A. 玩家是否会主动观察？
// B. 玩家是否会追逐逃跑生物？
// C. 玩家是否会冒险进入危险区域？
// D. 玩家是否会进入未知入口？
// E. 玩家是否会主动选择撤离？

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const W = canvas.width;
const H = canvas.height;

// ========== 行为追踪 ==========
const tracker = {
  zoneA_observed: false,
  zoneB_chased: false,
  zoneB_foundNook: false,
  zoneC_entered: false,
  zoneC_skipped: false,
  zoneC_survived: false,
  zoneD_entered: false,
  zoneD_type: null,
  zoneD_itemsCollected: 0,
  zoneE_exited: false,
  totalDiscoveries: 0,
  startTime: Date.now(),
  log: [],
};

function track(event, detail = "") {
  tracker.log.push({ time: ((Date.now() - tracker.startTime) / 1000).toFixed(1), event, detail });
  console.log(`[Experiment] ${event}`, detail || "");
}

// ========== 玩家 ==========
const player = {
  x: 60, y: H - 60, w: 14, h: 22, vx: 0, vy: 0, speed: 3,
  discoveries: [],
};

// ========== 输入 ==========
const keys = new Set();

// ========== 区域定义 ==========
const zones = {
  A: { name: "安全观察区", x: 50, y: 20, w: 280, h: 220, color: "rgba(240,217,165,0.08)", label: "A · 安全观察" },
  B: { name: "追逐区", x: 50, y: 260, w: 280, h: 200, color: "rgba(180,200,220,0.08)", label: "B · 追逐生物" },
  C: { name: "危险区", x: 620, y: 20, w: 290, h: 300, color: "rgba(200,60,60,0.06)", label: "C · 高风险区域" },
  D: { name: "未知入口", x: 380, y: 20, w: 200, h: 180, color: "rgba(160,120,200,0.08)", label: "D · 未知入口" },
  E: { name: "撤离点", x: 730, y: 400, w: 180, h: 100, color: "rgba(100,200,100,0.08)", label: "E · 撤离点" },
};

// ========== ZONE A: 观察生物 ==========
const strangeBlob = {
  x: zones.A.x + 140, y: zones.A.y + 110,
  w: 28, h: 20,
  observed: false,
  pulse: 0,
  name: "奇怪的墨团",
  desc: "一个不寻常的墨团。它没有逃跑，只是安静地待在那里，身上有微弱的光。你靠近时，它似乎在看你。",
  journalEntry: "它身上有细小的金色纹路。其他墨团没有这个。这可能是某个更大存在留下的痕迹——或者，它在等你注意到什么。",
};

// ========== ZONE B: 逃跑生物 ==========
const sketchFox = {
  x: zones.B.x + 150, y: zones.B.y + 100,
  w: 24, h: 16,
  vx: 0, vy: 0,
  fleeing: false,
  fleeTarget: null,
  reachedNook: false,
  name: "线稿狐",
};

// 隐藏角落
const hiddenNook = {
  x: zones.B.x + 30, y: zones.B.y + 30,
  w: 40, h: 40,
  found: false,
  reward: "被遗忘的草稿碎片",
  rewardDesc: "角落里有一张褪色的草稿。画的是一个少年站在窗前，窗外什么都没有。线条很轻，像是下了很大决心才画出来的。",
};

// ========== ZONE C: 危险区域 ==========
const dangerZone = {
  entered: false,
  survived: false,
  darknessLevel: 0,
  warningPulse: 0,
  reward: null,
  riskMessage: "警告：此区域墨压极高。进入后灵感可能受损，但有机会发现稀有母题碎片。",
};

// 危险区的"守护者"——不是要打，是压迫感
const pressureWraith = {
  x: zones.C.x + 145, y: zones.C.y + 180,
  active: false,
  name: "墨压之影",
};

// ========== ZONE D: 未知入口 ==========
const unknownGate = {
  x: zones.D.x + 100, y: zones.D.y + 90,
  w: 48, h: 56,
  glow: 0,
  entered: false,
  type: null, // 运行时随机
  subMapActive: false,
  subMapItems: [],
  subMapCollected: 0,
};

function randomGateType() {
  const types = ["warm", "danger", "weird"];
  return types[Math.floor(Math.random() * types.length)];
}

// ========== 子地图数据 ==========
function buildSubMap(type) {
  const maps = {
    warm: {
      name: "温馨画稿",
      bgColor: "#f5efe0",
      desc: "你落在一张蜡笔画上。太阳是歪的，小猫有三条腿，但一切都暖洋洋的。",
      items: [
        { x: 100, y: 150, name: "蜡笔太阳", collected: false },
        { x: 300, y: 100, name: "歪歪扭扭的小猫", collected: false },
        { x: 500, y: 200, name: "彩色云朵", collected: false },
      ],
      exitX: 550, exitY: 300,
    },
    danger: {
      name: "恐怖草图",
      bgColor: "#1a1412",
      desc: "你落在一张被反复涂抹的稿子上。橡皮擦的痕迹像伤疤。有什么在暗处动。",
      items: [
        { x: 150, y: 200, name: "暗影样本", collected: false },
        { x: 400, y: 120, name: "半张脸的设计稿", collected: false },
        { x: 500, y: 280, name: "未完成的怪物", collected: false },
      ],
      exitX: 550, exitY: 300,
    },
    weird: {
      name: "怪异画稿",
      bgColor: "#d8d0e0",
      desc: "你落在一个透视完全错乱的空间里。楼梯通向天花板，门开在空中。",
      items: [
        { x: 200, y: 180, name: "不可能的建筑碎片", collected: false },
        { x: 350, y: 100, name: "颠倒的窗户", collected: false },
        { x: 450, y: 250, name: "悬浮在空中的门", collected: false },
      ],
      exitX: 550, exitY: 300,
    },
  };
  return maps[type];
}

// ========== 消息系统 ==========
let messageText = "";
let messageTimer = 0;
let messageColor = "#f0d9a5";
let showJournal = false;
let journalEntries = [];
let showSummary = false;

function showMessage(text, color, duration) {
  messageText = text;
  messageColor = color || "#f0d9a5";
  messageTimer = duration || 150;
}

// ========== 更新 ==========
function update() {
  if (showSummary) return;

  // 子地图模式
  if (unknownGate.subMapActive) {
    updateSubMap();
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
  player.x = Math.max(16, Math.min(W - 16, player.x + player.vx));
  player.y = Math.max(16, Math.min(H - 16, player.y + player.vy));

  // ZONE A: 观察生物
  strangeBlob.pulse += 0.04;
  const dxA = player.x - strangeBlob.x;
  const dyA = player.y - strangeBlob.y;
  const distA = Math.sqrt(dxA * dxA + dyA * dyA);

  // ZONE B: 线稿狐逃跑
  const dxB = player.x - sketchFox.x;
  const dyB = player.y - sketchFox.y;
  const distB = Math.sqrt(dxB * dxB + dyB * dyB);

  if (distB < 100 && !sketchFox.reachedNook) {
    sketchFox.fleeing = true;
    if (!tracker.zoneB_chased) {
      track("zoneB_chase_started", "玩家靠近线稿狐，狐开始逃跑");
      tracker.zoneB_chased = true;
    }
    // 逃向隐藏角落
    const tx = hiddenNook.x + hiddenNook.w / 2;
    const ty = hiddenNook.y + hiddenNook.h / 2;
    const fdx = sketchFox.x - tx;
    const fdy = sketchFox.y - ty;
    const fdist = Math.sqrt(fdx * fdx + fdy * fdy);
    if (fdist < 30) {
      sketchFox.reachedNook = true;
      sketchFox.x = tx;
      sketchFox.y = ty;
      if (!tracker.zoneB_foundNook) {
        track("zoneB_nook_found", "线稿狐引导玩家发现了隐藏角落");
        tracker.zoneB_foundNook = true;
        hiddenNook.found = true;
        player.discoveries.push({ name: hiddenNook.reward, desc: hiddenNook.rewardDesc });
        tracker.totalDiscoveries++;
        showMessage(`发现隐藏角落！获得：${hiddenNook.reward}`, "#f0d9a5", 200);
      }
    } else {
      const speed = 1.5;
      sketchFox.x -= (fdx / fdist) * speed;
      sketchFox.y -= (fdy / fdist) * speed;
    }
  } else if (!sketchFox.reachedNook) {
    sketchFox.fleeing = false;
    sketchFox.vx *= 0.9;
    sketchFox.vy *= 0.9;
    sketchFox.x += sketchFox.vx;
    sketchFox.y += sketchFox.vy;
  }

  // ZONE D: 入口发光
  unknownGate.glow = Math.sin(Date.now() / 600) * 0.4 + 0.6;

  // 消息计时
  if (messageTimer > 0) messageTimer--;
  else messageText = "";
}

function updateSubMap() {
  const sub = unknownGate.subMapData;
  if (!sub) return;

  let mx = 0, my = 0;
  if (keys.has("w") || keys.has("arrowup")) my = -1;
  if (keys.has("s") || keys.has("arrowdown")) my = 1;
  if (keys.has("a") || keys.has("arrowleft")) mx = -1;
  if (keys.has("d") || keys.has("arrowright")) mx = 1;
  const len = Math.sqrt(mx * mx + my * my) || 1;
  sub.playerX = Math.max(10, Math.min(590, (sub.playerX || 50) + (mx / len) * 3));
  sub.playerY = Math.max(10, Math.min(350, (sub.playerY || 200) + (my / len) * 3));

  // 收集物品
  for (const item of sub.items) {
    if (item.collected) continue;
    const dx = sub.playerX - item.x;
    const dy = sub.playerY - item.y;
    if (Math.sqrt(dx * dx + dy * dy) < 22) {
      item.collected = true;
      unknownGate.subMapCollected++;
      tracker.zoneD_itemsCollected++;
      showMessage(`收集：${item.name}`, "#f0d9a5", 100);
    }
  }

  if (messageTimer > 0) messageTimer--;
}

// ========== 交互 ==========
function handleKeyDown(key) {
  keys.add(key);

  if (showSummary) {
    if (key === "enter" || key === " ") showSummary = false;
    return;
  }

  // 子地图处理
  if (unknownGate.subMapActive) {
    const sub = unknownGate.subMapData;
    if (key === "e") {
      const dx = sub.playerX - sub.exitX;
      const dy = sub.playerY - sub.exitY;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        unknownGate.subMapActive = false;
        showMessage(`从${sub.name}返回，收集了 ${unknownGate.subMapCollected} 个发现物`, "#2e7d32", 200);
        player.discoveries.push({
          name: `${sub.name}发现物 ×${unknownGate.subMapCollected}`,
          desc: sub.desc,
        });
        tracker.totalDiscoveries += unknownGate.subMapCollected;
      }
    }
    return;
  }

  const px = player.x, py = player.y;

  // ZONE A: 观察
  if (key === "e") {
    const dxA = px - strangeBlob.x;
    const dyA = py - strangeBlob.y;
    if (Math.sqrt(dxA * dxA + dyA * dyA) < 40) {
      strangeBlob.observed = true;
      if (!tracker.zoneA_observed) {
        track("zoneA_observed", "玩家观察了奇怪的墨团");
        tracker.zoneA_observed = true;
        journalEntries.push({ name: strangeBlob.name, entry: strangeBlob.journalEntry });
        player.discoveries.push({ name: `观察记录：${strangeBlob.name}`, desc: strangeBlob.desc });
        tracker.totalDiscoveries++;
        showMessage(strangeBlob.desc.slice(0, 40) + "...", "#f0d9a5", 200);
      }
    }

    // ZONE C: 进入危险区
    const inZoneC = px > zones.C.x && px < zones.C.x + zones.C.w &&
                    py > zones.C.y && py < zones.C.y + zones.C.h;
    if (inZoneC && !dangerZone.entered) {
      dangerZone.entered = true;
      track("zoneC_entered", "玩家进入了高风险区域");
      tracker.zoneC_entered = true;
      // 随机：有50%概率获得稀有发现物，50%损失灵感
      if (Math.random() < 0.5) {
        dangerZone.survived = true;
        tracker.zoneC_survived = true;
        dangerZone.reward = "稀有母题碎片";
        player.discoveries.push({ name: dangerZone.reward, desc: "一块古老的母题碎片，上面的图案你可能在梦里见过。" });
        tracker.totalDiscoveries++;
        showMessage("你在墨压中找到了稀有母题碎片！", "#c9a846", 200);
      } else {
        showMessage("墨压太重了...你什么都没找到，灵感受损。但你看到了深处的轮廓。", "#d32f2f", 250);
      }
    }

    // ZONE D: 进入未知入口
    const dxD = px - unknownGate.x;
    const dyD = py - unknownGate.y;
    if (Math.sqrt(dxD * dxD + dyD * dyD) < 45 && !unknownGate.entered) {
      unknownGate.entered = true;
      unknownGate.type = randomGateType();
      unknownGate.subMapData = buildSubMap(unknownGate.type);
      unknownGate.subMapData.playerX = 50;
      unknownGate.subMapData.playerY = 200;
      unknownGate.subMapActive = true;
      unknownGate.subMapCollected = 0;
      track("zoneD_entered", `玩家进入了未知入口，类型：${unknownGate.type}`);
      tracker.zoneD_entered = true;
      tracker.zoneD_type = unknownGate.type;
      showMessage(unknownGate.subMapData.desc, "#c9a846", 250);
    }

    // ZONE E: 撤离
    const inZoneE = px > zones.E.x && px < zones.E.x + zones.E.w &&
                    py > zones.E.y && py < zones.E.y + zones.E.h;
    if (inZoneE) {
      track("zoneE_exited", `玩家主动撤离，携带 ${tracker.totalDiscoveries} 个发现物`);
      tracker.zoneE_exited = true;
      showSummary = true;
    }
  }

  // J: 日志
  if (key === "j") { showJournal = !showJournal; }

  // ZONE C: 跳过（玩家走出C区）
  const wasInZoneC = px - player.vx > zones.C.x && px - player.vx < zones.C.x + zones.C.w &&
                     py - player.vy > zones.C.y && py - player.vy < zones.C.y + zones.C.h;
  const stillInZoneC = px > zones.C.x && px < zones.C.x + zones.C.w &&
                       py > zones.C.y && py < zones.C.y + zones.C.h;
  if (wasInZoneC && !stillInZoneC && !dangerZone.entered && !tracker.zoneC_skipped) {
    track("zoneC_skipped", "玩家选择绕过危险区域");
    tracker.zoneC_skipped = true;
  }
}

// ========== 渲染 ==========
function draw() {
  // 背景
  ctx.fillStyle = "#1a1816";
  ctx.fillRect(0, 0, W, H);

  // 纸纹
  ctx.fillStyle = "rgba(255,255,255,0.015)";
  for (let i = 0; i < 30; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 25 + 3, 1);
  }

  if (unknownGate.subMapActive) {
    drawSubMap();
    return;
  }

  if (showSummary) {
    drawSummary();
    return;
  }

  // 区域背景
  for (const [id, zone] of Object.entries(zones)) {
    ctx.fillStyle = zone.color;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 8]);
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.setLineDash([]);
    ctx.fillStyle = "#555";
    ctx.font = "10px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(zone.label, zone.x + 6, zone.y + 14);
  }

  // ZONE A: 奇怪生物
  const blobAlpha = 0.7 + Math.sin(strangeBlob.pulse) * 0.3;
  ctx.fillStyle = `rgba(80,60,40,${blobAlpha})`;
  ctx.beginPath();
  ctx.ellipse(strangeBlob.x, strangeBlob.y, strangeBlob.w / 2, strangeBlob.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // 金色纹路
  if (strangeBlob.pulse % 1 < 0.5) {
    ctx.strokeStyle = "rgba(201,168,70,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(strangeBlob.x, strangeBlob.y - 2, 8, 0, Math.PI * 1.3);
    ctx.stroke();
  }
  ctx.fillStyle = "#f5efe0";
  ctx.beginPath();
  ctx.arc(strangeBlob.x + 4, strangeBlob.y - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1816";
  ctx.beginPath();
  ctx.arc(strangeBlob.x + 5, strangeBlob.y - 3, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // 标签
  ctx.fillStyle = "#8b8173";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(strangeBlob.name + (strangeBlob.observed ? " ✓" : ""), strangeBlob.x, strangeBlob.y + 22);
  ctx.textAlign = "start";
  // 交互提示
  const dxA = player.x - strangeBlob.x;
  const dyA = player.y - strangeBlob.y;
  if (Math.sqrt(dxA * dxA + dyA * dyA) < 40 && !strangeBlob.observed) {
    drawHint(strangeBlob.x, strangeBlob.y - 28, "E 观察");
  }

  // ZONE B: 线稿狐
  if (!sketchFox.reachedNook) {
    ctx.fillStyle = sketchFox.fleeing ? "#6a5a4a" : "#4a4a4a";
    ctx.fillRect(sketchFox.x - sketchFox.w / 2, sketchFox.y - sketchFox.h / 2, sketchFox.w, sketchFox.h);
    ctx.fillStyle = "#f5efe0";
    ctx.fillRect(sketchFox.x + 2, sketchFox.y - 3, 3, 3);
    ctx.fillStyle = "#8b8173";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(sketchFox.name, sketchFox.x, sketchFox.y - 14);
    ctx.textAlign = "start";
    if (sketchFox.fleeing) {
      drawHint(sketchFox.x, sketchFox.y - 30, "它逃跑了！");
    }
  } else {
    // 到达隐藏角落
    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(sketchFox.x - 8, sketchFox.y - 6, 16, 12);
    ctx.fillStyle = "#f0d9a5";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("（已安顿）", sketchFox.x, sketchFox.y - 12);
    ctx.textAlign = "start";
  }

  // 隐藏角落
  if (hiddenNook.found) {
    ctx.fillStyle = "rgba(240,217,165,0.15)";
    ctx.fillRect(hiddenNook.x, hiddenNook.y, hiddenNook.w, hiddenNook.h);
    ctx.fillStyle = "#f0d9a5";
    ctx.font = "9px sans-serif";
    ctx.fillText("隐藏角落 ✓", hiddenNook.x + 4, hiddenNook.y + hiddenNook.h / 2 + 3);
  }

  // ZONE C: 危险区
  dangerZone.warningPulse = Math.sin(Date.now() / 400) * 0.4 + 0.6;
  if (dangerZone.entered && dangerZone.survived) {
    ctx.fillStyle = "rgba(201,168,70,0.15)";
    ctx.fillRect(zones.C.x, zones.C.y, zones.C.w, zones.C.h);
    ctx.fillStyle = "#c9a846";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("母题碎片已找到 ✓", zones.C.x + zones.C.w / 2, zones.C.y + zones.C.h / 2);
    ctx.textAlign = "start";
  } else if (dangerZone.entered && !dangerZone.survived) {
    ctx.fillStyle = "rgba(200,60,60,0.1)";
    ctx.fillRect(zones.C.x, zones.C.y, zones.C.w, zones.C.h);
    ctx.fillStyle = "#d32f2f";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("灵感受损，但你看到了什么...", zones.C.x + zones.C.w / 2, zones.C.y + zones.C.h / 2);
    ctx.textAlign = "start";
  } else {
    // 警告效果
    ctx.strokeStyle = `rgba(200,60,60,${dangerZone.warningPulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(zones.C.x + 2, zones.C.y + 2, zones.C.w - 4, zones.C.h - 4);
    ctx.setLineDash([]);
    // 警告文字
    ctx.fillStyle = `rgba(200,60,60,${dangerZone.warningPulse})`;
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚠ 高风险区域 ⚠", zones.C.x + zones.C.w / 2, zones.C.y + zones.C.h / 2 - 10);
    ctx.fillText("可能获得稀有母题，也可能损失灵感", zones.C.x + zones.C.w / 2, zones.C.y + zones.C.h / 2 + 16);
    ctx.textAlign = "start";

    // 进入提示
    const inC = player.x > zones.C.x && player.x < zones.C.x + zones.C.w &&
                player.y > zones.C.y && player.y < zones.C.y + zones.C.h;
    if (inC) {
      drawHint(zones.C.x + zones.C.w / 2, zones.C.y + 30, "E 进入 或 绕过");
    }
  }

  // ZONE D: 未知入口
  const gateAlpha = unknownGate.glow;
  const gradient = ctx.createRadialGradient(unknownGate.x, unknownGate.y, 8, unknownGate.x, unknownGate.y, 55);
  gradient.addColorStop(0, `rgba(160,120,200,${0.5 + gateAlpha * 0.3})`);
  gradient.addColorStop(1, "rgba(160,120,200,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(unknownGate.x - 55, unknownGate.y - 55, 110, 110);

  ctx.fillStyle = `rgba(160,120,200,${0.6 + gateAlpha * 0.3})`;
  ctx.fillRect(unknownGate.x - unknownGate.w / 2, unknownGate.y - unknownGate.h / 2, unknownGate.w, unknownGate.h);
  ctx.strokeStyle = `rgba(200,180,240,${gateAlpha})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(unknownGate.x - unknownGate.w / 2, unknownGate.y - unknownGate.h / 2, unknownGate.w, unknownGate.h);
  ctx.fillStyle = "#fff";
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("?", unknownGate.x, unknownGate.y + 6);
  ctx.textAlign = "start";

  if (unknownGate.entered) {
    ctx.fillStyle = "#c9a846";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`已探索：${unknownGate.subMapData?.name || ""}`, unknownGate.x, unknownGate.y + unknownGate.h / 2 + 14);
    ctx.textAlign = "start";
  }

  const dxD = player.x - unknownGate.x;
  const dyD = player.y - unknownGate.y;
  if (Math.sqrt(dxD * dxD + dyD * dyD) < 45 && !unknownGate.entered) {
    drawHint(unknownGate.x, unknownGate.y - 42, "E 进入未知区域");
  }

  // ZONE E: 撤离点
  ctx.fillStyle = "rgba(100,200,100,0.12)";
  ctx.fillRect(zones.E.x, zones.E.y, zones.E.w, zones.E.h);
  ctx.fillStyle = "#4a9e4a";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("撤离点", zones.E.x + zones.E.w / 2, zones.E.y + 30);
  ctx.fillText("E 带着发现物返回", zones.E.x + zones.E.w / 2, zones.E.y + 55);
  ctx.textAlign = "start";

  // 玩家
  ctx.fillStyle = "#2d2d2d";
  ctx.fillRect(player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);
  ctx.fillStyle = "#f5efe0";
  ctx.fillRect(player.x + 2, player.y - 3, 3, 3);

  // 消息
  if (messageText && messageTimer > 0) {
    const alpha = Math.min(1, messageTimer / 30);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    const tw = Math.min(600, ctx.measureText(messageText).width + 24);
    ctx.fillRect(W / 2 - tw / 2, H - 70, tw, 28);
    ctx.fillStyle = messageColor;
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(messageText, W / 2, H - 50);
    ctx.textAlign = "start";
    ctx.globalAlpha = 1;
  }

  // 底部提示
  ctx.fillStyle = "#555";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("WASD 移动 | E 交互 | J 日志 | 探索、观察、选择", W / 2, H - 12);
  ctx.textAlign = "start";

  // 发现物计数
  ctx.fillStyle = "#f0d9a5";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(`发现物：${tracker.totalDiscoveries}`, W - 140, 20);

  // 日志面板
  if (showJournal) drawJournal();
}

function drawSubMap() {
  const sub = unknownGate.subMapData;
  if (!sub) return;

  ctx.fillStyle = sub.bgColor;
  ctx.fillRect(0, 0, W, H);

  // 纹理
  if (sub.bgColor === "#f5efe0") {
    ctx.fillStyle = "rgba(0,0,0,0.02)";
    for (let i = 0; i < 15; i++) ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 18 + 2, 1);
  }

  // 标题
  ctx.fillStyle = "#1a1816";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(sub.name, 20, 30);
  ctx.fillStyle = "#555";
  ctx.font = "11px sans-serif";
  ctx.fillText(sub.desc, 20, 48);

  // 物品
  for (const item of sub.items) {
    if (item.collected) {
      ctx.fillStyle = "rgba(100,200,100,0.3)";
      ctx.beginPath();
      ctx.arc(item.x, item.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2e7d32";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✓", item.x, item.y + 4);
      ctx.textAlign = "start";
    } else {
      const pulse = Math.sin(Date.now() / 500 + (item.x || 0)) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(240,217,165,${pulse})`;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3a3630";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.name, item.x, item.y - 14);
      ctx.textAlign = "start";
    }
  }

  // 出口
  ctx.fillStyle = "rgba(100,200,100,0.6)";
  ctx.beginPath();
  ctx.arc(sub.exitX, sub.exitY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("出口 E", sub.exitX, sub.exitY + 4);
  ctx.textAlign = "start";

  // 玩家
  ctx.fillStyle = "#2d2d2d";
  ctx.fillRect(sub.playerX - 7, sub.playerY - 11, 14, 22);

  ctx.fillStyle = "#555";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`WASD 移动 | 靠近物品自动收集 | E 从出口返回`, W / 2, H - 15);
  ctx.textAlign = "start";
}

function drawSummary() {
  ctx.fillStyle = "rgba(26,24,22,0.95)";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#f0d9a5";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("探索结束", W / 2, 60);

  ctx.fillStyle = "#8b8173";
  ctx.font = "14px sans-serif";
  ctx.fillText(`发现物：${tracker.totalDiscoveries}  |  耗时：${((Date.now() - tracker.startTime) / 1000).toFixed(0)}s`, W / 2, 100);
  ctx.textAlign = "start";

  // 行为总结
  const checks = [
    { label: "A. 观察行为", done: tracker.zoneA_observed, detail: tracker.zoneA_observed ? "✓ 玩家主动观察了未知生物" : "✗ 玩家未观察" },
    { label: "B. 追逐行为", done: tracker.zoneB_chased, detail: tracker.zoneB_chased ? (tracker.zoneB_foundNook ? "✓ 追逐并发现了隐藏角落" : "✓ 发起了追逐") : "✗ 玩家未追逐" },
    { label: "C. 风险选择", done: tracker.zoneC_entered || tracker.zoneC_skipped, detail: tracker.zoneC_entered ? `✓ 进入危险区 (${tracker.zoneC_survived ? "获得稀有物" : "灵感受损"})` : (tracker.zoneC_skipped ? "→ 选择绕过" : "✗ 未靠近") },
    { label: "D. 未知探索", done: tracker.zoneD_entered, detail: tracker.zoneD_entered ? `✓ 进入未知入口 (${tracker.zoneD_type})，收集 ${tracker.zoneD_itemsCollected} 件` : "✗ 未进入" },
    { label: "E. 主动撤离", done: tracker.zoneE_exited, detail: tracker.zoneE_exited ? "✓ 主动撤离" : "✗ 未撤离" },
  ];

  let y = 150;
  for (const check of checks) {
    ctx.fillStyle = check.done ? "#2e7d32" : "#d32f2f";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(check.label, 120, y);
    ctx.fillStyle = "#8b8173";
    ctx.font = "13px sans-serif";
    ctx.fillText(check.detail, 280, y);
    y += 32;
  }

  // 发现物列表
  y += 30;
  ctx.fillStyle = "#f0d9a5";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("携带发现物：", 120, y);
  y += 28;
  if (player.discoveries.length === 0) {
    ctx.fillStyle = "#555";
    ctx.fillText("（空手而归）", 130, y);
  } else {
    for (const d of player.discoveries) {
      ctx.fillStyle = "#ccc";
      ctx.font = "13px sans-serif";
      ctx.fillText(`· ${d.name}`, 130, y);
      y += 22;
    }
  }

  ctx.fillStyle = "#555";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("按 Enter 返回地图  |  查看控制台获取详细日志", W / 2, H - 20);
  ctx.textAlign = "start";
}

function drawHint(x, y, text) {
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.font = "10px sans-serif";
  const tw = ctx.measureText(text).width;
  ctx.fillRect(x - tw / 2 - 4, y - 8, tw + 8, 16);
  ctx.fillStyle = "#f0d9a5";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y + 3);
  ctx.textAlign = "start";
}

function drawJournal() {
  ctx.fillStyle = "rgba(26,24,22,0.9)";
  ctx.fillRect(0, 0, W, H);

  const px = 80, py = 60, pw = W - 160, ph = H - 120;
  ctx.fillStyle = "#f5efe0";
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = "#2d2d2d";
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);

  ctx.fillStyle = "#1a1816";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("观察日志", px + 20, py + 30);

  if (journalEntries.length === 0) {
    ctx.fillStyle = "#555";
    ctx.font = "13px sans-serif";
    ctx.fillText("还没有任何观察记录。去探索吧。", px + 20, py + 70);
  } else {
    let y = py + 65;
    for (const entry of journalEntries) {
      ctx.fillStyle = "#c9a846";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(entry.name, px + 20, y);
      y += 22;
      ctx.fillStyle = "#3a3630";
      ctx.font = "12px sans-serif";
      // 换行
      const words = entry.entry;
      const maxW = pw - 40;
      ctx.fillText(words.slice(0, 55), px + 20, y);
      if (words.length > 55) {
        y += 18;
        ctx.fillText(words.slice(55, 110), px + 20, y);
        if (words.length > 110) {
          y += 18;
          ctx.fillText(words.slice(110), px + 20, y);
        }
      }
      y += 30;
    }
  }

  ctx.fillStyle = "#8b8173";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("按 J 关闭", W / 2, py + ph - 10);
  ctx.textAlign = "start";
}

// ========== 事件 ==========
window.addEventListener("keydown", (e) => {
  handleKeyDown(e.key.toLowerCase());
  e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

// ========== 启动 ==========
track("experiment_started", "Vertical Slice 行为实验开始");
showMessage("探索这片墨境。试着观察、追逐、冒险、发现未知。准备好了就走向撤离点。", "#f0d9a5", 400);

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
