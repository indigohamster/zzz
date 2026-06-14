import { createDefaultWeaponProfile } from "./WeaponGenerator.js?v=32";
import { createBuildState } from "./builds/BuildState.js";

export function createGameState() {
  const buildState = createBuildState();
  const currentWeapon = createDefaultWeaponProfile();
  currentWeapon.buildState = buildState;
  return {
    day: 1,
    phase: "free",
    money: 0,
    status: {
      hp: 100,
      fatigue: 0,
      mood: "tired",
      emotion: "calm",
      inspiration: 0,
      inkMax: 100,
    },
    currentBrief: {
      id: "mvp-weapon-brief",
      type: "equipment",
      title: "Draw something you still care about",
      client: "Zhou",
      requirementText: "Produce one readable weapon silhouette before dawn.",
      deadlinePressure: 1,
      rewardMoney: 0,
      commercialScoreRules: ["clear silhouette", "usable action pose"],
      soulScoreRules: ["visible time investment", "kept imperfect marks"],
      aiReferenceAllowed: false,
      specialFlags: ["first_loop"],
    },
    currentWeapon,
    buildState,
    materials: {},
    npcRelations: {
      inkdot: 1,
      zhou: 0,
    },
    unlocks: {},
    storyFlags: {},
  };
}

export function applyWeaponProfile(gameState, weaponProfile) {
  Object.assign(gameState.currentWeapon, weaponProfile);
  gameState.currentWeapon.buildState = gameState.buildState;
  console.log("[WeaponEquipped]", {
    id: gameState.currentWeapon.id,
    name: gameState.currentWeapon.name,
    weaponType: gameState.currentWeapon.weaponType,
    archetype: gameState.currentWeapon.archetype?.id,
    weaponArchetype: gameState.currentWeapon.weaponArchetype,
    attackPattern: gameState.currentWeapon.attackPattern ?? gameState.currentWeapon.archetype?.attackPattern,
    range: gameState.currentWeapon.finalStats?.range,
    damage: gameState.currentWeapon.finalStats?.damage,
  });
  return gameState.currentWeapon;
}
