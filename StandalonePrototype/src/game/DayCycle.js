const PHASES = ["morning", "work", "free", "inkwell", "settlement"];

export function createDayCycle(gameState) {
  let currentWorkEvents = [];  // 当前 work 阶段触发的事件列表
  let currentEventIndex = 0;  // 当前事件索引

  function setPhase(phase) {
    if (!PHASES.includes(phase)) throw new Error(`Unknown day phase: ${phase}`);
    gameState.phase = phase;
    
    // 进入 work 阶段时，生成工作事件
    if (phase === "work") {
      const { selectWorkEvents } = require("./WorkEvents.js");
      currentWorkEvents = selectWorkEvents(gameState);
      currentEventIndex = 0;
      console.log(`[DayCycle] Entering work phase, ${currentWorkEvents.length} events generated`);
    }
  }

  function nextPhase() {
    const index = PHASES.indexOf(gameState.phase);
    const next = PHASES[(index + 1) % PHASES.length];
    if (gameState.phase === "settlement") gameState.day++;
    setPhase(next);
    return gameState.phase;
  }

  /**
   * 获取当前 work 阶段的事件
   */
  function getCurrentWorkEvent() {
    if (gameState.phase !== "work") return null;
    if (currentEventIndex >= currentWorkEvents.length) return null;
    return currentWorkEvents[currentEventIndex];
  }

  /**
   * 完成当前事件，进入下一个事件
   * @returns {boolean} 是否还有更多事件
   */
  function advanceWorkEvent() {
    if (gameState.phase !== "work") return false;
    
    // 应用当前事件的效果
    const currentEvent = currentWorkEvents[currentEventIndex];
    if (currentEvent) {
      const { applyWorkEventEffects } = require("./WorkEvents.js");
      applyWorkEventEffects(gameState, currentEvent);
    }
    
    // 进入下一个事件
    currentEventIndex++;
    
    // 如果所有事件都完成了，自动进入 free 阶段
    if (currentEventIndex >= currentWorkEvents.length) {
      setPhase("free");
      return false; // 没有更多事件了
    }
    
    return true; // 还有更多事件
  }

  /**
   * 获取 work 阶段进度
   * @returns {Object} { current: number, total: number }
   */
  function getWorkProgress() {
    return {
      current: currentEventIndex,
      total: currentWorkEvents.length,
    };
  }

  return { 
    phases: PHASES, 
    setPhase, 
    nextPhase,
    getCurrentWorkEvent,
    advanceWorkEvent,
    getWorkProgress,
  };
}
