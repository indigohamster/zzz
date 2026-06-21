export const MODEL_SPRITES = {
  protagonist: { src: "./assets/sprites/model_import/protagonist.png", w: 36, h: 78, kind: "character" },
  inkdot: { src: "./assets/sprites/model_import/inkdot.png", w: 31, h: 34, kind: "companion" },
  supply_keeper: { src: "./assets/sprites/model_import/supply_keeper.png", w: 31, h: 52, kind: "npc" },
  forgotten_draft: { src: "./assets/sprites/model_import/forgotten_draft.png", w: 28, h: 52, kind: "npc" },
  deleted_character: { src: "./assets/sprites/model_import/deleted_character.png", w: 23, h: 56, kind: "npc" },
  zhou_redline_shadow: { src: "./assets/sprites/model_import/zhou_redline_shadow.png", w: 32, h: 70, kind: "npc" },
  zhou: { src: "./assets/sprites/model_import/zhou.png", w: 30, h: 70, kind: "office" },
  mira: { src: "./assets/sprites/model_import/mira.png", w: 29, h: 66, kind: "office" },
  ren: { src: "./assets/sprites/model_import/ren.png", w: 27, h: 68, kind: "office" },
  client: { src: "./assets/sprites/model_import/client.png", w: 31, h: 68, kind: "office" },
  sketchling: { src: "./assets/sprites/model_import/sketchling.png", w: 42, h: 42, kind: "monster" },
  inkmite: { src: "./assets/sprites/model_import/inkmite.png", w: 32, h: 34, kind: "monster" },
  binder: { src: "./assets/sprites/model_import/binder.png", w: 44, h: 50, kind: "monster" },
  margin_eel: { src: "./assets/sprites/model_import/margin_eel.png", w: 50, h: 50, kind: "monster" },
  paper_kite: { src: "./assets/sprites/model_import/paper_kite.png", w: 30, h: 48, kind: "monster" },
  blot_sentinel: { src: "./assets/sprites/model_import/blot_sentinel.png", w: 31, h: 46, kind: "monster" },
  template_engine: { src: "./assets/sprites/model_import/template_engine.png", w: 123, h: 112, kind: "boss" },
  eraser_warden: { src: "./assets/sprites/model_import/eraser_warden.png", w: 100, h: 112, kind: "boss" },
  printhead_maw: { src: "./assets/sprites/model_import/printhead_maw.png", w: 182, h: 122, kind: "boss" },
};

const imageCache = new Map();

export function getModelSprite(id) {
  const meta = MODEL_SPRITES[id];
  if (!meta || typeof Image === "undefined") return null;
  let image = imageCache.get(id);
  if (!image) {
    image = new Image();
    image.src = meta.src;
    imageCache.set(id, image);
  }
  return {
    ...meta,
    image,
    ready: image.complete && image.naturalWidth > 0,
  };
}

export function drawModelSprite(ctx, id, x, footY, options = {}) {
  const sprite = getModelSprite(id);
  if (!sprite?.ready) return false;
  const scale = options.height ? options.height / sprite.h : (options.scale ?? 1);
  const flip = (options.facing ?? 1) < 0 ? -1 : 1;
  const alpha = options.alpha ?? 1;
  const bob = options.bob ?? 0;
  const drawW = Math.max(1, Math.round(sprite.w * scale));
  const drawH = Math.max(1, Math.round(sprite.h * scale));
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha *= alpha;
  ctx.translate(Math.floor(x), Math.floor(footY - drawH + bob));
  ctx.scale(flip, 1);
  ctx.drawImage(sprite.image, -Math.floor(drawW / 2), 0, drawW, drawH);
  ctx.restore();
  return true;
}

export function drawCenteredModelSprite(ctx, id, centerX, centerY, options = {}) {
  const sprite = getModelSprite(id);
  if (!sprite?.ready) return false;
  const scale = options.height ? options.height / sprite.h : (options.scale ?? 1);
  const drawH = Math.max(1, Math.round(sprite.h * scale));
  return drawModelSprite(ctx, id, centerX, centerY + Math.floor(drawH / 2), options);
}

export const drawCentered = drawCenteredModelSprite;

export function preloadModelSprites(ids = Object.keys(MODEL_SPRITES)) {
  for (const id of ids) getModelSprite(id);
}
