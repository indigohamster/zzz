import { TILE, Tile } from "../core/config.js?v=27";
import { drawProtagonist } from "../characters/protagonist/ProtagonistSprite.js?v=26";
import { TUNING } from "../core/TuningConfig.js?v=3";
import { createAttackController } from "./AttackController.js?v=36";
import {
  AIR_FRICTION,
  AIR_RESPONSE,
  BRUSH_DASH_COOLDOWN,
  BRUSH_DASH_COST,
  BRUSH_DASH_SPEED,
  BRUSH_DASH_VERTICAL_SCALE,
  COYOTE_FRAMES,
  DOUBLE_JUMP_SPEED,
  GRAVITY,
  GROUND_FRICTION,
  GROUND_RESPONSE,
  INK_GLIDE_COST,
  INK_GLIDE_FALL_SPEED,
  INK_GLIDE_GRAVITY_SCALE,
  JUMP_BUFFER_FRAMES,
  JUMP_SPEED,
  MAX_FALL,
  MAX_JUMPS,
  MAX_RUN_SPEED,
  WALL_JUMP_X_SPEED,
  WALL_JUMP_Y_SPEED,
  WALL_SMEAR_COST,
  WALL_SMEAR_FALL_SPEED,
} from "./InkwellConfig.js?v=2";

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
    dashKeyHeld: false,
    brushDashFlash: 0,
    wallSmear: 0,
    wallClingSide: 0,
    isGliding: false,
    mobilityTrails: [],
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
    player.dashKeyHeld = false;
    player.brushDashFlash = 0;
    player.wallSmear = 0;
    player.wallClingSide = 0;
    player.isGliding = false;
    player.mobilityTrails.length = 0;
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
    const up = keys.has("w") || keys.has("arrowup");
    const down = keys.has("s") || keys.has("arrowdown");
    const jump = keys.has(" ");
    const dashKey = keys.has("shift");
    const attackKey = keys.has("j") || keys.has("x");
    const wasGrounded = player.onGround;

    if (jump && !player.jumpHeld) player.jumpBuffer = JUMP_BUFFER_FRAMES;
    player.jumpBuffer = Math.max(0, player.jumpBuffer - 1);
    player.coyoteTimer = wasGrounded ? COYOTE_FRAMES : Math.max(0, player.coyoteTimer - 1);

    const moveDir = (right ? 1 : 0) - (left ? 1 : 0);
    if (moveDir !== 0) player.facing = moveDir;
    const movementScale = attackController.getMovementScale();
    const rushActive = (run?.flowRushFrames ?? 0) > 0;
    const rushMoveMultiplier = rushActive ? (TUNING.flow?.rushMoveMultiplier ?? 1.18) : 1;
    const currentMaxRunSpeed = MAX_RUN_SPEED * movementScale * rushMoveMultiplier;
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
    const wallSide = detectWallSide(moveDir);
    const canWallSmear = !wasGrounded && wallSide !== 0 && player.vy > -1.2 && player.ink > WALL_SMEAR_COST;

    if (player.jumpBuffer > 0) {
      if (player.coyoteTimer > 0) {
        player.vy = JUMP_SPEED;
        player.onGround = false;
        player.coyoteTimer = 0;
        player.jumpsLeft = MAX_JUMPS - 1;
        player.jumpBuffer = 0;
      } else if (canWallSmear) {
        player.vx = -wallSide * WALL_JUMP_X_SPEED;
        player.vy = WALL_JUMP_Y_SPEED;
        player.onGround = false;
        player.facing = -wallSide;
        player.jumpsLeft = MAX_JUMPS - 1;
        player.wallSmear = 10;
        player.doubleJumpFlash = 16;
        player.ink = Math.max(0, player.ink - 2.5);
        addMobilityTrail("wall");
        player.jumpBuffer = 0;
      } else if (player.jumpsLeft > 0) {
        player.vy = DOUBLE_JUMP_SPEED;
        player.onGround = false;
        player.jumpsLeft--;
        player.doubleJumpFlash = 14;
        addMobilityTrail("jump");
        player.jumpBuffer = 0;
      }
    }

    if (!jump && player.jumpHeld && player.vy < -1.8) player.vy *= 0.72;
    player.jumpHeld = jump;

    if (canWallSmear && player.jumpBuffer <= 0) {
      player.wallSmear = 8;
      player.wallClingSide = wallSide;
      player.vy = Math.min(player.vy, WALL_SMEAR_FALL_SPEED);
      player.ink = Math.max(0, player.ink - WALL_SMEAR_COST);
      if (player.animFrame % 4 === 0) addMobilityTrail("wall");
    } else {
      player.wallClingSide = 0;
    }

    const canGlide = jump && !player.onGround && !canWallSmear && player.vy > -0.4 && player.ink > INK_GLIDE_COST;
    player.isGliding = canGlide;
    if (canGlide) {
      player.vy = Math.min(player.vy, INK_GLIDE_FALL_SPEED);
      player.ink = Math.max(0, player.ink - INK_GLIDE_COST);
      if (player.animFrame % 5 === 0) addMobilityTrail("glide");
    }

    const dashCost = BRUSH_DASH_COST * (rushActive ? (TUNING.flow?.rushDashCostMultiplier ?? 0.65) : 1);
    if (dashKey && !player.dashKeyHeld && player.dashCooldown <= 0 && player.ink >= dashCost) {
      const dash = getBrushDashDirection({ left, right, up, down });
      player.vx = dash.x * BRUSH_DASH_SPEED;
      player.vy = dash.y * BRUSH_DASH_SPEED * BRUSH_DASH_VERTICAL_SCALE;
      player.onGround = false;
      if (Math.abs(dash.x) > 0.12) player.facing = dash.x < 0 ? -1 : 1;
      player.dashCooldown = Math.max(4, Math.round(BRUSH_DASH_COOLDOWN * (rushActive ? 0.75 : 1)));
      player.brushDashFlash = 14;
      player.ink -= dashCost;
      addMobilityTrail("dash");
    }
    player.dashKeyHeld = dashKey;

    const gravityScale = player.isGliding ? INK_GLIDE_GRAVITY_SCALE : 1;
    player.vy = Math.min(MAX_FALL, player.vy + GRAVITY * gravityScale);
    if (wasGrounded && player.vy > 0 && player.vy < GRAVITY * 1.5) player.vy = 0;
    player.dashCooldown = Math.max(0, player.dashCooldown - 1);
    player.attackTimer = attackController.state.remainingFrames;
    player.doubleJumpFlash = Math.max(0, player.doubleJumpFlash - 1);
    player.brushDashFlash = Math.max(0, player.brushDashFlash - 1);
    player.wallSmear = Math.max(0, player.wallSmear - 1);
    player.ink = Math.min(100 + player.maxInkBonus, player.ink + (player.onGround ? 0.045 : 0.018) + (rushActive ? (TUNING.flow?.rushInkRegenBonus ?? 0.065) : 0));
    updateMobilityTrails();

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

  function detectWallSide(moveDir) {
    if (moveDir === 0 || player.onGround) return 0;
    const sideX = player.x + moveDir * (player.w / 2 + 2);
    const top = player.y - player.h / 2 + 4;
    const mid = player.y;
    const bottom = player.y + player.h / 2 - 4;
    if (tileMap.solidAtPixel(sideX, top) || tileMap.solidAtPixel(sideX, mid) || tileMap.solidAtPixel(sideX, bottom)) {
      return moveDir;
    }
    return 0;
  }

  function getBrushDashDirection(input) {
    let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);

    if (dx === 0 && dy === 0 && Number.isFinite(mouse.x) && Number.isFinite(mouse.y) && (mouse.x !== 0 || mouse.y !== 0)) {
      const aim = screenToWorld(mouse.x, mouse.y);
      dx = aim.x - player.centerX;
      dy = aim.y - player.centerY;
      if (Math.hypot(dx, dy) < 48) {
        dx = player.facing;
        dy = -0.18;
      }
    }

    if (dx === 0 && dy === 0) {
      dx = player.facing;
      dy = -0.18;
    }

    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  function addMobilityTrail(kind) {
    player.mobilityTrails.push({
      x: player.x,
      y: player.y,
      vx: player.vx * -0.08,
      vy: player.vy * -0.08,
      facing: player.facing,
      life: kind === "dash" ? 18 : 14,
      maxLife: kind === "dash" ? 18 : 14,
      kind,
    });
    if (player.mobilityTrails.length > 18) player.mobilityTrails.shift();
  }

  function updateMobilityTrails() {
    for (const trail of player.mobilityTrails) {
      trail.x += trail.vx;
      trail.y += trail.vy;
      trail.life--;
    }
    player.mobilityTrails = player.mobilityTrails.filter((trail) => trail.life > 0);
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
    drawMobilityTrails(ctx, cameraX, cameraY);
    drawProtagonist(ctx, player, cameraX, cameraY);
    drawMovementAura(ctx, cameraX, cameraY);
  }

  function drawMobilityTrails(ctx, cameraX, cameraY) {
    for (const trail of player.mobilityTrails) {
      const t = trail.life / trail.maxLife;
      const x = trail.x - cameraX;
      const y = trail.y - cameraY;
      ctx.save();
      ctx.globalAlpha = 0.08 + t * 0.28;
      ctx.fillStyle = trail.kind === "dash" ? "#1d1b25" : trail.kind === "wall" ? "#4a4944" : "#1e3a5f";
      ctx.beginPath();
      ctx.ellipse(x - trail.facing * (4 + (1 - t) * 10), y + 2, 12 + (1 - t) * 10, 5 + (1 - t) * 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(241,234,217,0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - trail.facing * 3, y - 8);
      ctx.lineTo(x - trail.facing * (18 + (1 - t) * 14), y + 4);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawMovementAura(ctx, cameraX, cameraY) {
    if (player.brushDashFlash <= 0 && !player.isGliding && player.wallSmear <= 0) return;
    const x = player.x - cameraX;
    const y = player.y - cameraY;
    ctx.save();
    if (player.brushDashFlash > 0) {
      const t = player.brushDashFlash / 14;
      ctx.globalAlpha = 0.16 + t * 0.24;
      ctx.strokeStyle = "#1d1b25";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, 18 + (1 - t) * 16, 8 + (1 - t) * 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (player.isGliding) {
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = "#1e3a5f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 15, y + 2 + Math.sin(player.animFrame * 0.2) * 2);
      ctx.quadraticCurveTo(x, y + 12, x + 15, y + 2 + Math.cos(player.animFrame * 0.2) * 2);
      ctx.stroke();
    }
    if (player.wallSmear > 0) {
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = "#1d1b25";
      ctx.fillRect(x + player.wallClingSide * 8 - 2, y - 10, 4, 20);
    }
    ctx.restore();
  }

  return { state: player, attackController, reset, update, draw };
}



