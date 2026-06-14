import { draw as drawWeaponSprite } from "./WeaponSpriteRenderer.js?v=24";

export function drawWeapon(ctx, player, weapon, attackState, placement) {
  drawWeaponSprite(ctx, player, weapon, attackState, placement);
}

export function drawHeldWeapon(ctx, player, x, y, flip, fallbackDraw) {
  // Deprecated: weapon visuals are rendered once through WeaponSpriteRenderer.draw.
}

export function drawAttackWeapon(ctx, player, x, y, fallbackDraw) {
  // Deprecated: weapon visuals are rendered once through WeaponSpriteRenderer.draw.
}
