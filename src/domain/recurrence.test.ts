import { describe, expect, it } from 'vitest';
import { nextOccurrence, parseRecurrenceRule, upcomingOccurrences } from './recurrence';

describe('nextOccurrence', () => {
  it('advances daily by the interval', () => {
    expect(nextOccurrence({ frequency: 'daily', interval: 1 }, new Date(2026, 5, 9)).getDate()).toBe(
      10,
    );
    expect(nextOccurrence({ frequency: 'daily', interval: 3 }, new Date(2026, 5, 9)).getDate()).toBe(
      12,
    );
  });

  it('advances weekly without weekdays by interval weeks', () => {
    const result = nextOccurrence({ frequency: 'weekly', interval: 2 }, new Date(2026, 5, 9));
    expect(result.getDate()).toBe(23); // +14 days, still in June
  });

  it('returns the next matching weekday for weekly with weekdays', () => {
    const after = new Date(2026, 5, 9);
    const targetWeekday = (after.getDay() + 2) % 7;
    const result = nextOccurrence(
      { frequency: 'weekly', interval: 1, weekdays: [targetWeekday] },
      after,
    );
    expect(result.getDay()).toBe(targetWeekday);
    expect(result.getTime()).toBeGreaterThan(after.getTime());
  });

  it('advances monthly by the interval', () => {
    expect(
      nextOccurrence({ frequency: 'monthly', interval: 1 }, new Date(2026, 0, 15)).getMonth(),
    ).toBe(1);
  });
});

describe('upcomingOccurrences', () => {
  it('returns the requested number of future dates in order', () => {
    const list = upcomingOccurrences({ frequency: 'daily', interval: 1 }, new Date(2026, 5, 9), 3);
    expect(list).toHaveLength(3);
    expect(list[0]?.getDate()).toBe(10);
    expect(list[2]?.getDate()).toBe(12);
  });
});

describe('parseRecurrenceRule', () => {
  it('defaults the interval and rejects invalid input', () => {
    expect(parseRecurrenceRule({ frequency: 'daily' })?.interval).toBe(1);
    expect(parseRecurrenceRule({ frequency: 'nope' })).toBeNull();
    expect(parseRecurrenceRule(null)).toBeNull();
  });
});
