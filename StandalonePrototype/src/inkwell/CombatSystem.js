const PLAYER_HIT_INVULN_FRAMES = 34;
const PLAYER_HURT_FRAMES = 12;
const DAMAGE_TEXT_LIFE = 34;
const CRIT_MULTIPLIER = 1.65;
const COUNTER_DAMAGE_MULTIPLIER = 1.35;
const RESIST_DAMAGE_MULTIPLIER = 0.75;

export function createCombatSystem({ player, run, random = Math.random }) {
  const floatingTexts = [];

  function reset() {
    floatingTexts.length = 0;
    player.invulnerableFrames = 0;
    player.hurtFrames = 0;
  }

  function update() {
    player.invulnerableFrames = Math.max(0, (player.invulnerableFrames ?? 0) - 1);
    player.hurtFrames = Math.max(0, (player.hurtFrames ?? 0) - 1);

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const text = floatingTexts[i];
      text.age++;
      text.x += text.vx;
      text.y += text.vy;
      text.vy += 0.012;
      if (text.age >= text.life) floatingTexts.splice(i, 1);
    }
  }

  function strikeNpc({ npc, npcManager, baseDamage, direction, weapon, weaponTrait, knockbackX, knockbackY, attackState = null }) {
    const roll = rollWeaponDamage(baseDamage, weapon, random);
    const matchup = resolveWeaponEnemyMatchup({ weapon, attackState, npc });
    const damageAfterMatchup = Math.max(1, Math.round(roll.damage * matchup.multiplier));
    const finalDamage = npcManager.damageNpc(npc, damageAfterMatchup, direction, weaponTrait, knockbackX, knockbackY);
    logMatchup(matchup);
    spawnFloatingText({
      text: roll.critical ? `${finalDamage}!` : String(finalDamage),
      x: npc.x,
      y: npc.y - npc.h * 0.65,
      color: roll.critical ? "#f0d9a5" : "#f7f0df",
      size: roll.critical ? 16 : 13,
      vx: (random() - 0.5) * 0.35,
      vy: roll.critical ? -0.92 : -0.72,
    });
    if (matchup.state !== "normal") {
      spawnFloatingText({
        text: matchup.state === "counter" ? "WEAK!" : "RESIST",
        x: npc.x,
        y: npc.y - npc.h * 0.65 - 16,
        color: matchup.state === "counter" ? "#f0d9a5" : "#8b8173",
        size: 13,
        vx: (random() - 0.5) * 0.25,
        vy: -0.86,
      });
    }
    return { damage: finalDamage, critical: roll.critical };
  }

  function hitPlayer({ amount, sourceX = player.x, knockbackX = 1.8, knockbackY = -1.3, inkDrain = 0, invulnFrames = PLAYER_HIT_INVULN_FRAMES }) {
    if ((player.invulnerableFrames ?? 0) > 0) return false;
    const damage = Math.max(0, amount);
    if (damage <= 0) return false;

    const dir = Math.sign(player.x - sourceX || player.facing || 1);
    player.hp = Math.max(0, player.hp - damage);
    player.ink = Math.max(0, player.ink - inkDrain);
    player.vx += dir * knockbackX;
    player.vy = Math.min(player.vy, knockbackY);
    player.invulnerableFrames = invulnFrames;
    player.hurtFrames = PLAYER_HURT_FRAMES;
    run.hitsTaken += damage;

    spawnFloatingText({
      text: `-${formatDamage(damage)}`,
      x: player.x,
      y: player.y - player.h * 0.75,
      color: "#b41f32",
      size: 13,
      vx: dir * 0.22,
      vy: -0.82,
    });
    return true;
  }

  function draw(ctx, cameraX, cameraY) {
    for (const text of floatingTexts) {
      const t = text.age / text.life;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.fillStyle = text.color;
      ctx.font = `${text.size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
      ctx.fillText(text.text, Math.floor(text.x - cameraX), Math.floor(text.y - cameraY));
      ctx.restore();
    }
  }

  function spawnFloatingText({ text, x, y, color, size, vx, vy }) {
    floatingTexts.push({
      text,
      x,
      y,
      color,
      size,
      vx,
      vy,
      age: 0,
      life: DAMAGE_TEXT_LIFE,
    });
  }

  return { reset, update, strikeNpc, hitPlayer, draw };
}

function rollWeaponDamage(baseDamage, weapon, random) {
  const stats = weapon?.finalStats ?? weapon?.combat ?? {};
  const variance = clampNumber(stats.damageVariance, 0, 0.35, 0.08);
  const critChance = clampNumber(stats.criticalChance ?? stats.crit, 0, 1, 0);
  const varianceScale = 1 + (random() * 2 - 1) * variance;
  const critical = random() < critChance;

  // Apply chaotic tendency random effect
  let chaoticMultiplier = 1;
  if (stats.chaoticEffect && stats.chaoticStrength > 0) {
    // Random multiplier between 0.7 and 1.3 (more extreme at higher strength)
    const minMult = 0.7 - stats.chaoticStrength * 0.1;
    const maxMult = 1.3 + stats.chaoticStrength * 0.1;
    chaoticMultiplier = minMult + random() * (maxMult - minMult);
    console.log("[ChaoticEffect]", { chaoticMultiplier, strength: stats.chaoticStrength });
  }

  const damage = Math.max(1, Math.round(baseDamage * varianceScale * chaoticMultiplier * (critical ? CRIT_MULTIPLIER : 1)));
  return { damage, critical };
}

function resolveWeaponEnemyMatchup({ weapon, attackState, npc }) {
  const weaponTags = getWeaponCounterTags(weapon, attackState);
  const weakness = normalizeTags(npc?.weakness);
  const resistance = normalizeTags(npc?.resistance);
  const counterTag = weaponTags.find((tag) => weakness.includes(tag));
  if (counterTag) {
    return {
      state: "counter",
      weaponTag: counterTag,
      enemyTag: getEnemyCounterLabel(npc),
      multiplier: COUNTER_DAMAGE_MULTIPLIER,
    };
  }

  const resistedTag = weaponTags.find((tag) => resistance.includes(tag));
  if (resistedTag) {
    return {
      state: "resisted",
      weaponTag: resistedTag,
      enemyTag: getEnemyCounterLabel(npc),
      multiplier: RESIST_DAMAGE_MULTIPLIER,
    };
  }

  return {
    state: "normal",
    weaponTag: weaponTags[0] ?? "sword",
    enemyTag: getEnemyCounterLabel(npc),
    multiplier: 1,
  };
}

function getWeaponCounterTags(weapon, attackState) {
  const weaponType = normalizeToken(
    attackState?.archetype ??
      weapon?.weaponType ??
      weapon?.weaponArchetype ??
      weapon?.archetype?.id ??
      weapon?.combat?.weaponArchetype ??
      weapon?.combat?.type ??
      "sword"
  ).toLowerCase();
  const attackPattern = normalizeToken(
    attackState?.attackPattern ??
      weapon?.attackPattern ??
      weapon?.archetype?.attackPattern ??
      weapon?.combat?.attackPattern ??
      "arcSlash"
  ).toLowerCase();

  if (weaponType.includes("spear") || attackPattern.includes("thrust")) return ["spear"];
  if (weaponType.includes("dagger") || attackPattern.includes("combo")) return ["dagger"];
  if (weaponType.includes("hammer") || weaponType.includes("axe") || attackPattern.includes("smash") || attackPattern.includes("slam")) return ["hammer"];
  if (weaponType.includes("whip") || attackPattern.includes("whip") || attackPattern.includes("lash")) return ["whip"];
  return ["sword"];
}

function getEnemyCounterLabel(npc) {
  return npc?.enemyType ?? getFirstRawTag(npc?.combatTags) ?? "unknown";
}

function logMatchup(matchup) {
  if (matchup.state === "counter") {
    console.log(`[CounterHit] weapon=${matchup.weaponTag} enemy=${matchup.enemyTag} multiplier=${matchup.multiplier}`);
  }
  if (matchup.state === "resisted") {
    console.log(`[ResistedHit] weapon=${matchup.weaponTag} enemy=${matchup.enemyTag} multiplier=${matchup.multiplier}`);
  }
}

function normalizeTags(tags) {
  return Array.isArray(tags) ? tags.map((tag) => normalizeToken(tag).toLowerCase()).filter(Boolean) : [];
}

function normalizeToken(value) {
  return String(value ?? "").trim();
}

function getFirstRawTag(tags) {
  return Array.isArray(tags) ? tags.find((tag) => typeof tag === "string" && tag.length > 0) : null;
}

function formatDamage(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
