import { H, TILE, W, WORLD_H, WORLD_W } from "../core/config.js";
import { label } from "../core/render.js";
import { drawInkwellBackground } from "../inkwell/Background.js";
import { drawInkwellLighting } from "../inkwell/Lighting.js";
import { createNpcManager } from "../inkwell/NPC.js?v=25";
import { createPhysics } from "../inkwell/Physics.js";
import { createPlayer } from "../inkwell/Player.js?v=32";
import { createTileMap } from "../inkwell/TileMap.js";
import { createLootManager } from "../inkwell/Loot.js";
import { createPortalManager } from "../inkwell/Portal.js";
import { BASIC_SLASH_ATTACK, DEBUG_ATTACK_ANGLE, DEBUG_ATTACK_HITBOX, DEBUG_ATTACK_STATE } from "../inkwell/AttackController.js?v=35";
import { createCombatSystem } from "../inkwell/CombatSystem.js?v=25";
import { createMapSystem } from "../inkwell/MapSystem.js";
import { createEcologyManager } from "../ecology/EcologyManager.js";
import { placeGatesOnMap, updateGates, drawGates, findNearestGate } from "../ecology/CanvasGate.js";
import { createSubMapScene } from "../ecology/SubMapScene.js";
import { createArtworkCompletion } from "../ecology/ArtworkCompletion.js";
import { shouldSpawnRift, rollRiftType, createRiftInstance, findNearestRift, updateRifts, drawRifts, RIFT_TYPES } from "../ecology/CanvasRift.js";
import { createRiftWorld } from "../ecology/RiftWorld.js";
import { createRewardOverlay } from "../game/builds/RewardOverlay.js?v=2";
import { generateRelicChoices, generateEvolutionChoices } from "../game/builds/RewardGenerator.js?v=32";
import { getWeaponTypeFromProfile } from "../game/builds/WeaponArchetypes.js?v=32";
import { getLayerByDepth, MAP_LAYERS } from "../inkwell/MapLayers.js";
import {
  ALL_NIGHT_BODY_COST,
  ALL_NIGHT_EXTENSION_FRAMES,
  NIGHT_DURATION_FRAMES,
  OVERTIME_BODY_COST,
  OVERTIME_EXTENSION_FRAMES,
} from "../inkwell/InkwellConfig.js";

const BASIC_SLASH = {
  name: "BasicSlash",
  damage: BASIC_SLASH_ATTACK.damage,
  knockbackX: BASIC_SLASH_ATTACK.knockbackX,
  knockbackY: BASIC_SLASH_ATTACK.knockbackY,
  range: BASIC_SLASH_ATTACK.range,
};
const lootWeaponStub = { damage: BASIC_SLASH.damage, reach: BASIC_SLASH.range };

export function createInkwellScene({ canvas, ctx, keys, mouse, weapon, getFrame, onFinish }) {
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
  };

  const tileMap = createTileMap(ctx);
  const physics = createPhysics(tileMap);
  let npcManager;
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
  npcManager = createNpcManager({ physics, player, run, tileMap, combat: combatSystem });
  lootManager = createLootManager({ tileMap, player, weapon: lootWeaponStub, run });
  portalManager = createPortalManager({ player, onEnter: () => finish("boss") });
  const mapSystem = createMapSystem(tileMap, () => player);
  const ecologyManager = createEcologyManager({ player, run, getCamera: () => camera });
  const artworkCompletion = createArtworkCompletion();
  let canvasGates = [];
  let subMapScene = null;  // ????????
  let subMapType = null;   // ?????

  
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
    run.currentLayer = "shallow";
    run.deepestLayer = "shallow";
    tileMap.generate();
    lootManager.reset();
    playerController.reset();
    combatSystem.reset();
    npcManager.reset();
    npcManager.logWeaknessTable();
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
      const strike = combatSystem.strikeNpc({
        npc,
        npcManager,
        baseDamage: attackController.getDamage(),
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
        const ecoHit = ecologyManager.onAttackHit(npc.x, npc.y);
        if (npc.boss && !npc.rewardDropped) {
          npc.rewardDropped = true;
          run.bossName = npc.variant?.name ?? "Unknown Boss";
          lootManager.dropBossRewards(npc.x, npc.y);
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
        subMapScene = createSubMapScene(subMapType, (discoveries, type) => {
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
        });
        subMapScene.start();
        return;
      }
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
      if (!portalManager.tryEnter()) lootManager.openNearestChest();
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
    // Layer info
    const layerNames = { shallow: "?????", middle: "?????", deep: "???????" };
    const layerColors = { shallow: "#f0d9a5", middle: "#8b8173", deep: "#8d1d25" };
    const layer = run.currentLayer || "shallow";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(4, 4, 130, 22);
    ctx.fillStyle = layerColors[layer] || "#f0d9a5";
    ctx.font = "bold 11px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(layerNames[layer] || layer, 10, 19);

    // Collection count
    const collected = run.itemsCollected + run.materialsCollected + run.kills;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(W - 110, 4, 106, 22);
    ctx.fillStyle = "#f0d9a5";
    ctx.font = "11px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(`??: ${collected}  F ??`, W - 104, 19);


    ctx.fillStyle = "rgba(241, 234, 217, 0.86)";
    ctx.fillRect(16, H - 88, 352, 64);
    ctx.fillStyle = "#151515";
    ctx.fillRect(30, H - 66, 210, 8);
    ctx.fillStyle = "#1d1b25";
    ctx.fillRect(30, H - 66, 210 * (player.ink / 100), 8);
    ctx.fillStyle = "#151515";
    ctx.fillRect(30, H - 42, 210, 8);
    ctx.fillStyle = "#9e2130";
    ctx.fillRect(30, H - 42, 210 * (player.hp / 100), 8);
    label(ctx, `ink ${Math.floor(player.ink)}%`, 252, H - 58, 12);
    label(ctx, `body ${Math.floor(player.hp)}%`, 252, H - 34, 12);
    const weaponName = weapon.archetype?.displayName ?? "Sword";
    const attackPattern = weapon.archetype?.attackPattern ?? "arcSlash";
    const damage = weapon.finalStats?.damage ?? BASIC_SLASH.damage;
    const range = weapon.finalStats?.range ?? BASIC_SLASH.range;
    label(ctx, `${weaponName}  ${attackPattern}  dmg ${damage}  range ${range}`, 24, H - 98, 14);
    const totalFrames = NIGHT_DURATION_FRAMES + addedTimeFrames;
    label(ctx, `night ${formatTime(timeLeftFrames())} / ${formatTime(totalFrames)}`, 24, H - 116, 14);

    ctx.fillStyle = "rgba(20,20,20,0.72)";
    ctx.fillRect(W - 304, 20, 274, 106);
    label(ctx, "A/D move  Space jump  Shift dash", W - 290, 44, 13, "#f7f0df");
    label(ctx, "Left attack/mine  E chest/portal", W - 290, 66, 13, "#f7f0df");
    label(ctx, "1 weapon  2 scraper  F return", W - 290, 88, 13, "#f7f0df");
    label(ctx, `kills ${run.kills} chest ${run.chestsOpened} boss ${run.bossRewards}`, W - 290, 110, 13, "#f7f0df");
    lootManager.drawInventory(ctx, W - 290, 128);
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
    drawInkwellBackground(ctx, drawCamera);
    tileMap.draw(drawCamera.x, drawCamera.y);
    ecologyManager.draw(ctx, drawCamera.x, drawCamera.y);
    drawGates(ctx, canvasGates, drawCamera.x, drawCamera.y);
    drawRifts(ctx, canvasRifts, drawCamera.x, drawCamera.y);
    lootManager.draw(ctx, drawCamera.x, drawCamera.y);
    npcManager.draw(ctx, drawCamera.x, drawCamera.y);
    drawHitNpcColliders(drawCamera.x, drawCamera.y);
    drawHitEffects(drawCamera.x, drawCamera.y);
    portalManager.draw(ctx, drawCamera.x, drawCamera.y);
    drawInkwellLighting(ctx, { camera: drawCamera, player, tileMap, npcs: npcManager.npcs });
    combatSystem.draw(ctx, drawCamera.x, drawCamera.y);
    playerController.draw(ctx, drawCamera.x, drawCamera.y);
    drawAttackDebug(drawCamera.x, drawCamera.y);
    drawAttackStateDebug();
    drawHud();
    mapSystem.drawMinimap(ctx);
    drawTimeChoice();
    rewardOverlay.render(ctx);
    mapSystem.drawFullMap(ctx, tileMap.getRooms());
  }

  function triggerRoomRewardIfReady() {
    const room = getCurrentRewardRoom();
    if (!room) return;
    if (room.hasRewardTriggered || room.rewardClaimed) return;
    if (!npcManager.roomEnemiesCleared(room.id)) return;

    room.hasRewardTriggered = true;
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



