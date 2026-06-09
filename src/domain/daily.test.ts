import { describe, expect, it } from 'vitest';
import { buildDailyNoteInput, formatDailyDate } from './daily';

describe('daily notes', () => {
  // Use local-component date so the formatted value is timezone-independent.
  const date = new Date(2026, 5, 9); // 9 June 2026

  it('formats the daily date as yyyy-MM-dd', () => {
    expect(formatDailyDate(date)).toBe('2026-06-09');
  });

  it('builds a daily note input from a template', () => {
    expect(buildDailyNoteInput(date)).toEqual({
      title: '2026-06-09',
      body: '# 2026-06-09\n\n',
      isDaily: true,
      dailyDate: '2026-06-09',
    });
  });
});
