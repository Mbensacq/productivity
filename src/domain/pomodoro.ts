/** Pomodoro / time-accounting helpers. Pure functions. */
export const DEFAULT_POMODORO_MIN = 25;
export const QUICK_START_POMODORO_MIN = 5;

/** Adds a completed session to a task's spent time (clamped to non-negative). */
export function addSpentTime(spentMin: number, sessionMin: number): number {
  return Math.max(0, spentMin) + Math.max(0, sessionMin);
}

export interface EstimateAccuracy {
  estimateMin: number;
  spentMin: number;
  /** Spent minus estimate; positive means over budget. */
  deltaMin: number;
  /** Spent / estimate, or null when no estimate was set. */
  ratio: number | null;
}

export function estimateAccuracy(estimateMin: number, spentMin: number): EstimateAccuracy {
  return {
    estimateMin,
    spentMin,
    deltaMin: spentMin - estimateMin,
    ratio: estimateMin > 0 ? spentMin / estimateMin : null,
  };
}

/** Formats a duration in minutes as "Xh Ym" / "X h" / "Y min". */
export function formatDuration(totalMin: number): string {
  const minutes = Math.max(0, Math.round(totalMin));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) {
    return `${remainder} min`;
  }
  if (remainder === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${remainder} min`;
}
