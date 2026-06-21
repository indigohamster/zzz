import { TILE } from "../core/config.js?v=27";
import { GRAVITY, MAX_FALL } from "./InkwellConfig.js?v=2";
import { pickBossVariant } from "./BossCatalog.js?v=25";
import { pickMonsterForRoom } from "./MonsterCatalog.js?v=1";
import { drawModelSprite } from "../core/SpriteAssets.js?v=21";

export function createNpcManager({ physics, player, run, tileMap, combat, gameState }) {
  const npcs = [];
  let bossVariant = null;

  // 根据压力计算敌人强度乘数
  function getStressMultiplier() {
    if (!gameState) return 1.0;
    const stress = gameState.status.stress;
    // 压力 0-30: 1.0x, 压力 30-70: 1.1-1.3x, 压力 70-100: 1.3-1.5x
    if (stress >= 70) return 1.3 + (stress - 70) / 100;
    if (stress >= 30) return 1.0 + (stress - 30) / 150;
    return 1.0;
  }

  function reset() {
    npcs.length = 0;
    bossVariant = pickBossVariant();
    for (const room of tileMap.getRooms()) {
      if (room.type === "combat") spawnInRoom(room, 1 + Math.floor(Math.random() * 3), 36, false);
      if (room.type === "resource" && Math.random() > 0.35) spawnInRoom(room, 1, 32, false);
      if (room.type === "rift") spawnInRoom(room, 1 + Math.floor(Math.random() * 2), 44, false);
      if (room.type === "danger") spawnInRoom(room, 2 + Math.floor(Math.random() * 2), 52, false);
      if (room.type === "boss") spawnBoss(room);
    }
  }

  function spawnInRoom(room, count, hp, boss = false) {
    const stressMultiplier = getStressMultiplier();
    const adjustedHp = Math.round(hp * stressMultiplier);
    
    for (let i = 0; i < count; i++) {
      const archetype = boss ? null : pickEnemyArchetype(room.type);
      const spread = (room.w - 20) / (count + 1);
      const jitter = (Math.random() - 0.5) * Math.min(12, spread);
      const x = (room.x + 10 + (i + 1) * spread + jitter) * TILE;
      const y = (room.y + room.h - 8) * TILE + (archetype?.spawnYOffset ?? 0);
      const finalHp = adjustedHp + Math.round((archetype?.hpBonus ?? 0) * stressMultiplier);
      npcs.push({
        x,
        y,
        roomId: room.id,
        w: boss ? 32 : archetype?.w ?? 18,
        h: boss ? 30 : archetype?.h ?? 20,
        vx: i % 2 === 0 ? -0.35 : 0.35,
        vy: 0,
        hp: finalHp,
        maxHp: finalHp,
        hurt: 0,
        flash: 0,
        boss,
        rewardDropped: false,
        contactCooldown: 0,
        aiTimer: Math.floor(Math.random() * 60),
        attackCooldown: 30,
        skillWindup: 0,
        pendingSkill: null,
        pulseFrame: 0,
        slamActive: false,
        stuckFrames: 0,
        lastX: x,
        facing: i % 2 === 0 ? -1 : 1,
        patrolDir: i % 2 === 0 ? -1 : 1,
        state: "idle",
        archetype,
        variant: boss ? bossVariant : null,
        enemyType: boss ? bossVariant?.id ?? "boss" : archetype?.enemyType ?? archetype?.id ?? "swarm",
        combatTags: boss ? normalizeArray(bossVariant?.combatTags, ["boss", "elite"]) : normalizeArray(archetype?.combatTags),
        weakness: boss ? normalizeArray(bossVariant?.weakness) : normalizeArray(archetype?.weakness),
        resistance: boss ? normalizeArray(bossVariant?.resistance) : normalizeArray(archetype?.resistance),
      });
    }
  }

  function pickEnemyArchetype(roomType) {
    return pickMonsterForRoom(roomType);
  }

  function spawnBoss(room) {
    spawnInRoom(room, 1, bossVariant.hp, true);
  }

  function spawnGateHunters({ sourceX, sourceY, count = 1, hp = 42, roomType = "danger", color = "#b23b48", label = "Canvas Echo" } = {}) {
    const room = findRoomAtPixel(sourceX, sourceY) ?? pickSpawnRoom(roomType);
    if (!room) return 0;
    let spawned = 0;
    const archetype = {
      ...pickEnemyArchetype(roomType),
      color,
      eye: "#f7f0df",
      spriteId: "sketchling",
      spriteHeight: 40,
      contactDamage: 6,
      inkDrain: 4,
      behavior: "leaper",
      speed: 1.18,
      jump: -5.2,
      sightX: 260,
      sightY: 150,
    };

    for (let i = 0; i < count; i++) {
      const x = sourceX ?? (room.x + room.w / 2) * TILE;
      const y = sourceY ?? (room.y + room.h / 2) * TILE;
      const jitterX = (i - (count - 1) / 2) * 26 + (Math.random() - 0.5) * 18;
      const finalHp = Math.max(1, Math.round(hp * getStressMultiplier()));
      npcs.push({
        x: x + jitterX,
        y: y - 12,
        roomId: room.id,
        w: 18,
        h: 20,
        vx: i % 2 === 0 ? -0.55 : 0.55,
        vy: -1.2,
        hp: finalHp,
        maxHp: finalHp,
        hurt: 0,
        flash: 6,
        boss: false,
        rewardDropped: false,
        contactCooldown: 0,
        aiTimer: Math.floor(Math.random() * 60),
        attackCooldown: 30,
        skillWindup: 0,
        pendingSkill: null,
        pulseFrame: 16,
        slamActive: false,
        stuckFrames: 0,
        lastX: x + jitterX,
        facing: i % 2 === 0 ? -1 : 1,
        patrolDir: i % 2 === 0 ? -1 : 1,
        state: "gate_hunter",
        archetype,
        variant: null,
        enemyType: "gate_hunter",
        combatTags: ["canvas", "hunter"],
        weakness: ["sword", "whip"],
        resistance: ["dagger"],
        label,
      });
      spawned++;
    }
    return spawned;
  }

  function findRoomAtPixel(px, py) {
    if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
    const tx = px / TILE;
    const ty = py / TILE;
    return tileMap.getRooms().find((room) => (
      tx >= room.x &&
      tx <= room.x + room.w &&
      ty >= room.y &&
      ty <= room.y + room.h
    )) ?? null;
  }

  function pickSpawnRoom(roomType) {
    const rooms = tileMap.getRooms().filter((room) => room.type !== "entrance" && room.type !== "exit" && room.type !== "boss");
    const preferred = rooms.filter((room) => room.type === roomType || room.type === "danger" || room.type === "combat");
    const pool = preferred.length > 0 ? preferred : rooms;
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
  }

  function damageNpc(npc, baseDamage, direction, weaponTrait = "plain", knockback = 4, knockbackY = -1.35) {
    const armorScale = npc.variant?.damageScale ?? 1;
    const traitScale = npc.variant?.resistances?.[weaponTrait] ?? 1;
    const finalDamage = Math.max(1, Math.round(baseDamage * armorScale * traitScale));
    npc.hp -= finalDamage;
    const knockbackScale = npc.boss ? 0.36 : 1;
    npc.vx = direction * (knockback * knockbackScale + finalDamage / 22);
    npc.vy = Math.min(npc.vy || 0, npc.boss ? knockbackY * 0.25 : knockbackY);
    npc.hurt = 8;
    npc.flash = 5;
    return finalDamage;
  }

  function update() {
    for (const npc of npcs) {
      if (npc.hp <= 0) continue;
      const wasGrounded = npc.onGround;
      npc.aiTimer++;
      npc.attackCooldown = Math.max(0, npc.attackCooldown - 1);
      npc.contactCooldown = Math.max(0, (npc.contactCooldown ?? 0) - 1);
      npc.pulseFrame = Math.max(0, npc.pulseFrame - 1);
      if (npc.boss) updateBoss(npc);
      else updateWalker(npc);
      npc.vy = Math.min(MAX_FALL, (npc.vy || 0) + GRAVITY);
      physics.moveEntity(npc);
      if (npc.boss && npc.slamActive && !wasGrounded && npc.onGround) resolveBossLanding(npc);
      npc.stuckFrames = Math.abs(npc.x - npc.lastX) < 0.03 && Math.abs(npc.vx) > 0.12 ? npc.stuckFrames + 1 : 0;
      npc.lastX = npc.x;
      npc.hurt = Math.max(0, npc.hurt - 1);
      npc.flash = Math.max(0, (npc.flash || 0) - 1);
      applyContactDamage(npc);
    }
  }

  function updateWalker(npc) {
    const archetype = npc.archetype;
    if (!archetype) return;
    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    const active = Math.abs(dx) < archetype.sightX && Math.abs(dy) < archetype.sightY;
    if (!active) {
      npc.state = "patrol";
      const ahead = hasGroundAhead(npc, npc.patrolDir);
      if (npc.onGround && (!ahead || wallAhead(npc, npc.patrolDir))) npc.patrolDir *= -1;
      npc.facing = npc.patrolDir;
      npc.vx += (npc.patrolDir * archetype.speed * 0.42 - npc.vx) * 0.06;
      return;
    }

    npc.state = "chase";
    const dir = Math.sign(dx || npc.facing || 1);
    npc.facing = dir;
    const edgeAhead = npc.onGround && !hasGroundAhead(npc, dir);
    const blocked = wallAhead(npc, dir);
    let targetSpeed = dir * archetype.speed;
    if (archetype.behavior === "guard" && Math.abs(dx) < 66) targetSpeed *= 0.35;
    if (archetype.behavior === "sentinel" && Math.abs(dx) < 118) targetSpeed *= -0.38;
    if (archetype.behavior === "skitter" && Math.abs(dx) < 44) targetSpeed *= -0.8;
    if (edgeAhead && dy > -36) targetSpeed *= 0.25;
    npc.vx += (targetSpeed - npc.vx) * movementResponse(archetype);

    if (npc.onGround && (blocked || npc.stuckFrames > 14)) npc.vy = archetype.jump;
    if (npc.onGround && Math.abs(dx) < 86 && player.y + 8 < npc.y) npc.vy = archetype.jump;
    if (npc.onGround && npc.attackCooldown <= 0 && archetype.behavior === "leaper" && Math.abs(dx) < 164 && Math.abs(dy) < 92) {
      npc.vx = dir * (archetype.speed + 1.45);
      npc.vy = archetype.jump;
      npc.attackCooldown = 74;
    }
    if (npc.attackCooldown <= 0 && archetype.behavior === "sentinel" && Math.abs(dx) < 96 && Math.abs(dy) < 72) {
      npc.pulseFrame = 12;
      combat.hitPlayer({ amount: 3, sourceX: npc.x, knockbackX: 1.5, knockbackY: -0.9, inkDrain: 3 });
      npc.attackCooldown = 96;
    }
  }

  function movementResponse(archetype) {
    if (archetype.behavior === "skitter") return 0.13;
    if (archetype.behavior === "sentinel") return 0.06;
    return 0.085;
  }

  function updateBoss(npc) {
    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    const variant = npc.variant;
    const dir = Math.sign(dx || npc.facing || 1);
    npc.facing = dir;

    if (npc.skillWindup > 0) {
      npc.skillWindup--;
      npc.vx *= 0.82;
      if (npc.skillWindup === 0) executeBossSkill(npc);
      return;
    }

    const phaseBoost = npc.hp < npc.maxHp * 0.45 ? 1.24 : 1;
    npc.vx += (dir * variant.moveSpeed * phaseBoost - npc.vx) * 0.045;

    if (npc.attackCooldown <= 0 && Math.abs(dx) < 310 && Math.abs(dy) < 150) {
      npc.pendingSkill = variant.skill;
      npc.skillWindup = variant.skill === "pulse" ? 26 : 18;
    }
  }

  function executeBossSkill(npc) {
    const dx = player.x - npc.x;
    const dir = Math.sign(dx || npc.facing || 1);
    if (npc.pendingSkill === "dash") {
      npc.vx = dir * 5.2;
      npc.attackCooldown = 105;
    }
    if (npc.pendingSkill === "slam") {
      if (npc.onGround) {
        npc.vy = -7.0;
        npc.slamActive = true;
      }
      npc.attackCooldown = 130;
    }
    if (npc.pendingSkill === "pulse") {
      npc.pulseFrame = 16;
      if (Math.abs(dx) < 122 && Math.abs(player.y - npc.y) < 96) {
        combat.hitPlayer({ amount: 7, sourceX: npc.x, knockbackX: 2.2, knockbackY: -1.0, inkDrain: 2 });
      }
      npc.attackCooldown = 115;
    }
    npc.pendingSkill = null;
  }

  function resolveBossLanding(npc) {
    npc.slamActive = false;
    if (Math.abs(player.x - npc.x) < 138 && Math.abs(player.y - npc.y) < 72) {
      combat.hitPlayer({ amount: 8, sourceX: npc.x, knockbackX: 2.6, knockbackY: -2.3, inkDrain: 3 });
    }
  }

  function hasGroundAhead(npc, dir) {
    return tileMap.solidAtPixel(npc.x + dir * (npc.w / 2 + 8), npc.y + npc.h / 2 + 5);
  }

  function wallAhead(npc, dir) {
    const x = npc.x + dir * (npc.w / 2 + 3);
    return tileMap.solidAtPixel(x, npc.y + npc.h * 0.15) || tileMap.solidAtPixel(x, npc.y + npc.h * 0.42);
  }

  function applyContactDamage(npc) {
    const touchX = npc.boss ? 24 : 16;
    const touchY = npc.boss ? 28 : 22;
    if (npc.contactCooldown <= 0 && Math.abs(player.x - npc.x) < touchX && Math.abs(player.y - npc.y) < touchY) {
      const baseDamage = npc.boss ? 8 : (npc.archetype?.contactDamage ?? 5);
      const stressMultiplier = getStressMultiplier();
      const damage = Math.round(baseDamage * stressMultiplier);
      const didHit = combat.hitPlayer({
        amount: damage,
        sourceX: npc.x,
        knockbackX: npc.boss ? 2.4 : 1.7,
        knockbackY: npc.boss ? -1.8 : -1.2,
        inkDrain: npc.boss ? damage * 0.25 : (npc.archetype?.inkDrain ?? damage * 0.25),
      });
      if (didHit) npc.contactCooldown = npc.boss ? 42 : 34;
    }
  }

  function draw(ctx, cameraX, cameraY) {
    for (const npc of npcs) {
      if (npc.hp <= 0) continue;
      const x = Math.floor(npc.x - cameraX);
      const y = Math.floor(npc.y - cameraY);
      drawEnemyAura(ctx, npc, x, y);
      drawNpcBody(ctx, npc, x, y);
      drawNpcHealth(ctx, npc, x, y);
      if (npc.boss) {
        if (npc.skillWindup > 0 || npc.pulseFrame > 0) {
          const radius = npc.pulseFrame > 0 ? 36 + npc.pulseFrame * 5 : 28 - npc.skillWindup * 0.4;
          ctx.strokeStyle = npc.pendingSkill === "pulse" || npc.pulseFrame > 0 ? "rgba(30,58,95,0.8)" : "rgba(216,207,184,0.72)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(241,234,217,0.85)";
        ctx.font = "11px Courier New, monospace";
        ctx.fillText(npc.variant.name, x - 38, y - npc.h / 2 - 8);
        ctx.fillStyle = "rgba(216,207,184,0.72)";
        ctx.fillText(npc.variant.resistanceLabel, x - 38, y - npc.h / 2 + 5);
      } else if (npc.pulseFrame > 0) {
        ctx.strokeStyle = "rgba(178,59,72,0.65)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 18 + npc.pulseFrame * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawNpcBody(ctx, npc, x, y) {
    if (drawEnemySprite(ctx, npc, x, y)) return;
    if (npc.boss) {
      drawBossBody(ctx, npc, x, y);
      return;
    }
    const id = npc.archetype?.id ?? npc.enemyType;
    if (id === "inkmite") drawInkmite(ctx, npc, x, y);
    else if (id === "binder") drawBinder(ctx, npc, x, y);
    else if (id === "margin_eel") drawMarginEel(ctx, npc, x, y);
    else if (id === "paper_kite") drawPaperKite(ctx, npc, x, y);
    else if (id === "blot_sentinel") drawBlotSentinel(ctx, npc, x, y);
    else drawSketchling(ctx, npc, x, y);
  }

  function drawEnemySprite(ctx, npc, x, y) {
    const spriteId = npc.boss ? npc.variant?.spriteId : npc.archetype?.spriteId;
    if (!spriteId) return false;
    const height = npc.boss ? (npc.variant?.spriteHeight ?? 86) : (npc.archetype?.spriteHeight ?? 40);
    return drawModelSprite(ctx, spriteId, x, y + npc.h / 2 + (npc.boss ? 8 : 5), {
      height,
      facing: npc.facing,
      alpha: npc.hurt > 0 ? 0.82 : 1,
      frame: npc.aiTimer ?? 0,
      walkSpeed: Math.abs(npc.vx ?? 0) + Math.abs(npc.vy ?? 0),
      motion: npc.boss ? "boss" : npc.hurt > 0 || npc.flash > 0 ? "hurt" : "hostile",
      hurt: npc.hurt ?? npc.flash ?? 0,
      accent: npc.boss ? "#ff5166" : npc.archetype?.eye ?? "#f0d9a5",
    });
  }

  function drawEnemyAura(ctx, npc, x, y) {
    const pulse = npc.pulseFrame ?? 0;
    if (npc.hurt > 0 || npc.flash > 0) {
      ctx.fillStyle = npc.flash > 0 ? "rgba(255,255,255,0.22)" : "rgba(178,59,72,0.22)";
      ctx.fillRect(x - npc.w / 2 - 5, y - npc.h / 2 - 5, npc.w + 10, npc.h + 10);
    }
    if (pulse > 0) {
      ctx.strokeStyle = npc.boss ? "rgba(125,211,252,0.50)" : "rgba(178,59,72,0.56)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, (npc.boss ? 28 : 16) + pulse * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(x - Math.max(10, npc.w / 2), y + npc.h / 2 + 2, Math.max(20, npc.w), 4);
  }

  function drawNpcHealth(ctx, npc, x, y) {
    const w = npc.boss ? 44 : 28;
    const top = y + npc.h / 2 + 8;
    ctx.fillStyle = "#05070b";
    ctx.fillRect(x - w / 2, top, w, 4);
    ctx.fillStyle = npc.boss ? "#d8cfb8" : "#b41f32";
    ctx.fillRect(x - w / 2 + 1, top + 1, Math.max(0, (w - 2) * Math.max(0, npc.hp / npc.maxHp)), 2);
  }

  function drawSketchling(ctx, npc, x, y) {
    const color = enemyColor(npc, "#202026");
    const eye = npc.archetype?.eye ?? "#f1ead9";
    const wiggle = Math.round(Math.sin(npc.aiTimer * 0.18) * 1);
    rect(ctx, x - 11, y - 11 + wiggle, 22, 21, "#05070b");
    rect(ctx, x - 9, y - 9 + wiggle, 18, 17, color);
    rect(ctx, x - 12, y + 6, 6, 4, "#05070b");
    rect(ctx, x + 6, y + 6, 6, 4, "#05070b");
    rect(ctx, x - 7 + npc.facing, y - 4 + wiggle, 5, 5, eye);
    rect(ctx, x + 2 + npc.facing, y - 4 + wiggle, 5, 5, eye);
    rect(ctx, x - 4, y + 9 + wiggle, 3, 5, "#05070b");
    rect(ctx, x + 3, y + 9 - wiggle, 3, 5, "#05070b");
  }

  function drawInkmite(ctx, npc, x, y) {
    const color = enemyColor(npc, "#171921");
    const leg = Math.round(Math.sin(npc.aiTimer * 0.36) * 2);
    rect(ctx, x - 9, y - 7, 18, 14, "#05070b");
    rect(ctx, x - 7, y - 9, 14, 16, color);
    for (let i = -1; i <= 1; i++) {
      rect(ctx, x - 12, y + i * 4 + leg, 6, 2, "#05070b");
      rect(ctx, x + 6, y + i * 4 - leg, 6, 2, "#05070b");
    }
    rect(ctx, x + npc.facing * 3, y - 3, 4, 4, npc.archetype?.eye ?? "#5f6f96");
    rect(ctx, x - 2, y + 6, 4, 2, "#0b0f17");
  }

  function drawBinder(ctx, npc, x, y) {
    const color = enemyColor(npc, "#31272b");
    rect(ctx, x - 13, y - 16, 26, 30, "#05070b");
    rect(ctx, x - 10, y - 14, 20, 27, color);
    rect(ctx, x - 8, y - 12, 16, 4, "#5f432b");
    rect(ctx, x - 11, y - 2, 22, 3, "#5f432b");
    rect(ctx, x - 12, y + 7, 24, 4, "#1d1b25");
    rect(ctx, x + npc.facing * 5 - 3, y - 5, 8, 4, npc.archetype?.eye ?? "#d8cfb8");
    rect(ctx, x - 15, y + 10, 5, 8, "#05070b");
    rect(ctx, x + 10, y + 10, 5, 8, "#05070b");
  }

  function drawMarginEel(ctx, npc, x, y) {
    const color = enemyColor(npc, "#25212a");
    const wave = Math.round(Math.sin(npc.aiTimer * 0.13) * 2);
    rect(ctx, x - 17, y - 6 + wave, 34, 12, "#05070b");
    rect(ctx, x - 14, y - 4 + wave, 28, 8, color);
    rect(ctx, x + npc.facing * 12 - 3, y - 7 + wave, 7, 14, "#05070b");
    rect(ctx, x + npc.facing * 12 - 2, y - 5 + wave, 5, 10, color);
    rect(ctx, x + npc.facing * 13, y - 2 + wave, 3, 2, npc.archetype?.eye ?? "#d8cfb8");
    rect(ctx, x - npc.facing * 17, y - 1 + wave, 5, 2, "rgba(125,211,252,0.35)");
  }

  function drawPaperKite(ctx, npc, x, y) {
    const color = enemyColor(npc, "#2d3040");
    const flap = Math.round(Math.sin(npc.aiTimer * 0.2) * 3);
    ctx.fillStyle = "#05070b";
    ctx.beginPath();
    ctx.moveTo(x, y - 15 - flap);
    ctx.lineTo(x + 14, y);
    ctx.lineTo(x, y + 15 + flap);
    ctx.lineTo(x - 14, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 11 - flap);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x, y + 11 + flap);
    ctx.lineTo(x - 10, y);
    ctx.closePath();
    ctx.fill();
    rect(ctx, x - 1, y - 10, 2, 21, "#d8cfb8");
    rect(ctx, x + npc.facing * 4 - 2, y - 2, 4, 3, npc.archetype?.eye ?? "#f0d9a5");
    rect(ctx, x - npc.facing * 9, y + 13, 4, 3, "#b23b48");
  }

  function drawBlotSentinel(ctx, npc, x, y) {
    const color = enemyColor(npc, "#1d1b25");
    rect(ctx, x - 12, y - 14, 24, 26, "#05070b");
    rect(ctx, x - 9, y - 12, 18, 22, color);
    rect(ctx, x - 7, y - 16, 14, 5, "#05070b");
    rect(ctx, x + npc.facing * 4 - 3, y - 4, 7, 5, npc.archetype?.eye ?? "#b23b48");
    rect(ctx, x - 13, y + 8, 26, 4, "#05070b");
    if (npc.attackCooldown < 28 || npc.pulseFrame > 0) {
      ctx.strokeStyle = "rgba(178,59,72,0.65)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 16.5, y - 18.5, 33, 34);
    }
  }

  function drawBossBody(ctx, npc, x, y) {
    const id = npc.variant?.id;
    if (id === "eraser_warden") drawEraserWarden(ctx, npc, x, y);
    else if (id === "printhead_maw") drawPrintheadMaw(ctx, npc, x, y);
    else drawTemplateEngine(ctx, npc, x, y);
  }

  function drawTemplateEngine(ctx, npc, x, y) {
    const color = enemyColor(npc, "#111016");
    const spin = Math.floor(npc.aiTimer / 8) % 4;
    rect(ctx, x - 20, y - 19, 40, 34, "#05070b");
    rect(ctx, x - 16, y - 16, 32, 29, color);
    rect(ctx, x - 12, y - 11, 24, 16, "#1b2028");
    rect(ctx, x - 6, y - 7, 12, 8, npc.variant?.eye ?? "#f1ead9");
    const marks = [[-24,-23], [20,-20], [-27,12], [23,15]];
    for (let i = 0; i < marks.length; i++) {
      const m = marks[(i + spin) % marks.length];
      rect(ctx, x + m[0], y + m[1], 9, 9, "#05070b");
      rect(ctx, x + m[0] + 2, y + m[1] + 2, 5, 5, "#7dd3fc");
    }
    rect(ctx, x - 18, y + 15, 8, 8, "#05070b");
    rect(ctx, x + 10, y + 15, 8, 8, "#05070b");
  }

  function drawEraserWarden(ctx, npc, x, y) {
    const color = enemyColor(npc, "#e8e4d6");
    const crouch = npc.slamActive ? 5 : 0;
    rect(ctx, x - 18, y - 20 + crouch, 36, 37 - crouch, "#05070b");
    rect(ctx, x - 15, y - 17 + crouch, 30, 32 - crouch, color);
    rect(ctx, x - 12, y - 14 + crouch, 24, 4, "#b9a98a");
    rect(ctx, x - 16, y - 2 + crouch, 32, 5, "#b9a98a");
    rect(ctx, x + npc.facing * 6 - 4, y - 8 + crouch, 8, 5, npc.variant?.eye ?? "#1d1b25");
    rect(ctx, x - 23, y + 5 + crouch, 9, 18, "#05070b");
    rect(ctx, x + 14, y + 5 + crouch, 9, 18, "#05070b");
    rect(ctx, x + npc.facing * 20, y + 15 + crouch, 14, 8, "#d8cfb8");
  }

  function drawPrintheadMaw(ctx, npc, x, y) {
    const color = enemyColor(npc, "#292632");
    const open = npc.pendingSkill === "dash" || Math.abs(npc.vx) > 2.8;
    rect(ctx, x - 26, y - 13, 52, 25, "#05070b");
    rect(ctx, x - 22, y - 10, 44, 18, color);
    rect(ctx, x + npc.facing * 17 - 7, y - 5, 14, 7, npc.variant?.eye ?? "#b23b48");
    const mouthX = x + npc.facing * 25;
    rect(ctx, mouthX - 6, y + (open ? 4 : 7), 12, open ? 15 : 7, "#05070b");
    rect(ctx, mouthX - 5, y + (open ? 6 : 8), 10, open ? 11 : 4, "#b23b48");
    for (let i = 0; i < 4; i++) rect(ctx, mouthX - 5 + i * 3, y + (open ? 4 : 7), 2, 5, "#f1ead9");
    rect(ctx, x - npc.facing * 28, y - 8, 8, 20, "#05070b");
    rect(ctx, x - npc.facing * 34, y - 2, 7, 14, "#05070b");
  }

  function enemyColor(npc, fallback) {
    if (npc.flash > 0) return "#ffffff";
    if (npc.hurt > 0) return "#8d1d25";
    return npc.variant?.color ?? npc.archetype?.color ?? fallback;
  }

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }

  function allDead() {
    return npcs.every((npc) => npc.hp <= 0);
  }

  function roomHasEnemies(roomId) {
    return npcs.some((npc) => npc.roomId === roomId);
  }

  function roomEnemiesCleared(roomId) {
    return roomHasEnemies(roomId) && npcs.every((npc) => npc.roomId !== roomId || npc.hp <= 0);
  }

  function logWeaknessTable() {
    const rows = uniqueWeaknessRows();
    console.log(`[EnemyWeaknessTable]\n${rows.map(formatWeaknessRow).join("\n")}`);
  }

  function uniqueWeaknessRows() {
    const byType = new Map();
    for (const npc of npcs) {
      if (!npc.enemyType || byType.has(npc.enemyType)) continue;
      byType.set(npc.enemyType, {
        enemyType: npc.enemyType,
        weakness: normalizeArray(npc.weakness),
        resistance: normalizeArray(npc.resistance),
      });
    }
    return [...byType.values()];
  }

  return { npcs, reset, update, draw, allDead, roomHasEnemies, roomEnemiesCleared, logWeaknessTable, damageNpc, spawnGateHunters, getBossVariant: () => bossVariant };
}

function normalizeArray(value, fallback = []) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : fallback;
}

function formatWeaknessRow(row) {
  return `enemyType=${row.enemyType} weakness=${row.weakness.join(",") || "none"} resistance=${row.resistance.join(",") || "none"}`;
}
