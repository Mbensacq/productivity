import { extractLinkTargets } from './wikilinks';

/** Minimal note shape needed for link resolution. */
export interface NoteRef {
  id: string;
  title: string;
}

export interface NoteWithBody extends NoteRef {
  body: string;
}

export interface ResolvedLink {
  sourceId: string;
  targetTitle: string;
  /** Resolved note id, or null when the target note does not exist yet. */
  targetId: string | null;
}

export interface Backlink {
  sourceId: string;
  targetTitle: string;
}

export function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

/** Map of normalized title -> note id (first occurrence wins on duplicates). */
export function buildTitleIndex(notes: readonly NoteRef[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const note of notes) {
    const key = normalizeTitle(note.title);
    if (!index.has(key)) {
      index.set(key, note.id);
    }
  }
  return index;
}

export function resolveLinks(notes: readonly NoteWithBody[]): ResolvedLink[] {
  const index = buildTitleIndex(notes);
  const links: ResolvedLink[] = [];
  for (const note of notes) {
    for (const targetTitle of extractLinkTargets(note.body)) {
      links.push({
        sourceId: note.id,
        targetTitle,
        targetId: index.get(normalizeTitle(targetTitle)) ?? null,
      });
    }
  }
  return links;
}

/** target note id -> backlinks pointing at it (resolved links only). */
export function computeBacklinks(notes: readonly NoteWithBody[]): Map<string, Backlink[]> {
  const backlinks = new Map<string, Backlink[]>();
  for (const link of resolveLinks(notes)) {
    if (link.targetId === null) {
      continue;
    }
    const list = backlinks.get(link.targetId) ?? [];
    list.push({ sourceId: link.sourceId, targetTitle: link.targetTitle });
    backlinks.set(link.targetId, list);
  }
  return backlinks;
}

/** Links whose target note does not exist yet (candidates for on-the-fly creation). */
export function findUnresolvedLinks(notes: readonly NoteWithBody[]): ResolvedLink[] {
  return resolveLinks(notes).filter((link) => link.targetId === null);
}

/** Notes with no resolved inbound or outbound link. */
export function findOrphanNotes(notes: readonly NoteWithBody[]): NoteRef[] {
  const connected = new Set<string>();
  for (const link of resolveLinks(notes)) {
    if (link.targetId !== null) {
      connected.add(link.sourceId);
      connected.add(link.targetId);
    }
  }
  return notes
    .filter((note) => !connected.has(note.id))
    .map((note) => ({ id: note.id, title: note.title }));
}
