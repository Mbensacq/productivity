import { buildTitleIndex, normalizeTitle, type NoteRef } from './links';
import { extractTags } from './tags';
import { extractLinkTargets } from './wikilinks';

export interface ResolvedLinkTarget {
  targetTitle: string;
  /** Resolved note id, or null when the target note does not exist yet. */
  targetId: string | null;
}

/** Tags derived from a note's body (for the `tags` column). */
export function computeNoteTags(body: string): string[] {
  return extractTags(body);
}

/**
 * Resolves the wikilink targets in a body against the known notes, producing the
 * rows to persist in `note_links` (unresolved targets keep targetId = null).
 */
export function resolveBodyLinkTargets(
  body: string,
  notes: readonly NoteRef[],
): ResolvedLinkTarget[] {
  const index = buildTitleIndex(notes);
  return extractLinkTargets(body).map((targetTitle) => ({
    targetTitle,
    targetId: index.get(normalizeTitle(targetTitle)) ?? null,
  }));
}
