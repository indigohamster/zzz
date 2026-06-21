import { validateWeaponProfile } from "../game/WeaponProfile.js?v=32";
import { applyBuildModifiers } from "../game/builds/BuildApplier.js";
import { getBuildWeaponArchetype, getWeaponTypeFromProfile } from "../game/builds/WeaponArchetypes.js?v=32";

export const DEBUG_ATTACK_HITBOX = true;
export const DEBUG_ATTACK_ANGLE = true;
export const DEBUG_ATTACK_STATE = true;
export const DEBUG_ATTACK_HITBOX_LOG = true;

export const WEAPON_ATTACK_PATTERNS = {
  arcSlash: {
    id: "arcSlash",
    archetype: "sword",
    label: "Sword",
    range: 56,
    hitboxWidth: 58,
    hitboxHeight: 38,
    forwardOffset: 34,
    hitShape: {
      type: "arcSegments",
      closeRadius: 26,
    },
    startupFrames: 1,
    activeFrames: 7,
    recoveryFrames: 6,
    damage: 12,
    knockbackX: 3.8,
    knockbackY: -1.2,
    damageMultiplier: 1,
    knockbackMultiplier: 1,
    hitstopSeconds: 0.05,
    shakeIntensity: 3,
    moveMultiplier: 0.75,
    comboResetSeconds: 0.35,
    animationPreset: {
      name: "arcSlash",
      swingArcDegrees: 75,
      trailCount: 4,
    },
    steps: {
      1: { startupFrames: 1, activeFrames: 7, recoveryFrames: 6, damageMultiplier: 1, knockbackMultiplier: 1 },
      2: { startupFrames: 2, activeFrames: 8, recoveryFrames: 8, damageMultiplier: 1.15, knockbackMultiplier: 1.25 },
    },
  },
  thrust: {
    id: "thrust",
    archetype: "spear",
    label: "Spear",
    range: 86,
    hitboxWidth: 82,
    hitboxHeight: 22,
    forwardOffset: 48,
    hitShape: {
      type: "capsule",
      startOffset: 8,
      endOffset: 92,
      radius: 13,
    },
    startupFrames: 2,
    activeFrames: 6,
    recoveryFrames: 8,
    damage: 12,
    knockbackX: 3.8,
    knockbackY: -1.2,
    damageMultiplier: 0.9,
    knockbackMultiplier: 1.05,
    hitstopSeconds: 0.045,
    shakeIntensity: 2.6,
    moveMultiplier: 0.78,
    comboResetSeconds: 0.35,
    animationPreset: {
      name: "thrust",
      thrustPixels: 34,
      rotationDegrees: 6,
      lengthScale: 1.22,
      trailCount: 2,
    },
  },
  heavySmash: {
    id: "heavySmash",
    archetype: "hammer",
    label: "Hammer",
    range: 48,
    hitboxWidth: 64,
    hitboxHeight: 52,
    forwardOffset: 30,
    hitShape: {
      type: "ellipse",
      radiusX: 48,
      radiusY: 42,
    },
    startupFrames: 5,
    activeFrames: 8,
    recoveryFrames: 12,
    damage: 12,
    knockbackX: 3.8,
    knockbackY: -1.2,
    damageMultiplier: 1.45,
    knockbackMultiplier: 1.55,
    hitstopSeconds: 0.075,
    shakeIntensity: 5,
    moveMultiplier: 0.62,
    comboResetSeconds: 0.35,
    animationPreset: {
      name: "heavySmash",
      windupDegrees: -120,
      impactDegrees: 48,
      activeScale: 1.24,
      trailCount: 6,
    },
  },
  guardBash: {
    id: "guardBash",
    archetype: "shield",
    label: "Shield",
    range: 38,
    hitboxWidth: 44,
    hitboxHeight: 42,
    forwardOffset: 24,
    hitShape: {
      type: "rect",
    },
    startupFrames: 2,
    activeFrames: 5,
    recoveryFrames: 8,
    damage: 12,
    knockbackX: 3.8,
    knockbackY: -1.2,
    damageMultiplier: 0.65,
    knockbackMultiplier: 1.15,
    hitstopSeconds: 0.05,
    shakeIntensity: 3.2,
    moveMultiplier: 0.72,
    comboResetSeconds: 0.35,
    blockWindowFrames: 8,
    animationPreset: {
      name: "guardBash",
      bashPixels: 18,
      rotationDegrees: 3,
      lengthScale: 0.82,
      trailCount: 1,
    },
  },
  daggerSlash: {
    id: "daggerSlash",
    archetype: "dagger",
    label: "Dagger",
    range: 38,
    hitboxWidth: 40,
    hitboxHeight: 30,
    forwardOffset: 24,
    hitShape: {
      type: "rect",
    },
    startupFrames: 1,
    activeFrames: 9,
    recoveryFrames: 5,
    damage: 8,
    knockbackX: 2.8,
    knockbackY: -1,
    damageMultiplier: 0.82,
    knockbackMultiplier: 0.85,
    hitstopSeconds: 0.04,
    shakeIntensity: 2,
    moveMultiplier: 0.82,
    comboResetSeconds: 0.28,
    animationPreset: {
      name: "daggerSlash",
      slashArcDegrees: 65,
      trailCount: 3,
      flickAmplitude: 12,
      flickSpeed: 2.2,
    },
  },
  whipLash: {
    id: "whipLash",
    archetype: "whip",
    label: "Whip",
    range: 108,
    hitboxWidth: 106,
    hitboxHeight: 20,
    forwardOffset: 62,
    hitShape: {
      type: "whipSegments",
    },
    startupFrames: 2,
    activeFrames: 8,
    recoveryFrames: 9,
    damage: 9,
    knockbackX: 2.6,
    knockbackY: -0.8,
    damageMultiplier: 0.9,
    knockbackMultiplier: 0.75,
    hitstopSeconds: 0.04,
    shakeIntensity: 2.2,
    moveMultiplier: 0.76,
    comboResetSeconds: 0.35,
    animationPreset: {
      name: "whipLash",
      crackPixels: 58,
      windbackDegrees: -50,
      crackDegrees: 22,
      lengthScale: 1.52,
      trailCount: 6,
      waveSegments: 5,
    },
  },
  staffSpin: {
    id: "staffSpin",
    archetype: "staff",
    label: "Staff",
    range: 70,
    hitboxWidth: 72,
    hitboxHeight: 38,
    forwardOffset: 44,
    hitShape: {
      type: "rect",
    },
    startupFrames: 2,
    activeFrames: 8,
    recoveryFrames: 7,
    damage: 10,
    knockbackX: 3.4,
    knockbackY: -1.4,
    damageMultiplier: 0.95,
    knockbackMultiplier: 1.1,
    hitstopSeconds: 0.05,
    shakeIntensity: 3.4,
    moveMultiplier: 0.72,
    comboResetSeconds: 0.35,
    animationPreset: {
      name: "staffSpin",
      spinArcDegrees: 210,
      lengthScale: 1.18,
      trailCount: 5,
      spinOffsetDegrees: -30,
    },
  },
};

export const BASIC_SLASH_ATTACK = WEAPON_ATTACK_PATTERNS.arcSlash;

// --- Composite melee hitbox: main + forgiveness sub-boxes ---
// Each weapon type generates 3-4 sub-boxes that each independently check for NPC overlap.
// Only the main hitbox uses shape-specific detection; grace boxes use simple AABB.
export const COMPOSITE_HITBOX_CONFIG = {
  sword: {
    main: { range: 54, width: 64, height: 42 },
    innerGrace: 20,
    sideGrace: 18,
  },
  spear: {
    main: { range: 88, width: 38, height: 34 },
    innerGrace: 14,
    tipGrace: 22,
  },
  hammer: {
    main: { range: 58, width: 82, height: 58 },
    innerGrace: 22,
    sideGrace: 26,
  },
  axe: {
    main: { range: 58, width: 82, height: 58 },
    innerGrace: 22,
    sideGrace: 26,
  },
  dagger: {
    main: { range: 38, width: 44, height: 36 },
    innerGrace: 28,
    sideGrace: 12,
  },
  shield: {
    main: { range: 38, width: 50, height: 48 },
    innerGrace: 24,
    sideGrace: 10,
  },
  staff: {
    main: { range: 70, width: 72, height: 38 },
    innerGrace: 16,
    sideGrace: 14,
  },
};

// --- Swept Melee Hit Detection: angle + distance fan check ---
// Replaces static AABB rectangles with directional sweep samples.
// Each weapon defines range, arc angle, inner (point-blank) radius, and sample count.
export const SWEPT_MELEE_CONFIG = {
  sword:    { range: 74, arcDeg: 105, innerRadius: 30, samples: 4 },
  spear:    { range: 112, arcDeg: 46,  innerRadius: 26, tipRadius: 20, samples: 5 },
  hammer:   { range: 80, arcDeg: 135, innerRadius: 34, samples: 5 },
  axe:      { range: 80, arcDeg: 135, innerRadius: 34, samples: 5 },
  dagger:   { range: 52, arcDeg: 95,  innerRadius: 36, samples: 3 },
  shield:   { range: 48, arcDeg: 80,  innerRadius: 28, samples: 3 },
  staff:    { range: 84, arcDeg: 100, innerRadius: 24, samples: 4 },
};



const FRAMES_PER_SECOND = 60;
const SHAKE_FRAMES = 6;
const HITBOX_FORGIVENESS = 1.15;
let nextNpcHitId = 1;

export function createAttackController() {
  const initialSpec = getAttackSpec(null, 1);
  const initialPattern = getAttackPatternConfig({ attackPattern: initialSpec.pattern });
  const initialStep = getComboStepConfig(initialPattern, 1);
  const state = {
    isAttacking: false,
    phase: "idle",
    frame: 0,
    totalFrames: initialStep.totalFrames,
    startupFrames: initialStep.startupFrames,
    activeFrames: initialStep.activeFrames,
    recoveryFrames: initialStep.recoveryFrames,
    remainingFrames: 0,
    hitstopTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    hitIds: new Set(),
    attackId: 0,
    facing: 1,
    angle: 0,
    attackAngle: 0,
    attackFacing: 1,
    dirX: 1,
    dirY: 0,
    archetype: initialPattern.archetype,
    attackPattern: initialPattern.id,
    attackSpec: initialSpec,
    animationPreset: initialPattern.animationPreset,
    baseDamage: 12,
    finalStats: null,
    range: initialSpec.range,
    hitboxWidth: initialSpec.width,
    hitboxHeight: initialSpec.height,
    hitboxForwardOffset: initialSpec.forwardOffset,
    hitboxVerticalOffset: initialSpec.verticalOffset,
    hitShape: initialSpec.hitShape,
    visualAttackLength: initialSpec.visualRange,
    blockWindowFrames: 0,
    attackSpeed: 60 / 16,
    pierce: 1,
    knockback: 3.8,
    comboStep: 1,
    damageMultiplier: initialStep.damageMultiplier,
    knockbackMultiplier: initialStep.knockbackMultiplier,
    hitstopFrames: getHitstopFrames(initialPattern),
    shakePower: initialPattern.shakeIntensity,
    shakeIntensity: 0,
    moveMultiplier: initialPattern.moveMultiplier,
    bufferedAttack: null,
    comboResetTimer: 0,
    debugStartedFrame: 0,
    debugHitboxLoggedAttackId: 0,
    aimWorldX: 0,
    aimWorldY: 0,
  };

  function reset() {
    clearAttackState();
    state.hitstopTimer = 0;
    state.isAttacking = false;
    state.shakeTimer = 0;
    state.shakeIntensity = 0;
    state.facing = 1;
    state.angle = 0;
    state.attackAngle = 0;
    state.attackFacing = 1;
    state.dirX = 1;
    state.dirY = 0;
    state.comboStep = 1;
    state.bufferedAttack = null;
    state.comboResetTimer = 0;
    applyPatternConfig(getAttackPatternConfig(), 1);
  }

  function canStart() {
    return !state.isAttacking;
  }

  function start(player, aim = null, weapon = null) {
    validateWeaponProfile(weapon, "attack.start");
    if (!canStart()) return bufferNextAttack(player, aim, weapon);
    const step = state.comboResetTimer > 0 ? state.comboStep : 1;
    beginAttack(player, aim, weapon, step);
    return true;
  }

  function beginAttack(player, aim, weapon, comboStep) {
    const playerDirection = normalizeFacing(player.facing);
    const attackFacing = playerDirection;
    const fallbackAngle = attackFacing < 0 ? Math.PI : 0;
    const attackAngle = normalizeAngle(Number.isFinite(aim?.angle) ? aim.angle : fallbackAngle);
    const attackDirection = {
      facing: attackFacing,
      angle: attackAngle,
      x: Math.cos(attackAngle),
      y: Math.sin(attackAngle),
    };
    const buildAttack = resolveBuildAttackStats(player, weapon);
    const attackSpec = getAttackSpec(buildAttack.weapon, attackFacing);
    const pattern = getAttackPatternConfig({ attackPattern: attackSpec.pattern });
    const step = pattern.id === "arcSlash" && comboStep === 2 ? 2 : 1;
    applyPatternConfig(pattern, step, buildAttack.weapon, attackSpec);
    logBuildAttackStats(buildAttack, player);
    logAttackSpec(attackSpec, attackFacing);
    console.log("[WeaponAttackStart]", {
      weaponType: buildAttack.weaponType,
      archetype: buildAttack.weapon?.archetype?.id ?? attackSpec.archetype,
      weaponArchetype: buildAttack.weapon?.weaponArchetype,
      attackPattern: attackSpec.pattern,
      range: attackSpec.range,
      damage: buildAttack.finalStats?.damage,
      facing: attackFacing,
    });
    console.log("[AttackDirection]", {
      playerDirection,
      attackDirection,
      weaponType: buildAttack.weaponType,
      attackPattern: buildAttack.weapon?.attackPattern,
    });
    player.facing = attackFacing;
    state.isAttacking = true;
    state.phase = "startup";
    state.frame = 0;
    state.remainingFrames = state.totalFrames;
    state.hitstopTimer = 0;
    state.hitIds.clear();
    state.attackId++;
    state.facing = attackFacing;
    state.attackFacing = attackFacing;
    state.angle = attackAngle;
    state.attackAngle = attackAngle;
    state.dirX = attackDirection.x;
    state.dirY = attackDirection.y;
    state.comboStep = step;
    state.comboResetTimer = 0;
    state.aimWorldX = aim?.clickWorldX ?? player.centerX + Math.cos(state.attackAngle) * 100;
    state.aimWorldY = aim?.clickWorldY ?? player.centerY + Math.sin(state.attackAngle) * 100;
    state.debugStartedFrame = player.animFrame ?? 0;
    debugAttack("start", { attackAngle, facing: attackFacing, attackId: state.attackId, comboStep: step, archetype: state.archetype, attackPattern: state.attackPattern });
  }

  function update() {
    if (state.hitstopTimer > 0) {
      state.hitstopTimer--;
      updateShake();
      return;
    }

    if (!state.isAttacking) {
      updateComboReset();
      updateShake();
      return;
    }

    const previousPhase = state.phase;
    state.frame++;
    state.remainingFrames = Math.max(0, state.totalFrames - state.frame);

    if (state.frame < state.startupFrames) state.phase = "startup";
    else if (state.frame < state.startupFrames + state.activeFrames) state.phase = "active";
    else if (state.frame < state.totalFrames) state.phase = "recovery";
    else endAttack("complete");

    if (state.isAttacking && state.phase !== previousPhase) debugAttack("phase", { phase: state.phase, frame: state.frame });
    if (state.isAttacking && state.frame > getStuckAttackFrameLimit()) endAttack("stuck_guard");

    updateShake();
  }

  function updateShake() {
    if (state.shakeTimer <= 0) return;
    state.shakeTimer--;
    if (state.shakeTimer <= 0) state.shakeIntensity = 0;
  }

  function isActive() {
    return state.isAttacking && state.phase === "active";
  }

  function isRecovery() {
    return state.isAttacking && state.phase === "recovery";
  }

  function canBufferNextAttack() {
    if (!isRecovery()) return false;
    if (state.attackPattern !== "arcSlash") return false;
    if (state.comboStep !== 1) return false;
    const recoveryFrame = state.frame - state.startupFrames - state.activeFrames;
    return recoveryFrame >= Math.ceil(state.recoveryFrames / 2);
  }

  function getMovementScale() {
    return state.isAttacking ? state.moveMultiplier : 1;
  }

  function hasHit(npc) {
    return state.hitIds.has(getNpcHitId(npc)) || state.hitIds.size >= state.pierce;
  }

  function markHit(npc) {
    state.hitIds.add(getNpcHitId(npc));
  }

  function triggerHitFeedback() {
    state.hitstopTimer = state.hitstopFrames;
    state.shakeTimer = SHAKE_FRAMES;
    state.shakeIntensity = state.shakePower || 3;
  }

  function getDamage() {
    return Math.max(1, Math.round(state.baseDamage * state.damageMultiplier));
  }

  function getKnockbackX() {
    return state.knockback * state.knockbackMultiplier;
  }

  function getKnockbackY() {
    return -1.2 * state.knockbackMultiplier;
  }

  // Build composite melee hitbox: main + inner/side/tip forgiveness boxes.
  // Called once per attack frame; results attached to getHitbox output as .composite.
  function buildCompositeHitboxes(player) {
    const config = COMPOSITE_HITBOX_CONFIG[state.archetype] ?? COMPOSITE_HITBOX_CONFIG.sword;
    const facing = state.facing || player.facing || 1;
    const dirX = Number.isFinite(state.dirX) ? state.dirX : facing;
    const dirY = Number.isFinite(state.dirY) ? state.dirY : 0;
    const normalX = -dirY;
    const normalY = dirX;
    const pCX = player.centerX ?? player.x;
    const pCY = player.centerY ?? player.y;
    const boxes = [];

    // --- mainHitbox ---
    const mainRange = config.main.range;
    const fwd = Math.round(mainRange * 0.58);
    const mCX = pCX + dirX * fwd;
    const mCY = pCY + dirY * fwd + (state.hitboxVerticalOffset ?? -2);
    boxes.push({
      type: "mainHitbox",
      x: mCX - config.main.width / 2,
      y: mCY - config.main.height / 2,
      w: config.main.width,
      h: config.main.height,
      centerX: mCX,
      centerY: mCY,
    });

    // --- innerForgivenessBox (point-blank body check) ---
    if (config.innerGrace > 0) {
      const g = config.innerGrace;
      boxes.push({
        type: "innerForgivenessBox",
        x: pCX - g,
        y: pCY - g * 1.3,
        w: g * 2,
        h: g * 2.6,
        centerX: pCX,
        centerY: pCY,
      });
    }

    // --- sideGraceBox (lateral forgiveness, both sides) ---
    if (config.sideGrace > 0) {
      const s = config.sideGrace;
      const sCX = pCX + dirX * (fwd * 0.38);
      const sCY = pCY + dirY * (fwd * 0.38) + (state.hitboxVerticalOffset ?? -2);
      const sw = Math.round(mainRange * 0.28);
      const sh = s * 2.2;
      // Left side (relative to attack direction)
      boxes.push({
        type: "sideGraceBox",
        x: sCX + normalX * s - sw / 2,
        y: sCY - sh / 2,
        w: sw,
        h: sh,
        centerX: sCX + normalX * s,
        centerY: sCY,
      });
      // Right side
      boxes.push({
        type: "sideGraceBox",
        x: sCX - normalX * s - sw / 2,
        y: sCY - sh / 2,
        w: sw,
        h: sh,
        centerX: sCX - normalX * s,
        centerY: sCY,
      });
    }

    // --- tipGraceBox (far-end poke forgiveness, spear only) ---
    if (config.tipGrace > 0) {
      const t = config.tipGrace;
      const tCX = pCX + dirX * mainRange;
      const tCY = pCY + dirY * mainRange + (state.hitboxVerticalOffset ?? -2);
      boxes.push({
        type: "tipGraceBox",
        x: tCX - t,
        y: tCY - t * 0.55,
        w: t * 2,
        h: t * 1.1,
        centerX: tCX,
        centerY: tCY,
      });
    }

    return boxes;
  }

  // Swept melee: returns interpolated {range, arcDeg, innerRadius, tipRadius, sampleIndex, facing} per frame.
  // Returns null when not in active phase.
  function getSweptMeleeParams(player) {
    if (!state.isAttacking || state.phase !== "active") return null;
    const config = SWEPT_MELEE_CONFIG[state.archetype] ?? SWEPT_MELEE_CONFIG.sword;
    const progress = (state.frame - state.startupFrames) / Math.max(1, state.activeFrames);
    const clamped = Math.max(0, Math.min(1, progress));
    // Bell-curve interpolation: range peaks at mid-swing
    const rScale = 0.65 + clamped * 0.88 * (1 - clamped * 0.65);
    const aScale = 0.65 + clamped * 0.82 * (1 - clamped * 0.55);
    const forwardOffset = Number.isFinite(state.hitboxForwardOffset) ? state.hitboxForwardOffset : 0;
    return {
      range: Math.round(config.range * rScale),
      arcDeg: Math.round(config.arcDeg * aScale),
      innerRadius: config.innerRadius,
      tipRadius: config.tipRadius || 0,
      sampleIndex: Math.min(config.samples - 1, Math.floor(clamped * config.samples)),
      totalSamples: config.samples,
      facing: state.attackFacing || state.facing || player.facing || 1,
      attackAngle: state.attackAngle,
      dirX: Number.isFinite(state.dirX) ? state.dirX : (state.attackFacing || state.facing || player.facing || 1),
      dirY: Number.isFinite(state.dirY) ? state.dirY : 0,
      archetype: state.archetype,
      forwardOffset: forwardOffset,
      originX: (player.centerX ?? player.x) + (Number.isFinite(state.dirX) ? state.dirX : (state.attackFacing || state.facing || 1)) * forwardOffset,
      originY: (player.centerY ?? player.y) + (Number.isFinite(state.dirY) ? state.dirY : 0) * forwardOffset,
    };
  }

  function getHitbox(player) {
    const playerCenterX = player.centerX ?? player.x;
    const playerCenterY = player.centerY ?? player.y;
    const facing = state.facing || player.facing || 1;
    const width = state.hitboxWidth;
    const height = state.hitboxHeight;
    const dirX = Number.isFinite(state.dirX) ? state.dirX : facing;
    const dirY = Number.isFinite(state.dirY) ? state.dirY : 0;
    const normalX = -dirY;
    const normalY = dirX;
    const forwardOffset = state.hitboxForwardOffset;
    const centerX = playerCenterX + dirX * forwardOffset;
    const centerY = playerCenterY + dirY * forwardOffset + (state.hitboxVerticalOffset ?? -2);
    const footHitbox = getAirFootHitbox(player, playerCenterX, playerCenterY);
    const hitbox = {
      x: centerX - width / 2,
      y: centerY - height / 2,
      w: width,
      h: height,
      originX: playerCenterX,
      originY: playerCenterY,
      centerX,
      centerY,
      angle: state.attackAngle,
      attackAngle: state.attackAngle,
      dirX,
      dirY,
      normalX,
      normalY,
      facing,
      range: state.range,
      forwardOffset,
      footHitbox,
      hitShape: state.hitShape,
      attackSpec: state.attackSpec,
      visualBounds: getVisualBounds(state.attackSpec, state.attackAngle),
      archetype: state.archetype,
      attackPattern: state.attackPattern,
      finalStatsRange: state.finalStatsRange,
      patternRange: state.patternRange,
      composite: buildCompositeHitboxes(player),
    };
    logHitboxDebug(hitbox, state);
    logCompositeHitbox(hitbox);
    return hitbox;
  }

  function getShakeOffset() {
    if (state.shakeTimer <= 0 || state.shakeIntensity <= 0) return { x: 0, y: 0 };
    const strength = state.shakeIntensity * (state.shakeTimer / SHAKE_FRAMES);
    const wobble = state.shakeTimer * 1.73 + state.attackId;
    return {
      x: Math.cos(wobble) * strength,
      y: Math.sin(wobble * 1.31) * strength * 0.55,
    };
  }

  function endAttack(reason) {
    debugAttack("end", { reason, attackId: state.attackId, frame: state.frame });
    const buffered = state.bufferedAttack;
    clearAttackState();
    if (buffered) {
      state.bufferedAttack = null;
      beginAttack(buffered.player, buffered.aim, buffered.weapon, 2);
      return;
    }
    if (state.comboStep === 2) {
      state.comboStep = 1;
      applyPatternConfig(getAttackPatternConfig(), 1);
    }
    state.comboResetTimer = getComboResetFrames();
  }

  function clearAttackState() {
    state.isAttacking = false;
    state.phase = "idle";
    state.frame = 0;
    state.remainingFrames = 0;
    state.hitIds.clear();
  }

  function bufferNextAttack(player, aim, weapon) {
    if (!canBufferNextAttack()) return false;
    state.bufferedAttack = { player, aim, weapon };
    debugAttack("buffer", { attackId: state.attackId, nextComboStep: 2 });
    return true;
  }

  function updateComboReset() {
    if (state.comboResetTimer <= 0) return;
    state.comboResetTimer--;
    if (state.comboResetTimer <= 0) {
      state.comboStep = 1;
      applyPatternConfig(getAttackPatternConfig(), 1);
      debugAttack("combo_reset", { comboStep: state.comboStep });
    }
  }

  function applyPatternConfig(pattern, comboStep, weapon = null, attackSpec = null) {
    const finalStats = weapon?.finalStats ?? {};
    const step = getComboStepConfig(pattern, comboStep, finalStats.attackSpeed);
    const spec = {
      ...(attackSpec ?? getAttackSpec(weapon, state.facing || 1)),
      activeStart: step.startupFrames,
      activeEnd: step.startupFrames + step.activeFrames,
    };
    state.archetype = spec.archetype;
    state.attackPattern = spec.pattern;
    state.attackSpec = spec;
    state.animationPreset = pattern.animationPreset;
    state.baseDamage = getWeaponDamage(weapon);
    state.finalStats = finalStats;
    state.finalStatsRange = weapon?.finalStats?.range;
    state.patternRange = pattern.range;
    state.range = spec.range;
    state.hitboxWidth = spec.width;
    state.hitboxHeight = spec.height;
    state.hitboxForwardOffset = spec.forwardOffset;
    state.hitboxVerticalOffset = spec.verticalOffset;
    state.hitShape = spec.hitShape;
    state.visualAttackLength = spec.visualRange;
    state.blockWindowFrames = pattern.blockWindowFrames ?? 0;
    state.attackSpeed = getWeaponAttackSpeed(weapon, pattern);
    state.pierce = Math.max(1, Math.round(finalStats.pierce ?? 1));
    state.knockback = getWeaponKnockback(weapon);
    state.totalFrames = step.totalFrames;
    state.startupFrames = step.startupFrames;
    state.activeFrames = step.activeFrames;
    state.recoveryFrames = step.recoveryFrames;
    state.damageMultiplier = step.damageMultiplier;
    state.knockbackMultiplier = step.knockbackMultiplier;
    state.hitstopFrames = getHitstopFrames(pattern);
    state.shakePower = pattern.shakeIntensity;
    state.moveMultiplier = pattern.moveMultiplier;
  }

  function getStuckAttackFrameLimit() {
    return state.totalFrames + state.hitstopFrames + 8;
  }

  return {
    state,
    reset,
    canStart,
    start,
    update,
    isActive,
    isRecovery,
    getMovementScale,
    hasHit,
    markHit,
    triggerHitFeedback,
    getDamage,
    getKnockbackX,
    getKnockbackY,
    getHitbox,
    getSweptMeleeParams,
    getShakeOffset,
  };
}

function getNpcHitId(npc) {
  if (!npc.__attackHitId) npc.__attackHitId = nextNpcHitId++;
  return npc.__attackHitId;
}

function debugAttack(event, payload) {
  if (!DEBUG_ATTACK_STATE) return;
  console.debug(`[AttackController] ${event}`, payload);
}

function logHitboxDebug(hitbox, state) {
  if (!DEBUG_ATTACK_HITBOX_LOG) return;
  if (state?.debugHitboxLoggedAttackId === state.attackId) return;
  if (state) state.debugHitboxLoggedAttackId = state.attackId;
  console.log("[AttackHitbox]", {
    weaponType: hitbox.archetype,
    archetype: hitbox.archetype,
    attackPattern: hitbox.attackPattern,
    facing: hitbox.facing,
    forwardOffset: hitbox.forwardOffset,
    width: hitbox.w,
    height: hitbox.h,
    x: hitbox.x,
    y: hitbox.y,
    finalStatsRange: hitbox.finalStatsRange,
    patternRange: hitbox.patternRange,
  });
}

function logCompositeHitbox(hitbox) {
  const boxes = hitbox.composite;
  if (!boxes || !DEBUG_ATTACK_HITBOX_LOG) return;
  const summary = boxes.map(function (b) {
    return { type: b.type, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) };
  });
  console.log("[CompositeHitbox]", {
    weapon: hitbox.archetype,
    facing: hitbox.facing,
    count: boxes.length,
    boxes: summary,
  });
}


function getComboStepConfig(pattern, comboStep, attackSpeed = null) {
  const step = pattern.steps?.[comboStep] ?? pattern.steps?.[1] ?? pattern;
  const speedScale = getAttackFrameScale(pattern, attackSpeed);
  const startupFrames = scaleFrames(step.startupFrames, speedScale);
  const activeFrames = scaleFrames(step.activeFrames, speedScale);
  const recoveryFrames = scaleFrames(step.recoveryFrames, speedScale);
  return {
    ...step,
    startupFrames,
    activeFrames,
    recoveryFrames,
    totalFrames: startupFrames + activeFrames + recoveryFrames,
  };
}

function resolveBuildAttackStats(player, weapon = null) {
  const weaponType = getWeaponTypeFromProfile(weapon);
  const buildBaseStats = getBuildWeaponArchetype(weaponType);
  const baseStats = mergeWeaponStats(buildBaseStats, weapon);
  const buildState = weapon?.buildState ?? player?.buildState ?? null;
  const finalStats = applyBuildModifiers(baseStats, buildState, {
    player,
    weapon,
    weaponType,
    bossRoom: Boolean(player?.bossRoom ?? weapon?.bossRoom),
  });

  // Apply drawing tendency modifiers to make combat experience differ based on drawing
  const modifiedFinalStats = applyDrawingTendencyModifiers(finalStats, weapon);

  const relics = Array.isArray(buildState?.relics) ? [...buildState.relics] : [];
  return {
    weaponType,
    baseStats,
    relics,
    finalStats: modifiedFinalStats,
    weapon: createEffectiveAttackWeapon(weapon, weaponType, modifiedFinalStats),
  };
}

// --- Drawing Tendency Modifiers ---
// Modifies combat stats based on the drawing tendency stored in the weapon profile.
// This makes the same weapon type feel different based on what the player drew.
function applyDrawingTendencyModifiers(finalStats, weapon = null) {
  const tendency = weapon?.drawingTendency;
  if (!tendency || !tendency.type) {
    return finalStats; // No tendency, return unchanged
  }

  const strength = clampNumber(tendency.strength ?? 0, 0, 1, 0);
  if (strength <= 0) {
    return finalStats;
  }

  // Create a copy to avoid mutating the original
  const modified = { ...finalStats };

  console.log("[DrawingTendencyModifier]", {
    type: tendency.type,
    strength,
    before: { damage: finalStats.damage, range: finalStats.range, attackSpeed: finalStats.attackSpeed, crit: finalStats.crit },
  });

  switch (tendency.type) {
    case "circular":
      // Circular: large range, low damage, higher inspiration gain
      modified.range = Math.round(modified.range * (1 + 0.2 * strength));
      modified.damage = Math.round(modified.damage * (1 - 0.15 * strength));
      modified.crit = modified.criticalChance = Math.max(modified.crit, modified.criticalChance) * (1 - 0.1 * strength);
      // Inspiration gain multiplier is handled elsewhere (in combat feedback)
      modified.inspirationGainMultiplier = 1 + 0.3 * strength;
      break;

    case "sharp":
      // Sharp: high crit, high penetration, smaller range
      modified.crit = modified.criticalChance = Math.min(0.95, Math.max(modified.crit, modified.criticalChance) * (1 + 0.5 * strength));
      modified.pierce = Math.max(modified.pierce, 1 + Math.round(strength * 2));
      modified.range = Math.round(modified.range * (1 - 0.15 * strength));
      modified.damageVariance = (modified.damageVariance ?? 0) + 0.15 * strength;
      break;

    case "chaotic":
      // Chaotic: high attack speed, random effects
      modified.attackSpeed = modified.attackSpeed * (1 + 0.3 * strength);
      modified.useTime = Math.max(1, Math.round(modified.useTime / (1 + 0.3 * strength)));
      modified.damageVariance = (modified.damageVariance ?? 0) + 0.2 * strength;
      // Random effect flag - handled in combat
      modified.chaoticEffect = true;
      modified.chaoticStrength = strength;
      break;

    case "longStraight":
      // Long straight: long distance, thrust attack
      modified.range = Math.round(modified.range * (1 + 0.4 * strength));
      modified.knockback = modified.knockback * (1 + 0.2 * strength);
      // Prefer thrust attack pattern if not already
      if (modified.attackPattern !== "thrust") {
        modified.preferThrust = strength > 0.5;
      }
      break;

    default:
      break;
  }

  console.log("[DrawingTendencyModifier]", {
    type: tendency.type,
    strength,
    after: { damage: modified.damage, range: modified.range, attackSpeed: modified.attackSpeed, crit: modified.crit },
  });

  return modified;
}

function mergeWeaponStats(buildBaseStats, weapon = null) {
  const weaponStats = weapon?.finalStats ?? weapon?.combat ?? {};
  const criticalChance = weaponStats.criticalChance ?? weaponStats.crit ?? buildBaseStats.critChance;
  return {
    ...buildBaseStats,
    attackPattern: weapon?.attackPattern ?? weapon?.archetype?.attackPattern ?? weapon?.combat?.attackPattern ?? buildBaseStats.attackPattern,
    damage: weaponStats.damage ?? weapon?.damage ?? buildBaseStats.damage,
    range: weaponStats.range ?? weapon?.reach ?? buildBaseStats.range,
    attackSpeed: weaponStats.attackSpeed ?? getAttackSpeedFromUseTime(weaponStats.useTime) ?? buildBaseStats.attackSpeed,
    critChance: criticalChance,
    criticalChance,
    pierce: weaponStats.pierce ?? buildBaseStats.pierce,
    knockback: weaponStats.knockback ?? weapon?.archetype?.baseStats?.knockback ?? buildBaseStats.knockback,
    damageVariance: weaponStats.damageVariance ?? 0,
    inkCost: weaponStats.inkCost ?? 0,
  };
}

function createEffectiveAttackWeapon(weapon, weaponType, finalStats) {
  return {
    ...(weapon ?? {}),
    weaponType,
    attackPattern: finalStats.attackPattern,
    finalStats: {
      ...(weapon?.finalStats ?? {}),
      ...finalStats,
      crit: finalStats.critChance,
      criticalChance: finalStats.criticalChance ?? finalStats.critChance,
    },
    combat: {
      ...(weapon?.combat ?? {}),
      type: weaponType,
      weaponArchetype: weaponType,
      attackPattern: finalStats.attackPattern,
      damage: finalStats.damage,
      range: finalStats.range,
      attackSpeed: finalStats.attackSpeed,
      pierce: finalStats.pierce,
      knockback: finalStats.knockback,
    },
  };
}

function logBuildAttackStats(buildAttack, player) {
  console.log("[BuildAttackStats]", {
    weaponType: buildAttack.weaponType,
    weaponLevel: player?.buildState?.weaponLevel ?? 1,
    relics: buildAttack.relics,
    evolutions: Object.keys(player?.buildState?.weaponEvolutions ?? {}).filter((k) => player?.buildState?.weaponEvolutions[k]),
    baseStats: buildAttack.baseStats,
    finalStats: buildAttack.finalStats,
  });
}

function getAttackPatternConfig(weapon = null) {
  if (!weapon) {
    return WEAPON_ATTACK_PATTERNS.arcSlash;
  }
  const attackPattern = weapon.attackPattern ?? weapon.archetype?.attackPattern ?? weapon.combat?.attackPattern;
  if (!attackPattern) {
    logWeaponFallback("missing attackPattern");
    return WEAPON_ATTACK_PATTERNS.arcSlash;
  }
  const pattern = WEAPON_ATTACK_PATTERNS[attackPattern];
  if (!pattern) {
    logWeaponFallback(`unknown attackPattern ${attackPattern}`);
    return WEAPON_ATTACK_PATTERNS.arcSlash;
  }
  return pattern;
}

export function getAttackSpec(weaponProfile = null, playerFacing = 1) {
  const archetype = resolveSpecArchetype(weaponProfile);
  const pattern = resolveSpecPattern(archetype, weaponProfile);
  const patternConfig = WEAPON_ATTACK_PATTERNS[pattern] ?? WEAPON_ATTACK_PATTERNS.arcSlash;
  const baseRange = getProfileRange(weaponProfile, patternConfig.range);
  const facing = normalizeFacing(playerFacing);
  const spec = createDefaultAttackSpec(archetype, pattern, baseRange, patternConfig, facing);
  return {
    archetype: spec.archetype,
    pattern: spec.pattern,
    facing,
    range: spec.range,
    width: spec.width,
    height: spec.height,
    forwardOffset: spec.forwardOffset,
    verticalOffset: spec.verticalOffset,
    arcRadius: spec.arcRadius,
    arcAngle: spec.arcAngle,
    activeStart: patternConfig.startupFrames,
    activeEnd: patternConfig.startupFrames + patternConfig.activeFrames,
    visualRange: spec.visualRange,
    visualWidth: spec.visualWidth,
    visualHeight: spec.visualHeight,
    visualArcRadius: spec.visualArcRadius,
    visualArcAngle: spec.visualArcAngle,
    hitShape: spec.hitShape,
  };
}

function createDefaultAttackSpec(archetype, pattern, baseRange, patternConfig, facing) {
  if (archetype === "spear") {
    const range = clampNumber(baseRange, 80, 100, 86);
    const height = 26;
    const width = Math.round(range * 0.96);
    return createLinearSpec({
      archetype,
      pattern,
      range,
      width,
      height,
      forwardOffset: Math.round(range * 0.56),
      verticalOffset: -2,
      hitShape: {
        type: "capsule",
        startOffset: 8,
        endOffset: Math.round(range * HITBOX_FORGIVENESS),
        radius: Math.round(height * 0.5),
      },
    });
  }

  if (archetype === "dagger") {
    const range = clampNumber(baseRange, 32, 42, 38);
    return createLinearSpec({
      archetype,
      pattern,
      range,
      width: Math.round(range * 1.05),
      height: 34,
      forwardOffset: Math.round(range * 0.58),
      verticalOffset: -1,
      hitShape: { type: "rect" },
    });
  }

  if (archetype === "hammer") {
    const range = clampNumber(baseRange, 46, 58, 52);
    const width = 74;
    const height = 64;
    return createLinearSpec({
      archetype,
      pattern,
      range,
      width,
      height,
      forwardOffset: Math.round(range * 0.62),
      verticalOffset: -1,
      hitShape: {
        type: "ellipse",
        radiusX: Math.round(width * 0.58),
        radiusY: Math.round(height * 0.52),
      },
    });
  }

  if (archetype === "whip") {
    const range = clampNumber(baseRange, 90, 120, 108);
    const height = 22;
    return createLinearSpec({
      archetype,
      pattern,
      range,
      width: Math.round(range * 0.98),
      height,
      forwardOffset: Math.round(range * 0.56),
      verticalOffset: -2,
      hitShape: {
        type: "whipSegments",
        segments: buildWhipSegments(range, height),
      },
    });
  }

  if (archetype === "staff") {
    const range = clampNumber(baseRange, 62, 82, 70);
    return createLinearSpec({
      archetype,
      pattern,
      range,
      width: Math.round(range * 1.02),
      height: 38,
      forwardOffset: Math.round(range * 0.54),
      verticalOffset: -1,
      hitShape: { type: "rect" },
    });
  }

  if (archetype === "shield") {
    const range = clampNumber(baseRange, 36, 46, 38);
    return createLinearSpec({
      archetype,
      pattern,
      range,
      width: 50,
      height: 48,
      forwardOffset: Math.round(range * 0.63),
      verticalOffset: -1,
      hitShape: { type: "rect" },
    });
  }

  const range = clampNumber(baseRange, 48, 60, 56);
  const arcAngle = 118;
  const height = 48;
  const width = 62;
  return createLinearSpec({
    archetype: "sword",
    pattern: "arcSlash",
    range,
    width,
    height,
    forwardOffset: Math.round(range * 0.58),
    verticalOffset: -2,
    arcRadius: Math.round(range * HITBOX_FORGIVENESS),
    arcAngle,
    hitShape: {
      type: "arcSegments",
      closeRadius: 26,
      segments: buildArcSlashSegments(range, arcAngle, height, facing),
    },
  });
}

function createLinearSpec({ archetype, pattern, range, width, height, forwardOffset, verticalOffset, arcRadius = range, arcAngle = 0, hitShape }) {
  return {
    archetype,
    pattern,
    range,
    width: Math.round(width * HITBOX_FORGIVENESS),
    height: Math.round(height * HITBOX_FORGIVENESS),
    forwardOffset,
    verticalOffset,
    arcRadius,
    arcAngle,
    visualRange: Math.round(range / HITBOX_FORGIVENESS),
    visualWidth: Math.round(width),
    visualHeight: Math.round(height),
    visualArcRadius: Math.round(arcRadius / HITBOX_FORGIVENESS),
    visualArcAngle: Math.round(arcAngle / HITBOX_FORGIVENESS),
    hitShape,
  };
}

// Build a dense fan of capsule segments approximating the arc slash sweep.
// The close segment covers the near-field around the player, while the fan
// segments radiate outward at evenly-spaced angles to eliminate gaps.
function buildArcSlashSegments(range, arcAngleDegrees, height) {
  const halfArc = degreesToRadians(arcAngleDegrees) / 2;
  const baseRadius = Math.max(14, Math.round(height * 0.34));
  const closeRadius = Math.round(height * 0.52);
  const fanCount = 13; // odd so 0 deg is always included
  const fanStep = (halfArc * 2) / (fanCount - 1);
  const segments = [];

  // Near-field safety net: wide capsule from origin to ~45% range at attack angle.
  segments.push({
    index: 0,
    label: "close",
    startOffset: 0,
    endOffset: Math.round(range * 0.45),
    angleOffset: 0,
    radius: closeRadius,
  });

  // Fan segments: uniform angular spacing, slight radius taper at edges.
  for (let i = 0; i < fanCount; i++) {
    const angleOffset = -halfArc + i * fanStep;
    // Radius tapers toward the extremes so the blade feels natural.
    const edgeT = Math.abs(angleOffset) / halfArc; // 0 at center, 1 at edge
    const radius = Math.round(baseRadius * (1 - edgeT * 0.22));
    const index = i + 1;
    const label =
      Math.abs(angleOffset) < 0.01 ? "fan-center" :
      angleOffset < 0 ? "fan-upper" : "fan-lower";

    segments.push({
      index,
      label: `${label}-${index}`,
      // Inner startOffset: overlap with close segment and adjacent fan segments.
      startOffset: Math.round(range * 0.28),
      // Extend well past visual range for forgiveness.
      endOffset: Math.round(range * 1.12),
      angleOffset,
      radius,
    });
  }

  return segments;
}

function buildWhipSegments(range, height) {
  const radius = Math.max(9, Math.round(height * 0.48));
  return [
    { index: 0, label: "handle", startOffset: 8, endOffset: Math.round(range * 0.36), angleOffset: 0, radius },
    { index: 1, label: "middle", startOffset: Math.round(range * 0.32), endOffset: Math.round(range * 0.72), angleOffset: -0.12, radius: Math.round(radius * 0.88) },
    { index: 2, label: "tip", startOffset: Math.round(range * 0.68), endOffset: Math.round(range * 1.1), angleOffset: -0.2, radius: Math.round(radius * 0.76) },
  ];
}

function resolveSpecArchetype(weaponProfile) {
  const raw = String(
    weaponProfile?.archetype?.id ??
      weaponProfile?.weaponArchetype ??
      weaponProfile?.weaponType ??
      weaponProfile?.combat?.weaponArchetype ??
      weaponProfile?.combat?.type ??
      ""
  ).toLowerCase();
  const pattern = String(weaponProfile?.attackPattern ?? weaponProfile?.archetype?.attackPattern ?? weaponProfile?.combat?.attackPattern ?? "").toLowerCase();
  if (raw.includes("spear") || pattern.includes("thrust")) return "spear";
  if (raw.includes("dagger")) return "dagger";
  if (raw.includes("hammer") || raw.includes("axe") || pattern.includes("smash") || pattern.includes("slam")) return "hammer";
  if (raw.includes("whip") || raw.includes("line_whip") || pattern.includes("whip")) return "whip";
  if (raw.includes("shield") || pattern.includes("bash")) return "shield";
  if (raw.includes("staff")) return "staff";
  return "sword";
}

function resolveSpecPattern(archetype, weaponProfile) {
  const explicit = weaponProfile?.attackPattern ?? weaponProfile?.archetype?.attackPattern ?? weaponProfile?.combat?.attackPattern;
  if (explicit && WEAPON_ATTACK_PATTERNS[explicit]) return explicit;
  if (archetype === "spear") return "thrust";
  if (archetype === "dagger") return "daggerSlash";
  if (archetype === "hammer") return "heavySmash";
  if (archetype === "whip") return "whipLash";
  if (archetype === "shield") return "guardBash";
  if (archetype === "staff") return "staffSpin";
  return "arcSlash";
}

function getProfileRange(weaponProfile, fallback) {
  const range = weaponProfile?.finalStats?.range ?? weaponProfile?.combat?.range ?? weaponProfile?.reach ?? fallback;
  return Number.isFinite(range) ? range : fallback;
}

function getVisualAttackLength(pattern, weapon) {
  const range = getAttackRange(pattern, weapon);
  return Math.max(34, Math.min(96, range));
}

function getHitboxForwardOffset(pattern, range) {
  const baseRange = Number.isFinite(pattern.range) && pattern.range > 0 ? pattern.range : 56;
  const baseOffset = Number.isFinite(pattern.forwardOffset) ? pattern.forwardOffset : 34;
  return Math.round(range * (baseOffset / baseRange));
}

function getAirFootHitbox(player, centerX, centerY) {
  if (player?.onGround !== false) return null;
  const width = 28;
  const height = 12;
  const footY = centerY + (player?.h ?? 22) / 2;
  return {
    x: centerX - width / 2,
    y: footY - 2,
    w: width,
    h: height,
    centerX,
    centerY: footY + height / 2 - 2,
  };
}

function getAttackRange(pattern, weapon) {
  const profileRange = weapon?.finalStats?.range;
  const baseRange = weapon?.archetype?.baseRange ?? weapon?.archetype?.baseStats?.range ?? pattern.range;
  const fallback = 56;
  const range = Number.isFinite(profileRange) ? profileRange : Number.isFinite(baseRange) ? baseRange : fallback;
  if (pattern.id === "thrust") return Math.max(86, range);
  if (pattern.id === "arcSlash") return Math.max(56, range);
  if (pattern.id === "daggerSlash") return Math.min(42, Math.max(32, range));
  if (pattern.id === "whipLash") return Math.max(90, range);
  if (pattern.id === "staffSpin") return Math.max(62, range);
  if (pattern.id === "heavySmash") return Math.min(52, Math.max(48, range));
  if (pattern.id === "guardBash") return Math.min(42, Math.max(38, range));
  return range;
}

function getHitstopFrames(pattern) {
  return Math.max(1, Math.round((pattern.hitstopSeconds ?? 0.05) * FRAMES_PER_SECOND));
}

function getAttackFrameScale(pattern, attackSpeed) {
  const baseSpeed = pattern.attackSpeed ?? getDefaultAttackSpeed(pattern);
  const speed = Number(attackSpeed);
  if (!Number.isFinite(speed) || speed <= 0) return 1;
  return Math.max(0.5, Math.min(1.7, baseSpeed / speed));
}

function getDefaultAttackSpeed(pattern) {
  const frames = pattern.startupFrames + pattern.activeFrames + pattern.recoveryFrames;
  return FRAMES_PER_SECOND / Math.max(1, frames);
}

function scaleFrames(frames, scale) {
  return Math.max(1, Math.round(frames * scale));
}

function getAttackSpeedFromUseTime(useTime) {
  const number = Number(useTime);
  if (!Number.isFinite(number) || number <= 0) return null;
  return FRAMES_PER_SECOND / number;
}

function getComboResetFrames() {
  return Math.round(BASIC_SLASH_ATTACK.comboResetSeconds * FRAMES_PER_SECOND);
}

function getWeaponDamage(weapon) {
  const damage = weapon?.finalStats?.damage ?? weapon?.combat?.damage ?? BASIC_SLASH_ATTACK.damage;
  if (weapon && !weapon?.finalStats?.damage && !weapon?.combat?.damage) logWeaponFallback("missing damage");
  return Number.isFinite(damage) ? damage : BASIC_SLASH_ATTACK.damage;
}

function getWeaponAttackSpeed(weapon, pattern) {
  const speed = weapon?.finalStats?.attackSpeed ?? weapon?.combat?.attackSpeed ?? getDefaultAttackSpeed(pattern);
  return Number.isFinite(speed) ? speed : getDefaultAttackSpeed(pattern);
}

function getWeaponKnockback(weapon) {
  const knockback = weapon?.finalStats?.knockback ?? weapon?.combat?.knockback ?? weapon?.archetype?.baseStats?.knockback ?? 3.8;
  return Number.isFinite(knockback) ? knockback : 3.8;
}

function normalizeFacing(facing) {
  return facing < 0 ? -1 : 1;
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function getVisualBounds(spec, attackAngle) {
  if (!spec) return null;
  return {
    type: spec.hitShape?.type ?? "rect",
    angle: attackAngle,
    range: spec.visualRange,
    width: spec.visualWidth,
    height: spec.visualHeight,
    arcRadius: spec.visualArcRadius,
    arcAngle: spec.visualArcAngle,
  };
}

function logAttackSpec(spec, facing) {
  console.log("[AttackSpec]", {
    archetype: spec.archetype,
    pattern: spec.pattern,
    facing,
    range: spec.range,
    width: spec.width,
    height: spec.height,
    forwardOffset: spec.forwardOffset,
  });
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function logWeaponFallback(reason) {
  console.warn(`[WeaponFallback] reason: ${reason}`);
}







