import { draw as drawWeaponSprite } from "../../inkwell/WeaponSpriteRenderer.js?v=24";

const PALETTE = {
  outline: "#080808",
  hair: "#101010",
  skin: "#e8b89d",
  skinShadow: "#b97d67",
  hoodie: "#333333",
  hoodieShadow: "#222222",
  pants: "#111111",
  pocket: "#2a2a2a",
  shoe: "#f5f5dc",
  inkBlue: "#1e3a5f",
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
  const walkBob = player.onGround ? Math.round(Math.sin(player.animFrame * 0.18) * Math.min(1, walk)) : 0;
  const stride = player.onGround ? Math.round(Math.sin(player.animFrame * 0.18) * Math.min(2, walk)) : 0;
  const y = footY - 34 + walkBob;

  drawDoubleJumpFlash(ctx, player, x, footY);
  drawGroundShadow(ctx, x, footY);
  drawLegs(ctx, x, y, stride);
  drawBody(ctx, x, y, flip);
  drawHead(ctx, x, y, flip);
  drawHand(ctx, x, y, flip);
  drawWeaponSprite(ctx, player, null, player.attack, { x, y, flip });
  drawHeadphoneCord(ctx, x, y);
  if ((player.hurtFrames ?? 0) > 0) drawHurtFlash(ctx, x, footY, player.hurtFrames);
  ctx.globalAlpha = 1;
}

function drawDoubleJumpFlash(ctx, player, x, footY) {
  if (player.doubleJumpFlash <= 0) return;
  ctx.strokeStyle = "rgba(30, 58, 95, 0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, footY - 9, 21 - player.doubleJumpFlash * 0.45, 0, Math.PI * 2);
  ctx.stroke();
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

function drawBody(ctx, x, y, flip) {
  rect(ctx, x - 9, y + 10, 18, 17, PALETTE.outline);
  rect(ctx, x - 7, y + 11, 14, 16, PALETTE.hoodie);
  rect(ctx, x - 6, y + 17, 12, 10, PALETTE.hoodieShadow);
  rect(ctx, x + flip * 4, y + 13, 3, 11, PALETTE.inkBlue);
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
}

function drawHand(ctx, x, y, flip) {
  const handX = flip > 0 ? x + 8 : x - 11;
  rect(ctx, handX, y + 17, 4, 4, PALETTE.outline);
  rect(ctx, handX + 1, y + 17, 3, 3, PALETTE.skin);
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
