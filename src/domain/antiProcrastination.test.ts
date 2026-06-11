import { describe, expect, it } from 'vitest';
import {
  deferFriction,
  evaluateScheduleToday,
  isTwoMinuteTask,
  requiresDecomposition,
  type SchedulableTask,
} from './antiProcrastination';

const baseTask: SchedulableTask = {
  estimateMin: 10,
  implementationIntention: 'After lunch, at my desk',
  subtaskCount: 0,
  deferCount: 0,
};

describe('requiresDecomposition', () => {
  it('flags a large task with no subtasks', () => {
    expect(requiresDecomposition(40, 0)).toBe(true);
  });

  it('passes a large task that has subtasks', () => {
    expect(requiresDecomposition(40, 2)).toBe(false);
  });

  it('passes a small task and a task without an estimate', () => {
    expect(requiresDecomposition(20, 0)).toBe(false);
    expect(requiresDecomposition(null, 0)).toBe(false);
  });
});

describe('isTwoMinuteTask', () => {
  it('matches tiny tasks only', () => {
    expect(isTwoMinuteTask(2)).toBe(true);
    expect(isTwoMinuteTask(3)).toBe(false);
    expect(isTwoMinuteTask(0)).toBe(false);
    expect(isTwoMinuteTask(null)).toBe(false);
  });
});

describe('evaluateScheduleToday', () => {
  it('blocks a 25+ minute task without subtasks (counter-example)', () => {
    expect(evaluateScheduleToday({ ...baseTask, estimateMin: 40, subtaskCount: 0 })).toBe(
      'needs-decomposition',
    );
  });

  it('requires an implementation intention', () => {
    expect(evaluateScheduleToday({ ...baseTask, implementationIntention: '   ' })).toBe(
      'needs-intention',
    );
  });

  it('allows a small task with an intention', () => {
    expect(evaluateScheduleToday(baseTask)).toBe('ok');
  });

  it('allows a large task once decomposed and intentioned', () => {
    expect(evaluateScheduleToday({ ...baseTask, estimateMin: 60, subtaskCount: 3 })).toBe('ok');
  });
});

describe('deferFriction', () => {
  it('suggests a break-down past the threshold', () => {
    expect(deferFriction(1)).toEqual({ count: 1, suggestBreakdown: false });
    expect(deferFriction(3)).toEqual({ count: 3, suggestBreakdown: true });
  });
});
