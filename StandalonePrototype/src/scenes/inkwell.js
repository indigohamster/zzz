import { H, TILE, W, WORLD_H, WORLD_W } from "../core/config.js?v=27";
import { TUNING } from "../core/TuningConfig.js?v=3";
import { drawPixelPanel, label, pixelText } from "../core/render.js?v=27";
import { drawInkwellBackground } from "../inkwell/Background.js?v=4";
import { drawInkwellLighting } from "../inkwell/Lighting.js?v=2";
import { createNpcManager } from "../inkwell/NPC.js?v=46";
import { createStoryNpcManager } from "../inkwell/StoryNPC.js?v=24";
import { createPhysics } from "../inkwell/Physics.js?v=2";
import { createPlayer } from "../inkwell/Player.js?v=57";
import { createTileMap } from "../inkwell/TileMap.js?v=5";
import { createLootManager } from "../inkwell/Loot.js?v=2";
import { createPortalManager } from "../inkwell/Portal.js";
import { BASIC_SLASH_ATTACK, DEBUG_ATTACK_ANGLE, DEBUG_ATTACK_HITBOX, DEBUG_ATTACK_STATE } from "../inkwell/AttackController.js?v=36";
import { createCombatSystem } from "../inkwell/CombatSystem.js?v=25";
import { createMapSystem } from "../inkwell/MapSystem.js?v=7";
import { drawForegroundPixels, drawPixelPostProcess } from "../inkwell/PixelPolish.js?v=1";
import { createEcologyManager } from "../ecology/EcologyManager.js";
import { placeGatesOnMap, updateGates, drawGates, findNearestGate } from "../ecology/CanvasGate.js?v=2";
import { createSubMapScene } from "../ecology/SubMapScene.js?v=24";
import { createArtworkCompletion } from "../ecology/ArtworkCompletion.js?v=2";
import { applyGateConsequence } from "../ecology/GateConsequences.js?v=1";
import { shouldSpawnRift, rollRiftType, createRiftInstance, findNearestRift, updateRifts, drawRifts, RIFT_TYPES } from "../ecology/CanvasRift.js?v=2";
import { createRiftWorld } from "../ecology/RiftWorld.js?v=24";
import { createRewardOverlay } from "../game/builds/RewardOverlay.js?v=2";
import { generateRelicChoices, generateEvolutionChoices } from "../game/builds/RewardGenerator.js?v=32";
import { getWeaponTypeFromProfile } from "../game/builds/WeaponArchetypes.js?v=32";
import { getLayerByDepth, MAP_LAYERS } from "../inkwell/MapLayers.js?v=4";
import {
  ALL_NIGHT_BODY_COST,
  ALL_NIGHT_EXTENSION_FRAMES,
  NIGHT_DURATION_FRAMES,
  OVERTIME_BODY_COST,
  OVERTIME_EXTENSION_FRAMES,
} from "../inkwell/InkwellConfig.js?v=2";

const BASIC_SLASH = {
  name: "BasicSlash",
  damage: BASIC_SLASH_ATTACK.damage,
  knockbackX: BASIC_SLASH_ATTACK.knockbackX,
  knockbackY: BASIC_SLASH_ATTACK.knockbackY,
  range: BASIC_SLASH_ATTACK.range,
};
const lootWeaponStub = { damage: BASIC_SLASH.damage, reach: BASIC_SLASH.range };
const FLOW_MAX = TUNING.flow?.max ?? 100;
const FLOW_RUSH_FRAMES = Math.max(1, Math.round((TUNING.flow?.rushSeconds ?? 10) * 60));
const FLOW_DECAY_PER_FRAME = (TUNING.flow?.decayPerSecond ?? 1.5) / 60;
const DISCOVERY_ECHO_LIFE = 64;
const EXPLORATION_SITE_PROFILES = [
  { id: "margin_note", name: "Margin note", color: "#f0d9a5", roomTypes: ["explore", "event", "resource"], reward: "ink" },
  { id: "breathing_ink", name: "Breathing ink", color: "#7dd3fc", roomTypes: ["rift", "danger", "combat"], reward: "flow" },
  { id: "folded_receipt", name: "Folded receipt", color: "#f2b84b", roomTypes: ["shop", "treasure", "event"], reward: "material" },
  { id: "wrong_shadow", name: "Wrong shadow", color: "#b23b48", roomTypes: ["danger", "rift", "combat"], reward: "rare" },
  { id: "warm_stain", name: "Warm stain", color: "#d8cfb8", roomTypes: ["resource", "explore", "treasure"], reward: "body" },
];

export function createInkwellScene({ canvas, ctx, keys, mouse, weapon, gameState, getFrame, onFinish }) {
  let toolMode = 1;
  let finished = false;
  let awaitingTimeChoice = false;
  let addedTimeFrames = 0;
  const camera = { x: 0, y: 0 };
  const run = {
    kills: 0,
    mined: 0,
    placed: 0,
    hitsTaken: 0,
    attacks: 0,
    startedFrame: 0,
    finishReason: "unknown",
    overtimeCount: 0,
    allNighter: false,
    chestsOpened: 0,
    bossRewards: 0,
    bossName: "",
    materialsCollected: 0,
    itemsCollected: 0,
    canvasPressure: 0,
    canvasConsequences: [],
    gateReturnDrifts: 0,
    latestGateReturnRoom: "",
    mapRule: null,
    flow: 0,
    flowRushFrames: 0,
    flowRushCount: 0,
    flowMessage: "",
    flowMessageColor: "#7dd3fc",
    flowMessageFrames: 0,
    flowEvents: 0,
    explorationFinds: 0,
    latestDiscoveryName: "",
    dayCarryover: null,
    dayCarryoverApplied: false,
  };

  const tileMap = createTileMap(ctx);
  const physics = createPhysics(tileMap);
  let npcManager;
  let storyNpcManager;
  let lootManager;
  let portalManager;
  const hitEffects = [];
  const hitNpcHighlights = []; // {npc, age} for debug collider draw
  const rewardOverlay = createRewardOverlay();

  const playerController = createPlayer({
    canvas,
    keys,
    mouse,
    weapon,
    tileMap,
    physics,
    getCamera: () => camera,
    getToolMode: () => toolMode,
    getFrame,
    onAttack: attack,
    run,
  });
  const player = playerController.state;
  const combatSystem = createCombatSystem({ player, run });
  npcManager = createNpcManager({ physics, player, run, tileMap, combat: combatSystem, gameState });
  storyNpcManager = createStoryNpcManager({ player, tileMap, run, gameState });
  lootManager = createLootManager({ tileMap, player, weapon: lootWeaponStub, run });
  portalManager = createPortalManager({ player, onEnter: () => finish("boss") });
  const mapSystem = createMapSystem(tileMap, () => player);
  const ecologyManager = createEcologyManager({ player, run, getCamera: () => camera });
  const artworkCompletion = createArtworkCompletion();
  let canvasGates = [];
  let subMapScene = null;  // ????????
  let subMapType = null;   // ?????
  let canvasRifts = [];
  let activeRift = null;
  let riftWorld = null;
  let riftNestDepth = 0;
  const flowVisitedRooms = new Set();
  let currentFlowRoomId = "";
  let explorationSites = [];
  const discoveryEchoes = [];

  
  function spawnRiftsOnMap() {
    canvasRifts = [];
    const rooms = tileMap.getRooms();
    for (const room of rooms) {
      if (room.type === "entrance" || room.type === "exit") continue;
      // Determine layer based on room Y position
      let layerId = "shallow";
      for (const layer of MAP_LAYERS) {
        if (room.y >= layer.yRange[0] && room.y <= layer.yRange[1]) { layerId = layer.id; break; }
      }
      if (shouldSpawnRift(layerId, room.type)) {
        const typeId = rollRiftType(layerId);
        const rx = (room.x + room.w / 2) * TILE + (Math.random() - 0.5) * room.w * TILE * 0.4;
        const ry = (room.y + room.h / 2) * TILE + (Math.random() - 0.5) * room.h * TILE * 0.3;
        const rift = createRiftInstance(typeId, rx, ry, layerId);
        if (rift) canvasRifts.push(rift);
      }
    }
  }

  function start() {
    finished = false;
    awaitingTimeChoice = false;
    addedTimeFrames = 0;
    toolMode = 1;
    camera.x = 0;
    camera.y = 0;
    run.kills = 0;
    run.mined = 0;
    run.placed = 0;
    run.hitsTaken = 0;
    run.attacks = 0;
    run.startedFrame = getFrame();
    run.finishReason = "unknown";
    run.overtimeCount = 0;
    run.allNighter = false;
    run.chestsOpened = 0;
    run.bossRewards = 0;
    run.bossName = "";
    run.materialsCollected = 0;
    run.itemsCollected = 0;
    run.artworkCompletion = 0;
    run.canvasPressure = 0;
    run.canvasConsequences = [];
    run.latestGateConsequence = null;
    run.gateReturnDrifts = 0;
    run.latestGateReturnRoom = "";
    run.currentLayer = "shallow";
    run.deepestLayer = "shallow";
    run.flow = 0;
    run.flowRushFrames = 0;
    run.flowRushCount = 0;
    run.flowMessage = "";
    run.flowMessageFrames = 0;
    run.flowEvents = 0;
    run.explorationFinds = 0;
    run.latestDiscoveryName = "";
    run.dayCarryover = getNightCarryover();
    run.dayCarryoverApplied = false;
    flowVisitedRooms.clear();
    currentFlowRoomId = "";
    discoveryEchoes.length = 0;
    tileMap.generate();
    run.mapRule = tileMap.getMapRule?.() ?? null;
    spawnExplorationSites();
    lootManager.reset();
    playerController.reset();
    applyDayCarryoverToNight();
    combatSystem.reset();
    npcManager.reset();
    npcManager.logWeaknessTable();
    storyNpcManager.reset();
    portalManager.reset();
    mapSystem.reset();
    ecologyManager.reset();
    ecologyManager.spawnEntranceCreatures(player.x, player.y);
    canvasGates = placeGatesOnMap(tileMap, artworkCompletion.state.unlockedGateTypes, 2 + Math.floor(Math.random() * 2));
    subMapScene = null;
    subMapType = null;
    activeRift = null;
    riftWorld = null;
    riftNestDepth = 0;
    spawnRiftsOnMap();
    rewardOverlay.hide();
  }

  function getNightCarryover() {
    const carry = gameState?.nightCarryover ?? {};
    const status = gameState?.status ?? {};
    return {
      label: carry.label ?? "QUIET DAY",
      action: carry.action ?? "carry the day",
      color: carry.color ?? "#f0d9a5",
      stress: Math.round(carry.stress ?? status.stress ?? 0),
      fatigue: Math.round(carry.fatigue ?? status.fatigue ?? 0),
      inspiration: Math.round(carry.inspiration ?? status.inspiration ?? 0),
      scope: Math.round(carry.scope ?? 0),
      morale: Math.round(carry.morale ?? 0),
      deadline: Math.round(carry.deadline ?? 0),
      reputation: Math.round(carry.reputation ?? 0),
      hpPenalty: Math.max(0, Math.round(carry.hpPenalty ?? Math.min(22, (status.fatigue ?? 0) / 6))),
      inkPenalty: Math.max(0, Math.round(carry.inkPenalty ?? Math.min(18, (status.stress ?? 0) / 7))),
      flowBonus: Math.max(0, Math.round(carry.flowBonus ?? Math.min(42, (status.inspiration ?? 0) / 3))),
    };
  }

  function applyDayCarryoverToNight() {
    const carry = run.dayCarryover;
    if (!carry || run.dayCarryoverApplied) return;
    if (carry.hpPenalty > 0) player.hp = Math.max(42, player.hp - carry.hpPenalty);
    if (carry.inkPenalty > 0) player.ink = Math.max(42, player.ink - carry.inkPenalty);
    if (carry.flowBonus > 0) addFlow(carry.flowBonus, "day spark", carry.color);
    run.dayCarryoverApplied = true;
  }

  function attack(attackController, aim, currentWeapon) {
    if (!attackController.start(player, aim, currentWeapon ?? weapon)) return;
    run.attacks++;
  }

  function resolveAttackHits() {
    const attackController = playerController.attackController;
    if (!attackController.isActive()) return;

    // Visual debug: still generates composite hitbox for rendering.
    const hitbox = attackController.getHitbox(player);

    // Actual damage: swept melee angle + distance detection.
    const swept = attackController.getSweptMeleeParams(player);
    if (swept) logSweptMelee(swept);
    // ---- AttackHitboxSpawn: log origin & offsets once per attack ----
    if (swept) logAttackHitboxSpawn(player, swept);

    for (const npc of npcManager.npcs) {
      if (npc.hp <= 0) continue;
      if (attackController.hasHit(npc)) continue;

      let isHit = false;
      let hitLabel = "";
      if (swept) {
        isHit = isNpcInSweepSample(npc, player, swept);
        hitLabel = "sweptMelee";
      }

      if (!isHit) continue;

      attackController.markHit(npc);
      const rushDamage = getInkRushDamageMultiplier();
      const strike = combatSystem.strikeNpc({
        npc,
        npcManager,
        baseDamage: Math.max(1, Math.round(attackController.getDamage() * rushDamage)),
        direction: hitbox.facing,
        weapon,
        attackState: attackController.state,
        weaponTrait: player.weaponTrait,
        knockbackX: attackController.getKnockbackX(),
        knockbackY: attackController.getKnockbackY(),
    });
      logAttackHit(npc, strike.damage, swept ? swept.sampleIndex : 0, hitLabel);
      spawnHitEffect(npc.x, npc.y);
      attackController.triggerHitFeedback();
      hitNpcHighlights.push({ npc, age: 0, life: 18 });

      if (npc.hp <= 0) {
        run.kills++;
        addFlow(npc.boss ? (TUNING.flow?.bossKill ?? 60) : (TUNING.flow?.kill ?? 16), npc.boss ? "boss broken" : "enemy inked", npc.boss ? "#f2b84b" : "#b23b48");
        const ecoHit = ecologyManager.onAttackHit(npc.x, npc.y);
        if (npc.boss && !npc.rewardDropped) {
          npc.rewardDropped = true;
          run.bossName = npc.variant?.name ?? "Unknown Boss";
          lootManager.dropBossRewards(npc.x, npc.y);
          addFlow(TUNING.flow?.roomClear ?? 24, "boss reward", "#f2b84b");
          portalManager.spawn(npc.x, npc.y);
        }
      }
    }
  }


  // Composite hitbox resolver: checks mainHitbox (shape-specific) +
  // grace boxes (simple AABB). Returns first matching sub-box hit.
  function resolveCompositeHitboxHit(hitbox, npc) {
    const boxes = hitbox.composite;
    if (!boxes || boxes.length === 0) {
      // Fallback: no composite data, use legacy single-hitbox detection.
      return getAttackHit(hitbox, npc);
    }
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.type === "mainHitbox") {
        // Main hitbox uses the existing shape-specific detection.
        const result = getAttackHit(hitbox, npc);
        if (result.hit) return { hit: true, hitboxIndex: i, boxType: box.type };
      } else {
        // Grace boxes: simple axis-aligned rect vs NPC rect.
        if (aabbOverlapsNpc(box, npc)) {
          return { hit: true, hitboxIndex: i, boxType: box.type };
        }
      }
    }
    return { hit: false, hitboxIndex: -1 };
  }

  function aabbOverlapsNpc(box, npc) {
    const nx = npc.x - npc.w / 2;
    const ny = npc.y - npc.h / 2;
    const nw = npc.w;
    const nh = npc.h;
    return box.x < nx + nw && box.x + box.w > nx && box.y < ny + nh && box.y + box.h > ny;
  }


  // --- Swept Melee Hit Detection ---
  // Replaces static AABB with directional arc + distance + inner-radius check.
  function isNpcInSweepSample(npc, player, swept) {
    // Use forward-offset origin so the swept fan originates from the weapon
    // tip area, not from player center. Spear thrusts extend forward, sword
    // arcs sit ahead of the player body.
    const pCX = swept.originX ?? (player.centerX ?? player.x);
    const pCY = swept.originY ?? (player.centerY ?? player.y);
    const dx = npc.x - pCX;
    const dy = npc.y - pCY;
    const dist = Math.hypot(dx, dy);
    const npcRadius = getNpcHitRadius(npc);

    // Inner radius: always hits at point-blank (no angle check needed).
    // NPC body size included so large enemies register close hits reliably.
    if (dist <= swept.innerRadius + npcRadius) return true;

    // Tip radius (spear): wider acceptance zone at the far end.
    if (swept.tipRadius > 0 && Math.abs(dist - swept.range) <= swept.tipRadius + npcRadius) {
      const angleToNpc = Math.atan2(dy, dx);
      let angleDiff = Math.abs(angleToNpc - swept.attackAngle);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      if (angleDiff <= (swept.arcDeg * 1.35) * Math.PI / 360) return true;
    }

    // Range check: must be within weapon reach + NPC body size.
    if (dist > swept.range + npcRadius) return false;

    // Angle check: must be within the attack arc, with angular forgiveness
    // proportional to NPC size (a wide enemy can be hit even if its center
    // is slightly outside the arc).
    const angleToNpc = Math.atan2(dy, dx);
    let angleDiff = Math.abs(angleToNpc - swept.attackAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
    const angleForgiveness = dist > 0 ? Math.asin(Math.min(1, npcRadius / dist)) : 0;
    return angleDiff <= swept.arcDeg * Math.PI / 360 + angleForgiveness;
  }

  function logAttackHitboxSpawn(player, swept) {
    const ac2 = playerController.attackController;
    if (ac2.state.attackSpawnLoggedId === ac2.state.attackId) return;
    ac2.state.attackSpawnLoggedId = ac2.state.attackId;
    console.log("[AttackHitboxSpawn]", {
      weaponType: swept.archetype,
      archetype: swept.archetype,
      attackPattern: ac2.state.attackPattern,
      aimAngle: ac2.state.attackAngle,
      attackAngle: swept.attackAngle,
      forwardOffset: swept.forwardOffset,
      range: swept.range,
      innerRadius: swept.innerRadius,
      playerX: player.centerX ?? player.x,
      playerY: player.centerY ?? player.y,
      hitboxX: swept.originX,
      hitboxY: swept.originY,
      deltaX: (swept.originX ?? 0) - (player.centerX ?? player.x ?? 0),
      deltaY: (swept.originY ?? 0) - (player.centerY ?? player.y ?? 0),
    });
  }

  function logSweptMelee(swept) {
    const ac = playerController.attackController;
    if (ac.state.sweptMeleeLoggedId === ac.state.attackId) return;
    ac.state.sweptMeleeLoggedId = ac.state.attackId;
    console.log("[SweptMelee]", {
      weapon: swept.archetype,
      facing: swept.facing,
      attackAngle: swept.attackAngle,
      range: swept.range,
      arcDeg: swept.arcDeg,
      innerRadius: swept.innerRadius,
      tipRadius: swept.tipRadius,
      totalSamples: swept.totalSamples,
      sampleIndex: swept.sampleIndex,
    });
  }

  function getAttackHit(hitbox, npc) {
    if (hitbox.hitShape?.type === "arcSegments") return arcSegmentsHitboxOverlapsNpc(hitbox, npc);
    if (hitbox.hitShape?.type === "whipSegments") return segmentedHitboxOverlapsNpc(hitbox, npc);
    if (hitbox.hitShape?.type === "arc") return arcHitboxOverlapsNpc(hitbox, npc);
    if (hitbox.hitShape?.type === "capsule") return capsuleHitboxOverlapsNpc(hitbox, npc);
    if (hitbox.hitShape?.type === "ellipse") return ellipseHitboxOverlapsNpc(hitbox, npc);
    if (orientedRectOverlapsNpc(hitbox, npc)) return { hit: true, hitboxIndex: 0 };
    if (footHitboxOverlapsNpc(hitbox, npc)) return { hit: true, hitboxIndex: "foot" };
    return { hit: false, hitboxIndex: -1 };
  }

  function getNpcBounds(npc) {
    return {
      x: npc.x - npc.w / 2,
      y: npc.y - npc.h / 2,
      w: npc.w,
      h: npc.h,
    };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function orientedRectOverlapsNpc(hitbox, npc) {
    const dx = npc.x - hitbox.centerX;
    const dy = npc.y - hitbox.centerY;
    const localX = dx * hitbox.dirX + dy * hitbox.dirY;
    const localY = dx * hitbox.normalX + dy * hitbox.normalY;
    const npcExtentX = Math.abs(hitbox.dirX) * npc.w / 2 + Math.abs(hitbox.dirY) * npc.h / 2;
    const npcExtentY = Math.abs(hitbox.normalX) * npc.w / 2 + Math.abs(hitbox.normalY) * npc.h / 2;
    return Math.abs(localX) <= hitbox.w / 2 + npcExtentX && Math.abs(localY) <= hitbox.h / 2 + npcExtentY;
  }

  function arcHitboxOverlapsNpc(hitbox, npc) {
    if (orientedRectOverlapsNpc(hitbox, npc)) return { hit: true, hitboxIndex: 0 };
    if (footHitboxOverlapsNpc(hitbox, npc)) return { hit: true, hitboxIndex: "foot" };
    const dx = npc.x - hitbox.originX;
    const dy = npc.y - hitbox.originY;
    const distance = Math.hypot(dx, dy);
    const npcRadius = getNpcHitRadius(npc);
    const closeRadius = hitbox.hitShape.closeRadius ?? 0;
    if (distance <= closeRadius + npcRadius) return { hit: true, hitboxIndex: "close" };
    if (distance > hitbox.range + npcRadius) return { hit: false, hitboxIndex: -1 };
    const nx = dx / Math.max(1, distance);
    const ny = dy / Math.max(1, distance);
    const dot = nx * hitbox.dirX + ny * hitbox.dirY;
    const arcDegrees = hitbox.hitShape.arcDegrees ?? 90;
    return { hit: dot >= Math.cos((arcDegrees * Math.PI / 180) / 2), hitboxIndex: "arc" };
  }

  function capsuleHitboxOverlapsNpc(hitbox, npc) {
    if (footHitboxOverlapsNpc(hitbox, npc)) return { hit: true, hitboxIndex: "foot" };
    const shape = hitbox.hitShape;
    const startOffset = shape.startOffset ?? 0;
    const endOffset = shape.endOffset ?? hitbox.range;
    const ax = hitbox.originX + hitbox.dirX * startOffset;
    const ay = hitbox.originY + hitbox.dirY * startOffset - 2;
    const bx = hitbox.originX + hitbox.dirX * endOffset;
    const by = hitbox.originY + hitbox.dirY * endOffset - 2;
    return {
      hit: distancePointToSegment(npc.x, npc.y, ax, ay, bx, by) <= (shape.radius ?? hitbox.h / 2) + getNpcHitRadius(npc),
      hitboxIndex: 0,
    };
  }

  function ellipseHitboxOverlapsNpc(hitbox, npc) {
    if (orientedRectOverlapsNpc(hitbox, npc)) return { hit: true, hitboxIndex: 0 };
    if (footHitboxOverlapsNpc(hitbox, npc)) return { hit: true, hitboxIndex: "foot" };
    const dx = npc.x - hitbox.centerX;
    const dy = npc.y - hitbox.centerY;
    const localX = dx * hitbox.dirX + dy * hitbox.dirY;
    const localY = dx * hitbox.normalX + dy * hitbox.normalY;
    const radiusX = (hitbox.hitShape.radiusX ?? hitbox.w / 2) + getNpcHitRadius(npc);
    const radiusY = (hitbox.hitShape.radiusY ?? hitbox.h / 2) + getNpcHitRadius(npc);
    return {
      hit: (localX * localX) / (radiusX * radiusX) + (localY * localY) / (radiusY * radiusY) <= 1,
      hitboxIndex: "ellipse",
    };
  }

  function arcSegmentsHitboxOverlapsNpc(hitbox, npc) {
    const close = hitbox.hitShape?.closeRadius ?? 0;
    if (close > 0 && Math.hypot(npc.x - hitbox.originX, npc.y - hitbox.originY) <= close + getNpcHitRadius(npc)) {
      return { hit: true, hitboxIndex: "close" };
    }
    return segmentedHitboxOverlapsNpc(hitbox, npc);
  }

  function segmentedHitboxOverlapsNpc(hitbox, npc) {
    if (footHitboxOverlapsNpc(hitbox, npc)) return { hit: true, hitboxIndex: "foot" };
    const segments = hitbox.hitShape?.segments ?? [];
    const npcRadius = getNpcHitRadius(npc);
    for (const segment of segments) {
      const angle = hitbox.angle + (segment.angleOffset ?? 0);
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const ax = hitbox.originX + dirX * (segment.startOffset ?? 0);
      const ay = hitbox.originY + dirY * (segment.startOffset ?? 0) + (hitbox.attackSpec?.verticalOffset ?? -2);
      const bx = hitbox.originX + dirX * (segment.endOffset ?? hitbox.range);
      const by = hitbox.originY + dirY * (segment.endOffset ?? hitbox.range) + (hitbox.attackSpec?.verticalOffset ?? -2);
      if (distancePointToSegment(npc.x, npc.y, ax, ay, bx, by) <= (segment.radius ?? hitbox.h / 2) + npcRadius) {
        return { hit: true, hitboxIndex: segment.index ?? 0 };
      }
    }
    return { hit: false, hitboxIndex: -1 };
  }

  function distancePointToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const lengthSq = abx * abx + aby * aby;
    const t = lengthSq > 0 ? Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSq)) : 0;
    const x = ax + abx * t;
    const y = ay + aby * t;
    return Math.hypot(px - x, py - y);
  }

  function getNpcHitRadius(npc) {
    return Math.max(npc.w, npc.h) * 0.42;
  }

  function footHitboxOverlapsNpc(hitbox, npc) {
    return Boolean(hitbox.footHitbox) && rectsOverlap(hitbox.footHitbox, getNpcBounds(npc));
  }

  function logAttackHit(npc, damage, hitboxIndex, pattern) {
    console.log("[AttackHit]", {
      enemyType: npc.enemyType ?? npc.archetype?.id ?? (npc.boss ? "boss" : "npc"),
      damage,
      hitboxIndex,
      pattern,
    });
  }

  function spawnHitEffect(x, y) {
    hitEffects.push({ x, y, age: 0, life: 8 });
  }

  function updateHitHighlights() {
    for (let i = hitNpcHighlights.length - 1; i >= 0; i--) {
      hitNpcHighlights[i].age++;
      if (hitNpcHighlights[i].age >= hitNpcHighlights[i].life) hitNpcHighlights.splice(i, 1);
    }
  }

  function updateHitEffects() {
    for (let i = hitEffects.length - 1; i >= 0; i--) {
      hitEffects[i].age++;
      if (hitEffects[i].age >= hitEffects[i].life) hitEffects.splice(i, 1);
    }
  }

  function updateCamera() {
    camera.x += (player.x - W * 0.45 - camera.x) * 0.16;
    camera.y += (player.y - H * 0.48 - camera.y) * 0.12;
    camera.x = Math.max(0, Math.min(WORLD_W * TILE - W, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_H * TILE - H, camera.y));
  }

  function elapsedFrames() {
    return getFrame() - run.startedFrame;
  }

  function timeLeftFrames() {
    return Math.max(0, NIGHT_DURATION_FRAMES + addedTimeFrames - elapsedFrames());
  }

  function addTimeFrames(frames) {
    const safeFrames = Math.max(0, Math.round(frames ?? 0));
    if (safeFrames > 0) addedTimeFrames += safeFrames;
  }

  function updateFlow() {
    if (run.flowRushFrames > 0) {
      run.flowRushFrames--;
    } else if (run.flow > 0) {
      run.flow = clampValue(run.flow - FLOW_DECAY_PER_FRAME, 0, FLOW_MAX);
    }
    if (run.flowMessageFrames > 0) run.flowMessageFrames--;
  }

  function addFlow(amount, label, color = "#7dd3fc") {
    const safeAmount = Math.max(0, Math.round(amount ?? 0));
    if (safeAmount <= 0) return;

    run.flowEvents++;
    run.flowMessageColor = color;

    if (run.flowRushFrames > 0) {
      run.flowRushFrames = Math.min(FLOW_RUSH_FRAMES, run.flowRushFrames + Math.round(safeAmount * 1.35));
      player.ink = Math.min(100 + (player.maxInkBonus ?? 0), player.ink + safeAmount * 0.05);
      run.flowMessage = label + " extends RUSH";
      run.flowMessageFrames = 70;
      return;
    }

    run.flow = clampValue((run.flow ?? 0) + safeAmount, 0, FLOW_MAX);
    run.flowMessage = label + " +" + safeAmount + " FLOW";
    run.flowMessageFrames = 85;

    if (run.flow >= FLOW_MAX) triggerInkRush(label, color);
  }

  function triggerInkRush(label, color) {
    run.flow = 0;
    run.flowRushFrames = FLOW_RUSH_FRAMES;
    run.flowRushCount++;
    run.flowMessage = "INK RUSH: " + label;
    run.flowMessageColor = color;
    run.flowMessageFrames = 150;
    player.ink = Math.min(100 + (player.maxInkBonus ?? 0), player.ink + (TUNING.flow?.rushInkGain ?? 18));
  }

  function getInkRushDamageMultiplier() {
    return run.flowRushFrames > 0 ? (TUNING.flow?.rushDamageMultiplier ?? 1.22) : 1;
  }

  function trackFlowRoom() {
    const room = getPlayerRoom();
    if (!room) return;
    const key = roomKey(room);
    if (key === currentFlowRoomId) return;
    currentFlowRoomId = key;
    if (flowVisitedRooms.has(key)) return;
    flowVisitedRooms.add(key);
    if (room.type === "entrance" || room.type === "exit" || room.type === "boss") return;

    const risky = room.type === "danger" || room.type === "rift" || room.type === "combat";
    addFlow(
      risky ? (TUNING.flow?.dangerRoom ?? 18) : (TUNING.flow?.exploreRoom ?? 12),
      "new " + formatFlowRoom(room.type),
      risky ? "#b23b48" : "#7dd3fc"
    );
  }

  function getPlayerRoom() {
    const tx = player.x / TILE;
    const ty = player.y / TILE;
    return tileMap.getRooms().find((room) => pointInRoom(tx, ty, room)) ?? null;
  }

  function roomKey(room) {
    return room.id ?? (room.type + ":" + room.x + ":" + room.y);
  }

  function formatFlowRoom(type) {
    const labels = {
      combat: "fight room",
      resource: "supply pocket",
      event: "odd room",
      treasure: "cache room",
      shop: "lost shop",
      danger: "danger room",
      explore: "side cave",
      rift: "rift room",
    };
    return labels[type] ?? "room";
  }

  function spawnExplorationSites() {
    explorationSites = [];
    const maxSites = TUNING.exploration?.maxSites ?? 14;
    const chance = TUNING.exploration?.siteChance ?? 0.72;
    const rooms = tileMap.getRooms()
      .filter((room) => !["entrance", "exit", "boss"].includes(room.type))
      .sort((a, b) => (a.depthRank ?? 0) - (b.depthRank ?? 0) || a.y - b.y);

    for (const room of rooms) {
      if (explorationSites.length >= maxSites) break;
      if (Math.random() > chance && room.type !== "explore" && room.type !== "event") continue;
      const profile = pickExplorationProfile(room);
      if (!profile) continue;
      const rare = profile.reward === "rare" || Math.random() < 0.12 + Math.min(0.14, (room.depthRank ?? 0) * 0.035);
      explorationSites.push({
        id: "site-" + explorationSites.length + "-" + roomKey(room),
        roomId: roomKey(room),
        x: (room.x + room.w * (0.34 + Math.random() * 0.32)) * TILE,
        y: (room.y + room.h * (0.52 + Math.random() * 0.22)) * TILE,
        name: rare ? "Rare " + profile.name : profile.name,
        color: rare ? "#f2b84b" : profile.color,
        reward: rare ? "rare" : profile.reward,
        rare,
        collected: false,
      });
    }
  }

  function pickExplorationProfile(room) {
    const pool = EXPLORATION_SITE_PROFILES.filter((profile) => profile.roomTypes.includes(room.type));
    const list = pool.length > 0 ? pool : EXPLORATION_SITE_PROFILES;
    return list[Math.floor(Math.random() * list.length)] ?? null;
  }

  function inspectNearestExplorationSite() {
    const site = findNearestExplorationSite();
    if (!site) return false;
    site.collected = true;
    run.explorationFinds++;
    run.latestDiscoveryName = site.name;

    const materialGain = TUNING.exploration?.materialGain ?? 2;
    const inkGain = TUNING.exploration?.inkGain ?? 8;
    const hpGain = TUNING.exploration?.hpGain ?? 3;
    if (site.reward === "material" || site.reward === "rare") run.materialsCollected += site.rare ? materialGain + 2 : materialGain;
    if (site.reward === "ink" || site.reward === "flow") player.ink = Math.min(100 + (player.maxInkBonus ?? 0), player.ink + inkGain);
    if (site.reward === "body" || site.reward === "rare") player.hp = Math.min(100, player.hp + hpGain);
    if (site.rare) run.itemsCollected++;
    discoveryEchoes.push({ x: site.x, y: site.y, color: site.color, name: site.name, age: 0, life: DISCOVERY_ECHO_LIFE });

    addFlow(site.rare ? (TUNING.exploration?.rareFlowGain ?? 42) : (TUNING.exploration?.flowGain ?? 26), "discovered " + site.name, site.color);
    showMessage("discovered " + site.name, site.color, 150);
    return true;
  }

  function findNearestExplorationSite() {
    const radius = TUNING.exploration?.inspectRadiusPixels ?? 48;
    let best = null;
    let bestDist = radius;
    for (const site of explorationSites) {
      if (site.collected) continue;
      const dist = Math.hypot(player.x - site.x, player.y - site.y);
      if (dist < bestDist) {
        best = site;
        bestDist = dist;
      }
    }
    return best;
  }

  function drawExplorationSites(ctx, cameraX, cameraY) {
    const nearest = findNearestExplorationSite();
    for (const site of explorationSites) {
      if (site.collected) continue;
      const x = Math.floor(site.x - cameraX);
      const y = Math.floor(site.y - cameraY);
      if (x < -24 || y < -24 || x > W + 24 || y > H + 24) continue;
      const active = site === nearest;
      const pulse = 0.65 + Math.sin(getFrame() * 0.07 + site.x * 0.01) * 0.25;
      ctx.save();
      drawDiscoverySiteAura(ctx, site, x, y, pulse, active);
      drawDiscoverySiteSprite(ctx, site, x, y, pulse, active);
      drawDiscoverySparkles(ctx, site, x, y, active);
      ctx.restore();
      if (active) drawDiscoveryInspectPanel(ctx, site, x, y);
    }
  }

  function drawDiscoverySiteAura(ctx, site, x, y, pulse, active) {
    ctx.globalAlpha = active ? 0.35 : 0.12 + pulse * 0.08;
    ctx.fillStyle = site.color;
    ctx.fillRect(x - 18, y - 2, 5, 2);
    ctx.fillRect(x + 13, y - 2, 5, 2);
    ctx.fillRect(x - 2, y - 18, 2, 5);
    ctx.fillRect(x - 2, y + 13, 2, 5);
    ctx.globalAlpha = active ? 0.22 : 0.12;
    ctx.fillRect(x - 12, y - 9, 24, 2);
    ctx.fillRect(x - 12, y + 7, 24, 2);
    ctx.fillRect(x - 9, y - 12, 2, 24);
    ctx.fillRect(x + 7, y - 12, 2, 24);
    ctx.globalAlpha = 1;
  }

  function drawDiscoverySiteSprite(ctx, site, x, y, pulse, active) {
    const bob = Math.round(Math.sin(getFrame() * 0.08 + site.y * 0.02) * 1.5);
    const sy = y + bob;
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 9, sy + 9, 18, 3);
    ctx.globalAlpha = active ? 1 : 0.78 + pulse * 0.18;

    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 9, sy - 9, 18, 18);
    ctx.fillStyle = "#151b24";
    ctx.fillRect(x - 7, sy - 7, 14, 14);
    ctx.fillStyle = "#25303a";
    ctx.fillRect(x - 5, sy - 5, 10, 10);
    ctx.fillStyle = site.color;
    ctx.fillRect(x - 6, sy - 5, 12, 3);
    ctx.fillRect(x - 5, sy - 2, 10, 7);
    drawDiscoveryRewardGlyph(ctx, site, x, sy);

    if (active) {
      ctx.strokeStyle = "#f7f0df";
      ctx.strokeRect(x - 11, sy - 11, 22, 22);
    }
    if (site.rare) {
      ctx.strokeStyle = "#f2b84b";
      ctx.strokeRect(x - 13, sy - 13, 26, 26);
      ctx.fillStyle = "#f2b84b";
      ctx.fillRect(x - 15, sy - 15, 5, 2);
      ctx.fillRect(x + 10, sy - 15, 5, 2);
      ctx.fillRect(x - 15, sy + 13, 5, 2);
      ctx.fillRect(x + 10, sy + 13, 5, 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawDiscoveryRewardGlyph(ctx, site, x, y) {
    ctx.fillStyle = "#f7f0df";
    if (site.reward === "ink" || site.reward === "flow") {
      ctx.fillRect(x - 1, y - 4, 3, 3);
      ctx.fillRect(x - 2, y - 1, 5, 5);
      ctx.fillRect(x - 1, y + 4, 3, 2);
      return;
    }
    if (site.reward === "material") {
      ctx.fillRect(x - 4, y - 4, 8, 2);
      ctx.fillRect(x - 4, y, 8, 2);
      ctx.fillRect(x - 3, y + 4, 6, 1);
      return;
    }
    if (site.reward === "body") {
      ctx.fillRect(x - 1, y - 5, 3, 11);
      ctx.fillRect(x - 5, y - 1, 11, 3);
      return;
    }
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 5, y - 5, 4, 12);
    ctx.fillStyle = "#b23b48";
    ctx.fillRect(x - 2, y - 6, 4, 12);
    ctx.fillStyle = "#f7f0df";
    ctx.fillRect(x + 2, y - 2, 3, 3);
  }

  function drawDiscoverySparkles(ctx, site, x, y, active) {
    const count = site.rare ? 6 : 3;
    for (let i = 0; i < count; i++) {
      const phase = getFrame() * 0.07 + i * 2.1 + site.x * 0.013;
      const reach = (site.rare ? 18 : 14) + (i % 2) * 4;
      const sx = x + Math.round(Math.cos(phase) * reach);
      const sy = y + Math.round(Math.sin(phase * 0.83) * reach * 0.55);
      ctx.globalAlpha = active ? 0.82 : clampValue(0.28 + Math.sin(phase) * 0.18, 0.14, 0.52);
      ctx.fillStyle = i % 3 === 0 ? "#f7f0df" : site.color;
      ctx.fillRect(sx, sy, i % 2 === 0 ? 3 : 2, i % 2 === 0 ? 1 : 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawDiscoveryInspectPanel(ctx, site, x, y) {
    const panelW = 132;
    const panelH = 38;
    const px = Math.floor(clampValue(x - panelW / 2, 10, W - panelW - 10));
    const py = Math.floor(clampValue(y - 52, 14, H - panelH - 14));
    drawPixelPanel(ctx, px, py, panelW, panelH, {
      fill: "#111823",
      border: "#05070b",
      accent: site.color,
      shine: "rgba(247,240,223,0.14)",
      grid: "rgba(125,211,252,0.035)",
    });
    pixelText(ctx, "E inspect", px + 10, py + 17, 11, "#f7f0df", "#05070b");
    label(ctx, site.name, px + 10, py + 30, 10, "#d8cfb8");
    ctx.fillStyle = site.color;
    ctx.fillRect(Math.floor(clampValue(x, px + 14, px + panelW - 16)), py + panelH - 2, 10, 4);
  }

  function updateDiscoveryEchoes() {
    for (let i = discoveryEchoes.length - 1; i >= 0; i--) {
      discoveryEchoes[i].age++;
      if (discoveryEchoes[i].age >= discoveryEchoes[i].life) discoveryEchoes.splice(i, 1);
    }
  }

  function drawDiscoveryEchoes(ctx, cameraX, cameraY) {
    for (const echo of discoveryEchoes) {
      const t = echo.age / Math.max(1, echo.life);
      const x = Math.floor(echo.x - cameraX);
      const y = Math.floor(echo.y - cameraY);
      if (x < -64 || y < -64 || x > W + 64 || y > H + 64) continue;
      const reach = Math.floor(12 + t * 30);
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.72;
      ctx.strokeStyle = echo.color;
      ctx.strokeRect(x - reach, y - Math.floor(reach * 0.58), reach * 2, Math.floor(reach * 1.16));
      ctx.globalAlpha = (1 - t) * 0.44;
      ctx.fillStyle = echo.color;
      for (let i = 0; i < 8; i++) {
        const phase = i * Math.PI * 0.25;
        const px = x + Math.round(Math.cos(phase) * reach);
        const py = y + Math.round(Math.sin(phase) * reach * 0.58);
        ctx.fillRect(px, py, i % 2 === 0 ? 4 : 2, i % 2 === 0 ? 2 : 4);
      }
      ctx.globalAlpha = (1 - t) * 0.88;
      pixelText(ctx, echo.name, Math.floor(clampValue(x - 46, 8, W - 126)), y - 20 - Math.floor(t * 14), 10, "#f7f0df", "#05070b");
      ctx.restore();
    }
  }

  function maybeGateReturnTeleport(nearGate, consequence, outcome) {
    const chance = gateReturnDriftChance(consequence, outcome);
    if (Math.random() > chance) return false;

    const room = pickGateReturnRoom(consequence, outcome);
    if (!room) return false;

    const padding = TUNING.portalReturn.arrivalPaddingPixels ?? 28;
    const minX = (room.x * TILE) + padding;
    const maxX = ((room.x + room.w) * TILE) - padding;
    const minY = (room.y * TILE) + padding;
    const maxY = ((room.y + room.h) * TILE) - padding;
    player.x = clampValue((room.x + room.w / 2) * TILE, minX, maxX);
    player.y = clampValue((room.y + room.h / 2) * TILE, minY, maxY);
    player.vx = 0;
    player.vy = 0;
    run.gateReturnDrifts++;
    run.latestGateReturnRoom = room.type;
    updateCamera();
    showMessage("画布门把你送到了" + formatGateReturnRoom(room.type), consequence?.color ?? "#7dd3fc", 150);
    return true;
  }

  function gateReturnDriftChance(consequence, outcome) {
    const tuning = TUNING.portalReturn;
    const choices = outcome?.choices ?? {};
    const riskGap = Math.max(0, (outcome?.riskScore ?? 0) - (outcome?.careScore ?? 0));
    let chance = tuning.baseChance ?? 0.2;
    chance += riskGap * (tuning.riskGapScale ?? 0);
    chance += (choices.riskyChoices ?? 0) * (tuning.riskyChoiceBonus ?? 0);
    chance += (choices.forceActions ?? 0) * (tuning.forceActionBonus ?? 0);
    chance += (choices.templateMistakes ?? 0) * (tuning.templateMistakeBonus ?? 0);

    const pressure = consequence?.pressure ?? run.canvasPressure ?? 0;
    if (pressure >= 60) chance += tuning.pressureBonus ?? 0;
    if (pressure <= 20) chance += tuning.stablePressureBonus ?? 0;
    if (outcome?.gateType === "ai_template") chance += tuning.aiTemplateBonus ?? 0;
    if (outcome?.gateType === "horror_sketch") chance += tuning.horrorSketchBonus ?? 0;
    return clampValue(chance, tuning.minChance ?? 0, tuning.maxChance ?? 1);
  }

  function pickGateReturnRoom(consequence, outcome) {
    const rooms = tileMap.getRooms().filter((room) => (
      room.type !== "entrance" &&
      room.type !== "exit" &&
      room.type !== "boss"
    ));
    if (rooms.length === 0) return null;

    const risky = (outcome?.riskScore ?? 0) > (outcome?.careScore ?? 0) || consequence?.pressureDelta > 0;
    const preferredTypes = risky
      ? ["danger", "combat", "rift"]
      : ["resource", "treasure", "explore", "shop", "event"];
    const preferredRooms = rooms.filter((room) => preferredTypes.includes(room.type));
    const pool = preferredRooms.length > 0 ? preferredRooms : rooms;
    return pool[Math.floor(Math.random() * pool.length)] ?? rooms[0];
  }

  function formatGateReturnRoom(type) {
    const labels = {
      combat: "战斗房",
      resource: "资源房",
      event: "事件房",
      treasure: "奖励房",
      shop: "补给房",
      danger: "危险房",
      explore: "探索房",
      rift: "裂隙房",
    };
    return labels[type] ?? "陌生房间";
  }

  function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function finish(reason = "manual") {
    if (finished) return;
    finished = true;
    run.finishReason = reason;
    onFinish({
      ...run,
      artworkCompletion: artworkCompletion.state.total,
      artworkDiscoveries: artworkCompletion.state.totalDiscoveries,
      durationFrames: elapsedFrames(),
      timeLimitFrames: NIGHT_DURATION_FRAMES + addedTimeFrames,
      timeLeftFrames: timeLeftFrames(),
      explorationSitesTotal: explorationSites.length,
    });
  }

  function update() {
    if (finished || awaitingTimeChoice) return;
    if (subMapScene) { subMapScene.update(keys); return; }
    if (riftWorld) {
      const result = riftWorld.update(keys);
      // Check for nested rift request
      return;
    }
    if (mapSystem.isFullMapOpen()) { if (mouse.justLeft) mapSystem.closeFullMap(); return; }
    if (storyNpcManager.isDialogueOpen()) {
      storyNpcManager.update();
      updateCamera();
      return;
    }
    if (rewardOverlay.isVisible()) {
      if (mouse.justLeft) {
        rewardOverlay.handleClick(mouse.x, mouse.y);
        mouse.justLeft = false;
      }
      updateCamera();
      return;
    }
    playerController.update();
    trackPlayerDepth();
    trackFlowRoom();
    updateFlow();
    updateDiscoveryEchoes();
    resolveAttackHits();
    triggerRoomRewardIfReady();
    combatSystem.update();
    updateHitEffects();
    updateHitHighlights();
    if (player.attack.hitstopTimer > 0) {
      updateCamera();
      return;
    }
    npcManager.update();
    storyNpcManager.update();
    triggerRoomRewardIfReady();
    lootManager.update();
    portalManager.update();
    mapSystem.update();
    ecologyManager.update();
    updateGates(canvasGates);
    updateRifts(canvasRifts);
    updateCamera();
    if (timeLeftFrames() <= 0) {
      if (run.allNighter) finish("deadline");
      else awaitingTimeChoice = true;
    }
    else if (player.hp <= 0) finish("body");
    else if (player.ink <= 0) finish("ink");
    else if (npcManager.allDead() && !portalManager.isOpen()) finish("clear");
  }

  function handleKey(key) {
    if (key === "m") { mapSystem.toggleFullMap(); return; }
    if (subMapScene) { subMapScene.handleKey(key); return; }
    if (riftWorld) {
      const result = riftWorld.handleKey(key);
      if (result === true) {
        // Exit rift ? return to random position in main map
        exitRiftWorld();
        return;
      }
      if (result?.nestRift) {
        // Enter nested rift
        enterNestedRift();
        return;
      }
      return;
    }
    if (storyNpcManager.handleKey(key)) return;
    if (ecologyManager.handleKey(key)) return;
    // Canvas gate entry
    if (key === "e") {
      // Check rifts first
      const nearRift = findNearestRift(canvasRifts, player.x, player.y, 50);
      if (nearRift && !nearRift.completed) {
        enterRiftWorld(nearRift);
        return;
      }
      const nearGate = findNearestGate(canvasGates, player.x, player.y, 50);
      if (nearGate && !nearGate.completed) {
        subMapType = nearGate.type;
        subMapScene = createSubMapScene(subMapType, (discoveries, type, outcome) => {
          // ???????
          for (const d of discoveries) {
            const result = artworkCompletion.addDiscovery(d, d.isJackpot || false);
            if (result.newMilestones.length > 0) {
              console.log("[Milestone]", result.newMilestones.map(m => m.message));
            }
          }
          nearGate.completed = true;
          subMapScene = null;
          subMapType = null;
          run.itemsCollected += discoveries.length;
          const consequence = applyGateConsequence({
            outcome,
            gateType: type,
            nearGate,
            player,
            weapon,
            run,
            npcManager,
            addTimeFrames,
          });
          showMessage("画布门结算：" + (consequence?.name ?? "新的回流"), consequence?.color ?? "#7dd3fc", 180);
          addFlow(TUNING.flow?.gateReturn ?? 42, "canvas gate", consequence?.color ?? "#7dd3fc");
          maybeGateReturnTeleport(nearGate, consequence, outcome);
        });
        subMapScene.start();
        return;
      }
      if (inspectNearestExplorationSite()) return;
    }
    if (rewardOverlay.isVisible()) return;
    if (awaitingTimeChoice) {
      if (key === "enter") finish("deadline");
      if (key === "o" && run.overtimeCount === 0) chooseOvertime();
      if (key === "n") chooseAllNighter();
      return;
    }
    if (key === "1") toolMode = 1;
    if (key === "2") toolMode = 2;
    if (key === "e") {
      if (!portalManager.tryEnter()) {
        const opened = lootManager.openNearestChest();
        if (opened) addFlow(TUNING.flow?.chest ?? 28, "cache opened", "#c9a846");
      }
    }
    if (key === "f") {
      // Retreat: return to surface with collected items
      finish("retreat");
      return;
    }
  }

  function chooseOvertime() {
    awaitingTimeChoice = false;
    addedTimeFrames += OVERTIME_EXTENSION_FRAMES;
    run.overtimeCount++;
    player.hp = Math.max(1, player.hp - OVERTIME_BODY_COST);
    player.ink = Math.min(100, player.ink + 18);
  }

  function chooseAllNighter() {
    awaitingTimeChoice = false;
    addedTimeFrames += ALL_NIGHT_EXTENSION_FRAMES;
    run.overtimeCount++;
    run.allNighter = true;
    player.hp = Math.max(1, player.hp - ALL_NIGHT_BODY_COST);
    player.ink = Math.min(100, player.ink + 35);
  }

  function formatTime(frames) {
    const seconds = Math.ceil(frames / 60);
    const minutes = Math.floor(seconds / 60);
    const rest = String(seconds % 60).padStart(2, "0");
    return `${minutes}:${rest}`;
  }

  function drawHud() {
    const layerNames = { shallow: "SHALLOW DRAFT", middle: "MIDDLE SCRAPS", deep: "DEEP TEMPLATE" };
    const layerColors = { shallow: "#f0d9a5", middle: "#b58b42", deep: "#7dd3fc" };
    const layer = run.currentLayer || "shallow";
    const accent = layerColors[layer] || "#f0d9a5";
    const collected = run.itemsCollected + run.materialsCollected + run.kills;
    const weaponName = weapon.archetype?.displayName ?? "Sword";
    const attackPattern = weapon.archetype?.attackPattern ?? "arcSlash";
    const damage = weapon.finalStats?.damage ?? BASIC_SLASH.damage;
    const range = weapon.finalStats?.range ?? BASIC_SLASH.range;
    const totalFrames = NIGHT_DURATION_FRAMES + addedTimeFrames;

    drawPixelPanel(ctx, 14, 14, 220, 50, { fill: "rgba(12,18,28,0.88)", accent });
    pixelText(ctx, layerNames[layer] || layer.toUpperCase(), 28, 38, 14, accent);
    pixelText(ctx, `loot ${collected}   F return`, 28, 56, 12, "#f7f0df");

    const rushActive = run.flowRushFrames > 0;
    const flowValue = rushActive ? run.flowRushFrames / FLOW_RUSH_FRAMES : run.flow / FLOW_MAX;
    const flowColor = rushActive ? "#f2b84b" : "#7dd3fc";
    drawPixelPanel(ctx, 14, 72, 220, 50, { fill: "rgba(8,11,18,0.84)", accent: flowColor });
    pixelText(ctx, rushActive ? "INK RUSH " + Math.ceil(run.flowRushFrames / 60) + "s" : "FLOW", 28, 94, 13, flowColor);
    drawMeter(28, 106, 178, 8, flowValue, flowColor, "#172033");
    pixelText(ctx, rushActive ? "move+ atk+ ink+" : "chain explore / fight", 28, 120, 11, "#f7f0df");

    if (run.flowMessageFrames > 0 && run.flowMessage) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, run.flowMessageFrames / 20);
      drawPixelPanel(ctx, W / 2 - 172, 24, 344, 42, { fill: "rgba(8,11,18,0.90)", accent: run.flowMessageColor ?? "#7dd3fc" });
      pixelText(ctx, run.flowMessage, W / 2 - 148, 51, 15, run.flowMessageColor ?? "#7dd3fc");
      ctx.restore();
    }

    drawPixelPanel(ctx, 16, H - 126, 390, 102, { fill: "rgba(12,18,28,0.88)", accent: "#f0d9a5" });
    pixelText(ctx, `NIGHT ${formatTime(timeLeftFrames())}/${formatTime(totalFrames)}`, 30, H - 98, 14, "#f0d9a5");
    pixelText(ctx, `${weaponName}  ${attackPattern}`, 30, H - 78, 13, "#f7f0df");
    pixelText(ctx, `dmg ${damage}  range ${range}`, 258, H - 78, 13, "#7dd3fc");
    drawMeter(30, H - 60, 214, 10, player.ink / 100, "#7dd3fc", "#172033");
    drawMeter(30, H - 38, 214, 10, player.hp / 100, "#b23b48", "#2a1118");
    pixelText(ctx, `ink ${Math.floor(player.ink)}%`, 256, H - 51, 12, "#f7f0df");
    pixelText(ctx, `body ${Math.floor(player.hp)}%`, 256, H - 29, 12, "#f7f0df");

    drawPixelPanel(ctx, W - 318, 18, 288, 174, { fill: "rgba(8,11,18,0.82)", accent: "#7dd3fc" });
    pixelText(ctx, "A/D move   Space jump   Shift dash", W - 300, 46, 12, "#f7f0df");
    pixelText(ctx, "Left attack/mine   E chest/portal", W - 300, 68, 12, "#f7f0df");
    pixelText(ctx, "1 weapon   2 scraper   M map", W - 300, 90, 12, "#f7f0df");
    if (run.dayCarryover) {
      pixelText(ctx, "day residue  " + run.dayCarryover.label, W - 300, 112, 11, run.dayCarryover.color ?? "#f0d9a5");
      pixelText(ctx, `scope ${run.dayCarryover.scope ?? 0} morale ${run.dayCarryover.morale ?? 0} deadline ${run.dayCarryover.deadline ?? 0}`, W - 300, 130, 9, "#d8cfb8");
      pixelText(ctx, `stress ${run.dayCarryover.stress}  fatigue ${run.dayCarryover.fatigue}  spark ${run.dayCarryover.inspiration}`, W - 300, 146, 9, "#d8cfb8");
    }
    pixelText(ctx, `kills ${run.kills}   chest ${run.chestsOpened}   finds ${run.explorationFinds}/${explorationSites.length}`, W - 300, 166, 11, "#f0d9a5");
    lootManager.drawInventory(ctx, W - 290, 190);
  }

  function drawMeter(x, y, w, h, value, fill, empty) {
    const clamped = Math.max(0, Math.min(1, value));
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = empty;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, Math.floor(w * clamped), h);
    ctx.fillStyle = "rgba(255,255,255,0.20)";
    ctx.fillRect(x + 2, y + 2, Math.max(0, Math.floor(w * clamped) - 4), 2);
  }

  function drawTimeChoice() {
    if (!awaitingTimeChoice) return;
    ctx.fillStyle = "rgba(8, 7, 10, 0.82)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f1ead9";
    ctx.fillRect(220, 140, 520, 236);
    ctx.strokeStyle = "#1d1c1a";
    ctx.lineWidth = 2;
    ctx.strokeRect(220, 140, 520, 236);
    label(ctx, "Dawn is pushing through the paper.", 252, 184, 24);
    label(ctx, "Enter  submit this draft", 252, 232, 18);
    label(
      ctx,
      run.overtimeCount === 0
        ? `O      overtime +${Math.floor(OVERTIME_EXTENSION_FRAMES / 60)}s, body -${OVERTIME_BODY_COST}`
        : "O      overtime already used tonight",
      252,
      268,
      18,
      run.overtimeCount === 0 ? "#24211f" : "#8b8173"
    );
    label(ctx, `N      all-nighter +${Math.floor(ALL_NIGHT_EXTENSION_FRAMES / 60)}s, body -${ALL_NIGHT_BODY_COST}`, 252, 304, 18);
    label(ctx, "The extra time will show up in tomorrow's feedback.", 252, 346, 15, "#5c554c");
  }

  
  
  function enterRiftWorld(rift) {
    rift.entered = true;
    activeRift = rift;
    riftNestDepth = rift.nestDepth || 0;
    riftWorld = createRiftWorld(rift.type, (reward) => {
      // Rift completed ? return to main map
      run.itemsCollected += reward.itemsCollected || 0;
      if (reward.jackpot) {
        run.discoveries = (run.discoveries || 0) + 1;
        showMessage("???" + reward.jackpot.name, "#c9a846", 200);
      }
      addFlow(TUNING.flow?.riftReturn ?? 34, "rift return", reward.jackpot ? "#c9a846" : "#7dd3fc");
      exitRiftWorld();
    }, riftNestDepth);
    riftWorld.start();
  }

  function enterNestedRift() {
    const parentRift = activeRift;
    riftNestDepth++;
    const nestedType = rollRiftType(parentRift.layerId || "deep");
    riftWorld = createRiftWorld(nestedType, (reward) => {
      run.itemsCollected += reward.itemsCollected || 0;
      addFlow(TUNING.flow?.riftReturn ?? 34, "nested rift", "#c9a846");
      exitRiftWorld();
    }, riftNestDepth);
    riftWorld.start();
    showMessage(`???${riftNestDepth + 1}???...`, "#c9a846", 150);
  }

  function exitRiftWorld() {
    if (activeRift && !activeRift.completed) {
      activeRift.completed = true;
    }
    riftWorld = null;
    activeRift = null;
    // Return to a random position in the main map (not the entrance)
    const rooms = tileMap.getRooms();
    const validRooms = rooms.filter(r => r.type !== "entrance" && r.type !== "exit" && r.type !== "boss");
    if (validRooms.length > 0) {
      const room = validRooms[Math.floor(Math.random() * validRooms.length)];
      player.x = (room.x + room.w / 2) * TILE;
      player.y = (room.y + room.h / 2) * TILE;
    }
    riftNestDepth = 0;
  }

  function showMessage(text, color, duration) {
    // Use ecologyManager's method or just set feedback vars
    // For now, we already have messageText in scope... 
    // Actually inkwell.js draws HUD text, so just use console
    console.log("[Inkwell]", text);
  }

  function trackPlayerDepth() {
    const py = player.y / TILE;
    let layerId = "shallow";
    for (const layer of MAP_LAYERS) {
      if (py >= layer.yRange[0] && py <= layer.yRange[1]) { layerId = layer.id; break; }
    }
    if (py > MAP_LAYERS[MAP_LAYERS.length - 1].yRange[1]) layerId = "deep";
    run.currentLayer = layerId;
    if (MAP_LAYERS.findIndex(l => l.id === layerId) > MAP_LAYERS.findIndex(l => l.id === run.deepestLayer)) {
      run.deepestLayer = layerId;
    }
  }

  function draw() {
    if (subMapScene) { subMapScene.draw(ctx); return; }
    if (riftWorld) { riftWorld.draw(ctx); return; }
    const shake = playerController.attackController.getShakeOffset();
    const drawCamera = { x: camera.x - shake.x, y: camera.y - shake.y };
    drawInkwellBackground(ctx, drawCamera, run.dayCarryover);
    tileMap.draw(drawCamera.x, drawCamera.y);
    ecologyManager.draw(ctx, drawCamera.x, drawCamera.y);
    drawGates(ctx, canvasGates, drawCamera.x, drawCamera.y);
    drawRifts(ctx, canvasRifts, drawCamera.x, drawCamera.y);
    drawDiscoveryEchoes(ctx, drawCamera.x, drawCamera.y);
    drawExplorationSites(ctx, drawCamera.x, drawCamera.y);
    lootManager.draw(ctx, drawCamera.x, drawCamera.y);
    storyNpcManager.draw(ctx, drawCamera.x, drawCamera.y);
    npcManager.draw(ctx, drawCamera.x, drawCamera.y);
    drawHitNpcColliders(drawCamera.x, drawCamera.y);
    drawHitEffects(drawCamera.x, drawCamera.y);
    portalManager.draw(ctx, drawCamera.x, drawCamera.y);
    drawInkwellLighting(ctx, { camera: drawCamera, player, tileMap, npcs: npcManager.npcs });
    combatSystem.draw(ctx, drawCamera.x, drawCamera.y);
    playerController.draw(ctx, drawCamera.x, drawCamera.y);
    drawForegroundPixels(ctx, drawCamera, run.currentLayer || "shallow");
    drawAttackDebug(drawCamera.x, drawCamera.y);
    drawAttackStateDebug();
    drawHud();
    mapSystem.drawMinimap(ctx);
    drawTimeChoice();
    rewardOverlay.render(ctx);
    mapSystem.drawFullMap(ctx, tileMap.getRooms());
    drawPixelPostProcess(ctx, getFrame(), run.currentLayer || "shallow");
    storyNpcManager.drawDialogue(ctx);
  }

  function triggerRoomRewardIfReady() {
    const room = getCurrentRewardRoom();
    if (!room) return;
    if (room.hasRewardTriggered || room.rewardClaimed) return;
    if (!npcManager.roomEnemiesCleared(room.id)) return;

    room.hasRewardTriggered = true;
    addFlow(TUNING.flow?.roomClear ?? 24, "room cleared", "#f2b84b");
    const buildState = weapon.buildState;
    const weaponType = getWeaponTypeFromProfile(weapon);

    // Grant weapon XP for the cleared room.
    buildState.addWeaponXp(1);
    console.log("[RoomRewardTriggered]", {
      roomId: room.id,
      weaponType,
      weaponXp: buildState.weaponXp,
      weaponLevel: buildState.weaponLevel,
    });

    // Check for weapon level-up first; evolutions take priority over relics.
    if (buildState.canLevelUpWeapon()) {
      buildState.levelUpWeapon();
      const evoChoices = generateEvolutionChoices(buildState, weaponType, 3);
      console.log("[EvolutionChoices]", {
        weaponLevel: buildState.weaponLevel,
        weaponType,
        choices: evoChoices.map((c) => c.id),
    });

      if (evoChoices.length === 0) {
        room.rewardClaimed = true;
        return;
      }

      rewardOverlay.showEvolutionChoices(evoChoices, (evo) => {
        buildState.addWeaponEvolution(evo);
        room.rewardClaimed = true;
        rewardOverlay.hide();
        console.log("[EvolutionPicked]", {
          evolutionId: evo.id,
          evolutionName: evo.name,
          weaponLevel: buildState.weaponLevel,
          currentEvolutions: Object.keys(buildState.weaponEvolutions).filter((k) => buildState.weaponEvolutions[k]),
      });
    });
      return;
    }

    // No level-up: show normal relic reward.
    const choices = generateRelicChoices(buildState, weaponType, 3);
    console.log("[RoomRewardTriggered]", {
      roomId: room.id,
      weaponType,
      choices: choices.map((choice) => choice.id),
    });

    if (choices.length === 0) {
      room.rewardClaimed = true;
      return;
    }

    rewardOverlay.showRelicChoices(choices, (relic) => {
      buildState.addRelic(relic);
      room.rewardClaimed = true;
      rewardOverlay.hide();
      console.log("[RelicPicked]", {
        relicId: relic.id,
        relicName: relic.name,
        currentRelics: [...buildState.relics],
    });
    });
  }

  function getCurrentRewardRoom() {
    const tx = player.x / TILE;
    const ty = player.y / TILE;
    return tileMap.getRooms().find((room) => isRewardRoom(room) && pointInRoom(tx, ty, room)) ?? null;
  }

  function isRewardRoom(room) {
    return room.type === "combat" || room.type === "resource" || room.type === "rift";
  }

  function pointInRoom(tx, ty, room) {
    return tx >= room.x - 1 && tx <= room.x + room.w + 1 && ty >= room.y - 2 && ty <= room.y + room.h + 2;
  }

  function drawHitNpcColliders(cameraX, cameraY) {
    for (const hl of hitNpcHighlights) {
      const npc = hl.npc;
      if (!npc || npc.hp <= 0) continue;
      const t = hl.age / hl.life;
      const alpha = 1 - t;
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 2;
      const nx = npc.x - npc.w / 2 - cameraX;
      const ny = npc.y - npc.h / 2 - cameraY;
      ctx.strokeRect(nx, ny, npc.w, npc.h);
      // Collider radius circle
      ctx.globalAlpha = alpha * 0.35;
      ctx.strokeStyle = "#ff8844";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(npc.x - cameraX, npc.y - cameraY, getNpcHitRadius(npc), 0, Math.PI * 2);
      ctx.stroke();
      // Label
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = "#ff4444";
      ctx.font = "9px Consolas, monospace";
      ctx.fillText("HIT r=" + Math.round(getNpcHitRadius(npc)), nx, ny - 4);
      ctx.restore();
    }
  }

  function drawHitEffects(cameraX, cameraY) {
    for (const effect of hitEffects) {
      const t = effect.age / effect.life;
      const x = Math.floor(effect.x - cameraX);
      const y = Math.floor(effect.y - cameraY);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = "#f7f0df";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 9 - t * 5, y);
      ctx.lineTo(x + 9 + t * 5, y);
      ctx.moveTo(x, y - 7 - t * 4);
      ctx.lineTo(x, y + 7 + t * 4);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawAttackDebug(cameraX, cameraY) {
    if (!player.attack.isAttacking) return;
    const shouldDrawHitbox = isAttackHitboxDebugEnabled();
    const shouldDrawAngle = DEBUG_ATTACK_ANGLE;
    if (!shouldDrawHitbox && !shouldDrawAngle) return;

    const hitbox = playerController.attackController.getHitbox(player);
    if (shouldDrawHitbox) {
      ctx.save();
      ctx.globalAlpha = playerController.attackController.isActive() ? 0.34 : 0.14;
      ctx.fillStyle = "#e23b3b";
      drawAttackHitboxShape(hitbox, cameraX, cameraY);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#3b8cff";
      drawWeaponVisualBounds(hitbox, cameraX, cameraY);
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = "#f8f3e7";
      ctx.lineWidth = 1;
      drawAttackHitboxShape(hitbox, cameraX, cameraY, true);
      drawPlayerCenterDebug(hitbox, cameraX, cameraY);
      drawForwardDebug(hitbox, cameraX, cameraY);
      drawCompositeHitboxDebug(hitbox, cameraX, cameraY);
      drawSweptMeleeDebug(player, cameraX, cameraY);
      ctx.restore();
    }

    if (shouldDrawAngle) {
      ctx.save();
      const x = player.centerX - cameraX;
      const y = player.centerY - cameraY;
      ctx.strokeStyle = "#71d6ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + hitbox.dirX * hitbox.range, y + hitbox.dirY * hitbox.range);
      ctx.stroke();
      ctx.fillStyle = "#71d6ff";
      ctx.beginPath();
      ctx.arc(x + hitbox.dirX * hitbox.range, y + hitbox.dirY * hitbox.range, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw aim direction (green dotted line) from player to aim world position
    const ac2 = playerController.attackController;
    if (ac2.state.aimWorldX) {
      ctx.save();
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      const ax = player.centerX - cameraX;
      const ay = player.centerY - cameraY;
      const bx = ac2.state.aimWorldX - cameraX;
      const by = ac2.state.aimWorldY - cameraY;
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      // aim angle label
      ctx.fillStyle = "#00ff88";
      ctx.font = "10px Consolas, monospace";
      const labelX = ax + (bx - ax) * 0.55;
      const labelY = ay + (by - ay) * 0.55 - 6;
      ctx.fillText("aim " + (ac2.state.attackAngle).toFixed(2), labelX, labelY);
      ctx.restore();
    }
  }

  function getAttackHitboxColor(archetype) {
    if (archetype === "spear") return "#35d07f";
    if (archetype === "hammer") return "#d72e43";
    if (archetype === "shield") return "#f4d35e";
    return "#4ea1ff";
  }

      function isAttackHitboxDebugEnabled() {
    // window.DEBUG_ATTACK_HITBOX = true to toggle at runtime
    return Boolean(window.DEBUG_ATTACK_HITBOX ?? DEBUG_ATTACK_HITBOX);
  }

  function drawAttackHitboxShape(hitbox, cameraX, cameraY, strokeOnly = false) {
    if (hitbox.hitShape?.type === "arcSegments" || hitbox.hitShape?.type === "whipSegments") {
      drawSegmentedHitbox(hitbox, cameraX, cameraY, strokeOnly);
    } else if (hitbox.hitShape?.type === "arc") {
      drawArcHitbox(hitbox, cameraX, cameraY, strokeOnly);
    } else if (hitbox.hitShape?.type === "capsule") {
      drawCapsuleHitbox(hitbox, cameraX, cameraY, strokeOnly);
    } else if (hitbox.hitShape?.type === "ellipse") {
      drawEllipseHitbox(hitbox, cameraX, cameraY, strokeOnly);
    } else {
      drawRectHitbox(hitbox, cameraX, cameraY, strokeOnly);
    }
    if (hitbox.footHitbox) drawFootHitbox(hitbox.footHitbox, cameraX, cameraY, strokeOnly);
  }

  function drawSegmentedHitbox(hitbox, cameraX, cameraY, strokeOnly) {
    const segments = hitbox.hitShape?.segments ?? [];
    for (const segment of segments) {
      const angle = hitbox.angle + (segment.angleOffset ?? 0);
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const ax = hitbox.originX + dirX * (segment.startOffset ?? 0) - cameraX;
      const ay = hitbox.originY + dirY * (segment.startOffset ?? 0) + (hitbox.attackSpec?.verticalOffset ?? -2) - cameraY;
      const bx = hitbox.originX + dirX * (segment.endOffset ?? hitbox.range) - cameraX;
      const by = hitbox.originY + dirY * (segment.endOffset ?? hitbox.range) + (hitbox.attackSpec?.verticalOffset ?? -2) - cameraY;
      drawCapsuleLine(ax, ay, bx, by, segment.radius ?? hitbox.h / 2, strokeOnly);
    }
  }

  function drawRectHitbox(hitbox, cameraX, cameraY, strokeOnly) {
    ctx.save();
    ctx.translate(hitbox.centerX - cameraX, hitbox.centerY - cameraY);
    ctx.rotate(hitbox.angle);
    if (strokeOnly) ctx.strokeRect(-hitbox.w / 2, -hitbox.h / 2, hitbox.w, hitbox.h);
    else ctx.fillRect(-hitbox.w / 2, -hitbox.h / 2, hitbox.w, hitbox.h);
    ctx.restore();
  }

  function drawArcHitbox(hitbox, cameraX, cameraY, strokeOnly) {
    const arc = (hitbox.hitShape.arcDegrees ?? 90) * Math.PI / 180;
    const radius = hitbox.range;
    const closeRadius = hitbox.hitShape.closeRadius ?? 0;
    const x = hitbox.originX - cameraX;
    const y = hitbox.originY - cameraY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, hitbox.angle - arc / 2, hitbox.angle + arc / 2);
    ctx.closePath();
    if (strokeOnly) ctx.stroke();
    else ctx.fill();
    if (closeRadius > 0) {
      ctx.beginPath();
      ctx.arc(x, y - 2, closeRadius, 0, Math.PI * 2);
      if (strokeOnly) ctx.stroke();
      else ctx.fill();
    }
  }

  function drawCapsuleHitbox(hitbox, cameraX, cameraY, strokeOnly) {
    const shape = hitbox.hitShape;
    const startOffset = shape.startOffset ?? 0;
    const endOffset = shape.endOffset ?? hitbox.range;
    const radius = shape.radius ?? hitbox.h / 2;
    const ax = hitbox.originX + hitbox.dirX * startOffset - cameraX;
    const ay = hitbox.originY + hitbox.dirY * startOffset - 2 - cameraY;
    const bx = hitbox.originX + hitbox.dirX * endOffset - cameraX;
    const by = hitbox.originY + hitbox.dirY * endOffset - 2 - cameraY;
    drawCapsuleLine(ax, ay, bx, by, radius, strokeOnly);
  }

  function drawCapsuleLine(ax, ay, bx, by, radius, strokeOnly) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = radius * 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    if (strokeOnly) {
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ax, ay, radius, 0, Math.PI * 2);
      ctx.arc(bx, by, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = ctx.fillStyle;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEllipseHitbox(hitbox, cameraX, cameraY, strokeOnly) {
    ctx.save();
    ctx.translate(hitbox.centerX - cameraX, hitbox.centerY - cameraY);
    ctx.rotate(hitbox.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, hitbox.hitShape.radiusX ?? hitbox.w / 2, hitbox.hitShape.radiusY ?? hitbox.h / 2, 0, 0, Math.PI * 2);
    if (strokeOnly) ctx.stroke();
    else ctx.fill();
    ctx.restore();
  }

  function drawFootHitbox(footHitbox, cameraX, cameraY, strokeOnly) {
    if (strokeOnly) ctx.strokeRect(footHitbox.x - cameraX, footHitbox.y - cameraY, footHitbox.w, footHitbox.h);
    else ctx.fillRect(footHitbox.x - cameraX, footHitbox.y - cameraY, footHitbox.w, footHitbox.h);
  }

  function drawWeaponVisualBounds(hitbox, cameraX, cameraY) {
    const bounds = hitbox.visualBounds;
    if (!bounds) return;
    if (hitbox.attackPattern === "arcSlash" || hitbox.hitShape?.type === "arcSegments") {
      drawVisualArc(hitbox, bounds, cameraX, cameraY);
      return;
    }
    if (hitbox.hitShape?.type === "capsule" || hitbox.hitShape?.type === "whipSegments") {
      const ax = hitbox.originX + hitbox.dirX * 8 - cameraX;
      const ay = hitbox.originY + hitbox.dirY * 8 + (hitbox.attackSpec?.verticalOffset ?? -2) - cameraY;
      const bx = hitbox.originX + hitbox.dirX * bounds.range - cameraX;
      const by = hitbox.originY + hitbox.dirY * bounds.range + (hitbox.attackSpec?.verticalOffset ?? -2) - cameraY;
      drawCapsuleLine(ax, ay, bx, by, Math.max(5, bounds.height / 2), false);
      return;
    }
    if (hitbox.hitShape?.type === "ellipse") {
      ctx.save();
      ctx.translate(hitbox.centerX - cameraX, hitbox.centerY - cameraY);
      ctx.rotate(hitbox.angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(6, bounds.width / 2), Math.max(6, bounds.height / 2), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(hitbox.centerX - cameraX, hitbox.centerY - cameraY);
    ctx.rotate(hitbox.angle);
    ctx.fillRect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);
    ctx.restore();
  }

  function drawVisualArc(hitbox, bounds, cameraX, cameraY) {
    const arc = (bounds.arcAngle || 75) * Math.PI / 180;
    const x = hitbox.originX - cameraX;
    const y = hitbox.originY - cameraY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, bounds.arcRadius || bounds.range, hitbox.angle - arc / 2, hitbox.angle + arc / 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawPlayerCenterDebug(hitbox, cameraX, cameraY) {
    const x = hitbox.originX - cameraX;
    const y = hitbox.originY - cameraY;
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.stroke();
  }

  function drawForwardDebug(hitbox, cameraX, cameraY) {
    const x = hitbox.originX - cameraX;
    const y = hitbox.originY - cameraY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + hitbox.dirX * hitbox.range, y + hitbox.dirY * hitbox.range);
    ctx.stroke();
  }

  function drawCompositeHitboxDebug(hitbox, cameraX, cameraY) {
    const boxes = hitbox.composite;
    if (!boxes || boxes.length === 0) return;
    const colors = {
      innerForgivenessBox: { fill: "rgba(240, 217, 50, 0.22)", stroke: "#f0d932" },
      sideGraceBox:       { fill: "rgba(80, 220, 100, 0.18)", stroke: "#50dc64" },
      tipGraceBox:        { fill: "rgba(80, 200, 240, 0.20)", stroke: "#50c8f0" },
    };
    ctx.save();
    ctx.lineWidth = 1;
    for (const box of boxes) {
      const style = colors[box.type];
      if (!style) continue;
      ctx.fillStyle = style.fill;
      ctx.fillRect(box.x - cameraX, box.y - cameraY, box.w, box.h);
      ctx.strokeStyle = style.stroke;
      ctx.strokeRect(box.x - cameraX, box.y - cameraY, box.w, box.h);
      ctx.fillStyle = style.stroke;
      ctx.font = "9px Consolas, monospace";
      ctx.fillText(box.type.replace("Box",""), box.x - cameraX + 2, box.y - cameraY + 10);
    }
    ctx.restore();
  }

  function drawSweptMeleeDebug(player, cameraX, cameraY) {
    const ac = playerController.attackController;
    if (!ac.isActive()) return;
    const swept = ac.getSweptMeleeParams(player);
    if (!swept) return;

    // Use forward-offset origin matching the actual hit detection
    const pCX = (swept.originX ?? (player.centerX ?? player.x)) - cameraX;
    const pCY = (swept.originY ?? (player.centerY ?? player.y)) - cameraY;
    const facingAngle = swept.attackAngle;
    const halfArc = swept.arcDeg * Math.PI / 360;
    const startAngle = facingAngle - halfArc;
    const endAngle = facingAngle + halfArc;

    ctx.save();
    // Arc sector fill
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#ff6b35";
    ctx.beginPath();
    ctx.moveTo(pCX, pCY);
    ctx.arc(pCX, pCY, swept.range, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
    // Arc sector outline
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#ff6b35";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pCX, pCY);
    ctx.lineTo(pCX + Math.cos(startAngle) * swept.range, pCY + Math.sin(startAngle) * swept.range);
    ctx.arc(pCX, pCY, swept.range, startAngle, endAngle);
    ctx.closePath();
    ctx.stroke();
    // Inner radius circle
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#f0d932";
    ctx.beginPath();
    ctx.arc(pCX, pCY, swept.innerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "#f0d932";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Tip radius (spear)
    if (swept.tipRadius > 0) {
      const tipX = pCX + Math.cos(facingAngle) * swept.range;
      const tipY = pCY + Math.sin(facingAngle) * swept.range;
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#50c8f0";
      ctx.beginPath();
      ctx.arc(tipX, tipY, swept.tipRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Sample label
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#ff6b35";
    ctx.font = "10px Consolas, monospace";
    ctx.fillText("swp " + swept.sampleIndex + "/" + swept.totalSamples, pCX - 14, pCY - 24);
    ctx.restore();
  }


  function drawAttackStateDebug() {
    if (!DEBUG_ATTACK_STATE) return;
    const attack = player.attack;
    const hitbox = playerController.attackController.isActive()
      ? playerController.attackController.getHitbox(player)
      : null;
    const segCount = hitbox?.hitShape?.segments?.length ?? 0;
    const spec = attack.attackSpec ?? {};
    ctx.fillStyle = "rgba(8, 7, 10, 0.82)";
    ctx.fillRect(16, 18, 280, 112);
    label(ctx, `phase ${attack.phase} step ${attack.comboStep} frame ${attack.frame}/${attack.totalFrames}`, 28, 42, 13, "#f7f0df");
    label(ctx, `${attack.archetype} / ${attack.attackPattern}  anim ${attack.animationPreset?.name ?? "arcSlash"}`, 28, 60, 13, "#f7f0df");
    label(ctx, `facing ${player.facing}  angle ${(attack.attackAngle ?? attack.angle).toFixed(2)}`, 28, 78, 13, "#f7f0df");
    label(ctx, `range ${spec.range ?? "?"}  box ${attack.hitboxWidth}x${attack.hitboxHeight}  segs ${segCount}`, 28, 96, 13, "#71d6ff");
    label(ctx, `vRange ${spec.visualRange ?? "?"}  fOffset ${spec.forwardOffset ?? "?"}  vOffset ${spec.verticalOffset ?? "?"}`, 28, 114, 13, "#ceedd1");
  }

  return { start, update, draw, handleKey };
}
