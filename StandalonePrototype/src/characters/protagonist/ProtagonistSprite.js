import { draw as drawWeaponSprite } from "../../inkwell/WeaponSpriteRenderer.js?v=24";
import { drawModelSprite } from "../../core/SpriteAssets.js?v=2";

const PALETTE = {
  outline: "#05070b",
  hair: "#11131a",
  skin: "#e8b89d",
  skinShadow: "#a96f5c",
  hoodie: "#39465a",
  hoodieShadow: "#202838",
  hoodieLight: "#52647a",
  pants: "#151923",
  pocket: "#2a3446",
  shoe: "#e8dcc8",
  inkBlue: "#1f6f91",
  inkLight: "#7dd3fc",
  tank: "#162033",
  pencil: "#d6b56d",
  pencilTip: "#2a2016",
};

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

export function drawProtagonist(ctx, player, cameraX, cameraY) {
  if ((player.invulnerableFrames ?? 0) > 0 && Math.floor(player.invulnerableFrames / 3) % 2 === 0) ctx.globalAlpha = 0.56;
  const x = Math.floor(player.x - cameraX);
  const footY = Math.floor(player.y - cameraY + player.h / 2);
  const flip = player.facing < 0 ? -1 : 1;
  const walk = Math.abs(player.vx);

  drawDoubleJumpFlash(ctx, player, x, footY);
  const bodyY = drawProtagonistAt(ctx, {
    x,
    footY,
    facing: flip,
    frame: player.animFrame,
    walkSpeed: walk,
    onGround: player.onGround,
    showTank: true,
  });
  drawWeaponSprite(ctx, player, null, player.attack, { x, y: bodyY, flip });
  drawHeadphoneCord(ctx, x, bodyY);
  if ((player.hurtFrames ?? 0) > 0) drawHurtFlash(ctx, x, footY, player.hurtFrames);
  ctx.globalAlpha = 1;
}

export function drawProtagonistAt(ctx, options = {}) {
  const x = Math.floor(options.x ?? 0);
  const footY = Math.floor(options.footY ?? options.y ?? 0);
  const flip = (options.facing ?? 1) < 0 ? -1 : 1;
  const frame = options.frame ?? 0;
  const walkSpeed = Math.abs(options.walkSpeed ?? 0);
  const onGround = options.onGround !== false;
  const drawing = Boolean(options.drawing);
  const walkBob = onGround && !drawing ? Math.round(Math.sin(frame * 0.18) * Math.min(1, walkSpeed)) : 0;
  const stride = onGround && !drawing ? Math.round(Math.sin(frame * 0.18) * Math.min(2, walkSpeed)) : 0;
  const y = footY - 34 + walkBob;

  drawGroundShadow(ctx, x, footY);
  if (drawModelSprite(ctx, "protagonist", x, footY, {
    height: options.spriteHeight ?? 60,
    facing: flip,
  })) {
    return y;
  }
  drawLegs(ctx, x, y, stride);
  if (options.showTank !== false) drawInkTank(ctx, x, y, flip);
  drawBody(ctx, x, y, flip);
  drawHead(ctx, x, y, flip);
  drawHand(ctx, x, y, flip);
  if (drawing) drawPencil(ctx, x, y, flip);
  drawHeadphoneCord(ctx, x, y);
  return y;
}

export function drawPixelPersonAt(ctx, options = {}) {
  const x = Math.floor(options.x ?? 0);
  const footY = Math.floor(options.footY ?? options.y ?? 0);
  const flip = (options.facing ?? 1) < 0 ? -1 : 1;
  const frame = options.frame ?? 0;
  const walkSpeed = Math.abs(options.walkSpeed ?? 0);
  const walkBob = Math.round(Math.sin(frame * 0.18) * Math.min(1, walkSpeed));
  const stride = Math.round(Math.sin(frame * 0.18) * Math.min(2, walkSpeed));
  const y = footY - 34 + walkBob;
  const body = options.bodyColor ?? PALETTE.hoodie;
  const bodyShadow = options.bodyShadow ?? darken(body);
  const accent = options.accentColor ?? PALETTE.inkLight;
  const hair = options.hairColor ?? PALETTE.hair;
  const skin = options.skinColor ?? PALETTE.skin;
  const skinShadow = options.skinShadow ?? PALETTE.skinShadow;
  const pants = options.pantsColor ?? PALETTE.pants;

  drawGroundShadow(ctx, x, footY);
  rect(ctx, x - 8, y + 22, 7, 11, PALETTE.outline);
  rect(ctx, x + 1, y + 22, 7, 11, PALETTE.outline);
  rect(ctx, x - 6, y + 22 + stride, 4, 10, pants);
  rect(ctx, x + 2, y + 22 - stride, 4, 10, pants);
  rect(ctx, x - 8, y + 32 + stride, 8, 3, PALETTE.shoe);
  rect(ctx, x + 1, y + 32 - stride, 8, 3, PALETTE.shoe);

  rect(ctx, x - 9, y + 10, 18, 17, PALETTE.outline);
  rect(ctx, x - 7, y + 11, 14, 16, body);
  rect(ctx, x - 6, y + 17, 12, 10, bodyShadow);
  rect(ctx, x - 5, y + 12, 10, 2, lighten(body));
  rect(ctx, x + flip * 4, y + 13, 3, 11, accent);
  rect(ctx, x + flip * 5, y + 14, 1, 8, "rgba(255,255,255,0.35)");

  rect(ctx, x - 6, y + 2, 12, 11, PALETTE.outline);
  rect(ctx, x - 5, y + 3, 10, 9, skin);
  rect(ctx, x + 3, y + 5, 2, 6, skinShadow);
  rect(ctx, x - 7, y - 1, 14, 5, hair);
  rect(ctx, x - 5 + flip * 2, y - 3, 7, 3, hair);
  rect(ctx, x - 8, y + 3, 3, 5, hair);
  rect(ctx, x + 4, y + 3, 3, 4, hair);
  rect(ctx, x + flip * 2, y + 7, 3, 1, PALETTE.shoe);
  rect(ctx, x + flip * 3, y + 7, 1, 1, accent);

  const handX = flip > 0 ? x + 8 : x - 11;
  rect(ctx, handX, y + 17, 4, 4, PALETTE.outline);
  rect(ctx, handX + 1, y + 17, 3, 3, skin);
  if (options.badge) rect(ctx, x - flip * 6, y + 15, 3, 3, accent);
  if (options.apron) {
    rect(ctx, x - 5, y + 16, 10, 11, options.apronColor ?? "#d8cfb8");
    rect(ctx, x - 3, y + 20, 6, 1, PALETTE.outline);
  }
  if (options.active) {
    ctx.strokeStyle = accent;
    ctx.strokeRect(x - 15.5, y - 7.5, 31, 45);
  }
  return y;
}

export function drawInkCompanionAt(ctx, options = {}) {
  const x = Math.floor(options.x ?? 0);
  const footY = Math.floor(options.footY ?? options.y ?? 0);
  const flip = (options.facing ?? 1) < 0 ? -1 : 1;
  const frame = options.frame ?? 0;
  const bob = Math.round(Math.sin(frame * 0.08) * 2);
  const y = footY - 15 + bob;
  const color = options.bodyColor ?? "#1d1b25";
  const accent = options.accentColor ?? PALETTE.inkLight;

  drawGroundShadow(ctx, x, footY);
  if (drawModelSprite(ctx, "inkdot", x, footY, {
    height: options.spriteHeight ?? 30,
    facing: flip,
  })) {
    return;
  }
  rect(ctx, x - 10, y + 2, 20, 12, PALETTE.outline);
  rect(ctx, x - 8, y, 16, 14, color);
  rect(ctx, x - 6, y - 3, 5, 5, color);
  rect(ctx, x + 1, y - 3, 5, 5, color);
  rect(ctx, x - 4 + flip, y + 4, 3, 2, PALETTE.shoe);
  rect(ctx, x + 3 + flip, y + 4, 3, 2, PALETTE.shoe);
  rect(ctx, x + flip * 6, y + 7, 2, 2, accent);
  rect(ctx, x - 5, y + 12, 10, 2, accent);
}

function drawDoubleJumpFlash(ctx, player, x, footY) {
  if (player.doubleJumpFlash <= 0) return;
  const radius = Math.max(8, 21 - player.doubleJumpFlash * 0.45);
  ctx.fillStyle = "rgba(125, 211, 252, 0.28)";
  rect(ctx, x - radius, footY - 11, radius * 2, 2, ctx.fillStyle);
  rect(ctx, x - radius + 4, footY - 18, radius * 2 - 8, 2, ctx.fillStyle);
}

function drawGroundShadow(ctx, x, footY) {
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(x, footY + 1, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHurtFlash(ctx, x, footY, frames) {
  ctx.save();
  ctx.globalAlpha = Math.min(0.55, frames / 14);
  ctx.strokeStyle = "#b41f32";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, footY - 17, 18 - frames * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawLegs(ctx, x, y, stride) {
  rect(ctx, x - 8, y + 22, 7, 11, PALETTE.outline);
  rect(ctx, x + 1, y + 22, 7, 11, PALETTE.outline);
  rect(ctx, x - 6, y + 22 + stride, 4, 10, PALETTE.pants);
  rect(ctx, x + 2, y + 22 - stride, 4, 10, PALETTE.pants);
  rect(ctx, x - 8, y + 26 + stride, 2, 4, PALETTE.pocket);
  rect(ctx, x + 6, y + 26 - stride, 2, 4, PALETTE.pocket);
  rect(ctx, x - 8, y + 32 + stride, 8, 3, PALETTE.shoe);
  rect(ctx, x + 1, y + 32 - stride, 8, 3, PALETTE.shoe);
  rect(ctx, x - 2, y + 32 + stride, 2, 1, PALETTE.inkBlue);
}

function drawInkTank(ctx, x, y, flip) {
  const tankX = x - flip * 10;
  rect(ctx, tankX - 4, y + 12, 7, 15, PALETTE.outline);
  rect(ctx, tankX - 3, y + 13, 5, 13, PALETTE.tank);
  rect(ctx, tankX - 2, y + 15, 2, 8, PALETTE.inkBlue);
  rect(ctx, tankX + 1, y + 14, 1, 10, PALETTE.inkLight);
  rect(ctx, tankX - 2, y + 10, 3, 3, PALETTE.outline);
}

function drawBody(ctx, x, y, flip) {
  rect(ctx, x - 9, y + 10, 18, 17, PALETTE.outline);
  rect(ctx, x - 7, y + 11, 14, 16, PALETTE.hoodie);
  rect(ctx, x - 6, y + 17, 12, 10, PALETTE.hoodieShadow);
  rect(ctx, x - 5, y + 12, 10, 2, PALETTE.hoodieLight);
  rect(ctx, x + flip * 4, y + 13, 3, 11, PALETTE.inkBlue);
  rect(ctx, x + flip * 5, y + 14, 1, 8, PALETTE.inkLight);
  rect(ctx, x - 8, y + 11, 3, 6, PALETTE.hoodieShadow);
  rect(ctx, x + 5, y + 11, 3, 6, PALETTE.hoodieShadow);
}

function drawHead(ctx, x, y, flip) {
  rect(ctx, x - 6, y + 2, 12, 11, PALETTE.outline);
  rect(ctx, x - 5, y + 3, 10, 9, PALETTE.skin);
  rect(ctx, x + 3, y + 5, 2, 6, PALETTE.skinShadow);

  rect(ctx, x - 7, y - 1, 14, 5, PALETTE.hair);
  rect(ctx, x - 5 + flip * 2, y - 3, 7, 3, PALETTE.hair);
  rect(ctx, x - 8, y + 3, 3, 5, PALETTE.hair);
  rect(ctx, x + 4, y + 3, 3, 4, PALETTE.hair);

  rect(ctx, x + flip * 2, y + 7, 3, 1, PALETTE.shoe);
  rect(ctx, x + flip * 3, y + 7, 1, 1, PALETTE.inkBlue);
  rect(ctx, x - flip * 3, y + 10, 3, 1, PALETTE.skinShadow);
  rect(ctx, x - flip * 5, y + 4, 2, 2, PALETTE.outline);
  rect(ctx, x - flip * 5, y + 5, 1, 1, PALETTE.inkLight);
}

function drawHand(ctx, x, y, flip) {
  const handX = flip > 0 ? x + 8 : x - 11;
  rect(ctx, handX, y + 17, 4, 4, PALETTE.outline);
  rect(ctx, handX + 1, y + 17, 3, 3, PALETTE.skin);
}

function drawPencil(ctx, x, y, flip) {
  const handX = flip > 0 ? x + 12 : x - 18;
  rect(ctx, handX, y + 18, 14, 3, PALETTE.pencil);
  rect(ctx, handX + (flip > 0 ? 12 : -2), y + 17, 4, 4, PALETTE.pencilTip);
}

function drawHeadphoneCord(ctx, x, y) {
  ctx.strokeStyle = "rgba(245,245,220,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 12);
  ctx.lineTo(x - 4, y + 19);
  ctx.lineTo(x - 2, y + 25);
  ctx.stroke();
}

function darken(color) {
  const hex = parseHex(color);
  if (!hex) return PALETTE.hoodieShadow;
  return toHex(Math.round(hex.r * 0.62), Math.round(hex.g * 0.62), Math.round(hex.b * 0.62));
}

function lighten(color) {
  const hex = parseHex(color);
  if (!hex) return PALETTE.hoodieLight;
  return toHex(
    Math.min(255, Math.round(hex.r * 1.24 + 10)),
    Math.min(255, Math.round(hex.g * 1.24 + 10)),
    Math.min(255, Math.round(hex.b * 1.24 + 10)),
  );
}

function parseHex(color) {
  if (typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color)) return null;
  return {
    r: Number.parseInt(color.slice(1, 3), 16),
    g: Number.parseInt(color.slice(3, 5), 16),
    b: Number.parseInt(color.slice(5, 7), 16),
  };
}

function toHex(r, g, b) {
  return "#" + [r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("");
}
