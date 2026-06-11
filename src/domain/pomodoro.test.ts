import { describe, expect, it } from 'vitest';
import { addSpentTime, estimateAccuracy, formatDuration } from './pomodoro';

describe('addSpentTime', () => {
  it('accumulates and clamps negatives', () => {
    expect(addSpentTime(25, 25)).toBe(50);
    expect(addSpentTime(-5, 25)).toBe(25);
    expect(addSpentTime(10, -5)).toBe(10);
  });
});

describe('estimateAccuracy', () => {
  it('computes delta and ratio', () => {
    expect(estimateAccuracy(30, 45)).toEqual({
      estimateMin: 30,
      spentMin: 45,
      deltaMin: 15,
      ratio: 1.5,
    });
  });

  it('returns a null ratio when there is no estimate', () => {
    expect(estimateAccuracy(0, 20).ratio).toBeNull();
  });
});

describe('formatDuration', () => {
  it('formats minutes, hours, and mixed durations', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatDuration(-10)).toBe('0 min');
  });
});
