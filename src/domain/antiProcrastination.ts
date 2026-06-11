/**
 * Anti-procrastination rules. Pure functions over a minimal task shape so they
 * can be unit-tested and reused by the UI guards.
 */
export const DECOMPOSITION_THRESHOLD_MIN = 25;
export const TWO_MINUTE_THRESHOLD_MIN = 2;
export const DEFER_FRICTION_THRESHOLD = 3;

export interface SchedulableTask {
  estimateMin: number | null;
  implementationIntention: string | null;
  subtaskCount: number;
  deferCount: number;
}

export type ScheduleEvaluation = 'ok' | 'needs-decomposition' | 'needs-intention';

/** A task estimated above the threshold must be broken into subtasks first. */
export function requiresDecomposition(
  estimateMin: number | null,
  subtaskCount: number,
  thresholdMin: number = DECOMPOSITION_THRESHOLD_MIN,
): boolean {
  return estimateMin !== null && estimateMin > thresholdMin && subtaskCount === 0;
}

/** The "2-minute rule": tiny tasks worth doing immediately. */
export function isTwoMinuteTask(
  estimateMin: number | null,
  thresholdMin: number = TWO_MINUTE_THRESHOLD_MIN,
): boolean {
  return estimateMin !== null && estimateMin > 0 && estimateMin <= thresholdMin;
}

/**
 * Whether a task may be activated for today, and if not, why:
 * it must be decomposed when large, and carry an implementation intention.
 */
export function evaluateScheduleToday(
  task: SchedulableTask,
  thresholdMin: number = DECOMPOSITION_THRESHOLD_MIN,
): ScheduleEvaluation {
  if (requiresDecomposition(task.estimateMin, task.subtaskCount, thresholdMin)) {
    return 'needs-decomposition';
  }
  if (task.implementationIntention === null || task.implementationIntention.trim() === '') {
    return 'needs-intention';
  }
  return 'ok';
}

export interface DeferFriction {
  count: number;
  /** True once the task has been deferred enough to prompt a break-down/drop. */
  suggestBreakdown: boolean;
}

export function deferFriction(
  deferCount: number,
  threshold: number = DEFER_FRICTION_THRESHOLD,
): DeferFriction {
  return { count: deferCount, suggestBreakdown: deferCount >= threshold };
}
