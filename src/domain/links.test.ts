import { describe, expect, it } from 'vitest';
import {
  computeBacklinks,
  findOrphanNotes,
  findUnresolvedLinks,
  resolveLinks,
  type NoteWithBody,
} from './links';

const notes: NoteWithBody[] = [
  { id: 'n1', title: 'Alpha', body: 'links to [[Beta]] and [[Ghost]]' },
  { id: 'n2', title: 'Beta', body: 'back to [[alpha]]' },
  { id: 'n3', title: 'Gamma', body: 'no links' },
];

describe('resolveLinks', () => {
  it('resolves existing targets case-insensitively and marks missing ones null', () => {
    const links = resolveLinks(notes);
    expect(links).toContainEqual({ sourceId: 'n1', targetTitle: 'Beta', targetId: 'n2' });
    expect(links).toContainEqual({ sourceId: 'n1', targetTitle: 'Ghost', targetId: null });
    expect(links).toContainEqual({ sourceId: 'n2', targetTitle: 'alpha', targetId: 'n1' });
  });
});

describe('computeBacklinks', () => {
  it('maps target id to its inbound links', () => {
    const backlinks = computeBacklinks(notes);
    expect(backlinks.get('n2')).toEqual([{ sourceId: 'n1', targetTitle: 'Beta' }]);
    expect(backlinks.get('n1')).toEqual([{ sourceId: 'n2', targetTitle: 'alpha' }]);
    expect(backlinks.has('n3')).toBe(false);
  });
});

describe('findUnresolvedLinks', () => {
  it('returns only links to non-existent notes', () => {
    expect(findUnresolvedLinks(notes)).toEqual([
      { sourceId: 'n1', targetTitle: 'Ghost', targetId: null },
    ]);
  });
});

describe('findOrphanNotes', () => {
  it('returns notes with no resolved inbound or outbound links', () => {
    expect(findOrphanNotes(notes)).toEqual([{ id: 'n3', title: 'Gamma' }]);
  });
});
