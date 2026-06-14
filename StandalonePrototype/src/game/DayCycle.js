const PHASES = ["morning", "work", "free", "inkwell", "settlement"];

export function createDayCycle(gameState) {
  function setPhase(phase) {
    if (!PHASES.includes(phase)) throw new Error(`Unknown day phase: ${phase}`);
    gameState.phase = phase;
  }

  function nextPhase() {
    const index = PHASES.indexOf(gameState.phase);
    const next = PHASES[(index + 1) % PHASES.length];
    if (gameState.phase === "settlement") gameState.day++;
    setPhase(next);
    return gameState.phase;
  }

  return { phases: PHASES, setPhase, nextPhase };
}
