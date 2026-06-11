import { addDays, addMonths, addWeeks } from 'date-fns';
import { z } from 'zod';

/**
 * Recurrence rule stored as jsonb on a task. Pure, framework-agnostic logic.
 *
 * - `daily`   : every `interval` days.
 * - `weekly`  : with `weekdays`, the next day matching one of them; otherwise
 *               every `interval` weeks.
 * - `monthly` : every `interval` months (same day-of-month, clamped by date-fns).
 */
export const recurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().int().positive().default(1),
  weekdays: z.array(z.number().int().min(0).max(6)).optional(),
});

export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>;

/** The first occurrence strictly after `after`. */
export function nextOccurrence(rule: RecurrenceRule, after: Date): Date {
  switch (rule.frequency) {
    case 'daily':
      return addDays(after, rule.interval);
    case 'monthly':
      return addMonths(after, rule.interval);
    case 'weekly': {
      if (rule.weekdays !== undefined && rule.weekdays.length > 0) {
        const wanted = new Set(rule.weekdays);
        let candidate = addDays(after, 1);
        for (let i = 0; i < 366; i += 1) {
          if (wanted.has(candidate.getDay())) {
            return candidate;
          }
          candidate = addDays(candidate, 1);
        }
        return candidate;
      }
      return addWeeks(after, rule.interval);
    }
  }
}

/** The next `count` occurrences after `after`, in order. */
export function upcomingOccurrences(rule: RecurrenceRule, after: Date, count: number): Date[] {
  const occurrences: Date[] = [];
  let cursor = after;
  for (let i = 0; i < count; i += 1) {
    cursor = nextOccurrence(rule, cursor);
    occurrences.push(cursor);
  }
  return occurrences;
}

/** Safely parses a stored jsonb value into a rule, or null if invalid. */
export function parseRecurrenceRule(value: unknown): RecurrenceRule | null {
  const parsed = recurrenceRuleSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
