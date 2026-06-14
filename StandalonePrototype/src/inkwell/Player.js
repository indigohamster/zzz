import { TILE, Tile } from "../core/config.js";
import { drawProtagonist } from "../characters/protagonist/ProtagonistSprite.js?v=24";
import { createAttackController } from "./AttackController.js?v=35";
import {
  AIR_FRICTION,
  AIR_RESPONSE,
  COYOTE_FRAMES,
  DASH_SPEED,
  DOUBLE_JUMP_SPEED,
  GRAVITY,
  GROUND_FRICTION,
  GROUND_RESPONSE,
  JUMP_BUFFER_FRAMES,
  JUMP_SPEED,
  MAX_FALL,
  MAX_JUMPS,
  MAX_RUN_SPEED,
} from "./InkwellConfig.js";

export function createPlayer({ canvas, keys, mouse, weapon, tileMap, physics, getCamera, getToolMode, getFrame, onAttack, run }) {
  const attackController = createAttackController();
  const player = {
    x: 56 * TILE,
    y: 52 * TILE,
    centerX: 56 * TILE,
    centerY: 52 * TILE,
    w: 12,
    h: 22,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    dashCooldown: 0,
    attackTimer: 0,
    attack: attackController.state,
    attackKeyHeld: false,
    jumpsLeft: MAX_JUMPS,
    coyoteTimer: 0,
    jumpBuffer: 0,
    jumpHeld: false,
    doubleJumpFlash: 0,
    ink: 100,
    maxInkBonus: 0,
    hp: 100,
    invulnerableFrames: 0,
    hurtFrames: 0,
    animFrame: 0,
    weaponReach: 52,
    weaponTrait: "plain",
    weaponArchetype: weapon.archetype?.id ?? "sword",
    weaponAttackPattern: weapon.archetype?.attackPattern ?? "arcSlash",
    weaponAttackSpeed: 60 / 13,
    weaponVisualPreset: weapon.weaponVisual ?? null,
    weaponImageDataUrl: weapon.imageDataUrl ?? "",
  };

  function reset() {
    const entrance = tileMap.getRoomByType("entrance");
    player.x = (entrance ? entrance.x + 12 : 56) * TILE;
    player.y = (entrance ? entrance.y + entrance.h - 8 : 52) * TILE;
    player.centerX = player.x;
    player.centerY = player.y;
    player.vx = 0;
    player.vy = 0;
    player.hp = 100;
    player.ink = 100 + player.maxInkBonus;
    player.invulnerableFrames = 0;
    player.hurtFrames = 0;
    player.attackTimer = 0;
    player.attackKeyHeld = false;
    attackController.reset();
    player.dashCooldown = 0;
    player.jumpsLeft = MAX_JUMPS;
    player.coyoteTimer = 0;
    player.jumpBuffer = 0;
    player.jumpHeld = false;
    player.doubleJumpFlash = 0;
    player.animFrame = 0;
  }

  function update() {
    player.animFrame++;
    attackController.update();
    player.weaponReach = weapon.finalStats?.range ?? weapon.combat?.range ?? 52;
    player.weaponTrait = weapon.trait ?? "plain";
    player.weaponArchetype = weapon.archetype?.id ?? "sword";
    player.weaponAttackPattern = weapon.archetype?.attackPattern ?? weapon.combat?.attackPattern ?? "arcSlash";
    player.weaponAttackSpeed = weapon.finalStats?.useTime ? 60 / weapon.finalStats.useTime : 60 / 13;
    player.weaponVisualPreset = weapon.weaponVisual ?? null;
    player.weaponImageDataUrl = weapon.imageDataUrl ?? "";
    const left = keys.has("a") || keys.has("arrowleft");
    const right = keys.has("d") || keys.has("arrowright");
    const jump = keys.has(" ");
    const attackKey = keys.has("j") || keys.has("x");
    const wasGrounded = player.onGround;

    if (jump && !player.jumpHeld) player.jumpBuffer = JUMP_BUFFER_FRAMES;
    player.jumpBuffer = Math.max(0, player.jumpBuffer - 1);
    player.coyoteTimer = wasGrounded ? COYOTE_FRAMES : Math.max(0, player.coyoteTimer - 1);

    const moveDir = (right ? 1 : 0) - (left ? 1 : 0);
    if (moveDir !== 0) player.facing = moveDir;
    const movementScale = attackController.getMovementScale();
    const currentMaxRunSpeed = MAX_RUN_SPEED * movementScale;
    const targetVx = moveDir * currentMaxRunSpeed;
    const response = player.onGround ? GROUND_RESPONSE : AIR_RESPONSE;
    if (moveDir !== 0) {
      player.vx += (targetVx - player.vx) * response;
    } else {
      player.vx *= player.onGround ? GROUND_FRICTION : AIR_FRICTION;
      if (Math.abs(player.vx) < 0.025) player.vx = 0;
    }
    player.vx = Math.max(-currentMaxRunSpeed, Math.min(currentMaxRunSpeed, player.vx));

    if (wasGrounded) player.jumpsLeft = MAX_JUMPS;
    if (player.jumpBuffer > 0) {
      if (player.coyoteTimer > 0) {
        player.vy = JUMP_SPEED;
        player.onGround = false;
        player.coyoteTimer = 0;
        player.jumpsLeft = MAX_JUMPS - 1;
        player.jumpBuffer = 0;
      } else if (player.jumpsLeft > 0) {
        player.vy = DOUBLE_JUMP_SPEED;
        player.onGround = false;
        player.jumpsLeft--;
        player.doubleJumpFlash = 14;
        player.jumpBuffer = 0;
      }
    }

    if (!jump && player.jumpHeld && player.vy < -1.8) player.vy *= 0.72;
    player.jumpHeld = jump;

    if (keys.has("shift") && player.dashCooldown <= 0 && player.ink >= 6) {
      player.vx = player.facing * DASH_SPEED;
      player.dashCooldown = 48;
      player.ink -= 6;
    }

    player.vy = Math.min(MAX_FALL, player.vy + GRAVITY);
    if (wasGrounded && player.vy > 0 && player.vy < GRAVITY * 1.5) player.vy = 0;
    player.dashCooldown = Math.max(0, player.dashCooldown - 1);
    player.attackTimer = attackController.state.remainingFrames;
    player.doubleJumpFlash = Math.max(0, player.doubleJumpFlash - 1);
    player.ink = Math.min(100 + player.maxInkBonus, player.ink + (player.onGround ? 0.045 : 0.018));

    physics.moveEntity(player);
    if (!player.onGround && player.vy >= 0 && physics.probeGround(player)) player.onGround = true;
    if (player.onGround && player.vy > 0) player.vy = 0;
    player.centerX = player.x;
    player.centerY = player.y;

    if (mouse.justLeft || (attackKey && !player.attackKeyHeld)) {
      if (getToolMode() === 1) {
        const aim = createAttackAim();
        player.facing = aim.facing;
        onAttack(attackController, aim, weapon);
      }
      else mineOrPlace(false);
    }
    player.attackKeyHeld = attackKey;
    if (mouse.left && getToolMode() === 2 && getFrame() % 7 === 0) mineOrPlace(false);
    if (mouse.justRight) mineOrPlace(true);
    player.attackTimer = attackController.state.remainingFrames;
  }

  function mineOrPlace(place) {
    const p = screenToWorld(mouse.x, mouse.y);
    const tx = Math.floor(p.x / TILE);
    const ty = Math.floor(p.y / TILE);
    const dist = Math.hypot(tx * TILE + 8 - player.x, ty * TILE + 8 - player.y);
    if (dist > 82) return;

    if (place) {
      if (tileMap.tileAt(tx, ty) === Tile.Air && player.ink >= 2) {
        tileMap.setTile(tx, ty, Tile.Paper);
        player.ink -= 2;
        run.placed++;
      }
      return;
    }

    if (tileMap.tileAt(tx, ty) !== Tile.Air) {
      tileMap.setTile(tx, ty, Tile.Air);
      player.ink = Math.max(0, player.ink - (getToolMode() === 2 ? 1.2 : 0.5));
      run.mined++;
    }
  }

  function screenToWorld(mx, my) {
    const rect = canvas.getBoundingClientRect();
    const camera = getCamera();
    const sx = (mx - rect.left) * (canvas.width / rect.width);
    const sy = (my - rect.top) * (canvas.height / rect.height);
    return { x: sx + camera.x, y: sy + camera.y };
  }

  function createAttackAim() {
    const clickWorld = screenToWorld(mouse.x, mouse.y);
    const dx = clickWorld.x - player.centerX;
    const dy = clickWorld.y - player.centerY;
    const angle = Math.atan2(dy, dx || player.facing || 1);
    return {
      clickWorldX: clickWorld.x,
      clickWorldY: clickWorld.y,
      angle,
      facing: Math.cos(angle) < 0 ? -1 : 1,
    };
  }

  function draw(ctx, cameraX, cameraY) {
    drawProtagonist(ctx, player, cameraX, cameraY);
  }

  return { state: player, attackController, reset, update, draw };
}



