const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const NIGHT_GOALS = [
  {
    id: "explore",
    title: "Map one strange room",
    detail: "Find at least one exploration site or bring back a discovery.",
    color: "#7dd3fc",
  },
  {
    id: "shape",
    title: "Bring back a useful shape",
    detail: "Open a chest, finish a portal room, or collect enough material.",
    color: "#f2b84b",
  },
  {
    id: "pressure",
    title: "Face the noisy room",
    detail: "Win a fight, survive a danger room, or retreat before the hand breaks.",
    color: "#b23b48",
  },
];

export function createCalendarSystem(gameState) {
  const state = gameState.calendar ?? createInitialCalendarState();
  gameState.calendar = state;

  function ensureDay(day = gameState.day) {
    const dayId = String(day);
    if (!state.days[dayId]) state.days[dayId] = createDayRecord(day);
    state.currentDay = day;
    return state.days[dayId];
  }

  function startDay({ contract, brief, companyState } = {}) {
    const record = ensureDay(gameState.day);
    record.status = "active";
    record.theme = pickDayTheme(gameState.day, companyState);
    record.slots = createBaseSlots(contract, brief);
    record.goals = createBaseGoals(contract, brief, gameState.day);
    record.notes = [];
    record.summary = "";
    state.lastUpdatedFrame++;
    return record;
  }

  function logOfficeAction({ label, action, message, color } = {}) {
    const record = ensureDay();
    const slot = findSlot(record, "office");
    slot.status = "active";
    slot.detail = message || action || slot.detail;
    slot.color = color || slot.color;
    pushNote(record, {
      type: "office",
      title: label || "Office action",
      body: message || action || "A work choice shaped the night.",
      color: color || "#f0d9a5",
    });
    state.stats.officeActions++;
    state.lastUpdatedFrame++;
  }

  function resolveOfficeGoal({ title, success, value, threshold, color } = {}) {
    const record = ensureDay();
    const slot = findSlot(record, "office");
    slot.status = success ? "done" : "missed";
    slot.detail = title || slot.detail;
    slot.color = success ? (color || "#7dd3fc") : "#b23b48";
    const goal = findGoal(record, "office");
    goal.status = success ? "done" : "missed";
    goal.detail = formatThreshold(value, threshold);
    goal.color = slot.color;
    if (success) state.stats.officeGoals++;
    state.lastUpdatedFrame++;
  }

  function logDrawingResult(result = {}) {
    const record = ensureDay();
    const slot = findSlot(record, "draw");
    slot.status = result.success ? "done" : "missed";
    slot.detail = (result.title || "Drawing brief") + "  " + Math.round((result.score ?? 0) * 100) + "%";
    slot.color = result.success ? "#7dd3fc" : "#f2b84b";
    const goal = findGoal(record, "drawing");
    goal.status = result.success ? "done" : "missed";
    goal.detail = String(result.passed ?? 0) + "/" + String(result.total ?? 0) + " checks";
    goal.color = slot.color;
    if (result.success) state.stats.briefWins++;
    state.lastUpdatedFrame++;
  }

  function startNight(carryover = {}) {
    const record = ensureDay();
    markSlot(record, "route", "done", carryover.label || "Home route settled", carryover.color);
    markSlot(record, "inkwell", "active", carryover.goalTitle || "Night dive started", carryover.color);
    state.lastUpdatedFrame++;
  }

  function finishNight(run = {}) {
    const record = ensureDay();
    const nightGoal = record.nightGoal ?? NIGHT_GOALS[0];
    const success = evaluateNightGoal(nightGoal.id, run);
    markSlot(record, "inkwell", success ? "done" : "missed", summarizeRun(run), success ? nightGoal.color : "#b23b48");
    const goal = findGoal(record, "night");
    goal.status = success ? "done" : "missed";
    goal.detail = summarizeRun(run);
    goal.color = success ? nightGoal.color : "#b23b48";
    record.status = "settled";
    record.summary = summarizeRun(run);
    state.stats.explorationFinds += Math.max(0, run.explorationFinds ?? 0);
    state.stats.discoveryInfusions += Array.isArray(run.discoveryInfusions) ? run.discoveryInfusions.length : 0;
    state.stats.bossRewards += Math.max(0, run.bossRewards ?? 0);
    state.stats.portals += Math.max(0, run.canvasGateReturns ?? run.gateReturnDrifts ?? 0);
    if (success) state.stats.nightGoals++;
    state.lastUpdatedFrame++;
  }

  function getSnapshot({ companyState, companyContract } = {}) {
    const record = ensureDay();
    if (companyContract && !findGoal(record, "office").title) {
      startDay({ contract: companyContract, brief: gameState.drawingBrief, companyState });
    }
    return {
      day: gameState.day,
      week: Math.floor((gameState.day - 1) / 7) + 1,
      weekday: WEEKDAYS[(gameState.day - 1) % WEEKDAYS.length],
      record,
      weekDays: buildWeekDays(gameState.day),
      mainline: buildMainline(),
      sideQuests: buildSideQuests(companyState),
      stats: { ...state.stats },
    };
  }

  function buildWeekDays(day) {
    const weekStart = Math.floor((day - 1) / 7) * 7 + 1;
    return WEEKDAYS.map((weekday, index) => {
      const current = weekStart + index;
      const record = state.days[String(current)];
      return {
        day: current,
        weekday,
        current: current === day,
        status: record?.status ?? (current < day ? "missed" : "locked"),
        summary: record?.summary ?? "",
      };
    });
  }

  function buildMainline() {
    const settledDays = Object.values(state.days).filter((day) => day.status === "settled").length;
    const visualProgress = Math.min(6, state.stats.briefWins + state.stats.discoveryInfusions);
    const bossProgress = Math.min(3, state.stats.bossRewards + Math.floor(state.stats.nightGoals / 3));
    return [
      progressQuest("main_01", "Make the day and night talk", settledDays, 5, "#7dd3fc"),
      progressQuest("main_02", "Recover a visual language", visualProgress, 6, "#f2b84b"),
      progressQuest("main_03", "Confront the template below", bossProgress, 3, "#b23b48"),
    ];
  }

  function buildSideQuests(companyState = {}) {
    const reputation = Math.round(companyState?.reputation ?? 0);
    const morale = Math.round(companyState?.morale ?? 0);
    const routeFinds = Math.min(10, state.stats.explorationFinds);
    const officeTrust = Math.min(100, reputation + Math.floor(morale / 2));
    return [
      progressQuest("side_routes", "Ink route map", routeFinds, 10, "#7dd3fc"),
      progressQuest("side_office", "Office trust", officeTrust, 100, "#86c06c"),
      progressQuest("side_briefs", "Brief discipline", state.stats.officeGoals + state.stats.briefWins, 8, "#f2b84b"),
    ];
  }

  return {
    ensureDay,
    startDay,
    logOfficeAction,
    resolveOfficeGoal,
    logDrawingResult,
    startNight,
    finishNight,
    getSnapshot,
  };
}

function createInitialCalendarState() {
  return {
    currentDay: 1,
    lastUpdatedFrame: 0,
    days: {},
    stats: {
      officeActions: 0,
      officeGoals: 0,
      briefWins: 0,
      nightGoals: 0,
      explorationFinds: 0,
      discoveryInfusions: 0,
      bossRewards: 0,
      portals: 0,
    },
  };
}

function createDayRecord(day) {
  const nightGoal = NIGHT_GOALS[(day - 1) % NIGHT_GOALS.length];
  return {
    day,
    weekday: WEEKDAYS[(day - 1) % WEEKDAYS.length],
    theme: pickDayTheme(day),
    status: "planned",
    nightGoal,
    slots: createBaseSlots(),
    goals: createBaseGoals(null, null, day),
    notes: [],
    summary: "",
  };
}

function createBaseSlots(contract, brief) {
  return [
    {
      id: "office",
      time: "09:00",
      title: "Office",
      detail: contract?.title ?? "Receive the picture brief",
      status: "active",
      color: contract?.color ?? "#7dd3fc",
    },
    {
      id: "route",
      time: "18:30",
      title: "Home / shop",
      detail: "Buy supplies or protect the hand",
      status: "pending",
      color: "#f0d9a5",
    },
    {
      id: "draw",
      time: "21:00",
      title: "Drawing desk",
      detail: brief?.title ?? "Turn the brief into a weapon",
      status: "pending",
      color: "#f2b84b",
    },
    {
      id: "inkwell",
      time: "00:00",
      title: "Inkwell",
      detail: "Explore what the drawing opened",
      status: "pending",
      color: "#7dd3fc",
    },
  ];
}

function createBaseGoals(contract, brief, day) {
  const nightGoal = NIGHT_GOALS[(day - 1) % NIGHT_GOALS.length];
  return [
    {
      id: "office",
      type: "daily",
      title: contract?.title ?? "Shape the office brief",
      detail: contract ? contract.target + " " + (contract.direction === "low" ? "<=" : ">=") + " " + contract.threshold : "Finish a work choice",
      status: "open",
      color: contract?.color ?? "#7dd3fc",
    },
    {
      id: "drawing",
      type: "daily",
      title: "Match the drawing brief",
      detail: brief?.title ?? "Make one readable weapon",
      status: "open",
      color: "#f2b84b",
    },
    {
      id: "night",
      type: "daily",
      title: nightGoal.title,
      detail: nightGoal.detail,
      status: "open",
      color: nightGoal.color,
    },
  ];
}

function pickDayTheme(day, companyState = {}) {
  if ((companyState.deadline ?? 0) > 70) return "Deadline heat";
  if ((companyState.morale ?? 0) > 70) return "Team air";
  if ((companyState.scope ?? 0) > 70) return "Clear silhouette";
  const themes = ["Rough sketch", "Reference hunt", "Client fog", "Quiet repair", "Deep dive"];
  return themes[(day - 1) % themes.length];
}

function findSlot(record, id) {
  let slot = record.slots.find((item) => item.id === id);
  if (!slot) {
    slot = { id, time: "--:--", title: id, detail: "", status: "pending", color: "#f0d9a5" };
    record.slots.push(slot);
  }
  return slot;
}

function markSlot(record, id, status, detail, color) {
  const slot = findSlot(record, id);
  slot.status = status;
  if (detail) slot.detail = detail;
  if (color) slot.color = color;
}

function findGoal(record, id) {
  let goal = record.goals.find((item) => item.id === id);
  if (!goal) {
    goal = { id, type: "daily", title: "", detail: "", status: "open", color: "#f0d9a5" };
    record.goals.push(goal);
  }
  return goal;
}

function pushNote(record, note) {
  record.notes.unshift(note);
  record.notes = record.notes.slice(0, 4);
}

function formatThreshold(value, threshold) {
  if (value === undefined || threshold === undefined) return "resolved";
  return "value " + Math.round(value) + " / target " + Math.round(threshold);
}

function progressQuest(id, title, current, target, color) {
  const safeTarget = Math.max(1, target);
  const clamped = Math.max(0, Math.min(safeTarget, current));
  return {
    id,
    title,
    current: clamped,
    target: safeTarget,
    ratio: clamped / safeTarget,
    status: clamped >= safeTarget ? "done" : "open",
    color,
  };
}

function evaluateNightGoal(goalId, run) {
  if (goalId === "explore") return (run.explorationFinds ?? 0) > 0 || (run.itemsCollected ?? 0) > 0;
  if (goalId === "shape") return (run.chestsOpened ?? 0) > 0 || (run.materialsCollected ?? 0) >= 8 || (run.itemsCollected ?? 0) > 0;
  return (run.kills ?? 0) > 0 || (run.bossRewards ?? 0) > 0 || run.finishReason === "retreat";
}

function summarizeRun(run) {
  const finds = run.explorationFinds ?? 0;
  const items = run.itemsCollected ?? 0;
  const kills = run.kills ?? 0;
  const reason = run.finishReason ?? "return";
  if ((run.bossRewards ?? 0) > 0) return "Boss reward brought back";
  if (finds > 0) return String(finds) + " finds, " + String(items) + " items, " + String(kills) + " fights";
  if (items > 0) return String(items) + " items carried home";
  if (kills > 0) return String(kills) + " fights survived";
  return "Night ended: " + reason;
}
