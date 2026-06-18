export const DEBUG_WEAPON_ANCHOR = true;
export const DEBUG_HAND_POINT = false;
export const DEBUG_WEAPON_DIRECTION = true;
export const DEBUG_WEAPON_RENDER_COUNT = false;

export const weaponVisual = {
  displayLength: 52,
  handOffsetX: 7,
  handOffsetY: -3,
  anchorX: 0.15,
  anchorY: 0.65,
  idleTiltDegrees: 15,
  swingArcDegrees: 75,
  startupEase: "easeOut",
  activeEase: "easeOut",
  recoveryEase: "easeInOut",
  trailEnabled: true,
};

const imageCache = new Map();
let renderFrameToken = -1;
let renderCount = 0;

export function draw(ctx, player, weapon = null, attackState = player.attack, placement = {}) {
  trackRenderCount(player);
  const config = getVisualConfig(player, weapon);
  const x = placement.x ?? Math.floor(player.x);
  const y = placement.y ?? Math.floor(player.y);
  const flip = placement.flip ?? (player.facing < 0 ? -1 : 1);
  const state = getWeaponState(player, attackState);
  const hand = getHandPosition(x, y, state.facing < 0 ? -1 : 1, config);
  const pose = getWeaponPose(config, state, flip);
  const handX = hand.x + pose.handOffsetX;
  const handY = hand.y + pose.handOffsetY;
  const drawInfo = {
    playerFacing: player.facing,
    attackAngle: state.attackAngle,
    weaponDrawAngle: pose.angle,
    handX,
    handY,
  };

  drawMotionTrail(ctx, {
    src: getWeaponImage(player, weapon),
    handX,
    handY,
    pose,
    config,
    facing: state.facing,
  });
  drawWeaponAtHand(ctx, {
    src: getWeaponImage(player, weapon),
    handX,
    handY,
    angle: pose.angle,
    length: pose.length,
    config,
    facing: state.facing,
    alpha: 0.98,
    showDebug: true,
    drawInfo,
  });
}

function drawWeaponAtHand(ctx, { src, handX, handY, angle, length, config, facing = 1, alpha = 0.96, showDebug = false, drawInfo = null }) {
  const sprite = getSprite(src);
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(angle);
  if (facing < 0) ctx.scale(1, -1);
  ctx.globalAlpha = alpha;

  if (sprite?.ready) {
    drawCroppedImage(ctx, sprite, length, config);
  } else {
    drawDefaultShortSword(ctx, length, config);
  }

  if (showDebug && DEBUG_WEAPON_ANCHOR) {
    ctx.fillStyle = "#d72e43";
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  if (showDebug && DEBUG_HAND_POINT) {
    ctx.save();
    ctx.fillStyle = "#71d6ff";
    ctx.beginPath();
    ctx.arc(handX, handY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (showDebug && DEBUG_WEAPON_DIRECTION) drawDirectionDebug(ctx, drawInfo);
}

function drawCroppedImage(ctx, sprite, length, config) {
  const crop = sprite.crop;
  const drawW = length;
  const drawH = Math.max(6, length * crop.aspectRatio);
  ctx.drawImage(
    sprite.image,
    crop.x,
    crop.y,
    crop.w,
    crop.h,
    -config.anchorX * drawW,
    -config.anchorY * drawH,
    drawW,
    drawH
  );
}

function drawDefaultShortSword(ctx, length, config) {
  const hiltX = -config.anchorX * length;
  const y = -config.anchorY * 8;
  ctx.fillStyle = "#1d1c1a";
  ctx.fillRect(hiltX, y + 2, length, 4);
  ctx.fillStyle = "#f5f5dc";
  ctx.fillRect(hiltX + 5, y + 3, length - 9, 2);
  ctx.fillStyle = "#d8cfb8";
  ctx.fillRect(hiltX - 2, y, 5, 8);
}

function getSprite(src) {
  if (!src) return null;
  let sprite = imageCache.get(src);
  if (sprite) return sprite;

  const image = new Image();
  sprite = {
    image,
    ready: false,
    crop: { x: 0, y: 0, w: 1, h: 1, aspectRatio: 1 },
  };
  image.onload = () => {
    sprite.crop = findOpaqueBounds(image);
    sprite.ready = true;
  };
  image.src = src;
  imageCache.set(src, sprite);
  return sprite;
}

function findOpaqueBounds(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= 8) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return normalizeCrop({ x: 0, y: 0, w: width, h: height });
  return normalizeCrop({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
}

function normalizeCrop(crop) {
  return {
    ...crop,
    aspectRatio: Math.max(0.12, Math.min(1.6, crop.h / Math.max(1, crop.w))),
  };
}

function getHandPosition(x, y, flip, config) {
  return {
    x: x + flip * config.handOffsetX,
    y: y + 16 + config.handOffsetY,
  };
}

function getVisualConfig(player) {
  return { ...weaponVisual, ...normalizeVisualPreset(player.weaponVisualPreset) };
}

function normalizeVisualPreset(preset) {
  if (!preset || typeof preset !== "object") return {};
  const next = {};
  const allowedKeys = [
    "displayLength",
    "handOffsetX",
    "handOffsetY",
    "anchorX",
    "anchorY",
    "idleTiltDegrees",
    "swingArcDegrees",
    "startupEase",
    "activeEase",
    "recoveryEase",
    "trailEnabled",
  ];

  // Ignore older WeaponProfile visual presets unless they have the new displayLength field.
  if (!hasOwn(preset, "displayLength")) return next;

  for (const key of allowedKeys) {
    if (hasOwn(preset, key)) next[key] = preset[key];
  }
  return next;
}

function getWeaponState(player, attackState) {
  const attack = attackState ?? player.attack;
  const facing = normalizeFacing(attack?.isAttacking ? attack.facing : player.facing);
  const fallbackAttackAngle = facing < 0 ? Math.PI : 0;
  const attackAngle = Number.isFinite(attack?.attackAngle)
    ? attack.attackAngle
    : Number.isFinite(attack?.angle)
      ? attack.angle
      : fallbackAttackAngle;
  return {
    attack,
    facing,
    phase: attack?.isAttacking ? attack.phase : "idle",
    isAttacking: Boolean(attack?.isAttacking),
    progress: getPhaseProgress(attack),
    angle: attackAngle,
    attackAngle,
    attackSpec: attack?.attackSpec ?? null,
    visualAttackLength: Number.isFinite(attack?.attackSpec?.visualRange)
      ? attack.attackSpec.visualRange
      : Number.isFinite(attack?.visualAttackLength)
        ? attack.visualAttackLength
        : configDisplayLengthFallback(),
    attackPattern: attack?.attackPattern ?? player.weaponAttackPattern ?? "arcSlash",
    animationPreset: attack?.animationPreset ?? { name: attack?.attackPattern ?? player.weaponAttackPattern ?? "arcSlash" },
  };
}

function getWeaponPose(config, state, idleFlip) {
  const idleFacing = state.isAttacking ? state.facing : idleFlip;
  const idleAngle = getIdleAngle(idleFacing, config);
  if (!state.isAttacking) return createPose(idleAngle, config.displayLength);

  const name = state.animationPreset?.name ?? state.attackPattern;
  if (name === "thrust") return getThrustPose(config, state, idleAngle);
  if (name === "heavySmash") return getHeavySmashPose(config, state, idleAngle);
  if (name === "guardBash") return getGuardBashPose(config, state, idleAngle);
  if (name === "daggerSlash") return getDaggerSlashPose(config, state, idleAngle);
  if (name === "whipLash") return getWhipLashPose(config, state, idleAngle);
  if (name === "staffSpin") return getStaffSpinPose(config, state, idleAngle);
  return getArcSlashPose(config, state, idleAngle);
}

function getArcSlashPose(config, state, idleAngle) {
  const preset = state.animationPreset ?? {};
  const length = getAttackDisplayLength(config, state);
  const arc = degreesToRadians(state.attackSpec?.visualArcAngle ?? preset.swingArcDegrees ?? config.swingArcDegrees);
  const swingStart = state.angle - arc / 2;
  const swingEnd = state.angle + arc / 2;

  if (state.phase === "startup") {
    const t = applyEase(state.progress, config.startupEase);
    const angle = lerpAngle(idleAngle, swingStart, t);
    return createPose(angle, length, 0, 0, getTrailAngles(idleAngle, angle, 2));
  }

  if (state.phase === "active") {
    const t = applyEase(state.progress, config.activeEase);
    const angle = lerpAngle(swingStart, swingEnd, t);
    return createPose(angle, length, 0, 0, getTrailAngles(swingStart, angle, preset.trailCount ?? 4));
  }

  const t = applyEase(state.progress, config.recoveryEase);
  const angle = lerpAngle(swingEnd, idleAngle, t);
  return createPose(angle, length, 0, 0, getTrailAngles(swingEnd, angle, 2));
}

function getThrustPose(config, state, idleAngle) {
  const preset = state.animationPreset ?? {};
  const length = getAttackDisplayLength(config, state);
  const rotation = degreesToRadians(preset.rotationDegrees ?? 6);
  const thrust = preset.thrustPixels ?? 34;
  const startAngle = state.angle - rotation / 2;
  const endAngle = state.angle + rotation / 2;
  const alignT = state.phase === "startup" ? easeOut(state.progress) : 1;
  const angle = state.phase === "active" ? lerpAngle(startAngle, endAngle, state.progress) : lerpAngle(idleAngle, state.angle, alignT);
  const push = state.phase === "startup"
    ? thrust * 0.25 * easeOut(state.progress)
    : state.phase === "active"
      ? thrust * easeOut(state.progress)
      : thrust * (1 - easeInOut(state.progress));
  return createPose(
    angle,
    length * (preset.lengthScale ?? 1.22),
    Math.cos(state.angle) * push,
    Math.sin(state.angle) * push,
    getTrailAngles(idleAngle, angle, preset.trailCount ?? 2)
  );
}

function getHeavySmashPose(config, state, idleAngle) {
  const preset = state.animationPreset ?? {};
  const length = getAttackDisplayLength(config, state);
  const swingStart = state.angle + degreesToRadians(preset.windupDegrees ?? -120);
  const swingEnd = state.angle + degreesToRadians(preset.impactDegrees ?? 48);
  if (state.phase === "startup") {
    const angle = lerpAngle(idleAngle, swingStart, easeInOut(state.progress));
    return createPose(angle, length * 1.08, 0, 0, getTrailAngles(idleAngle, angle, 2));
  }
  if (state.phase === "active") {
    const angle = lerpAngle(swingStart, swingEnd, easeIn(state.progress));
    return createPose(angle, length * (preset.activeScale ?? 1.24), 0, 0, getTrailAngles(swingStart, angle, preset.trailCount ?? 6));
  }
  const angle = lerpAngle(swingEnd, idleAngle, easeOut(state.progress));
  return createPose(angle, length, 0, 0, getTrailAngles(swingEnd, angle, 2));
}

function getGuardBashPose(config, state, idleAngle) {
  const preset = state.animationPreset ?? {};
  const length = getAttackDisplayLength(config, state);
  const rotation = degreesToRadians(preset.rotationDegrees ?? 3);
  const bashAngle = state.angle + (state.facing < 0 ? -rotation : rotation);
  const bashPixels = preset.bashPixels ?? 18;
  const push = state.phase === "startup"
    ? bashPixels * 0.35 * easeOut(state.progress)
    : state.phase === "active"
      ? bashPixels
      : bashPixels * (1 - easeInOut(state.progress));
  const angle = state.phase === "startup" ? lerpAngle(idleAngle, bashAngle, easeOut(state.progress)) : bashAngle;
  return createPose(angle, length * (preset.lengthScale ?? 0.82), Math.cos(state.angle) * push, Math.sin(state.angle) * push, getTrailAngles(idleAngle, angle, preset.trailCount ?? 1));
}

// Dagger: Quick multi-strike with rapid flicking motion.
// Visually distinct from sword - faster, shorter, with an oscillating zigzag.
function getDaggerSlashPose(config, state, idleAngle) {
  const preset = state.animationPreset ?? {};
  const length = getAttackDisplayLength(config, state);
  const arc = degreesToRadians(preset.slashArcDegrees ?? 65);
  const flickAmp = degreesToRadians(preset.flickAmplitude ?? 12);
  const flickSpeed = preset.flickSpeed ?? 2.2;
  const slashStart = state.angle - arc / 2;
  const slashEnd = state.angle + arc / 2;

  if (state.phase === "startup") {
    // Quick flick from idle to slash start
    const t = easeIn(state.progress);
    const angle = lerpAngle(idleAngle, slashStart, t);
    return createPose(angle, length * 0.9);
  }

  if (state.phase === "active") {
    const t = state.progress;
    // Main slash with rapid oscillation for a "flickering" dagger feel
    const baseAngle = lerpAngle(slashStart, slashEnd, easeOut(t));
    const flick = Math.sin(t * Math.PI * flickSpeed) * flickAmp * (1 - t * 0.6);
    const angle = baseAngle + flick;
    return createPose(angle, length, 0, 0, getTrailAngles(slashStart, angle, preset.trailCount ?? 3));
  }

  // Recovery: snap back quickly
  const t = easeIn(state.progress);
  const angle = lerpAngle(slashEnd, idleAngle, t);
  return createPose(angle, length, 0, 0, getTrailAngles(slashEnd, angle, 1));
}

// Whip: Cracking whip with long windback, extended length, and wave curve.
// Visually distinct from spear - longer delay, dramatic crack, length extension.
function getWhipLashPose(config, state, idleAngle) {
  const preset = state.animationPreset ?? {};
  const length = getAttackDisplayLength(config, state);
  const windback = degreesToRadians(preset.windbackDegrees ?? -50);
  const crack = degreesToRadians(preset.crackDegrees ?? 22);
  const crackDist = preset.crackPixels ?? 58;
  const waveSegments = preset.waveSegments ?? 5;

  if (state.phase === "startup") {
    // Wind the whip back behind the character
    const t = easeInOut(state.progress);
    const angle = lerpAngle(idleAngle, state.angle + windback, t);
    // Slight length reduction during windup
    return createPose(angle, length * 0.82, 0, 0, getTrailAngles(idleAngle, angle, 2));
  }

  if (state.phase === "active") {
    // Crack forward with extended length and wave effect
    const t = easeOut(state.progress);
    const angle = lerpAngle(state.angle + windback, state.angle + crack, t);
    const extLength = length * (1 + (preset.lengthScale ?? 1.52) - 1) * t;
    // Forward push as the whip cracks
    const pushX = Math.cos(state.angle) * crackDist * t;
    const pushY = Math.sin(state.angle) * crackDist * t;
    // Wave oscillation along the whip
    const wave = Math.sin(t * Math.PI * waveSegments) * 4 * (1 - t * 0.3);
    const waveAngle = angle + degreesToRadians(wave);
    return createPose(waveAngle, extLength, pushX, pushY, getTrailAngles(state.angle + windback, angle, preset.trailCount ?? 6));
  }

  // Recovery: pull back and snap to idle
  const t = easeOut(state.progress);
  const angle = lerpAngle(state.angle + crack, idleAngle, t);
  const extLength = length * (1 + (preset.lengthScale ?? 1.52) - 1) * (1 - t);
  return createPose(angle, extLength, 0, 0, getTrailAngles(state.angle + crack, angle, 2));
}

// Staff: Wide spinning sweep around the character.
// Visually distinct from sword - much wider arc, spins around the body.
function getStaffSpinPose(config, state, idleAngle) {
  const preset = state.animationPreset ?? {};
  const length = getAttackDisplayLength(config, state);
  const spinArc = degreesToRadians(preset.spinArcDegrees ?? 210);
  const spinOffset = degreesToRadians(preset.spinOffsetDegrees ?? -30);

  // Staff sweep starts offset from attack angle so it spins through the target
  const spinStart = state.angle + spinOffset - spinArc / 2;
  const spinEnd = state.angle + spinOffset + spinArc / 2;

  if (state.phase === "startup") {
    // Begin rotation from idle into the spin start position
    const t = easeInOut(state.progress);
    const angle = lerpAngle(idleAngle, spinStart, t);
    return createPose(angle, length, 0, 0, getTrailAngles(idleAngle, angle, 2));
  }

  if (state.phase === "active") {
    // Full sweep across the wide arc
    const t = easeOut(state.progress);
    const angle = lerpAngle(spinStart, spinEnd, t);
    const extLength = length * (preset.lengthScale ?? 1.18);
    return createPose(angle, extLength, 0, 0, getTrailAngles(spinStart, angle, preset.trailCount ?? 5));
  }

  // Recovery: rotate back to idle
  const t = easeInOut(state.progress);
  const angle = lerpAngle(spinEnd, idleAngle, t);
  return createPose(angle, length, 0, 0, getTrailAngles(spinEnd, angle, 2));
}

function createPose(angle, length, handOffsetX = 0, handOffsetY = 0, trailAngles = []) {
  return { angle, length, handOffsetX, handOffsetY, trailAngles };
}

function drawMotionTrail(ctx, { src, handX, handY, pose, config, facing }) {
  if (!config.trailEnabled || pose.trailAngles.length === 0) return;
  const count = pose.trailAngles.length;
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    drawWeaponAtHand(ctx, {
      src,
      handX,
      handY,
      angle: pose.trailAngles[i],
      length: pose.length,
      config,
      facing,
      alpha: 0.08 + t * 0.08,
      showDebug: false,
    });
  }
}

function getIdleAngle(facing, config) {
  const tilt = degreesToRadians(config.idleTiltDegrees);
  return facing > 0 ? tilt : Math.PI - tilt;
}

function getTrailAngles(from, to, count) {
  if (count <= 0) return [];
  const angles = [];
  for (let i = count; i >= 1; i--) {
    angles.push(lerpAngle(from, to, i / (count + 1)));
  }
  return angles;
}

function applyEase(t, type) {
  if (type === "easeIn") return easeIn(t);
  if (type === "easeInOut") return easeInOut(t);
  return easeOut(t);
}

function getPhaseProgress(attack) {
  if (!attack?.isAttacking) return 0;
  if (attack.phase === "startup") {
    return Math.max(0, Math.min(1, attack.frame / Math.max(1, attack.startupFrames)));
  }
  if (attack.phase === "active") {
    return Math.max(0, Math.min(1, (attack.frame - attack.startupFrames) / Math.max(1, attack.activeFrames)));
  }
  if (attack.phase === "recovery") {
    const completed = attack.startupFrames + attack.activeFrames;
    return Math.max(0, Math.min(1, (attack.frame - completed) / Math.max(1, attack.recoveryFrames)));
  }
  return 0;
}

function getWeaponImage(player, weapon) {
  return weapon?.imageDataUrl ?? player.weaponImageDataUrl;
}

function trackRenderCount(player) {
  const token = getFrameToken(player);
  if (token !== renderFrameToken) {
    renderFrameToken = token;
    renderCount = 0;
  }
  renderCount++;
  if (DEBUG_WEAPON_RENDER_COUNT && renderCount > 1) {
    console.warn("[WeaponSpriteRenderer] weapon rendered more than once in one frame", {
      count: renderCount,
      frame: token,
      playerX: player.x,
      playerY: player.y,
    });
  }
}

function getFrameToken(player) {
  return player?.animFrame ?? (typeof performance !== "undefined" && performance.now ? Math.floor(performance.now()) : Date.now());
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * t;
}

function easeIn(t) {
  return t * t;
}

function easeOut(t) {
  return 1 - (1 - t) * (1 - t);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function getAttackDisplayLength(config, state) {
  if (!state.isAttacking) return config.displayLength;
  return Math.max(32, Math.min(104, state.visualAttackLength || config.displayLength));
}

function configDisplayLengthFallback() {
  return weaponVisual.displayLength;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeFacing(value) {
  return value < 0 ? -1 : 1;
}

function drawDirectionDebug(ctx, info) {
  if (!info) return;
  ctx.save();
  ctx.font = "10px Consolas, monospace";
  ctx.fillStyle = "#71d6ff";
  const x = info.handX + 8;
  const y = info.handY - 26;
  ctx.fillText(`f ${normalizeFacing(info.playerFacing)}`, x, y);
  ctx.fillText(`a ${info.attackAngle.toFixed(2)}`, x, y + 12);
  ctx.fillText(`w ${info.weaponDrawAngle.toFixed(2)}`, x, y + 24);
  ctx.fillText(`h ${Math.round(info.handX)},${Math.round(info.handY)}`, x, y + 36);
  ctx.restore();
}

