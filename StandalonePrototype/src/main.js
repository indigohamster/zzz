import { H, W } from "./core/config.js?v=25";
import { drawPaperBackground, label } from "./core/render.js?v=25";
import { createDrawingCanvas } from "./features/drawing/DrawingCanvas.js?v=25";
import { drawWeaponResultPanel, weaponResultEnterButton } from "./features/drawing/WeaponResultPanel.js?v=25";
import { createDayCycle } from "./game/DayCycle.js?v=25";
import { applyWeaponProfile, createGameState } from "./game/GameState.js?v=32";
import { validateWeaponProfile } from "./game/WeaponProfile.js?v=32";
import { generateRelicChoices } from "./game/builds/RewardGenerator.js?v=32";
import { getWeaponTypeFromProfile } from "./game/builds/WeaponArchetypes.js?v=32";
import { createInkwellScene } from "./scenes/inkwell.js?v=36";
import { createOpeningScene } from "./scenes/OpeningScene.js";
import { createChapter0Scene } from "./scenes/Chapter0.js?v=1";
import { createShopState, buyShopItem, getAllShopItems, getCategories, getItemsByCategory } from "./game/ShopSystem.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const keys = new Set();
const mouse = { x: 0, y: 0, left: false, right: false, justLeft: false, justRight: false };
const pointerInput = {
  activePointerId: null,
  lastScaleX: 1,
  lastScaleY: 1,
  lastLogKey: "",
};

let scene = "chapter0";
let frame = 0;

const drawPanel = { x: 86, y: 92, w: 420, h: 330 };
const finishButton = { x: 548, y: 342, w: 176, h: 38 };
const drawingToolButtons = [
  { id: "pencil", label: "Pencil", x: 86, y: 436, w: 76, h: 30 },
  { id: "eraser", label: "Eraser", x: 170, y: 436, w: 76, h: 30 },
  { id: "undo", label: "Undo", x: 254, y: 436, w: 66, h: 30 },
  { id: "redo", label: "Redo", x: 328, y: 436, w: 66, h: 30 },
  { id: "clear", label: "Clear", x: 402, y: 436, w: 72, h: 30 },
];
const gameState = createGameState();
window.inkwellBuild = {
  state: gameState.buildState,
  addRelic: (id) => gameState.buildState.addRelic(id),
  removeRelic: (id) => gameState.buildState.removeRelic(id),
  choices: (count = 3) => generateRelicChoices(gameState.buildState, getWeaponTypeFromProfile(gameState.currentWeapon), count, gameState.status.inspiration),
};
const dayCycle = createDayCycle(gameState);
const drawingCanvas = createDrawingCanvas(drawPanel);
const weapon = gameState.currentWeapon;
let drawingComplete = false;
let lastValidWeapon = null;
let drawConfidence = 0;
let recognitionFailed = false;
let shopState = null; // 商店状态
const confirmGenerateButton = { x: 548, y: 392, w: 176, h: 34 };

let feedback = {
  title: "Day 1",
  boss: "Zhou has not seen the draft yet.",
  cat: "Inkdot watches the blank page.",
  draft: "No draft has been made.",
};

lastValidWeapon = null;  // structuredClone removed: currentWeapon contains non-cloneable functions (buildState)
console.debug("[DrawPanel] studio ready", { day: gameState.day, weapon: gameState.currentWeapon?.name ?? "none" });

const inkwell = createInkwellScene({
  canvas,
  ctx,
  keys,
  mouse,
  weapon,
  getFrame: () => frame,
  onFinish: finishInkwellRun,
});


const openingScene = createOpeningScene({
  canvas,
  ctx,
  keys,
  mouse,
  onDone: () => { scene = "studio"; },
});
window.DEBUG_SET_WEAPON_TYPE = setDebugWeaponType;
const chapter0Scene = createChapter0Scene({
  canvas,
  ctx,
  keys,
  mouse,
  gameState,
  onDone: () => { scene = "studio"; },
});

function clearDrawing() {
  drawingCanvas.clear();
  drawingComplete = false;
}

function setDrawingTool(tool) {
  if (drawingComplete) return;
  drawingCanvas.setTool(tool);
}

function undoDrawing() {
  if (drawingComplete) return;
  drawingCanvas.undo();
}

function redoDrawing() {
  if (drawingComplete) return;
  drawingCanvas.redo();
}

function beginStroke() {
  if (scene !== "studio" || drawingComplete) return;
  drawingCanvas.beginStroke(mouse.x, mouse.y);
}

function endStroke() {
  drawingCanvas.endStroke();
}

function updateDrawing() {
  if (drawingComplete) return;
  drawingCanvas.update(mouse.x, mouse.y);
}

function finishDrawing() {
  const profile = drawingCanvas.finishWeaponProfile();
  validateWeaponProfile(profile, "drawing.finish");
  applyWeaponProfile(gameState, profile);
  drawingComplete = true;
}

function enterInkwell() {
  if (!drawingComplete) finishDrawing();
  validateWeaponProfile(gameState.currentWeapon, "inkwell.enter");
  dayCycle.setPhase("inkwell");
  inkwell.start();
  scene = "inkwell";
}

function setDebugWeaponType(type) {
  const normalized = String(type ?? "").trim().toLowerCase();
  const presets = {
    sword: { pattern: "arcSlash", range: 56, damage: 12, attackSpeed: 3.75, knockback: 3.2 },
    spear: { pattern: "thrust", range: 86, damage: 10, attackSpeed: 3.35, knockback: 3 },
    dagger: { pattern: "daggerSlash", range: 38, damage: 8, attackSpeed: 4.3, knockback: 2.4 },
    hammer: { pattern: "heavySmash", range: 52, damage: 17, attackSpeed: 2.15, knockback: 7 },
    whip: { pattern: "whipLash", range: 108, damage: 9, attackSpeed: 3.15, knockback: 2.6 },
  };
  const preset = presets[normalized];
  if (!preset) {
    console.warn("[DebugWeapon] unknown type", normalized);
    return null;
  }
  Object.assign(gameState.currentWeapon, {
    id: `debug-${normalized}`,
    name: `Debug ${normalized}`,
    weaponType: normalized,
    weaponArchetype: normalized,
    archetype: {
      id: normalized,
      displayName: normalized,
      attackPattern: preset.pattern,
      baseRange: preset.range,
      baseStats: {
        damage: preset.damage,
        range: preset.range,
        attackSpeed: preset.attackSpeed,
        inkCost: 0,
        crit: 0.05,
        criticalChance: 0.05,
        knockback: preset.knockback,
      },
    },
    attackPattern: preset.pattern,
    metrics: { debugWeapon: true },
    imageDataUrl: gameState.currentWeapon.imageDataUrl ?? "",
    finalStats: {
      damage: preset.damage,
      range: preset.range,
      attackSpeed: preset.attackSpeed,
      inkCost: 0,
      crit: 0.05,
      criticalChance: 0.05,
      knockback: preset.knockback,
    },
    combat: {
      type: normalized,
      weaponArchetype: normalized,
      attackPattern: preset.pattern,
      damage: preset.damage,
      range: preset.range,
      attackSpeed: preset.attackSpeed,
      inkCost: 0,
      knockback: preset.knockback,
    },
  });
  console.log("[DebugWeapon]", normalized, gameState.currentWeapon);
  return gameState.currentWeapon;
}

function pointInRect(px, py, rect) {
  return px >= rect.x && py >= rect.y && px <= rect.x + rect.w && py <= rect.y + rect.h;
}

function finishInkwellRun(run) {
  const m = weapon.metrics || { seconds: 0, revisions: 0, overdraw: 0, jitter: 0 };
  const exhaustion = run.overtimeCount * 6 + (run.allNighter ? 18 : 0);
  const soul = Math.round(m.seconds * 1.5 + m.revisions * 2 + run.kills * 8 + run.mined * 0.4 + m.overdraw * 0.12 - exhaustion);
  const commercial = Math.round(run.kills * 8 + run.mined * 0.25 + run.attacks * 0.8 + run.overtimeCount * 4 - run.hitsTaken * 0.15);

  feedback = {
    title: `Day ${gameState.day} - morning draft`,
    draft: makeDraftLine(m, run),
    boss: makeBossLine(commercial, run),
    cat: makeCatLine(soul, run),
  };
  dayCycle.setPhase("settlement");
  scene = "feedback";
}

function makeDraftLine(metrics, run) {
  const minutes = Math.max(1, Math.round(run.durationFrames / 3600));
  if (run.finishReason === "boss" || run.bossRewards > 0) return `The draft locks into a finished composition. ${weapon.name} breaks ${run.bossName || "the night boss"} at the center of the page.`;
  if (run.allNighter) return `The draft is frighteningly complete. ${weapon.name} has details you do not remember drawing.`;
  if (run.overtimeCount > 0) return `The draft keeps going past its natural ending. ${weapon.name} gains detail, but the page feels warm from overwork.`;
  if (run.itemsCollected > 0) return `The draft picks up a strange new motif from the treasure room. ${weapon.name} no longer feels like a single-use sketch.`;
  if (run.materialsCollected > 8) return "The draft has richer texture than yesterday. Small materials from the rooms became background details.";
  if (run.finishReason === "deadline") return `Dawn catches the page mid-stroke. ${weapon.name} leaves a hard unfinished line across the draft.`;
  if (run.finishReason === "ink") return "The draft thins near the edges. You can see where the ink ran out before the idea did.";
  if (run.finishReason === "body") return "The draft is heavy and blurred. The strongest marks are where your hand almost slipped.";
  if (run.finishReason === "clear") return `The draft becomes a complete action study. ${weapon.name} owns the center of the page.`;
  if (run.kills >= 3) return `The draft becomes a tense action piece. ${weapon.name} cuts through the center of the page.`;
  if (run.mined > 18) return `The draft is quiet and dense with scenery. You spent ${minutes} minutes digging for a shape.`;
  if (metrics.revisions > 8) return "The draft has many corrected lines. None of them are clean, but they feel chosen.";
  return "The draft is small, unfinished, and alive enough to bother you.";
}

function makeBossLine(commercial, run) {
  if (run.finishReason === "boss" || run.bossRewards > 0) return "Zhou: This one has an ending. Keep that structure.";
  if (run.chestsOpened > 0) return "Zhou: Better texture library today. The details are doing some work.";
  if (run.allNighter) return "Zhou: This is polished. Too polished for one night, honestly.";
  if (run.overtimeCount > 0) return "Zhou: The extra pass helped. Just do not make this your normal rhythm.";
  if (run.finishReason === "deadline") return "Zhou: You stopped at the right second, or the wrong one. Hard to tell. But it has urgency.";
  if (run.finishReason === "clear") return "Zhou: This one reads immediately. Strong silhouette, clear action.";
  if (commercial > 28) return "Zhou: This has movement. Keep this direction.";
  return "Zhou: It is rough. Next time, use more reference.";
}

function makeCatLine(soul, run) {
  if (run.finishReason === "boss" || run.bossRewards > 0) return "Inkdot circles the broken shape you brought back. It looks relieved that the night has an end.";
  if (run.chestsOpened > 0) return "Inkdot noses the opened supply sketch. Some of the dust clings to its whiskers.";
  if (run.allNighter) return "Inkdot does not climb onto the desk today. It watches your hand like it is afraid of waking you.";
  if (run.overtimeCount > 0) return "Inkdot presses its head against your wrist. The page improved, but the room feels later than it should.";
  if (run.finishReason === "deadline") return "Inkdot paws at the corner of the page. It seems to like that you did not smooth over the unfinished part.";
  if (run.finishReason === "ink") return "Inkdot presses close to the dry brush marks. The room smells like paper dust.";
  if (soul > 38) return "Inkdot is brighter than yesterday. It remembers the line you kept redrawing.";
  return "Inkdot curls near the paper. The room feels a little pale.";
}

function drawStudio() {
  drawPaperBackground(ctx);
  ctx.fillStyle = "#1d1c1a";
  ctx.fillRect(0, H - 76, W, 76);
  ctx.fillStyle = "#33302c";
  ctx.fillRect(0, H - 118, W, 44);
  label(ctx, "Night studio", 54, 50, 24);
  label(ctx, "Draw a weapon. The game reads time, strokes, corrections, overdraw, and tremble.", 54, 76, 14, "#5c554c");

  ctx.fillStyle = "#f8f3e7";
  ctx.fillRect(drawPanel.x, drawPanel.y, drawPanel.w, drawPanel.h);
  ctx.strokeStyle = "#202020";
  ctx.lineWidth = 2;
  ctx.strokeRect(drawPanel.x, drawPanel.y, drawPanel.w, drawPanel.h);

  drawingCanvas.draw(ctx);
  drawDrawingToolbar();

  const { metrics, classification } = drawingCanvas.previewWeaponProfile();
  const elapsed = Math.round(metrics.seconds);
  label(ctx, "weapon read", 548, 134, 14, "#756b5e");
  label(ctx, `type ${classification.type}`, 548, 164, 18);
  label(ctx, `pattern ${classification.attackPattern}`, 548, 194, 16);
  label(ctx, "process", 548, 254, 14, "#756b5e");
  label(ctx, `time ${elapsed}s  strokes ${metrics.strokeCount}`, 548, 282, 16);
  label(ctx, `points ${metrics.pointCount}  overdraw ${metrics.overdraw}`, 548, 306, 16);
  drawFinishButton();
  if (drawingComplete) drawFinishedWeaponPanel();
  else label(ctx, "P/E: tools  Ctrl+Z/Y: undo/redo  R: clear", 548, 404, 16);

  ctx.fillStyle = "#f0d9a5";
  ctx.fillRect(66, H - 56, 16, 16);
  label(ctx, "Inkdot waits by the sketchbook. It does not care if the line is pretty.", 96, H - 42, 15, "#f8f3e7");
}

function drawDrawingToolbar() {
  const activeTool = drawingCanvas.getTool();
  for (const button of drawingToolButtons) {
    const disabled = drawingComplete || (button.id === "undo" && !drawingCanvas.canUndo()) || (button.id === "redo" && !drawingCanvas.canRedo());
    const active = button.id === activeTool;
    ctx.fillStyle = disabled ? "#8b8173" : active ? "#f0d9a5" : "#1f1e1c";
    ctx.fillRect(button.x, button.y, button.w, button.h);
    ctx.strokeStyle = active ? "#1f1e1c" : "#f0d9a5";
    ctx.lineWidth = 1;
    ctx.strokeRect(button.x, button.y, button.w, button.h);
    label(ctx, button.label, button.x + 10, button.y + 21, 14, disabled || active ? "#1f1e1c" : "#f8f3e7");
  }
}

function drawFinishButton() {
  const enabled = drawingCanvas.hasEnoughPoints();
  ctx.fillStyle = drawingComplete ? "#d2c7b3" : enabled ? "#1f1e1c" : "#8b8173";
  ctx.fillRect(finishButton.x, finishButton.y, finishButton.w, finishButton.h);
  ctx.strokeStyle = "#1f1e1c";
  ctx.lineWidth = 2;
  ctx.strokeRect(finishButton.x, finishButton.y, finishButton.w, finishButton.h);
  label(
    ctx,
    drawingComplete ? "Drawing complete" : "Finish drawing",
    finishButton.x + 14,
    finishButton.y + 25,
    16,
    drawingComplete ? "#1f1e1c" : "#f8f3e7"
  );
}

function drawConfirmGenerateButton() {
  if (drawingComplete || !drawingCanvas.hasEnoughPoints()) return;
  ctx.fillStyle = "#f0d9a5";
  ctx.fillRect(confirmGenerateButton.x, confirmGenerateButton.y, confirmGenerateButton.w, confirmGenerateButton.h);
  ctx.strokeStyle = "#1f1e1c";
  ctx.lineWidth = 2;
  ctx.strokeRect(confirmGenerateButton.x, confirmGenerateButton.y, confirmGenerateButton.w, confirmGenerateButton.h);
  label(ctx, "que ren sheng cheng", confirmGenerateButton.x + 18, confirmGenerateButton.y + 24, 15, "#1f1e1c");
}

function drawFinishedWeaponPanel() {
  drawWeaponResultPanel(ctx, gameState.currentWeapon, label);
}

function updateWorkPhase() {
  // Work 阶段暂时不需要更新逻辑
  // 主要是等待玩家按 Enter 键继续
}

function drawWorkPhase() {
  // 绘制纸张背景
  drawPaperBackground(ctx);
  
  // 获取当前工作事件
  const currentEvent = dayCycle.getCurrentWorkEvent();
  if (!currentEvent) {
    // 没有事件了，应该不会到这里（应该已经切换到 studio 场景了）
    label(ctx, "Work phase complete. Entering studio...", 70, 70, 26);
    return;
  }
  
  // 绘制事件标题
  label(ctx, `Day ${gameState.day} - Work Phase`, 70, 70, 26);
  
  // 绘制事件类型图标
  const eventTypeIcons = {
    "overtime": "[加班]",
    "requirement_change": "[需求修改]",
    "client_feedback": "[客户反馈]",
    "urgent_task": "[临时任务]",
    "positive": "[积极事件]",
  };
  const icon = eventTypeIcons[currentEvent.type] || "[事件]";
  label(ctx, `${icon} ${currentEvent.title}`, 70, 120, 22);
  
  // 绘制事件描述（支持换行）
  const descLines = currentEvent.description.split("\n");
  let yPos = 170;
  descLines.forEach(line => {
    label(ctx, line, 70, yPos, 18);
    yPos += 30;
  });
  
  // 绘制状态变化
  yPos += 20;
  ctx.fillStyle = "#8d1d25";
  ctx.font = "bold 18px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText("Status Changes:", 70, yPos);
  yPos += 35;
  
  ctx.fillStyle = "#24211f";
  ctx.font = "16px Segoe UI, Microsoft YaHei, sans-serif";
  
  const effects = currentEvent.effects;
  if (effects.stress) {
    const sign = effects.stress > 0 ? "+" : "";
    ctx.fillText(`Stress: ${sign}${effects.stress}`, 90, yPos);
    yPos += 25;
  }
  if (effects.fatigue) {
    const sign = effects.fatigue > 0 ? "+" : "";
    ctx.fillText(`Fatigue: ${sign}${effects.fatigue}`, 90, yPos);
    yPos += 25;
  }
  if (effects.inspiration) {
    const sign = effects.inspiration > 0 ? "+" : "";
    ctx.fillText(`Inspiration: ${sign}${effects.inspiration}`, 90, yPos);
    yPos += 25;
  }
  if (effects.mood) {
    ctx.fillText(`Mood: ${effects.mood}`, 90, yPos);
    yPos += 25;
  }
  
  // 绘制当前状态
  yPos += 20;
  const { getStatusDescription } = require("./game/WorkEvents.js");
  const statusDesc = getStatusDescription(gameState.status);
  ctx.fillStyle = "#8d1d25";
  ctx.font = "bold 16px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText("Current Status:", 70, yPos);
  yPos += 30;
  
  ctx.fillStyle = "#24211f";
  ctx.font = "16px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(statusDesc, 90, yPos);
  
  // 绘制进度
  const progress = dayCycle.getWorkProgress();
  yPos += 40;
  ctx.fillStyle = "#666";
  ctx.font = "14px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(`Event ${progress.current + 1} / ${progress.total}`, 70, yPos);
  
  // 绘制提示
  label(ctx, "Enter: continue", 70, 462, 18);
}

function updateShop() {
  if (!shopState) return;
  
  // 切换分类：Left / Right
  if (keys.has("arrowleft") || keys.has("a")) {
    keys.delete("arrowleft");
    keys.delete("a");
    const categories = getCategories();
    const currentIndex = categories.findIndex(c => c.id === shopState.selectedCategory);
    shopState.selectedCategory = categories[(currentIndex - 1 + categories.length) % categories.length].id;
    shopState.selectedIndex = 0;
  }
  if (keys.has("arrowright") || keys.has("d")) {
    keys.delete("arrowright");
    keys.delete("d");
    const categories = getCategories();
    const currentIndex = categories.findIndex(c => c.id === shopState.selectedCategory);
    shopState.selectedCategory = categories[(currentIndex + 1) % categories.length].id;
    shopState.selectedIndex = 0;
  }
  
  // 选择物品：Up / Down
  const currentItems = getItemsByCategory(shopState.selectedCategory);
  if (keys.has("arrowup") || keys.has("w")) {
    keys.delete("arrowup");
    keys.delete("w");
    shopState.selectedIndex = Math.max(0, shopState.selectedIndex - 1);
  }
  if (keys.has("arrowdown") || keys.has("s")) {
    keys.delete("arrowdown");
    keys.delete("s");
    shopState.selectedIndex = Math.min(currentItems.length - 1, shopState.selectedIndex + 1);
  }
  
  // 购买：Enter
  if (keys.has("enter")) {
    keys.delete("enter");
    const item = currentItems[shopState.selectedIndex];
    if (item) {
      const result = buyShopItem(gameState, item.id);
      shopState.message = result.message;
      shopState.messageTimer = 120; // 2 秒（60fps * 2）
    }
  }
  
  // 退出商店：Escape
  if (keys.has("escape")) {
    keys.delete("escape");
    shopState = null;
    scene = "free";
  }
  
  // 消息计时器
  if (shopState.messageTimer > 0) {
    shopState.messageTimer--;
  }
}

function drawShop() {
  if (!shopState) return;
  
  // 绘制纸张背景
  drawPaperBackground(ctx);
  
  // 绘制标题
  label(ctx, "Shop", 70, 70, 26);
  
  // 绘制货币
  ctx.fillStyle = "#24211f";
  ctx.font = "bold 20px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(`Money: ${gameState.money}`, 490, 70);
  
  // 绘制分类标签
  const categories = getCategories();
  let categoryX = 70;
  categories.forEach((cat) => {
    const isSelected = cat.id === shopState.selectedCategory;
    ctx.fillStyle = isSelected ? "#1f1e1c" : "#8d1d25";
    ctx.font = isSelected ? "bold 18px Segoe UI, Microsoft YaHei, sans-serif" : "18px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(`${cat.icon} ${cat.name}`, categoryX, 120);
    categoryX += ctx.measureText(`${cat.icon} ${cat.name}`).width + 30;
  });
  
  // 绘制分隔线
  ctx.strokeStyle = "#8d1d25";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 135);
  ctx.lineTo(610, 135);
  ctx.stroke();
  
  // 获取当前分类的商品
  const items = getItemsByCategory(shopState.selectedCategory);
  
  // 绘制商品列表
  let yPos = 170;
  items.forEach((item, index) => {
    const isSelected = index === shopState.selectedIndex;
    
    // 绘制选中背景
    if (isSelected) {
      ctx.fillStyle = "rgba(141, 29, 37, 0.1)";
      ctx.fillRect(70, yPos - 20, 540, 30);
    }
    
    // 绘制商品名称
    ctx.fillStyle = isSelected ? "#1f1e1c" : "#24211f";
    ctx.font = isSelected ? "bold 16px Segoe UI, Microsoft YaHei, sans-serif" : "16px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(`${item.icon} ${item.name} - ${item.price} Money`, 90, yPos);
    
    yPos += 35;
  });
  
  // 绘制选中商品的详细描述
  if (items.length > 0) {
    const selectedItem = items[shopState.selectedIndex];
    let descY = 370;
    
    ctx.fillStyle = "#24211f";
    ctx.font = "bold 16px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText("Description:", 70, descY);
    
    descY += 30;
    ctx.fillStyle = "#666";
    ctx.font = "15px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(selectedItem.desc, 90, descY);
    
    // 绘制购买提示
    descY += 50;
    ctx.fillStyle = "#8d1d25";
    ctx.font = "bold 16px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(`Press Enter to buy (${selectedItem.price} Money)`, 70, descY);
  }
  
  // 绘制消息
  if (shopState.message && shopState.messageTimer > 0) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(100, 250, 400, 40);
    ctx.fillStyle = shopState.message.includes("不足") || shopState.message.includes("已经拥有") ? "#d32f2f" : "#2e7d32";
    ctx.font = "bold 16px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(shopState.message, 120, 275);
  }
  
  // 绘制控制提示
  label(ctx, "Left/Right: Switch category | Up/Down: Select item | Enter: Buy | Escape: Exit", 70, 462, 14);
}

function drawFeedback() {
  drawPaperBackground(ctx);
  label(ctx, feedback.title, 70, 70, 26);
  label(ctx, feedback.draft, 70, 134, 18);
  label(ctx, feedback.boss, 70, 188, 18);
  label(ctx, feedback.cat, 70, 242, 18);

  ctx.fillStyle = "#1f1e1c";
  ctx.fillRect(70, 310, 560, 92);
  label(ctx, `Last weapon: ${weapon.name}`, 96, 344, 16, "#f7f0df");
  label(ctx, `process: ${Math.round(weapon.metrics.seconds)}s, ${weapon.metrics.revisions} revisions, trait '${weapon.trait}'`, 96, 372, 15, "#f7f0df");

  label(ctx, "Enter: next night", 70, 462, 18);
}

function update() {
  if (scene === "chapter0") chapter0Scene.update();
  if (scene === "opening") openingScene.update();
  if (scene === "studio") updateDrawing();
  if (scene === "inkwell") inkwell.update();
  if (scene === "work") updateWorkPhase();
  if (scene === "shop") updateShop();
}

function draw() {
  if (scene === "opening") openingScene.draw();
  if (scene === "chapter0") chapter0Scene.draw();
  if (scene === "studio") drawStudio();
  if (scene === "inkwell") inkwell.draw();
  if (scene === "feedback") drawFeedback();
  if (scene === "work") drawWorkPhase();
  if (scene === "shop") drawShop();
}

function loop() {
  try {
    frame++;
    update();
    draw();
    mouse.justLeft = false;
    mouse.justRight = false;
    requestAnimationFrame(loop);
  } catch (error) {
    showFatalError(error);
  }
}

chapter0Scene.start();
clearDrawing();
loop();

function showFatalError(error) {
  ctx.fillStyle = "#f1ead9";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#8d1d25";
  ctx.font = "18px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText("Runtime error:", 40, 60);
  ctx.fillStyle = "#24211f";
  ctx.font = "14px Consolas, monospace";
  const message = String(error?.stack || error?.message || error).split("\n").slice(0, 8);
  for (let i = 0; i < message.length; i++) ctx.fillText(message[i].slice(0, 110), 40, 94 + i * 22);
  console.error(error);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (scene === "studio" && (event.ctrlKey || event.metaKey) && key === "z") {
    event.preventDefault();
    undoDrawing();
    return;
  }
  if (scene === "studio" && (event.ctrlKey || event.metaKey) && key === "y") {
    event.preventDefault();
    redoDrawing();
    return;
  }
  keys.add(key);
  if (scene === "chapter0") { chapter0Scene.handleKey(key); return; }
  if (scene === "opening") { openingScene.handleKey(key); return; }
  if (scene === "inkwell") inkwell.handleKey(key);
  if (key === "p" && scene === "studio") setDrawingTool("pencil");
  if (key === "e" && scene === "studio") setDrawingTool("eraser");
  if (key === "r" && scene === "studio") clearDrawing();
  if (key === "enter" && scene === "studio" && drawingCanvas.hasEnoughPoints()) enterInkwell();
  if (key === "s" && scene === "studio") {
    shopState = createShopState();
    scene = "shop";
  }
  if (key === "enter" && scene === "work") {
    const hasMoreEvents = dayCycle.advanceWorkEvent();
    if (!hasMoreEvents) {
      scene = "studio"; // 所有事件完成，进入 studio
    }
  }
  if (key === "enter" && scene === "feedback") {
    gameState.day++;
    dayCycle.setPhase("work"); // 进入 work 阶段
    clearDrawing();
    scene = "work"; // 设置场景为 work
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

function updateMouseFromEvent(event, reason = "move") {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
  pointerInput.lastScaleX = scaleX;
  pointerInput.lastScaleY = scaleY;
  mouse.x = (event.clientX - rect.left) * scaleX;
  mouse.y = (event.clientY - rect.top) * scaleY;
  logCanvasInputMetrics(rect, scaleX, scaleY, reason);
}

function logCanvasInputMetrics(rect, scaleX, scaleY, reason) {
  const style = getComputedStyle(canvas);
  const logKey = [
    Math.round(rect.width),
    Math.round(rect.height),
    canvas.width,
    canvas.height,
    scaleX.toFixed(4),
    scaleY.toFixed(4),
    window.devicePixelRatio || 1,
    style.transform,
  ].join("|");
  if (logKey === pointerInput.lastLogKey && reason !== "pointerdown") return;
  pointerInput.lastLogKey = logKey;
  console.log("[CanvasInput]", {
    reason,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    displayWidth: rect.width,
    displayHeight: rect.height,
    scaleX,
    scaleY,
    devicePixelRatio: window.devicePixelRatio || 1,
    cssTransform: style.transform,
  });
}

function handlePrimaryDown(event) {
  event.preventDefault();
  updateMouseFromEvent(event, "pointerdown");
  pointerInput.activePointerId = event.pointerId;
  canvas.setPointerCapture?.(event.pointerId);

  if (event.button === 0 || event.pointerType === "touch" || event.pointerType === "pen") {
    if (scene === "chapter0") { chapter0Scene.handleClick(); return; }
    if (scene === "opening") { openingScene.handleClick(); return; }
    if (scene === "studio" && !drawingComplete) {
      const toolButton = drawingToolButtons.find((button) => pointInRect(mouse.x, mouse.y, button));
      if (toolButton) {
        if (toolButton.id === "pencil" || toolButton.id === "eraser") setDrawingTool(toolButton.id);
        if (toolButton.id === "undo") undoDrawing();
        if (toolButton.id === "redo") redoDrawing();
        if (toolButton.id === "clear") clearDrawing();
        return;
      }
    }
    if (scene === "studio" && !drawingComplete && pointInRect(mouse.x, mouse.y, finishButton) && drawingCanvas.hasEnoughPoints()) {
      finishDrawing();
      return;
    }
    if (scene === "studio" && drawingComplete && pointInRect(mouse.x, mouse.y, weaponResultEnterButton)) {
      enterInkwell();
      return;
    }
    mouse.left = true;
    mouse.justLeft = true;
    beginStroke();
  }
  if (event.button === 2) {
    mouse.right = true;
    mouse.justRight = true;
  }
}

function handlePrimaryMove(event) {
  event.preventDefault();
  updateMouseFromEvent(event, "pointermove");
  if (mouse.left && scene === "studio" && !drawingComplete) drawingCanvas.update(mouse.x, mouse.y);
}

function handlePrimaryUp(event) {
  event.preventDefault();
  updateMouseFromEvent(event, "pointerup");
  if (pointerInput.activePointerId === event.pointerId) {
    pointerInput.activePointerId = null;
    canvas.releasePointerCapture?.(event.pointerId);
  }
  if (event.button === 0 || event.pointerType === "touch" || event.pointerType === "pen") {
    mouse.left = false;
    endStroke();
  }
  if (event.button === 2) mouse.right = false;
}

function cancelPointerInput(event) {
  if (event) event.preventDefault();
  if (pointerInput.activePointerId !== null) {
    canvas.releasePointerCapture?.(pointerInput.activePointerId);
    pointerInput.activePointerId = null;
  }
  mouse.left = false;
  mouse.right = false;
  endStroke();
}

canvas.addEventListener("pointerdown", handlePrimaryDown);
canvas.addEventListener("pointermove", handlePrimaryMove);
canvas.addEventListener("pointerup", handlePrimaryUp);
canvas.addEventListener("pointercancel", cancelPointerInput);
canvas.addEventListener("lostpointercapture", () => {
  if (mouse.left) cancelPointerInput();
});

canvas.addEventListener("contextmenu", (event) => event.preventDefault());

requestAnimationFrame(() => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
  logCanvasInputMetrics(rect, scaleX, scaleY, "init");
});

window.addEventListener("resize", () => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
  logCanvasInputMetrics(rect, scaleX, scaleY, "resize");
});














