import { TILE } from "../core/config.js";
import { GRAVITY, MAX_FALL } from "./InkwellConfig.js";
import { pickBossVariant } from "./BossCatalog.js?v=24";
import { pickMonsterForRoom } from "./MonsterCatalog.js";

export function createNpcManager({ physics, player, run, tileMap, combat }) {
  const npcs = [];
  let bossVariant = null;

  function reset() {
    npcs.length = 0;
    bossVariant = pickBossVariant();
    for (const room of tileMap.getRooms()) {
      if (room.type === "combat") spawnInRoom(room, 1 + Math.floor(Math.random() * 3), 36, false);
      if (room.type === "resource" && Math.random() > 0.35) spawnInRoom(room, 1, 32, false);
      if (room.type === "rift") spawnInRoom(room, 1 + Math.floor(Math.random() * 2), 44, false);
      if (room.type === "boss") spawnBoss(room);
    }
  }

  function spawnInRoom(room, count, hp, boss = false) {
    for (let i = 0; i < count; i++) {
      const archetype = boss ? null : pickEnemyArchetype(room.type);
      const spread = (room.w - 20) / (count + 1);
      const jitter = (Math.random() - 0.5) * Math.min(12, spread);
      const x = (room.x + 10 + (i + 1) * spread + jitter) * TILE;
      const y = (room.y + room.h - 8) * TILE + (archetype?.spawnYOffset ?? 0);
      npcs.push({
        x,
        y,
        roomId: room.id,
        w: boss ? 32 : archetype?.w ?? 18,
        h: boss ? 30 : archetype?.h ?? 20,
        vx: i % 2 === 0 ? -0.35 : 0.35,
        vy: 0,
        hp: hp + (archetype?.hpBonus ?? 0),
        maxHp: hp + (archetype?.hpBonus ?? 0),
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
      const damage = npc.boss ? 8 : (npc.archetype?.contactDamage ?? 5);
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
      ctx.fillStyle = npc.flash > 0 ? "#ffffff" : npc.hurt > 0 ? "#8d1d25" : npc.variant?.color ?? npc.archetype?.color ?? "#202026";
      drawNpcBody(ctx, npc, x, y);
      ctx.fillStyle = npc.variant?.eye ?? npc.archetype?.eye ?? "#f1ead9";
      ctx.fillRect(x - (npc.boss ? 8 : 4) + npc.facing, y - 4, npc.boss ? 16 : 8, 2);
      ctx.fillStyle = "#111";
      ctx.fillRect(x - 14, y + npc.h / 2 + 4, 28, 3);
      ctx.fillStyle = npc.boss ? "#d8cfb8" : "#b41f32";
      ctx.fillRect(x - 14, y + npc.h / 2 + 4, 28 * Math.max(0, npc.hp / npc.maxHp), 3);
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
        ctx.font = "11px Segoe UI, sans-serif";
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
    const shape = npc.archetype?.shape;
    if (npc.boss || shape === "box") {
      ctx.fillRect(x - npc.w / 2, y - npc.h / 2, npc.w, npc.h);
      return;
    }

    if (shape === "round") {
      ctx.beginPath();
      ctx.ellipse(x, y, npc.w / 2, npc.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (shape === "kite") {
      ctx.beginPath();
      ctx.moveTo(x, y - npc.h / 2);
      ctx.lineTo(x + npc.w / 2, y);
      ctx.lineTo(x, y + npc.h / 2);
      ctx.lineTo(x - npc.w / 2, y);
      ctx.closePath();
      ctx.fill();
      return;
    }

    if (shape === "long") {
      ctx.fillRect(x - npc.w / 2, y - npc.h / 2 + 2, npc.w, npc.h - 4);
      ctx.fillRect(x - npc.w / 2 + 3, y - npc.h / 2, npc.w - 6, 4);
      return;
    }

    ctx.fillRect(x - npc.w / 2, y - npc.h / 2, npc.w, npc.h);
    ctx.fillRect(x - npc.w / 2 - 2, y + npc.h / 2 - 7, npc.w + 4, 5);
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

  return { npcs, reset, update, draw, allDead, roomHasEnemies, roomEnemiesCleared, logWeaknessTable, damageNpc, getBossVariant: () => bossVariant };
}

function normalizeArray(value, fallback = []) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : fallback;
}

function formatWeaknessRow(row) {
  return `enemyType=${row.enemyType} weakness=${row.weakness.join(",") || "none"} resistance=${row.resistance.join(",") || "none"}`;
}
