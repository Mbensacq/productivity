import { format } from 'date-fns';

export interface DailyNoteInput {
  title: string;
  body: string;
  isDaily: true;
  dailyDate: string;
}

/** ISO date (yyyy-MM-dd) in local time, used as the daily note's title/date. */
export function formatDailyDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Builds the input for a daily note from a template. */
export function buildDailyNoteInput(date: Date): DailyNoteInput {
  const iso = formatDailyDate(date);
  return {
    title: iso,
    body: `# ${iso}\n\n`,
    isDaily: true,
    dailyDate: iso,
  };
}
