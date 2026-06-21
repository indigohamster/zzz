const MODEL_PATH = "../../assets/sprites/models/";
const MODEL_ASSET_VERSION = "typed-motion-packs-v13";

const MODEL_DEFS = {
  protagonist: {
    ...modelPack("player/protagonist", "hero", "#7dd3fc", 60),
    variants: {
      front: "turnaround/front.png",
      back: "turnaround/back.png",
      drawing: "turnaround/drawing.png",
    },
  },
  inkdot: modelPack("companions/inkdot", "companion", "#37d8ff", 30),
  supply_keeper: modelPack("story_npcs/supply_keeper", "npc", "#f2b84b", 46),
  forgotten_draft: modelPack("story_npcs/forgotten_draft", "npc", "#d8cfb8", 46),
  deleted_character: modelPack("story_npcs/deleted_character", "rift", "#c9a8d8", 54),
  zhou_redline_shadow: modelPack("story_npcs/zhou_redline_shadow", "pressure", "#ff4b55", 66),
  office_zhou: modelPack("office_npcs/office_zhou", "office", "#f2b84b", 58),
  office_mira: modelPack("office_npcs/office_mira", "office", "#7dd3fc", 58),
  office_ren: modelPack("office_npcs/office_ren", "office", "#86c06c", 58),
  office_client: modelPack("office_npcs/office_client", "office", "#b23b48", 58),
  monster_cube: modelPack("monsters/monster_cube", "monster", "#d8cfb8", 38),
  monster_eye_spider: modelPack("monsters/monster_eye_spider", "monster", "#f0d9a5", 34),
  monster_book: modelPack("monsters/monster_book", "monster", "#b23b48", 46),
  monster_worm: modelPack("monsters/monster_worm", "monster", "#7dd3fc", 36),
  monster_kite: modelPack("monsters/monster_kite", "monster", "#f2b84b", 42),
  monster_inkpot: modelPack("monsters/monster_inkpot", "monster", "#ff5166", 46),
  boss_portal_machine: modelPack("bosses/boss_portal_machine", "boss", "#37d8ff", 92),
  boss_stone_brute: modelPack("bosses/boss_stone_brute", "boss", "#d8cfb8", 92),
  boss_printer_beast: modelPack("bosses/boss_printer_beast", "boss", "#ff3b4e", 82),

  zhou: { alias: "office_zhou" },
  mira: { alias: "office_mira" },
  ren: { alias: "office_ren" },
  client: { alias: "office_client" },
  sketchling: { alias: "monster_cube" },
  inkmite: { alias: "monster_eye_spider" },
  binder: { alias: "monster_book" },
  margin_eel: { alias: "monster_worm" },
  paper_kite: { alias: "monster_kite" },
  blot_sentinel: { alias: "monster_inkpot" },
  template_engine: { alias: "boss_portal_machine" },
  eraser_warden: { alias: "boss_stone_brute" },
  printhead_maw: { alias: "boss_printer_beast" },
};

MODEL_DEFS.protagonist.animations = {};
MODEL_DEFS.protagonist.animations.idle = { file: "idle_strip.png", frames: 8, fps: 8, loop: true };
MODEL_DEFS.protagonist.animations.walk = { file: "walk_strip.png", frames: 12, fps: 12, loop: true };
MODEL_DEFS.protagonist.animations.run = { file: "run_strip.png", frames: 12, fps: 15, loop: true };
MODEL_DEFS.protagonist.animations.draw = { file: "draw_strip.png", frames: 8, fps: 8, loop: true };
MODEL_DEFS.protagonist.animations.jump = { file: "jump_strip.png", frames: 6, fps: 10, loop: false };
MODEL_DEFS.protagonist.animations.hurt = { file: "hurt_strip.png", frames: 4, fps: 12, loop: false };
MODEL_DEFS.protagonist.anchor = { x: 0.5, y: 0.965 };
MODEL_DEFS.protagonist.animations.idle.anchor = MODEL_DEFS.protagonist.anchor;
MODEL_DEFS.protagonist.animations.walk.anchor = MODEL_DEFS.protagonist.anchor;
MODEL_DEFS.protagonist.animations.run.anchor = MODEL_DEFS.protagonist.anchor;
MODEL_DEFS.protagonist.animations.draw.anchor = MODEL_DEFS.protagonist.anchor;
MODEL_DEFS.protagonist.animations.jump.anchor = MODEL_DEFS.protagonist.anchor;
MODEL_DEFS.protagonist.animations.hurt.anchor = MODEL_DEFS.protagonist.anchor;
MODEL_DEFS.protagonist.animations.idle.anchors = protagonistAnchors([[1, -1], [2, -2], [1, -2], [0, -2], [-1, -1], [-2, -1], [-1, 0], [0, -1]]);
MODEL_DEFS.protagonist.animations.walk.anchors = protagonistAnchors([[0, -1], [1, -1], [2, -1], [2, 0], [2, 0], [1, -1], [0, -1], [-1, -1], [-2, -1], [-2, 0], [-2, -1], [-1, -1]]);
MODEL_DEFS.protagonist.animations.run.anchors = protagonistAnchors([[0, -1], [1, -1], [2, -1], [2, 0], [2, 0], [1, -1], [0, -1], [-1, -1], [-2, -1], [-2, 0], [-2, -1], [-1, -1]]);
MODEL_DEFS.protagonist.animations.draw.anchors = protagonistAnchors([[0, -2], [2, -2], [2, -3], [2, -3], [0, -3], [-2, -2], [-3, -2], [-2, -1]]);
MODEL_DEFS.protagonist.animations.jump.anchors = protagonistAnchors([[0, 1], [0, 0], [0, 0], [0, 0], [0, 0], [0, 1]]);
MODEL_DEFS.protagonist.animations.hurt.anchors = protagonistAnchors([[3, 0], [-4, 0], [1, 0], [0, 0]]);

const imageCache = new Map();

export const MODEL_SPRITES = MODEL_DEFS;

function protagonistAnchors(offsets) {
  return offsets.map(([offsetX, offsetY]) => ({ x: 0.5, y: 0.965, offsetX, offsetY }));
}

function modelPack(folder, kind, accent, restHeight) {
  return {
    folder,
    file: "base.png",
    kind,
    accent,
    restHeight,
    anchor: { x: 0.5, y: 1 },
    assets: {
      base: "base.png",
      icon: "icon.png",
      portrait: "portrait.png",
      silhouette: "silhouette.png",
      config: "config.json",
    },
    animations: {
      idle: { file: "idle_strip.png", frames: 4, fps: 8, loop: true },
      walk: { file: "walk_strip.png", frames: 6, fps: 10, loop: true },
      float: { file: "idle_strip.png", frames: 4, fps: 7, loop: true },
      hostile: { file: "walk_strip.png", frames: 6, fps: 9, loop: true },
      boss: { file: "idle_strip.png", frames: 4, fps: 6, loop: true },
      talk: { file: "talk_strip.png", frames: 6, fps: 9, loop: true },
      hurt: { file: "hurt_strip.png", frames: 3, fps: 12, loop: false },
    },
  };
}

export function getModelSprite(id) {
  const def = resolveModelDef(id);
  if (!def || typeof Image === "undefined") return null;
  const image = getModelImage(def, def.assets?.base ?? def.file);
  return {
    ...def,
    id,
    image,
    ready: isImageReady(image),
  };
}

export function isModelSpriteReady(id) {
  return Boolean(getModelSprite(id)?.ready);
}

export function preloadModelSprites(ids = Object.keys(MODEL_DEFS)) {
  for (const id of ids) {
    const sprite = getModelSprite(id);
    if (!sprite) continue;
    for (const animation of Object.values(sprite.animations ?? {})) {
      getModelImage(sprite, animation.file);
    }
    for (const variant of Object.values(sprite.variants ?? {})) {
      getModelImage(sprite, variant);
    }
  }
}

export function drawModelSprite(ctx, id, x, footY, options = {}) {
  const sprite = getModelSprite(id);
  if (!sprite?.ready) return false;
  const variantFile = options.variant ? sprite.variants?.[options.variant] : "";
  const variantImage = variantFile ? getModelImage(sprite, variantFile) : null;
  const baseImage = variantImage && isImageReady(variantImage) ? variantImage : sprite.image;

  const naturalW = Math.max(1, baseImage.naturalWidth || 1);
  const naturalH = Math.max(1, baseImage.naturalHeight || 1);
  const height = Math.max(1, options.height ?? sprite.restHeight ?? 48);
  const width = Math.max(1, Math.round(options.width ?? height * naturalW / naturalH));
  const alpha = options.alpha ?? 1;
  const flip = (options.flip ?? options.facing ?? 1) < 0 ? -1 : 1;
  const xOffset = Math.round(options.xOffset ?? 0);
  const yOffset = Math.round(options.yOffset ?? 0);
  const kind = options.kind ?? sprite.kind ?? "npc";
  const frame = resolveFrame(options.frame);
  const motion = options.motion ?? inferMotion(kind, options);
  const pose = buildPose(id, kind, motion, frame, options);

  drawModelShadow(ctx, x + xOffset, footY + yOffset, width, height, pose, options);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = (ctx.globalAlpha ?? 1) * alpha;
  ctx.translate(Math.floor(x + xOffset + pose.rootX), Math.floor(footY + yOffset + pose.rootY));
  ctx.scale(flip, 1);
  const animation = variantFile ? null : resolveAnimation(sprite, motion, options);
  const animationImage = animation && options.useBaseOnly !== true ? getModelImage(sprite, animation.file) : null;
  if (animationImage && isImageReady(animationImage)) {
    drawModelAnimationFrame(ctx, animationImage, animation, width, height, kind, pose, options);
  } else {
    drawLayeredModel(ctx, baseImage, naturalW, naturalH, width, height, kind, pose);
  }
  drawModelLifeFx(ctx, width, height, kind, sprite.accent, pose, options);
  ctx.restore();
  return true;
}

export function drawCenteredModelSprite(ctx, id, centerX, centerY, options = {}) {
  const sprite = getModelSprite(id);
  if (!sprite?.ready) return false;
  const naturalH = Math.max(1, sprite.image.naturalHeight || 1);
  const height = Math.max(1, options.height ?? sprite.restHeight ?? naturalH);
  return drawModelSprite(ctx, id, centerX, centerY + Math.floor(height / 2), options);
}

export const drawAnimatedModelSprite = drawModelSprite;
export const drawCentered = drawCenteredModelSprite;

function resolveModelDef(id) {
  let key = id;
  const seen = new Set();
  while (key && !seen.has(key)) {
    seen.add(key);
    const def = MODEL_DEFS[key];
    if (!def) return null;
    if (!def.alias) return def;
    key = def.alias;
  }
  return null;
}

function getModelImage(def, file) {
  if (!def || !file || typeof Image === "undefined") return null;
  const path = (def.folder ? def.folder + "/" : "") + file;
  let image = imageCache.get(path);
  if (!image) {
    image = new Image();
    image.decoding = "async";
    image.src = new URL(MODEL_PATH + path, import.meta.url).href + "?v=" + MODEL_ASSET_VERSION;
    imageCache.set(path, image);
  }
  return image;
}

function isImageReady(image) {
  return Boolean(image && image.complete && (image.naturalWidth ?? 0) > 0 && (image.naturalHeight ?? 0) > 0);
}

function resolveAnimation(sprite, motion, options) {
  if (options.animation === false) return null;
  const table = sprite.animations ?? {};
  if (options.animation && table[options.animation]) return table[options.animation];
  return table[motion] ?? table.idle ?? null;
}

function drawModelAnimationFrame(ctx, image, animation, width, height, kind, pose, options = {}) {
  const frames = Math.max(1, animation.frames ?? 1);
  const fps = Math.max(1, animation.fps ?? 8);
  const sourceW = Math.max(1, Math.floor((image.naturalWidth || width) / frames));
  const sourceH = Math.max(1, image.naturalHeight || height);
  const frameStep = Math.floor((pose.frame * fps) / 60);
  const explicitFrame = Number.isFinite(options.animationFrame) ? Math.floor(options.animationFrame) : null;
  const frameIndex = explicitFrame !== null
    ? clamp(explicitFrame, 0, frames - 1)
    : animation.loop === false
    ? Math.min(frames - 1, Math.abs(frameStep) % frames)
    : positiveMod(frameStep, frames);
  const sx = frameIndex * sourceW;
  const settle = kind === "boss" ? Math.round(Math.sin(pose.frame * 0.06) * 1) : 0;
  const anchor = resolveFrameAnchor(animation, frameIndex);
  const scaleX = width / sourceW;
  const scaleY = height / sourceH;
  const drawX = -Math.round(width * anchor.x) + Math.round((anchor.offsetX ?? 0) * scaleX);
  const drawY = -Math.round(height * anchor.y) + Math.round((anchor.offsetY ?? 0) * scaleY) + settle;
  ctx.drawImage(image, sx, 0, sourceW, sourceH, drawX, drawY, width, height);
}

function resolveFrameAnchor(animation, frameIndex) {
  const anchor = animation.anchors?.[frameIndex] ?? animation.anchor ?? { x: 0.5, y: 1 };
  return {
    x: clamp(Number.isFinite(anchor.x) ? anchor.x : 0.5, 0, 1),
    y: clamp(Number.isFinite(anchor.y) ? anchor.y : 1, 0, 1),
    offsetX: Number.isFinite(anchor.offsetX) ? anchor.offsetX : 0,
    offsetY: Number.isFinite(anchor.offsetY) ? anchor.offsetY : 0,
  };
}

function resolveFrame(frame) {
  if (Number.isFinite(frame)) return frame;
  const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  return now / 16.67;
}

function inferMotion(kind, options) {
  if ((options.hurt ?? 0) > 0 || options.flash) return "hurt";
  if ((options.walkSpeed ?? 0) > 2.1) return "run";
  if ((options.walkSpeed ?? 0) > 0.12) return "walk";
  if (kind === "monster" || kind === "pressure") return "hostile";
  if (kind === "companion" || kind === "rift") return "float";
  if (kind === "boss") return "boss";
  return "idle";
}

function buildPose(id, kind, motion, frame, options) {
  const seed = hashSeed(id) * 0.01;
  const speed = clamp(Math.abs(options.walkSpeed ?? 0) / 3, 0, 1);
  const moving = motion === "walk" || motion === "run";
  const running = motion === "run";
  const phase = frame * (moving ? (running ? 0.34 : 0.24) + speed * 0.08 : 0.075) + seed;
  const breathe = Math.sin(frame * 0.055 + seed);
  const step = Math.sin(phase);
  const flutter = Math.sin(frame * 0.13 + seed * 0.7);
  const hurt = Math.max(0, options.hurt ?? options.flash ?? 0);
  const hostile = motion === "hostile" || motion === "boss";
  const floating = motion === "float" || kind === "companion" || kind === "rift";

  const walkBob = moving ? Math.abs(step) * (1.5 + speed * (running ? 4.5 : 2.5)) : 0;
  const idleBob = floating ? breathe * 2.4 : breathe * 0.7;
  const shake = hurt > 0 ? Math.sin(frame * 1.4 + seed) * Math.min(5, 1 + hurt * 0.25) : 0;
  const hostileLean = hostile ? Math.sin(frame * 0.105 + seed) * 0.035 : 0;
  const squash = floating
    ? 1 + breathe * 0.035
    : moving
      ? 1 - Math.abs(step) * (running ? 0.04 : 0.025)
      : 1 + breathe * 0.01;

  return {
    frame,
    motion,
    speed,
    breathe,
    step,
    flutter,
    hurt,
    rootX: shake + (options.bobX ?? 0),
    rootY: (options.bob ?? 0) + idleBob - walkBob,
    topDx: (moving ? -step * (1.8 + speed * (running ? 2.2 : 1.4)) : breathe * 0.5) + (kind === "pressure" ? flutter * 1.6 : 0),
    midDx: moving ? step * (running ? 1.35 : 0.9) : hostile ? flutter * 0.7 : 0,
    footDx: moving ? step * (running ? 5.2 : 2.4 + speed * 2) : 0,
    topDy: moving ? -Math.abs(step) * (running ? 1.1 : 0.7) : breathe * 0.55,
    midDy: moving ? Math.abs(step) * (running ? 0.85 : 0.5) : 0,
    footDy: moving ? Math.abs(step) * (running ? 1.7 : 1.2) : 0,
    topAngle: hostileLean + (moving ? -step * (running ? 0.07 : 0.045) : breathe * 0.018),
    midAngle: moving ? step * (running ? 0.04 : 0.025) : hostileLean * 0.5,
    footAngle: moving ? step * (running ? 0.05 : 0.03) : 0,
    scaleX: 1 + (moving ? Math.abs(step) * (running ? 0.018 : 0.012) : breathe * 0.008),
    scaleY: squash,
    glow: floating || hostile || hurt > 0 || motion === "draw" ? 1 : Math.max(0, (breathe + 1) * 0.25),
  };
}

function drawLayeredModel(ctx, image, naturalW, naturalH, width, height, kind, pose) {
  const bands = modelBands(kind);
  for (const band of bands) {
    const sourceY = Math.max(0, Math.floor(naturalH * band.from));
    const sourceH = Math.min(naturalH - sourceY, Math.ceil(naturalH * (band.to - band.from)));
    const destH = Math.max(1, Math.round(height * (band.to - band.from) * (band.scaleY ?? 1) * pose.scaleY));
    const destY = Math.round(-height + height * band.from + (band.dy ?? 0) + pose[band.poseDy] + band.overlap);
    const destW = Math.max(1, Math.round(width * (band.scaleX ?? 1) * pose.scaleX));
    const pivotY = destY + destH * (band.pivot ?? 0.55);

    ctx.save();
    ctx.translate(Math.round((band.dx ?? 0) + pose[band.poseDx]), Math.round(pivotY));
    ctx.rotate(pose[band.poseAngle] ?? 0);
    ctx.drawImage(image, 0, sourceY, naturalW, sourceH, -Math.floor(destW / 2), -Math.round(destH * (band.pivot ?? 0.55)), destW, destH);
    ctx.restore();
  }
}

function modelBands(kind) {
  if (kind === "companion") {
    return [
      { from: 0, to: 1, poseDx: "midDx", poseDy: "topDy", poseAngle: "midAngle", scaleX: 1.02, scaleY: 1.02, overlap: 0, pivot: 0.62 },
    ];
  }
  if (kind === "monster") {
    return [
      { from: 0, to: 0.58, poseDx: "topDx", poseDy: "topDy", poseAngle: "topAngle", overlap: 0, pivot: 0.62 },
      { from: 0.50, to: 1, poseDx: "footDx", poseDy: "footDy", poseAngle: "footAngle", overlap: -2, pivot: 0.36 },
    ];
  }
  if (kind === "boss") {
    return [
      { from: 0, to: 0.46, poseDx: "topDx", poseDy: "topDy", poseAngle: "topAngle", scaleX: 1.01, overlap: 0, pivot: 0.72 },
      { from: 0.38, to: 0.82, poseDx: "midDx", poseDy: "midDy", poseAngle: "midAngle", overlap: -3, pivot: 0.5 },
      { from: 0.74, to: 1, poseDx: "footDx", poseDy: "footDy", poseAngle: "footAngle", scaleX: 1.02, overlap: -3, pivot: 0.28 },
    ];
  }
  if (kind === "rift" || kind === "pressure") {
    return [
      { from: 0, to: 0.42, poseDx: "topDx", poseDy: "topDy", poseAngle: "topAngle", overlap: 0, pivot: 0.75 },
      { from: 0.34, to: 0.78, poseDx: "midDx", poseDy: "midDy", poseAngle: "midAngle", overlap: -3, pivot: 0.5 },
      { from: 0.68, to: 1, poseDx: "footDx", poseDy: "footDy", poseAngle: "footAngle", overlap: -4, pivot: 0.28 },
    ];
  }
  return [
    { from: 0, to: 0.34, poseDx: "topDx", poseDy: "topDy", poseAngle: "topAngle", overlap: 0, pivot: 0.82 },
    { from: 0.28, to: 0.76, poseDx: "midDx", poseDy: "midDy", poseAngle: "midAngle", overlap: -2, pivot: 0.5 },
    { from: 0.68, to: 1, poseDx: "footDx", poseDy: "footDy", poseAngle: "footAngle", overlap: -4, pivot: 0.25 },
  ];
}

function drawModelShadow(ctx, x, footY, width, height, pose, options) {
  if (options.shadow === false) return;
  const scale = clamp(width / 42, 0.7, 3.3);
  const alpha = clamp((options.alpha ?? 1) * (pose.motion === "float" ? 0.2 : 0.34), 0.08, 0.42);
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0," + alpha.toFixed(3) + ")";
  ctx.beginPath();
  ctx.ellipse(Math.floor(x), Math.floor(footY + 1), Math.max(8, width * 0.28 * scale), Math.max(2, height * 0.035), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawModelLifeFx(ctx, width, height, kind, accent, pose, options) {
  const color = options.accent ?? accent ?? "#7dd3fc";
  const glow = clamp(pose.glow, 0, 1);
  if (glow > 0.12) {
    ctx.fillStyle = withAlpha(color, kind === "boss" ? 0.36 : 0.28);
    const t = Math.round(pose.frame * 0.18);
    const points = kind === "monster" || kind === "boss" ? 5 : 3;
    for (let i = 0; i < points; i++) {
      const px = Math.round(Math.sin((t + i * 17) * 0.37) * width * 0.34);
      const py = Math.round(-height * (0.2 + ((t + i * 11) % 53) / 80));
      const size = kind === "boss" ? 3 : 2;
      ctx.fillRect(px, py, size, size);
    }
  }
  if (pose.motion === "draw") {
    const t = Math.round(pose.frame * 0.33);
    for (let i = 0; i < 6; i++) {
      const px = Math.round(width * 0.22 + Math.sin((t + i * 5) * 0.7) * width * 0.08);
      const py = Math.round(-height * 0.55 - ((t + i * 9) % 20));
      ctx.fillStyle = i % 2 === 0 ? "rgba(242,184,75,0.9)" : withAlpha(color, 0.85);
      ctx.fillRect(px, py, i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 3 : 2);
    }
  }
  if (pose.motion === "jump") {
    ctx.fillStyle = withAlpha(color, 0.32);
    ctx.fillRect(-Math.round(width * 0.28), -4, Math.round(width * 0.18), 2);
    ctx.fillRect(Math.round(width * 0.12), -5, Math.round(width * 0.2), 2);
  }
  if (pose.motion === "run") {
    ctx.fillStyle = withAlpha(color, 0.28);
    const sway = Math.round(Math.sin(pose.frame * 0.5) * width * 0.08);
    ctx.fillRect(-Math.round(width * 0.46) + sway, -8, Math.round(width * 0.22), 2);
    ctx.fillRect(-Math.round(width * 0.36) - sway, -2, Math.round(width * 0.26), 2);
  }
  if (pose.hurt > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-Math.floor(width / 2) - 2, -height - 2, width + 4, height + 4);
    ctx.strokeStyle = "rgba(178,59,72,0.72)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-Math.floor(width / 2) - 5, -height - 5, width + 10, height + 10);
  }
}

function withAlpha(hex, alpha) {
  const parsed = parseHex(hex);
  if (!parsed) return "rgba(125,211,252," + alpha + ")";
  return "rgba(" + parsed.r + "," + parsed.g + "," + parsed.b + "," + alpha + ")";
}

function parseHex(color) {
  if (typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color)) return null;
  return {
    r: Number.parseInt(color.slice(1, 3), 16),
    g: Number.parseInt(color.slice(3, 5), 16),
    b: Number.parseInt(color.slice(5, 7), 16),
  };
}

function hashSeed(value) {
  const text = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) % 9973;
  return hash;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function positiveMod(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}
