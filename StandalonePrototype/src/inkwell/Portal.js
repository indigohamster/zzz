import { label } from "../core/render.js";

export function createPortalManager({ player, onEnter }) {
  let portal = null;

  function reset() {
    portal = null;
  }

  function spawn(x, y) {
    portal = { x, y, frame: 0 };
  }

  function update() {
    if (!portal) return;
    portal.frame++;
  }

  function tryEnter() {
    if (!portal) return false;
    if (Math.hypot(player.x - portal.x, player.y - portal.y) > 42) return false;
    onEnter();
    return true;
  }

  function draw(ctx, cameraX, cameraY) {
    if (!portal) return;
    const x = Math.floor(portal.x - cameraX);
    const y = Math.floor(portal.y - cameraY);
    const pulse = Math.sin(portal.frame * 0.08) * 3;
    ctx.strokeStyle = "rgba(245,245,220,0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y - 8, 16 + pulse, 25 - pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(30,58,95,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y - 8, 9 - pulse * 0.3, 18 + pulse * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (Math.hypot(player.x - portal.x, player.y - portal.y) < 42) {
      label(ctx, "E return / keep exploring", x - 54, y - 42, 12, "#f7f0df");
    }
  }

  function isOpen() {
    return Boolean(portal);
  }

  return { reset, spawn, update, draw, tryEnter, isOpen };
}
