import { H, W } from "./core/config.js?v=27";
import { drawPaperBackground, drawPixelFrame, label } from "./core/render.js?v=27";
import { drawModelSprite, preloadModelSprites } from "./core/SpriteAssets.js?v=3";
import { createDrawingCanvas } from "./features/drawing/DrawingCanvas.js?v=25";
import { drawWeaponResultPanel, weaponResultEnterButton } from "./features/drawing/WeaponResultPanel.js?v=26";
import { createDayCycle } from "./game/DayCycle.js?v=25";
import { createCalendarSystem } from "./game/CalendarSystem.js?v=1";
import { applyWeaponProfile, createGameState } from "./game/GameState.js?v=32";
import { validateWeaponProfile } from "./game/WeaponProfile.js?v=32";
import { generateRelicChoices } from "./game/builds/RewardGenerator.js?v=32";
import { getWeaponTypeFromProfile } from "./game/builds/WeaponArchetypes.js?v=32";
import { formatGateConsequenceLine } from "./ecology/GateConsequences.js";
import { createInkwellScene } from "./scenes/inkwell.js?v=55";
import { createOpeningScene } from "./scenes/OpeningScene.js";
import { createChapter0Scene } from "./scenes/Chapter0.js?v=6";
import { createShopState, buyShopItem, getAllShopItems, getCategories, getItemsByCategory } from "./game/ShopSystem.js";
import { createInkwellExperiment } from "./scenes/InkwellExperiment.js?v=3";
import { drawPixelPersonAt, drawProtagonistAt } from "./characters/protagonist/ProtagonistSprite.js?v=28";
import {
  drawBottomPrompt,
  drawDrawingBoard,
  drawInteractionHint,
  drawPixelButton,
  drawReadoutPanel,
  drawStudioActor,
  drawStudioRoom,
  drawStudioSketchbook,
  pixelLabel,
} from "./scenes/StudioRoom.js?v=6";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
preloadModelSprites();

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
let calendarOpen = false;

const drawPanel = { x: 86, y: 92, w: 420, h: 330 };
const finishButton = { x: 548, y: 342, w: 176, h: 38 };
const shopDoorButton = { x: 612, y: 330, w: 112, h: 34 };
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
const calendarSystem = createCalendarSystem(gameState);
let drawingComplete = false;
let studioDrawingActive = false;
const studioPlayer = {
  x: 134,
  y: H - 178,
  vx: 0,
  facing: 1,
  walkFrame: 0,
};
const companyPlayer = {
  x: 118,
  y: H - 136,
  vx: 0,
  facing: 1,
  walkFrame: 0,
};
const companyStations = [
  { id: "focus", x: 138, y: H - 190, w: 118, label: "THUMBNAILS", action: "test silhouettes", color: "#7dd3fc" },
  { id: "meeting", x: 364, y: H - 198, w: 132, label: "BRIEF CALL", action: "defend the subject", color: "#f2b84b" },
  { id: "reference", x: 594, y: H - 190, w: 142, label: "MOTIF WALL", action: "collect motifs", color: "#86c06c" },
  { id: "coffee", x: 800, y: H - 184, w: 92, label: "LIGHTBOX", action: "rest your eyes", color: "#b23b48" },
];
const companyNpcs = [
  { id: "zhou", name: "Zhou", role: "art lead", x: 438, color: "#f2b84b", action: "lock visual brief", prop: "red_pen", stance: "director" },
  { id: "mira", name: "Mira", role: "layout", x: 278, color: "#7dd3fc", action: "sequence thumbnails", prop: "tablet", stance: "planner" },
  { id: "ren", name: "Ren", role: "brush", x: 654, color: "#86c06c", action: "trade brush motif", prop: "brush_roll", stance: "craft" },
  { id: "client", name: "Client", role: "reader", x: 760, color: "#b23b48", action: "decode reference", prop: "phone", stance: "pressure" },
];
const companyContracts = [
  { id: "scope_lock", title: "Lock the picture brief", briefId: "clean_silhouette", target: "scope", threshold: 68, direction: "high", reward: { money: 8, inspiration: 5, reputation: 4 }, penalty: { stress: 6 }, color: "#7dd3fc" },
  { id: "team_air", title: "Protect the sketch mood", briefId: "guarded_icon", target: "morale", threshold: 64, direction: "high", reward: { stress: -6, fatigue: -5, morale: 4 }, penalty: { fatigue: 8, morale: -6 }, color: "#86c06c" },
  { id: "deadline_tame", title: "Find the fast readable mark", briefId: "quick_gesture", target: "deadline", threshold: 48, direction: "low", reward: { money: 10, reputation: 6 }, penalty: { stress: 8, deadline: 8 }, color: "#b23b48" },
  { id: "client_face", title: "Make the image read", briefId: "motif_dense", target: "reputation", threshold: 16, direction: "high", reward: { money: 14, stress: -3 }, penalty: { stress: 7, reputation: -4 }, color: "#f2b84b" },
];
const drawingBriefTemplates = {
  clean_silhouette: {
    id: "clean_silhouette",
    title: "Clean silhouette",
    prompt: "Draw one readable weapon outline before details. Long, clear, not overworked.",
    rewardLine: "clear outline gives the night weapon a sharper first read",
    checks: [
      { metric: "aspectRatio", label: "long silhouette", min: 1.45 },
      { metric: "coverage", label: "controlled mass", max: 0.38 },
      { metric: "overdraw", label: "few muddy passes", max: 80 },
    ],
  },
  guarded_icon: {
    id: "guarded_icon",
    title: "Guarded icon",
    prompt: "Draw a shape with a protected center: loop, guard, shield, or strong enclosed mark.",
    rewardLine: "enclosed mark gives the night weapon better control",
    checks: [
      { metric: "closedShapeScore", label: "closed form", min: 0.42 },
      { metric: "strokeCount", label: "built with care", min: 3 },
      { metric: "coverage", label: "visible body", min: 0.12 },
    ],
  },
  quick_gesture: {
    id: "quick_gesture",
    title: "Fast readable mark",
    prompt: "Draw the idea fast. The silhouette should read without polishing every edge.",
    rewardLine: "fast gesture keeps the night light on its feet",
    checks: [
      { metric: "seconds", label: "quick pass", max: 75 },
      { metric: "aspectRatio", label: "clear direction", min: 1.2 },
      { metric: "overdraw", label: "no panic scribble", max: 95 },
    ],
  },
  motif_dense: {
    id: "motif_dense",
    title: "Readable motif",
    prompt: "Draw a weapon with one memorable motif: teeth, hook, eye, rune, notch, or repeated edge.",
    rewardLine: "motif detail gives the night more discoveries to echo",
    checks: [
      { metric: "complexity", label: "distinct motif", min: 0.28 },
      { metric: "pointCount", label: "enough marks", min: 80 },
      { metric: "coverage", label: "visible read", min: 0.1 },
    ],
  },
};
function createDefaultCompanyState() {
  return { scope: 48, morale: 52, deadline: 42, reputation: 0, actionsLeft: 3 };
}
let companyState = createDefaultCompanyState();
let companyContract = null;
let companyContractResolved = false;
let companyMessage = "";
let companyMessageColor = "#f0d9a5";
let companyMessageTimer = 0;
let companyCoffeeUsed = false;
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
  gameState,
  getFrame: () => frame,
  onFinish: finishInkwellRun,
});


const openingScene = createOpeningScene({
  canvas,
  ctx,
  keys,
  mouse,
  onDone: () => { enterCompanyScene(); },
});
window.DEBUG_SET_WEAPON_TYPE = setDebugWeaponType;
const chapter0Scene = createChapter0Scene({
  canvas,
  ctx,
  keys,
  mouse,
  gameState,
  onDone: () => { enterCompanyScene(); },
});
const inkwellExperiment = createInkwellExperiment({
  keys,
  mouse,
  weapon: gameState.currentWeapon,
  getFrame: () => frame,
  onFinish: (result) => {
    scene = "studio";
    console.log("[Experiment]", result);
  },
});

function clearDrawing() {
  drawingCanvas.clear();
  drawingComplete = false;
  studioDrawingActive = false;
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
  if (scene !== "studio" || drawingComplete || !studioDrawingActive) return;
  drawingCanvas.beginStroke(mouse.x, mouse.y);
}

function endStroke() {
  drawingCanvas.endStroke();
}

function updateDrawing() {
  if (drawingComplete) return;
  drawingCanvas.update(mouse.x, mouse.y);
}

function updateStudio() {
  if (!studioDrawingActive && !drawingComplete) updateStudioWalk();
  if (studioDrawingActive || drawingComplete) updateDrawing();
}

function updateStudioWalk() {
  const left = keys.has("a") || keys.has("arrowleft");
  const right = keys.has("d") || keys.has("arrowright");
  const input = (right ? 1 : 0) - (left ? 1 : 0);
  studioPlayer.vx += (input * 2.1 - studioPlayer.vx) * 0.28;
  studioPlayer.x = Math.max(74, Math.min(512, studioPlayer.x + studioPlayer.vx));
  if (input !== 0) {
    studioPlayer.facing = input;
    studioPlayer.walkFrame += Math.abs(studioPlayer.vx) + 0.8;
  } else {
    studioPlayer.walkFrame += 0.12;
  }
}

function isStudioPlayerAtBoard() {
  return studioPlayer.x >= drawPanel.x + 40 && studioPlayer.x <= drawPanel.x + drawPanel.w - 20;
}

function activateStudioDrawing() {
  if (drawingComplete) return;
  studioDrawingActive = true;
  studioPlayer.x = Math.max(drawPanel.x + 120, Math.min(drawPanel.x + drawPanel.w - 90, studioPlayer.x));
  studioPlayer.facing = 1;
}

function leaveStudioDrawing() {
  if (drawingComplete) return;
  studioDrawingActive = false;
}

function finishDrawing() {
  const profile = drawingCanvas.finishWeaponProfile();
  const briefResult = evaluateDrawingBrief(profile, ensureDrawingBrief());
  applyDrawingBriefResult(profile, briefResult);
  calendarSystem.logDrawingResult(briefResult);
  validateWeaponProfile(profile, "drawing.finish");
  applyWeaponProfile(gameState, profile);
  drawingComplete = true;
}

function evaluateDrawingBrief(profile, brief) {
  const metrics = profile?.metrics ?? {};
  const checks = Array.isArray(brief?.checks) ? brief.checks : [];
  const details = checks.map((check) => {
    const value = getBriefMetricValue(metrics, check.metric);
    const passedMin = check.min === undefined || value >= check.min;
    const passedMax = check.max === undefined || value <= check.max;
    return {
      label: check.label,
      metric: check.metric,
      value: Math.round(value * 100) / 100,
      min: check.min,
      max: check.max,
      passed: passedMin && passedMax,
    };
  });
  const passed = details.filter((item) => item.passed).length;
  const total = Math.max(1, details.length);
  const score = passed / total;
  return {
    id: brief?.id ?? "free_sketch",
    title: brief?.title ?? "Free sketch",
    prompt: brief?.prompt ?? "Draw one readable weapon silhouette.",
    rewardLine: brief?.rewardLine ?? "the drawing carries into the night",
    passed,
    total,
    score,
    success: passed >= Math.ceil(total * 0.67),
    details,
  };
}

function getBriefMetricValue(metrics, metric) {
  if (metric === "closedShapeScore") return metrics.closedShapeScore ?? metrics.closedness ?? 0;
  if (metric === "seconds") return metrics.seconds ?? metrics.drawTime ?? 0;
  if (metric === "pointCount") return metrics.pointCount ?? metrics.points ?? 0;
  return metrics[metric] ?? 0;
}

function applyDrawingBriefResult(profile, result) {
  profile.drawingBrief = {
    id: result.id,
    title: result.title,
    prompt: result.prompt,
  };
  profile.briefMatch = result;
  gameState.lastBriefResult = result;

  if (gameState.dayResidue) {
    Object.assign(gameState.dayResidue, {
      briefTitle: result.title,
      briefScore: Math.round(result.score * 100),
      briefSuccess: result.success,
    });
  }

  if (result.success) {
    const stats = profile.finalStats ?? {};
    const bonus = Math.max(1, Math.min(3, result.passed));
    profile.finalStats = {
      ...stats,
      damage: Math.round((stats.damage ?? profile.damage ?? 10) + bonus),
      range: Math.round((stats.range ?? profile.reach ?? 50) + bonus * 2),
      crit: Math.min(1, (stats.crit ?? stats.criticalChance ?? 0) + 0.03),
      criticalChance: Math.min(1, (stats.criticalChance ?? stats.crit ?? 0) + 0.03),
    };
    if (profile.combat) {
      profile.combat.damage = profile.finalStats.damage;
      profile.combat.range = profile.finalStats.range;
    }
    profile.damage = profile.finalStats.damage;
    profile.reach = profile.finalStats.range;
    applyCompanyStatusDelta({ inspiration: 7, stress: -2 });
    return;
  }

  applyCompanyStatusDelta({ stress: 4, inspiration: -2 });
}

function enterInkwell() {
  if (!drawingComplete) finishDrawing();
  validateWeaponProfile(gameState.currentWeapon, "inkwell.enter");
  gameState.nightCarryover = createNightCarryover();
  calendarSystem.startNight(gameState.nightCarryover);
  dayCycle.setPhase("inkwell");
  inkwell.start();
  scene = "inkwell";
}

function enterShopScene() {
  shopState = createShopState();
  scene = "shop";
}

function enterCompanyScene() {
  dayCycle.setPhase("work");
  companyState = ensureCompanyState();
  companyState.actionsLeft = Math.min(4, 3 + Math.floor((companyState.reputation ?? 0) / 50));
  companyContract = rollCompanyContract();
  gameState.drawingBrief = createDrawingBrief(companyContract.briefId, companyContract);
  calendarSystem.startDay({ contract: companyContract, brief: gameState.drawingBrief, companyState });
  companyContractResolved = false;
  companyPlayer.x = 118;
  companyPlayer.vx = 0;
  companyPlayer.facing = 1;
  companyPlayer.walkFrame = 0;
  companyCoffeeUsed = false;
  for (const npc of companyNpcs) npc.used = false;
  companyMessage = "Company goal: " + companyContract.title;
  companyMessageColor = companyContract.color;
  companyMessageTimer = 160;
  scene = "work";
}

function ensureCompanyState() {
  if (!gameState.companyState) gameState.companyState = createDefaultCompanyState();
  return gameState.companyState;
}

function rollCompanyContract() {
  const stress = gameState.status?.stress ?? 0;
  if (stress > 60) return companyContracts.find((item) => item.id === "team_air") ?? companyContracts[0];
  if ((companyState.deadline ?? 0) > 60) return companyContracts.find((item) => item.id === "deadline_tame") ?? companyContracts[0];
  return companyContracts[Math.floor(Math.random() * companyContracts.length)] ?? companyContracts[0];
}

function createDrawingBrief(briefId, contract = companyContract) {
  const template = drawingBriefTemplates[briefId] ?? drawingBriefTemplates.clean_silhouette;
  return {
    ...template,
    checks: template.checks.map((check) => ({ ...check })),
    contractId: contract?.id ?? "",
    contractTitle: contract?.title ?? "",
    notes: [],
    source: "company",
  };
}

function ensureDrawingBrief() {
  if (!gameState.drawingBrief) gameState.drawingBrief = createDrawingBrief("clean_silhouette");
  return gameState.drawingBrief;
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
  const artworkPct = Math.min(100, (run.artworkCompletion || 0) + run.kills * 2 + run.itemsCollected * 3 + run.materialsCollected);
  const artworkDisc = (run.artworkDiscoveries || 0) + run.kills + run.itemsCollected;
  const commercial = Math.round(run.kills * 8 + run.mined * 0.25 + run.attacks * 0.8 + run.overtimeCount * 4 - run.hitsTaken * 0.15);

  feedback = {
    title: `Day ${gameState.day} - morning draft`,
    draft: makeDraftLine(m, run),
    boss: makeBossLine(commercial, run),
    cat: makeCatLine(soul, run),
    artwork: artworkPct > 0 ? `Artwork completion: ${artworkPct}% (${artworkDisc} discoveries)` : "",
    infusion: makeInfusionLine(run),
    consequence: formatGateConsequenceLine(run),
    exploration: makeExplorationLine(run),
    objective: run.nightObjectiveResult || "",
  };
  calendarSystem.finishNight(run);
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
  if (run.finishReason === "retreat") return "The draft stops where you chose to stop. Not because time ran out, but because you decided what was enough for tonight.";
  return "The draft is small, unfinished, and alive enough to bother you.";
}

function makeInfusionLine(run) {
  const infusions = Array.isArray(run.discoveryInfusions) ? run.discoveryInfusions : [];
  if (infusions.length === 0) return "";
  const latest = infusions[infusions.length - 1];
  const names = [...new Set(infusions.map((item) => item.name).filter(Boolean))].slice(0, 3).join(" / ");
  const power = infusions.reduce((sum, item) => sum + (item.power || 0), 0);
  return `Discovery infusion: ${names || latest.name} +${power} (${latest.count || 0} brought back last)`;
}

function makeExplorationLine(run) {
  const found = run.explorationFinds ?? 0;
  if (found <= 0) return "";
  const total = run.explorationSitesTotal ?? found;
  const latest = run.latestDiscoveryName ? " last: " + run.latestDiscoveryName : "";
  return "Exploration finds: " + found + "/" + total + latest;
}

function makeBossLine(commercial, run) {
  if (run.finishReason === "boss" || run.bossRewards > 0) return "Zhou: This one has an ending. Keep that structure.";
  if (run.chestsOpened > 0) return "Zhou: Better texture library today. The details are doing some work.";
  if (run.allNighter) return "Zhou: This is polished. Too polished for one night, honestly.";
  if (run.overtimeCount > 0) return "Zhou: The extra pass helped. Just do not make this your normal rhythm.";
  if (run.finishReason === "deadline") return "Zhou: You stopped at the right second, or the wrong one. Hard to tell. But it has urgency.";
  if (run.finishReason === "clear") return "Zhou: This one reads immediately. Strong silhouette, clear action.";
  if (commercial > 28) return "Zhou: This has movement. Keep this direction.";
  if (run.finishReason === "retreat") return "Zhou: You came back early. Smart. A living artist knows when to stop.";
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
  if (run.finishReason === "retreat") return "Inkdot meets you at the edge of the page. It seems glad you knew when to come home.";
  return "Inkdot curls near the paper. The room feels a little pale.";
}

function drawStudio() {
  const boardReady = isStudioPlayerAtBoard();
  drawStudioRoom(ctx, frame, { drawingActive: studioDrawingActive, drawingComplete, boardReady, playerX: studioPlayer.x });
  pixelLabel(ctx, "HOME STUDIO / DAY " + gameState.day, 54, 50, 24, "#f7f0df");
  pixelLabel(ctx, studioDrawingActive ? "the desk light pins the night draft in place" : "after work: shop, draw, then descend", 54, 76, 14, "#f0d9a5");

  if (studioDrawingActive || drawingComplete) {
    drawDrawingBoard(ctx, drawPanel, drawingComplete);
    drawingCanvas.draw(ctx);
  } else {
    drawStudioSketchbook(ctx, drawPanel, frame, boardReady);
    drawDayRoutePanel();
  }
  drawStudioActor(ctx, studioPlayer, studioDrawingActive || drawingComplete);

  if (!studioDrawingActive && !drawingComplete) {
    drawInteractionHint(ctx, boardReady ? "E  DRAW" : "A/D  MOVE", Math.floor(studioPlayer.x), Math.floor(studioPlayer.y - 42), boardReady);
    drawBottomPrompt(ctx, boardReady ? "E draw the night draft. S shop. C calendar." : "A/D move. S shop. C calendar. The office brief is already on the desk.");
    return;
  }

  drawDrawingToolbar();

  const { metrics, classification } = drawingCanvas.previewWeaponProfile();
  const elapsed = Math.round(metrics.seconds);
  drawReadoutPanel(ctx, 548, 112, 330, 226, "WEAPON READ");
  pixelLabel(ctx, `TYPE     ${classification.type}`, 568, 164, 17, "#f7f0df");
  pixelLabel(ctx, `PATTERN  ${classification.attackPattern}`, 568, 194, 14, "#7dd3fc");
  drawStudioBriefHint(568, 220, 284, metrics);
  pixelLabel(ctx, "PROCESS", 568, 270, 13, "#a99d8c");
  pixelLabel(ctx, `TIME ${elapsed}s   STROKES ${metrics.strokeCount}`, 568, 298, 14, "#f7f0df");
  pixelLabel(ctx, `POINTS ${metrics.pointCount}  OVERDRAW ${metrics.overdraw}`, 568, 320, 14, "#f7f0df");
  drawFinishButton();
  if (drawingComplete) drawFinishedWeaponPanel();
  else pixelLabel(ctx, "P/E tools  Ctrl+Z/Y undo/redo  R clear  Esc stand up", 548, 404, 15, "#f0d9a5");

  drawBottomPrompt(ctx, drawingComplete ? "The page opens downward. Enter the Inkwell when you are ready. C calendar." : "Draw inside the room. C calendar.");
}

function drawDayRoutePanel() {
  drawReadoutPanel(ctx, 588, 252, 306, 142, "AFTER WORK");
  const brief = gameState.drawingBrief;
  pixelLabel(ctx, brief ? "Office brief shapes the next drawing." : "The next office brief arrives tomorrow.", 612, 292, 12, "#a99d8c");
  if (brief) pixelLabel(ctx, "brief  " + brief.title, 612, 316, 12, "#7dd3fc");
  drawPixelButton(ctx, shopDoorButton, "S  SHOP", "default");
  pixelLabel(ctx, "Draw at the desk when you are ready.", 742, 352, 12, "#f0d9a5");
  pixelLabel(ctx, "Shop stock and work stress change the dive.", 612, 384, 12, "#7dd3fc");
}

function drawStudioBriefHint(x, y, width, metrics) {
  const brief = ensureDrawingBrief();
  const result = evaluateDrawingBrief({ metrics }, brief);
  const firstNeed = result.details.find((item) => !item.passed) ?? result.details[0];
  const status = firstNeed ? (firstNeed.passed ? "ok " : "need ") + firstNeed.label : "free sketch";
  pixelLabel(ctx, "BRIEF  " + brief.title, x, y, 12, "#f2b84b");
  pixelLabel(ctx, status + "  " + result.passed + "/" + result.total, x, y + 22, 11, result.success ? "#7dd3fc" : "#d8cfb8");
  const barWidth = Math.round(width * result.score);
  ctx.fillStyle = "#05070b";
  ctx.fillRect(x, y + 32, width, 8);
  ctx.fillStyle = result.success ? "#7dd3fc" : "#f2b84b";
  ctx.fillRect(x + 2, y + 34, Math.max(0, barWidth - 4), 4);
}

function drawDrawingToolbar() {
  const activeTool = drawingCanvas.getTool();
  for (const button of drawingToolButtons) {
    const disabled = drawingComplete || (button.id === "undo" && !drawingCanvas.canUndo()) || (button.id === "redo" && !drawingCanvas.canRedo());
    const active = button.id === activeTool;
    drawPixelButton(ctx, button, button.label.toUpperCase(), disabled ? "disabled" : active ? "active" : "default");
  }
}

function drawFinishButton() {
  const enabled = drawingCanvas.hasEnoughPoints();
  drawPixelButton(
    ctx,
    finishButton,
    drawingComplete ? "DRAWING READY" : "FINISH DRAWING",
    drawingComplete ? "active" : enabled ? "default" : "disabled"
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
  updateCompanyWalk();
  if (companyMessageTimer > 0) companyMessageTimer--;
  // Work 阶段暂时不需要更新逻辑
  // 主要是等待玩家按 Enter 键继续
}

function updateCompanyWalk() {
  const left = keys.has("a") || keys.has("arrowleft");
  const right = keys.has("d") || keys.has("arrowright");
  const input = (right ? 1 : 0) - (left ? 1 : 0);
  companyPlayer.vx += (input * 2.45 - companyPlayer.vx) * 0.24;
  companyPlayer.x = Math.max(74, Math.min(W - 74, companyPlayer.x + companyPlayer.vx));
  if (input !== 0) {
    companyPlayer.facing = input;
    companyPlayer.walkFrame += Math.abs(companyPlayer.vx) + 0.7;
  } else {
    companyPlayer.walkFrame += 0.1;
  }
}

function getNearestCompanyStation() {
  let best = null;
  let bestDist = 74;
  for (const station of companyStations) {
    const sx = station.x + station.w / 2;
    const dist = Math.abs(companyPlayer.x - sx);
    if (dist < bestDist) {
      best = station;
      bestDist = dist;
    }
  }
  return best;
}

function getNearestCompanyNpc() {
  let best = null;
  let bestDist = 58;
  for (const npc of companyNpcs) {
    const dist = Math.abs(companyPlayer.x - npc.x);
    if (dist < bestDist) {
      best = npc;
      bestDist = dist;
    }
  }
  return best;
}

function getNearestCompanyTarget() {
  const station = getNearestCompanyStation();
  const npc = getNearestCompanyNpc();
  if (!station) return npc ? { type: "npc", item: npc } : null;
  if (!npc) return { type: "station", item: station };
  const stationDist = Math.abs(companyPlayer.x - (station.x + station.w / 2));
  const npcDist = Math.abs(companyPlayer.x - npc.x);
  return npcDist <= stationDist ? { type: "npc", item: npc } : { type: "station", item: station };
}

function handleCompanyInteract() {
  const target = getNearestCompanyTarget();
  if (!target) {
    companyMessage = "Move to a workstation or NPC first.";
    companyMessageColor = "#a99d8c";
    companyMessageTimer = 90;
    return;
  }
  if (target.type === "npc") {
    handleCompanyNpcInteract(target.item);
    return;
  }

  const station = target.item;

  const currentEvent = dayCycle.getCurrentWorkEvent();
  if (station.id === "coffee") {
    if (companyCoffeeUsed) {
      companyMessage = "The machine is empty. Of course it is.";
      companyMessageColor = "#b23b48";
      companyMessageTimer = 110;
      return;
    }
    if (!spendCompanyAction()) return;
    companyCoffeeUsed = true;
    applyCompanyStatusDelta({ stress: -10, fatigue: -8, inspiration: 2 });
    applyCompanyManagementDelta({ morale: 6, deadline: 4 });
    setDayResidue(station, "Resting your eyes made the next line less noisy.");
    recordCalendarOfficeAction(station, gameState.dayResidue.message);
    companyMessage = "Lightbox break: the drawing stops buzzing for a minute.";
    companyMessageColor = station.color;
    companyMessageTimer = 140;
    maybeResolveCompanyTurn(Boolean(dayCycle.getCurrentWorkEvent()));
    return;
  }

  if (!currentEvent) {
    scene = "studio";
    return;
  }

  if (!spendCompanyAction()) return;
  const outcome = resolveCompanyChoice(station, currentEvent);
  applyCompanyStatusDelta(outcome.delta);
  applyCompanyManagementDelta(outcome.management);
  gameState.money = Math.max(0, (gameState.money ?? 0) + outcome.money);
  setDayResidue(station, outcome.message);
  recordCalendarOfficeAction(station, outcome.message);
  const hasMoreEvents = dayCycle.advanceWorkEvent();
  companyMessage = outcome.message + (hasMoreEvents ? "" : " Work queue cleared.");
  companyMessageColor = station.color;
  companyMessageTimer = hasMoreEvents ? 150 : 220;
  maybeResolveCompanyTurn(hasMoreEvents);
}

function handleCompanyNpcInteract(npc) {
  if (npc.used) {
    companyMessage = npc.name + " has nothing useful left today.";
    companyMessageColor = "#a99d8c";
    companyMessageTimer = 100;
    return;
  }
  if (!spendCompanyAction()) return;
  npc.used = true;
  const result = resolveCompanyNpcChoice(npc);
  applyCompanyStatusDelta(result.delta);
  applyCompanyManagementDelta(result.management);
  gameState.money = Math.max(0, (gameState.money ?? 0) + result.money);
  setDayResidue({ id: npc.id, label: npc.name.toUpperCase(), action: npc.action, color: npc.color }, result.message);
  recordCalendarOfficeAction({ label: npc.name.toUpperCase(), action: npc.action, color: npc.color }, result.message);
  companyMessage = result.message;
  companyMessageColor = npc.color;
  companyMessageTimer = 160;
  maybeResolveCompanyTurn(Boolean(dayCycle.getCurrentWorkEvent()));
}

function spendCompanyAction() {
  if ((companyState.actionsLeft ?? 0) <= 0) {
    maybeResolveCompanyTurn(Boolean(dayCycle.getCurrentWorkEvent()));
    companyMessage = "No office actions left. Enter returns to the studio.";
    companyMessageColor = "#a99d8c";
    companyMessageTimer = 120;
    return false;
  }
  companyState.actionsLeft = Math.max(0, (companyState.actionsLeft ?? 0) - 1);
  gameState.companyState = companyState;
  return true;
}

function maybeResolveCompanyTurn(hasMoreEvents) {
  if (companyContractResolved) return;
  if ((companyState.actionsLeft ?? 0) > 0 && hasMoreEvents) return;
  resolveCompanyContract();
}

function resolveCompanyContract() {
  if (companyContractResolved || !companyContract) return;
  companyContractResolved = true;
  const value = companyState[companyContract.target] ?? 0;
  const success = companyContract.direction === "low" ? value <= companyContract.threshold : value >= companyContract.threshold;
  const payload = success ? companyContract.reward : companyContract.penalty;
  applyCompanyContractPayload(payload);
  const resultText = success ? "Goal cleared: " : "Goal missed: ";
  companyMessage = resultText + companyContract.title;
  companyMessageColor = success ? companyContract.color : "#b23b48";
  companyMessageTimer = 210;
  setDayResidue(
    { id: companyContract.id, label: companyContract.title.toUpperCase(), action: success ? "kept the project alive" : "left damage behind", color: companyMessageColor },
    companyMessage
  );
  Object.assign(gameState.dayResidue, {
    goalTitle: companyContract.title,
    goalTarget: companyContract.target,
    goalValue: Math.round(value),
    goalThreshold: companyContract.threshold,
    goalSuccess: success,
  });
  calendarSystem.resolveOfficeGoal({
    title: companyContract.title,
    success,
    value,
    threshold: companyContract.threshold,
    color: companyContract.color,
  });
}

function applyCompanyContractPayload(payload = {}) {
  applyCompanyStatusDelta({
    stress: payload.stress ?? 0,
    fatigue: payload.fatigue ?? 0,
    inspiration: payload.inspiration ?? 0,
  });
  applyCompanyManagementDelta({
    scope: payload.scope ?? 0,
    morale: payload.morale ?? 0,
    deadline: payload.deadline ?? 0,
    reputation: payload.reputation ?? 0,
  });
  if (payload.money) gameState.money = Math.max(0, (gameState.money ?? 0) + payload.money);
}

function resolveCompanyChoice(station, event) {
  const pressure = Math.max(0, event?.effects?.stress ?? 0);
  if (station.id === "meeting") {
    return {
      money: 12,
      delta: { stress: 5 + Math.round(pressure * 0.12), fatigue: 2, inspiration: -2 },
      management: { deadline: -12, reputation: 8, morale: -5, scope: -2 },
      message: "You defended the subject in the brief call. Clearer image, tighter hand.",
    };
  }
  if (station.id === "reference") {
    return {
      money: 4,
      delta: { stress: 3, fatigue: 6, inspiration: 10 + Math.round(pressure * 0.08) },
      management: { scope: 6, morale: 8, deadline: 6 },
      message: "You pinned a motif from the wall. It wants to become a mark tonight.",
    };
  }
  return {
    money: 7,
    delta: { stress: -4, fatigue: 4, inspiration: 4 },
    management: { scope: 14, deadline: 4, morale: -2, reputation: 2 },
    message: "You tested thumbnails until one silhouette survived.",
  };
}

function resolveCompanyNpcChoice(npc) {
  if (npc.id === "zhou") {
    return {
      money: 5,
      delta: { stress: 5, fatigue: 1, inspiration: 0 },
      management: { scope: 10, deadline: -10, reputation: 6, morale: -4 },
      message: "Zhou locked the visual promise. The picture is clearer, not kinder.",
    };
  }
  if (npc.id === "mira") {
    return {
      money: 0,
      delta: { stress: -4, fatigue: 2, inspiration: 3 },
      management: { scope: 12, deadline: 3, morale: 4 },
      message: "Mira sequenced the thumbnails. The drawing has a path now.",
    };
  }
  if (npc.id === "ren") {
    return {
      money: 0,
      delta: { stress: 2, fatigue: 2, inspiration: 9 },
      management: { morale: 10, scope: 4, deadline: 5 },
      message: "Ren traded you a brush motif. It will probably reappear underground.",
    };
  }
  return {
    money: 8,
    delta: { stress: 7, fatigue: 1, inspiration: -1 },
    management: { reputation: 10, deadline: -6, morale: -8 },
    message: "The client pointed at the part they can read. Everyone else got louder.",
  };
}

function applyCompanyStatusDelta(delta) {
  const status = gameState.status;
  status.stress = clampCompanyValue((status.stress ?? 0) + (delta.stress ?? 0), 0, 100);
  status.fatigue = clampCompanyValue((status.fatigue ?? 0) + (delta.fatigue ?? 0), 0, 100);
  status.inspiration = clampCompanyValue((status.inspiration ?? 0) + (delta.inspiration ?? 0), 0, 100);
  if ((delta.inspiration ?? 0) > 6) status.emotion = "inspired";
  else if ((delta.stress ?? 0) > 4) status.emotion = "anxious";
}

function applyCompanyManagementDelta(delta = {}) {
  companyState.scope = clampCompanyValue((companyState.scope ?? 0) + (delta.scope ?? 0), 0, 100);
  companyState.morale = clampCompanyValue((companyState.morale ?? 0) + (delta.morale ?? 0), 0, 100);
  companyState.deadline = clampCompanyValue((companyState.deadline ?? 0) + (delta.deadline ?? 0), 0, 100);
  companyState.reputation = clampCompanyValue((companyState.reputation ?? 0) + (delta.reputation ?? 0), 0, 100);
  gameState.companyState = companyState;
}

function clampCompanyValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setDayResidue(station, message) {
  gameState.dayResidue = {
    choice: station.id,
    label: station.label,
    action: station.action,
    color: station.color,
    message,
    stress: Math.round(gameState.status.stress ?? 0),
    fatigue: Math.round(gameState.status.fatigue ?? 0),
    inspiration: Math.round(gameState.status.inspiration ?? 0),
    scope: Math.round(companyState.scope ?? 0),
    morale: Math.round(companyState.morale ?? 0),
    deadline: Math.round(companyState.deadline ?? 0),
    reputation: Math.round(companyState.reputation ?? 0),
    actionsLeft: Math.round(companyState.actionsLeft ?? 0),
    briefTitle: gameState.drawingBrief?.title ?? "",
    briefPrompt: gameState.drawingBrief?.prompt ?? "",
  };
}

function recordCalendarOfficeAction(station, message) {
  calendarSystem.logOfficeAction({
    label: station.label,
    action: station.action,
    message,
    color: station.color,
  });
}

function createNightCarryover() {
  const status = gameState.status ?? {};
  const residue = gameState.dayResidue ?? {};
  const stress = Math.round(status.stress ?? 0);
  const fatigue = Math.round(status.fatigue ?? 0);
  const inspiration = Math.round(status.inspiration ?? 0);
  const color = residue.color ?? (inspiration >= stress ? "#7dd3fc" : "#f0d9a5");
  const scope = Math.round(residue.scope ?? companyState.scope ?? 0);
  const morale = Math.round(residue.morale ?? companyState.morale ?? 0);
  const deadline = Math.round(residue.deadline ?? companyState.deadline ?? 0);
  const reputation = Math.round(residue.reputation ?? companyState.reputation ?? 0);
  const briefResult = gameState.lastBriefResult ?? {};
  const briefScore = Math.round(residue.briefScore ?? (briefResult.score ?? 0) * 100);
  const briefSuccess = Boolean(residue.briefSuccess ?? briefResult.success);
  const briefFlowBonus = briefSuccess ? Math.min(12, Math.floor(briefScore / 12)) : 0;
  return {
    choice: residue.choice ?? "",
    label: residue.label ?? "QUIET DAY",
    action: residue.action ?? "carry the day",
    color,
    stress,
    fatigue,
    inspiration,
    scope,
    morale,
    deadline,
    reputation,
    goalTitle: residue.goalTitle ?? "",
    goalTarget: residue.goalTarget ?? "",
    goalValue: Math.round(residue.goalValue ?? 0),
    goalThreshold: Math.round(residue.goalThreshold ?? 0),
    goalSuccess: Boolean(residue.goalSuccess),
    actionsLeft: Math.round(residue.actionsLeft ?? companyState.actionsLeft ?? 0),
    briefTitle: residue.briefTitle ?? briefResult.title ?? gameState.drawingBrief?.title ?? "",
    briefScore,
    briefSuccess,
    hpPenalty: Math.min(24, Math.floor(fatigue / 6) + Math.floor(Math.max(0, 45 - morale) / 10)),
    inkPenalty: Math.min(22, Math.floor(stress / 7) + Math.floor(deadline / 18)),
    flowBonus: Math.min(48, Math.floor(inspiration / 3) + Math.floor(scope / 16) + Math.floor(reputation / 20) + briefFlowBonus),
  };
}

function isCompanyDayResolved(currentEvent = dayCycle.getCurrentWorkEvent()) {
  return companyContractResolved || !currentEvent || (companyState.actionsLeft ?? 0) <= 0;
}

function companyMetricName(metric) {
  const names = {
    scope: "scope",
    morale: "morale",
    deadline: "deadline",
    reputation: "rep",
  };
  return names[metric] ?? metric;
}

function drawCompanyGoalStrip(x, y, width) {
  if (!companyContract) return;
  const value = Math.round(companyState[companyContract.target] ?? 0);
  const threshold = companyContract.threshold;
  const comparator = companyContract.direction === "low" ? "<=" : ">=";
  const successNow = companyContract.direction === "low" ? value <= threshold : value >= threshold;
  const resolvedText = companyContractResolved ? (gameState.dayResidue?.goalSuccess ? "cleared" : "missed") : "open";
  const goalColor = companyContractResolved ? (gameState.dayResidue?.goalSuccess ? companyContract.color : "#b23b48") : companyContract.color;
  const fillWidth = Math.round(width * clampCompanyValue(value, 0, 100) / 100);
  const markerX = x + Math.round(width * clampCompanyValue(threshold, 0, 100) / 100);

  pixelLabel(ctx, "goal  " + companyContract.title, x, y, 12, goalColor);
  pixelLabel(ctx, companyMetricName(companyContract.target) + " " + value + " " + comparator + " " + threshold, x, y + 22, 12, successNow ? "#7dd3fc" : "#f2b84b");
  ctx.fillStyle = "#05070b";
  ctx.fillRect(x, y + 34, width, 10);
  ctx.fillStyle = "#1b2028";
  ctx.fillRect(x + 2, y + 36, width - 4, 6);
  ctx.fillStyle = companyContract.direction === "low" && !successNow ? "#b23b48" : goalColor;
  ctx.fillRect(x + 2, y + 36, Math.max(0, fillWidth - 4), 6);
  ctx.fillStyle = "#f7f0df";
  ctx.fillRect(markerX, y + 31, 2, 16);
  pixelLabel(ctx, "actions " + (companyState.actionsLeft ?? 0) + "   " + resolvedText, x, y + 62, 12, companyContractResolved ? goalColor : "#a99d8c");
}

function drawWorkPhase() {
  drawCompanyBackdrop();

  const currentEvent = dayCycle.getCurrentWorkEvent();
  const dayResolved = isCompanyDayResolved(currentEvent);
  const nearestTarget = getNearestCompanyTarget();
  const nearestStation = nearestTarget?.type === "station" ? nearestTarget.item : null;
  const nearestNpc = nearestTarget?.type === "npc" ? nearestTarget.item : null;
  drawCompanyStations(nearestStation, currentEvent);
  drawCompanyNpcs(nearestNpc);
  drawCompanyActor(companyPlayer);

  pixelLabel(ctx, "ZHOU STUDIO", 62, 54, 24, "#f7f0df");
  pixelLabel(ctx, "day job pressure becomes tonight's drawing brief", 62, 80, 13, "#f0d9a5");

  drawReadoutPanel(ctx, 48, 104, 408, 210, "TODAY BRIEF");
  if (dayResolved) {
    const result = companyContractResolved ? "Company goal resolved." : "No more revisions today.";
    pixelLabel(ctx, result, 78, 150, 20, "#f7f0df");
    pixelLabel(ctx, "The office lights buzz. This day will follow you down.", 78, 184, 14, "#a99d8c");
    drawCompanyGoalStrip(78, 222, 334);
    if (companyMessageTimer > 0) pixelLabel(ctx, companyMessage, 78, 300, 13, companyMessageColor);
    drawBottomPrompt(ctx, "Enter returns to your studio. C calendar. Tonight inherits this result.");
    return;
  }

  pixelLabel(ctx, workEventIcon(currentEvent.type) + "  " + workEventName(currentEvent.type), 78, 150, 20, "#f7f0df");
  drawWrappedPixelText(workEventPrompt(currentEvent), 78, 186, 346, 15, "#d8cfb8", 23);
  drawCompanyGoalStrip(78, 252, 334);

  const statusDesc = companyStatusSummary(gameState.status);
  drawReadoutPanel(ctx, 506, 104, 396, 252, "CURRENT SELF / PROJECT");
  drawCompanyMeters(532, 148);
  drawCompanyProjectMeters(532, 268);
  pixelLabel(ctx, "wallet  " + gameState.money, 532, 340, 13, "#f2b84b");
  drawWrappedPixelText(companyProjectSummary(), 654, 320, 220, 12, "#d8cfb8", 15);
  drawWrappedPixelText(statusDesc, 654, 342, 220, 11, "#a99d8c", 14);

  const progress = dayCycle.getWorkProgress();
  pixelLabel(ctx, "task " + (progress.current + 1) + " / " + progress.total + "   actions " + (companyState.actionsLeft ?? 0), 662, 58, 15, "#7dd3fc");
  if (nearestTarget) drawInteractionHint(ctx, "E  " + nearestTarget.item.action, Math.floor(companyPlayer.x), Math.floor(companyPlayer.y - 54), true);
  if (companyMessageTimer > 0) pixelLabel(ctx, companyMessage, 76, 342, 14, companyMessageColor);
  drawBottomPrompt(ctx, "A/D move. E spend a sketch-planning action. C calendar.");
}

function drawCompanyBackdrop() {
  ctx.fillStyle = "#0b0f17";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#151d29";
  ctx.fillRect(0, 86, W, 280);
  ctx.fillStyle = "#1f2b3d";
  ctx.fillRect(0, 86, W, 28);
  ctx.fillStyle = "#283449";
  for (let x = 28; x < W; x += 86) {
    ctx.fillRect(x, 128, 52, 72);
    ctx.fillStyle = "#7dd3fc";
    ctx.fillRect(x + 8, 142, 36, 16);
    ctx.fillStyle = "#f0d9a5";
    if ((frame + x) % 5 === 0) ctx.fillRect(x + 14, 172, 24, 4);
    ctx.fillStyle = "#283449";
  }
  ctx.fillStyle = "#0b0f17";
  ctx.fillRect(0, H - 112, W, 112);
  ctx.fillStyle = "#263040";
  for (let y = H - 104; y < H; y += 18) ctx.fillRect(0, y, W, 2);
  ctx.fillStyle = "#111823";
  for (let x = 0; x < W; x += 72) ctx.fillRect(x, H - 112, 2, 112);
  ctx.fillStyle = "rgba(240,217,165,0.08)";
  for (let i = 0; i < 60; i++) {
    const px = (i * 71 + frame) % W;
    const py = 118 + ((i * 43 + Math.floor(frame * 0.25)) % 250);
    ctx.fillRect(px, py, i % 4 === 0 ? 4 : 2, 1);
  }
  ctx.fillStyle = "#05070b";
  ctx.fillRect(40, 330, 852, 18);
  ctx.fillStyle = "#243047";
  ctx.fillRect(52, 320, 828, 18);
}

function drawCompanyStations(nearestStation, currentEvent) {
  for (const station of companyStations) {
    const active = station === nearestStation;
    ctx.fillStyle = "#05070b";
    ctx.fillRect(station.x - 8, station.y + 58, station.w + 16, 14);
    ctx.fillStyle = active ? station.color : "#2e3442";
    ctx.fillRect(station.x, station.y + 46, station.w, 16);
    ctx.fillStyle = "#111823";
    ctx.fillRect(station.x + 8, station.y, station.w - 16, 48);
    ctx.fillStyle = station.color;
    ctx.fillRect(station.x + 14, station.y + 8, station.w - 28, 5);
    ctx.fillStyle = "#d8cfb8";
    if (station.id === "focus") {
      ctx.fillRect(station.x + 26, station.y + 22, 56, 4);
      ctx.fillRect(station.x + 26, station.y + 32, 42, 4);
    } else if (station.id === "meeting") {
      ctx.fillRect(station.x + 32, station.y + 18, 18, 18);
      ctx.fillRect(station.x + 70, station.y + 18, 18, 18);
      ctx.fillStyle = "#b23b48";
      ctx.fillRect(station.x + 54, station.y + 26, 12, 4);
    } else if (station.id === "reference") {
      for (let i = 0; i < 4; i++) ctx.fillRect(station.x + 22 + i * 25, station.y + 18 + (i % 2) * 8, 18, 18);
      ctx.fillStyle = "#86c06c";
      ctx.fillRect(station.x + 42, station.y + 38, 64, 3);
    } else {
      ctx.fillRect(station.x + 26, station.y + 16, 30, 28);
      ctx.fillStyle = companyCoffeeUsed ? "#5f5a52" : "#b23b48";
      ctx.fillRect(station.x + 34, station.y + 24, 14, 8);
    }
    pixelLabel(ctx, station.label, station.x + 10, station.y + 84, 11, active ? station.color : "#a99d8c");
  }
  if (currentEvent) {
    ctx.fillStyle = "#05070b";
    ctx.fillRect(322, H - 84, 318, 30);
    ctx.fillStyle = "#151a22";
    ctx.fillRect(326, H - 80, 310, 22);
    pixelLabel(ctx, workEventName(currentEvent.type), 340, H - 64, 12, "#f0d9a5");
  }
}

function drawCompanyNpcs(nearestNpc) {
  for (const npc of companyNpcs) {
    const active = npc === nearestNpc;
    const x = npc.x;
    const y = H - 174;
    const color = npc.used ? "#5f5a52" : npc.color;
    drawOfficeNpcAt(ctx, npc, {
      x,
      footY: y + 42,
      facing: x < companyPlayer.x ? 1 : -1,
      frame: frame + x,
      active,
      used: npc.used,
    });
    drawNpcStatusPip(ctx, x, y + 50, color, active, npc.used);
    pixelLabel(ctx, npc.name, x - 20, y + 66, 11, active ? color : "#d8cfb8");
    pixelLabel(ctx, npc.role, x - 26, y + 80, 9, npc.used ? "#5f5a52" : "#a99d8c");
  }
}

function drawOfficeNpcAt(ctx, npc, options = {}) {
  const x = Math.floor(options.x ?? 0);
  const footY = Math.floor(options.footY ?? 0);
  const flip = (options.facing ?? 1) < 0 ? -1 : 1;
  const frameValue = options.frame ?? 0;
  const active = Boolean(options.active);
  const used = Boolean(options.used);
  const bob = used ? 0 : Math.round(Math.sin(frameValue * 0.08) * (active ? 2 : 1));
  const y = footY - 42 + bob;
  const accent = used ? "#5f5a52" : npc.color;

  ctx.fillStyle = active ? "rgba(240,217,165,0.24)" : "rgba(5,7,11,0.36)";
  ctx.fillRect(x - 18, footY - 2, 36, 5);
  if (drawModelSprite(ctx, companyNpcSpriteId(npc.id), x, footY + bob, {
    height: 58,
    facing: flip,
    alpha: used ? 0.58 : 1,
  })) {
    if (active) {
      ctx.strokeStyle = accent;
      ctx.strokeRect(x - 23.5, footY - 64.5 + bob, 47, 69);
    }
    return;
  }
  if (active) {
    ctx.fillStyle = accent;
    ctx.fillRect(x - 20, y - 10, 40, 2);
    ctx.fillRect(x - 20, y - 10, 2, 48);
    ctx.fillRect(x + 18, y - 10, 2, 48);
  }

  if (npc.id === "zhou") drawZhouOfficeSprite(ctx, x, y, flip, accent, used, frameValue);
  else if (npc.id === "mira") drawMiraOfficeSprite(ctx, x, y, flip, accent, used, frameValue);
  else if (npc.id === "ren") drawRenOfficeSprite(ctx, x, y, flip, accent, used, frameValue);
  else drawClientOfficeSprite(ctx, x, y, flip, accent, used, frameValue);
}

function companyNpcSpriteId(id) {
  if (id === "zhou") return "zhou";
  if (id === "mira") return "mira";
  if (id === "ren") return "ren";
  if (id === "client") return "client";
  return "mira";
}

function drawZhouOfficeSprite(ctx, x, y, flip, accent, used, frameValue) {
  const coat = used ? "#34333a" : "#151923";
  rectPx(ctx, x - 9, y + 11, 18, 29, "#05070b");
  rectPx(ctx, x - 7, y + 12, 14, 27, coat);
  rectPx(ctx, x - 5, y + 16, 10, 2, accent);
  rectPx(ctx, x + flip * 4, y + 18, 2, 12, "#f2b84b");
  rectPx(ctx, x - 6, y + 2, 12, 11, "#05070b");
  rectPx(ctx, x - 5, y + 3, 10, 9, used ? "#9a8879" : "#e8b89d");
  rectPx(ctx, x - 7, y - 2, 14, 6, "#11131a");
  rectPx(ctx, x + flip * 2, y + 7, 3, 1, "#f7f0df");
  rectPx(ctx, x - flip * 4, y + 9, 3, 1, "#7a4b42");
  rectPx(ctx, x - 8, y + 38, 7, 9, "#11131a");
  rectPx(ctx, x + 1, y + 38, 7, 9, "#11131a");
  rectPx(ctx, x + flip * 10, y + 17, 3, 17, "#05070b");
  rectPx(ctx, x + flip * 11, y + 15 + Math.round(Math.sin(frameValue * 0.12)), 2, 16, "#b23b48");
  rectPx(ctx, x + flip * 13, y + 14, 3, 3, "#f0d9a5");
}

function drawMiraOfficeSprite(ctx, x, y, flip, accent, used, frameValue) {
  const hoodie = used ? "#343b45" : "#263447";
  rectPx(ctx, x - 8, y + 12, 16, 26, "#05070b");
  rectPx(ctx, x - 6, y + 13, 12, 24, hoodie);
  rectPx(ctx, x + flip * 5, y + 15, 2, 16, accent);
  rectPx(ctx, x - 6, y + 3, 12, 10, "#05070b");
  rectPx(ctx, x - 5, y + 4, 10, 8, used ? "#a58b75" : "#d8a88e");
  rectPx(ctx, x - 7, y - 1, 14, 6, "#11131a");
  rectPx(ctx, x + 3, y - 3, 4, 4, "#11131a");
  rectPx(ctx, x + flip * 2, y + 8, 3, 1, accent);
  rectPx(ctx, x - 8, y + 37, 7, 9, "#151923");
  rectPx(ctx, x + 1, y + 37, 7, 9, "#151923");
  rectPx(ctx, x - flip * 18, y + 20 + Math.round(Math.sin(frameValue * 0.1)), 15, 12, "#05070b");
  rectPx(ctx, x - flip * 17, y + 21, 13, 10, "#1d2936");
  rectPx(ctx, x - flip * 15, y + 23, 9, 1, accent);
}

function drawRenOfficeSprite(ctx, x, y, flip, accent, used, frameValue) {
  const robe = used ? "#34362d" : "#242820";
  rectPx(ctx, x - 10, y + 10, 20, 29, "#05070b");
  rectPx(ctx, x - 8, y + 12, 16, 27, robe);
  rectPx(ctx, x - 5, y + 17, 10, 3, accent);
  rectPx(ctx, x - 10, y + 23, 20, 8, "#3b2f22");
  for (let i = 0; i < 4; i++) rectPx(ctx, x - 8 + i * 4, y + 24, 2, 7, used ? "#5f5a52" : "#d8cfb8");
  rectPx(ctx, x - 6, y + 2, 12, 11, "#05070b");
  rectPx(ctx, x - 5, y + 3, 10, 9, used ? "#9b816c" : "#d8a88e");
  rectPx(ctx, x - 8, y - 1, 16, 6, "#11131a");
  rectPx(ctx, x + flip * 2, y + 7, 3, 1, accent);
  rectPx(ctx, x - 8, y + 38, 7, 9, "#11131a");
  rectPx(ctx, x + 1, y + 38, 7, 9, "#11131a");
  const brushY = y + 16 + Math.round(Math.sin(frameValue * 0.09));
  rectPx(ctx, x + flip * 10, brushY, 3, 20, "#5f432b");
  rectPx(ctx, x + flip * 9, brushY - 3, 5, 5, accent);
}

function drawClientOfficeSprite(ctx, x, y, flip, accent, used, frameValue) {
  const suit = used ? "#2e3038" : "#161a22";
  rectPx(ctx, x - 8, y + 11, 16, 28, "#05070b");
  rectPx(ctx, x - 6, y + 12, 12, 26, suit);
  rectPx(ctx, x + flip * 3, y + 16, 3, 10, accent);
  rectPx(ctx, x - 6, y + 2, 12, 11, "#05070b");
  rectPx(ctx, x - 5, y + 3, 10, 9, used ? "#9b7d68" : "#d6a48b");
  rectPx(ctx, x - 6, y - 1, 12, 5, "#15100f");
  rectPx(ctx, x + flip * 2, y + 7, 3, 1, "#f7f0df");
  rectPx(ctx, x - 8, y + 38, 7, 9, "#11131a");
  rectPx(ctx, x + 1, y + 38, 7, 9, "#11131a");
  rectPx(ctx, x + flip * 11, y + 19 + Math.round(Math.sin(frameValue * 0.07)), 8, 12, "#05070b");
  rectPx(ctx, x + flip * 12, y + 20, 6, 10, "#292632");
  rectPx(ctx, x + flip * 13, y + 21, 3, 1, accent);
  ctx.fillStyle = "rgba(178,59,72,0.18)";
  ctx.fillRect(x - 16, y + 6, 32, 34);
}

function drawNpcStatusPip(ctx, x, y, color, active, used) {
  ctx.fillStyle = "#05070b";
  ctx.fillRect(x - 7, y, 14, 5);
  ctx.fillStyle = used ? "#5f5a52" : active ? color : "#1b2028";
  ctx.fillRect(x - 5, y + 1, 10, 3);
}

function rectPx(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function drawCompanyActor(actor) {
  const x = Math.floor(actor.x);
  drawProtagonistAt(ctx, {
    x,
    footY: Math.floor(actor.y + 44),
    facing: actor.facing,
    frame: actor.walkFrame ?? 0,
    walkSpeed: Math.abs(actor.vx ?? 0),
    showTank: false,
  });
  pixelLabel(ctx, "you", x - 12, Math.floor(actor.y + 62), 11, "#f0d9a5");
}

function drawCompanyMeters(x, y) {
  drawCompanyMeter("stress", gameState.status.stress ?? 0, x, y, "#b23b48");
  drawCompanyMeter("fatigue", gameState.status.fatigue ?? 0, x, y + 38, "#f2b84b");
  drawCompanyMeter("spark", gameState.status.inspiration ?? 0, x, y + 76, "#7dd3fc");
}

function drawCompanyProjectMeters(x, y) {
  drawCompanyMiniMeter("scope", companyState.scope ?? 0, x, y, "#7dd3fc");
  drawCompanyMiniMeter("morale", companyState.morale ?? 0, x, y + 22, "#86c06c");
  drawCompanyMiniMeter("deadline", companyState.deadline ?? 0, x + 178, y, "#b23b48");
  drawCompanyMiniMeter("rep", companyState.reputation ?? 0, x + 178, y + 22, "#f2b84b");
}

function drawCompanyMeter(name, value, x, y, color) {
  pixelLabel(ctx, name, x, y, 13, "#a99d8c");
  ctx.fillStyle = "#05070b";
  ctx.fillRect(x + 86, y - 12, 168, 16);
  ctx.fillStyle = "#1b2028";
  ctx.fillRect(x + 90, y - 8, 160, 8);
  ctx.fillStyle = color;
  ctx.fillRect(x + 90, y - 8, Math.round(160 * clampCompanyValue(value, 0, 100) / 100), 8);
  pixelLabel(ctx, String(Math.round(value)), x + 268, y, 12, "#f7f0df");
}

function drawCompanyMiniMeter(name, value, x, y, color) {
  pixelLabel(ctx, name, x, y, 10, "#a99d8c");
  ctx.fillStyle = "#05070b";
  ctx.fillRect(x + 66, y - 9, 86, 10);
  ctx.fillStyle = "#1b2028";
  ctx.fillRect(x + 68, y - 7, 82, 6);
  ctx.fillStyle = color;
  ctx.fillRect(x + 68, y - 7, Math.round(82 * clampCompanyValue(value, 0, 100) / 100), 6);
}

function companyProjectSummary() {
  if ((companyState.deadline ?? 0) >= 72) return "Deadline heat will make the hand rush tonight.";
  if ((companyState.scope ?? 0) >= 70) return "Clear scope gives the drawing a readable silhouette.";
  if ((companyState.morale ?? 0) >= 70) return "The hand has enough air to keep useful mistakes.";
  if ((companyState.reputation ?? 0) >= 60) return "The client can read the motif without a meeting.";
  return "The picture brief is still wobbling.";
}

function companyStatusSummary(status) {
  const stress = status.stress ?? 0;
  const fatigue = status.fatigue ?? 0;
  const inspiration = status.inspiration ?? 0;
  if (stress >= 70) return "Pressure is loud enough to follow you into the page.";
  if (fatigue >= 70) return "Your hand is running on borrowed time.";
  if (inspiration >= 70) return "A useful image is waiting for night.";
  if (stress >= 40 || fatigue >= 40) return "You can work, but it will leave a mark.";
  if (inspiration >= 40) return "There is a small spark under the office noise.";
  return "Stable enough. That almost feels suspicious.";
}

function workEventName(type) {
  const names = {
    overtime: "Overtime revision",
    requirement_change: "Requirement changed",
    client_feedback: "Vague client feedback",
    urgent_task: "Urgent side request",
    positive: "Rare good momentum",
  };
  return names[type] ?? "Office pressure";
}

function workEventPrompt(event) {
  const prompts = {
    overtime: "The clock is already wrong. Decide whether the drawing needs a smaller silhouette, a clearer subject, or one useful motif.",
    requirement_change: "The target moved after the sketch started. Pick which part of the picture brief survives.",
    client_feedback: "Nobody can explain what is wrong. Turn fog into a readable mark before night.",
    urgent_task: "A new reference lands on top of everything else. It can become money, stress, or material for the Inkwell.",
    positive: "For once the day gives something back. Use the momentum while the line still feels alive.",
  };
  return prompts[event?.type] ?? "Pick a station. The way you shape the brief changes the night drawing.";
}

function workEventIcon(type) {
  const icons = {
    overtime: "[OVERTIME]",
    requirement_change: "[REVISION]",
    client_feedback: "[CLIENT]",
    urgent_task: "[URGENT]",
    positive: "[GOOD]",
  };
  return icons[type] ?? "[WORK]";
}

function drawEffectLine(name, value, y) {
  if (!value) return y;
  const sign = value > 0 ? "+" : "";
  const color = value > 0 ? "#b23b48" : "#7dd3fc";
  pixelLabel(ctx, name + "  " + sign + value, 644, y, 16, color);
  return y + 30;
}

function drawWrappedPixelText(text, x, y, maxWidth, size = 15, color = "#f7f0df", lineHeight = 22) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const next = line ? line + " " + word : word;
    ctx.font = size + "px Courier New, Microsoft YaHei, monospace";
    if (ctx.measureText(next).width > maxWidth && line) {
      pixelLabel(ctx, line, x, cursorY, size, color);
      cursorY += lineHeight;
      line = word;
    } else {
      line = next;
    }
  }
  if (line) pixelLabel(ctx, line, x, cursorY, size, color);
}

function drawCalendarOverlay() {
  const snapshot = calendarSystem.getSnapshot({ companyState, companyContract });
  const record = snapshot.record;
  ctx.save();
  ctx.fillStyle = "rgba(5,7,11,0.82)";
  ctx.fillRect(0, 0, W, H);
  drawReadoutPanel(ctx, 44, 32, 872, 462, "CALENDAR");
  pixelLabel(ctx, "WEEK " + snapshot.week + " / DAY " + snapshot.day + " / " + snapshot.weekday, 72, 70, 20, "#f7f0df");
  pixelLabel(ctx, record.theme, 360, 70, 14, "#f0d9a5");
  pixelLabel(ctx, "CLOSE  C / ESC", 744, 70, 12, "#a99d8c");

  drawCalendarWeekStrip(snapshot.weekDays, 72, 94);
  drawCalendarSlots(record.slots, 72, 152);
  drawCalendarGoals(record.goals, 404, 152);
  drawCalendarQuestList("MAINLINE", snapshot.mainline, 72, 332);
  drawCalendarQuestList("SIDELINES", snapshot.sideQuests, 500, 332);
  if (record.notes.length > 0) {
    const note = record.notes[0];
    pixelLabel(ctx, "LATEST", 404, 300, 11, note.color || "#f0d9a5");
    drawWrappedPixelText(note.body, 462, 300, 400, 11, "#d8cfb8", 14);
  }
  ctx.restore();
}

function drawCalendarWeekStrip(days, x, y) {
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const bx = x + i * 116;
    const color = calendarStatusColor(day.status, day.current);
    ctx.fillStyle = "#05070b";
    ctx.fillRect(bx, y, 96, 38);
    ctx.fillStyle = day.current ? "#1b2028" : "#10141b";
    ctx.fillRect(bx + 3, y + 3, 90, 32);
    ctx.fillStyle = color;
    ctx.fillRect(bx + 3, y + 3, 90, 3);
    pixelLabel(ctx, day.weekday, bx + 10, y + 22, 11, color);
    pixelLabel(ctx, String(day.day), bx + 66, y + 22, 11, "#f7f0df");
  }
}

function drawCalendarSlots(slots, x, y) {
  drawReadoutPanel(ctx, x, y - 22, 286, 154, "TODAY");
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const sy = y + 10 + i * 30;
    const color = calendarStatusColor(slot.status, false, slot.color);
    pixelLabel(ctx, slot.time, x + 18, sy, 11, "#a99d8c");
    pixelLabel(ctx, calendarStatusMark(slot.status) + " " + slot.title, x + 78, sy, 12, color);
    const detail = String(slot.detail || "").slice(0, 28);
    pixelLabel(ctx, detail, x + 78, sy + 15, 9, "#d8cfb8");
  }
}

function drawCalendarGoals(goals, x, y) {
  drawReadoutPanel(ctx, x, y - 22, 468, 154, "TASK TARGETS");
  for (let i = 0; i < goals.length; i++) {
    const goal = goals[i];
    const gy = y + 14 + i * 40;
    const color = calendarStatusColor(goal.status, false, goal.color);
    pixelLabel(ctx, calendarStatusMark(goal.status) + " " + goal.title, x + 18, gy, 13, color);
    drawWrappedPixelText(goal.detail, x + 34, gy + 16, 398, 10, "#d8cfb8", 12);
  }
}

function drawCalendarQuestList(title, quests, x, y) {
  drawReadoutPanel(ctx, x, y - 22, 388, 124, title);
  for (let i = 0; i < quests.length; i++) {
    const quest = quests[i];
    const qy = y + 12 + i * 32;
    pixelLabel(ctx, quest.title, x + 18, qy, 12, quest.status === "done" ? quest.color : "#f7f0df");
    drawCalendarProgress(quest, x + 196, qy - 10, 142, 10);
    pixelLabel(ctx, String(quest.current) + "/" + String(quest.target), x + 346, qy, 10, quest.color);
  }
}

function drawCalendarProgress(quest, x, y, w, h) {
  ctx.fillStyle = "#05070b";
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = "#1b2028";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = quest.color;
  ctx.fillRect(x, y, Math.round(w * quest.ratio), h);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x + 2, y + 2, Math.max(0, Math.round(w * quest.ratio) - 4), 2);
}

function calendarStatusMark(status) {
  if (status === "done" || status === "settled") return "[x]";
  if (status === "active") return "[>]";
  if (status === "missed") return "[!]";
  if (status === "locked") return "[-]";
  return "[ ]";
}

function calendarStatusColor(status, current = false, fallback = "#f0d9a5") {
  if (status === "done" || status === "settled") return "#7dd3fc";
  if (status === "active" || current) return fallback || "#f0d9a5";
  if (status === "missed") return "#b23b48";
  if (status === "locked") return "#5f5a52";
  return "#a99d8c";
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
    scene = "studio";
  }
  
  // 消息计时器
  if (shopState.messageTimer > 0) {
    shopState.messageTimer--;
  }
}

function drawShop() {
  if (!shopState) return;

  drawPaperBackground(ctx);
  drawShopBackdrop();
  pixelLabel(ctx, "INKDOT NOOK", 58, 54, 24, "#f7f0df");
  pixelLabel(ctx, "a tiny counter between rent money and impossible ink", 58, 80, 13, "#f0d9a5");

  drawReadoutPanel(ctx, 52, 108, 280, 330, "SHELVES");
  const categories = getCategories();
  let y = 150;
  for (const cat of categories) {
    const selected = cat.id === shopState.selectedCategory;
    const button = { x: 76, y: y - 22, w: 224, h: 32 };
    drawPixelButton(ctx, button, cat.icon + "  " + cat.name, selected ? "active" : "default");
    y += 44;
  }

  const items = getItemsByCategory(shopState.selectedCategory);
  drawReadoutPanel(ctx, 360, 108, 276, 330, "COUNTER STOCK");
  let itemY = 154;
  items.forEach((item, index) => {
    const selected = index === shopState.selectedIndex;
    const button = { x: 384, y: itemY - 23, w: 228, h: 34 };
    drawPixelButton(ctx, button, item.name, selected ? "active" : "default");
    pixelLabel(ctx, item.price + " money", 404, itemY + 22, 12, selected ? "#7dd3fc" : "#a99d8c");
    itemY += 52;
  });

  drawReadoutPanel(ctx, 666, 108, 236, 330, "SHOPKEEPER");
  drawShopkeeper(760, 218);
  pixelLabel(ctx, "wallet  " + gameState.money, 704, 156, 16, "#f2b84b");
  const selectedItem = items[shopState.selectedIndex];
  if (selectedItem) {
    const afford = gameState.money >= selectedItem.price;
    pixelLabel(ctx, selectedItem.icon + "  " + selectedItem.name, 690, 292, 15, "#f7f0df");
    drawWrappedPixelText(selectedItem.desc, 690, 326, 180, 13, "#d8cfb8", 19);
    pixelLabel(ctx, afford ? "Enter buy" : "not enough money", 690, 410, 14, afford ? "#7dd3fc" : "#b23b48");
  }

  if (shopState.message && shopState.messageTimer > 0) {
    drawReadoutPanel(ctx, 256, 452, 448, 54, "RECEIPT");
    pixelLabel(ctx, shopState.message, 286, 486, 14, shopState.message.includes("Not") ? "#b23b48" : "#7dd3fc");
  }

  drawBottomPrompt(ctx, "A/D shelf. W/S item. Enter buy. C calendar. Escape studio.");
}

function drawShopBackdrop() {
  ctx.fillStyle = "#141019";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#221a26";
  ctx.fillRect(0, 92, W, 362);
  ctx.fillStyle = "#34243a";
  for (let x = 42; x < W; x += 118) {
    ctx.fillRect(x, 126, 84, 12);
    ctx.fillRect(x, 200, 84, 12);
    ctx.fillRect(x, 274, 84, 12);
    ctx.fillStyle = "#7dd3fc";
    ctx.fillRect(x + 12, 104, 14, 20);
    ctx.fillStyle = "#f2b84b";
    ctx.fillRect(x + 42, 178, 18, 18);
    ctx.fillStyle = "#34243a";
  }
  ctx.fillStyle = "#0b0f17";
  ctx.fillRect(0, 454, W, 86);
}

function drawShopkeeper(x, y) {
  ctx.fillStyle = "#05070b";
  ctx.fillRect(x - 50, y + 42, 100, 24);
  ctx.fillStyle = "#151a22";
  ctx.fillRect(x - 46, y + 46, 92, 16);
  if (!drawModelSprite(ctx, "supply_keeper", x, y + 62, { height: 150, facing: -1 })) {
    drawPixelPersonAt(ctx, {
      x,
      footY: y + 50,
      facing: -1,
      frame,
      walkSpeed: 0.08,
      bodyColor: "#6b4b2a",
      accentColor: "#f2b84b",
      hairColor: "#24211f",
      apron: true,
      apronColor: "#7dd3fc",
      badge: true,
    });
  }
  pixelLabel(ctx, "Supply Keeper", x - 48, y + 88, 13, "#f0d9a5");
}

function drawFeedback() {
  drawPaperBackground(ctx);
  label(ctx, feedback.title, 70, 70, 26);
  label(ctx, feedback.draft, 70, 134, 18);
  label(ctx, feedback.boss, 70, 188, 18);
  label(ctx, feedback.cat, 70, 242, 18);
  if (feedback.artwork) label(ctx, feedback.artwork, 70, 294, 16, "#c9a846");
  if (feedback.infusion) label(ctx, feedback.infusion, 70, 322, 15, "#7dd3fc");
  if (feedback.consequence) label(ctx, feedback.consequence, 70, 348, 15, "#b23b48");
  if (feedback.exploration) label(ctx, feedback.exploration, 70, 374, 15, "#d8cfb8");
  if (feedback.objective) label(ctx, feedback.objective, 70, 400, 15, "#f2b84b");
  // artwork completion displayed via feedback.artwork above

  ctx.fillStyle = "#1f1e1c";
  ctx.fillRect(70, 404, 560, 58);
  label(ctx, `Last weapon: ${weapon.name}`, 96, 428, 16, "#f7f0df");
  label(ctx, `process: ${Math.round(weapon.metrics.seconds)}s, ${weapon.metrics.revisions} revisions, trait '${weapon.trait}'`, 96, 452, 15, "#f7f0df");

  label(ctx, "Enter: next workday    C: calendar", 70, 496, 18);
}

function update() {
  if (calendarOpen) return;
  if (scene === "chapter0") chapter0Scene.update();
  if (scene === "opening") openingScene.update();
  if (scene === "studio") updateStudio();
  if (scene === "inkwell") inkwell.update();
  if (scene === "work") updateWorkPhase();
  if (scene === "shop") updateShop();
  if (scene === "experiment") inkwellExperiment.update();
}

function draw() {
  if (scene === "opening") openingScene.draw();
  if (scene === "chapter0") chapter0Scene.draw();
  if (scene === "studio") drawStudio();
  if (scene === "inkwell") inkwell.draw();
  if (scene === "feedback") drawFeedback();
  if (scene === "work") drawWorkPhase();
  if (scene === "shop") drawShop();
  if (scene === "experiment") inkwellExperiment.draw();
  drawPixelFrame(ctx, frame, scene === "inkwell" || scene === "experiment" ? "inkwell" : "studio");
  if (calendarOpen) drawCalendarOverlay();
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
  if (key === "c" && scene !== "chapter0" && scene !== "opening") {
    event.preventDefault();
    calendarOpen = !calendarOpen;
    keys.clear();
    return;
  }
  if (calendarOpen) {
    event.preventDefault();
    if (key === "escape" || key === "enter") calendarOpen = false;
    keys.clear();
    return;
  }
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
  if (scene === "experiment") { inkwellExperiment.handleKey(key); return; }
  if (key === "escape" && scene === "studio" && studioDrawingActive) { leaveStudioDrawing(); return; }
  if (key === "e" && scene === "studio" && !studioDrawingActive && !drawingComplete) {
    if (isStudioPlayerAtBoard()) activateStudioDrawing();
    return;
  }
  if (key === "p" && scene === "studio" && studioDrawingActive) setDrawingTool("pencil");
  if (key === "e" && scene === "studio" && studioDrawingActive) setDrawingTool("eraser");
  if (key === "r" && scene === "studio") clearDrawing();
  if (key === "enter" && scene === "experiment") { inkwellExperiment.handleKey("enter"); return; }
  if (key === "enter" && scene === "studio" && drawingCanvas.hasEnoughPoints() && (studioDrawingActive || drawingComplete)) enterInkwell();
  if (key === "t" && scene === "studio") {
    inkwellExperiment.start();
    scene = "experiment";
    return;
  }
  if (key === "s" && scene === "studio") {
    enterShopScene();
    return;
  }
  if (scene === "work") {
    if (key === "e") {
      handleCompanyInteract();
      return;
    }
    if (key === "enter") {
      maybeResolveCompanyTurn(Boolean(dayCycle.getCurrentWorkEvent()));
      if (isCompanyDayResolved()) {
        scene = "studio";
        return;
      }
      companyMessage = "Spend your office actions first.";
      companyMessageColor = "#a99d8c";
      companyMessageTimer = 110;
    }
    return;
  }
  if (key === "enter" && scene === "work") {
    const hasMoreEvents = dayCycle.advanceWorkEvent();
    if (!hasMoreEvents) {
      scene = "studio"; // 所有事件完成，进入 studio
    }
  }
  if (key === "enter" && scene === "feedback") {
    gameState.day++;
    clearDrawing();
    enterCompanyScene();
    return;
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
    if (scene === "studio" && !studioDrawingActive && !drawingComplete) {
      if (pointInRect(mouse.x, mouse.y, shopDoorButton)) {
        enterShopScene();
        return;
      }
      if (pointInRect(mouse.x, mouse.y, drawPanel)) {
        activateStudioDrawing();
        mouse.left = true;
        mouse.justLeft = true;
        beginStroke();
      }
      return;
    }
    if (scene === "studio" && studioDrawingActive && !drawingComplete) {
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
  if (mouse.left && scene === "studio" && studioDrawingActive && !drawingComplete) drawingCanvas.update(mouse.x, mouse.y);
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














