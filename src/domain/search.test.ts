import { describe, expect, it } from 'vitest';
import { createNoteSearchIndex, searchNotes } from './search';
import type { SearchableNote } from './search';

const notes: SearchableNote[] = [
  { id: '1', title: 'Gardening basics', body: 'soil and water', tags: ['hobby'] },
  { id: '2', title: 'Cooking pasta', body: 'boil water and salt', tags: ['food'] },
  { id: '3', title: 'Water cycle', body: 'evaporation', tags: [] },
];

describe('note search', () => {
  it('finds notes by a body/title term', () => {
    const index = createNoteSearchIndex(notes);
    const ids = searchNotes(index, 'water').map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining(['1', '2', '3']));
  });

  it('supports prefix queries and returns titles', () => {
    const index = createNoteSearchIndex(notes);
    const results = searchNotes(index, 'cook');
    expect(results.map((r) => r.id)).toContain('2');
    expect(results.find((r) => r.id === '2')?.title).toBe('Cooking pasta');
  });

  it('searches the tags field', () => {
    const index = createNoteSearchIndex(notes);
    expect(searchNotes(index, 'food').map((r) => r.id)).toContain('2');
  });

  it('returns nothing for a blank query', () => {
    const index = createNoteSearchIndex(notes);
    expect(searchNotes(index, '   ')).toEqual([]);
  });
});
