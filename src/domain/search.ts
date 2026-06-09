import MiniSearch, { type Options } from 'minisearch';

export interface SearchableNote {
  id: string;
  title: string;
  body: string;
  tags?: string[];
}

export interface NoteSearchResult {
  id: string;
  title: string;
  score: number;
}

export type NoteSearchIndex = MiniSearch<SearchableNote>;

const OPTIONS: Options<SearchableNote> = {
  fields: ['title', 'body', 'tags'],
  storeFields: ['title'],
  searchOptions: { boost: { title: 2 }, prefix: true, fuzzy: 0.2 },
  extractField: (document, fieldName) => {
    if (fieldName === 'tags') {
      return (document.tags ?? []).join(' ');
    }
    const value = document[fieldName as keyof SearchableNote];
    return typeof value === 'string' ? value : '';
  },
};

/** Builds an in-memory full-text index for offline / instant client search. */
export function createNoteSearchIndex(notes: readonly SearchableNote[]): NoteSearchIndex {
  const index = new MiniSearch<SearchableNote>(OPTIONS);
  index.addAll(notes as SearchableNote[]);
  return index;
}

export function searchNotes(index: NoteSearchIndex, query: string): NoteSearchResult[] {
  const trimmed = query.trim();
  if (trimmed === '') {
    return [];
  }
  return index.search(trimmed).map((result) => ({
    id: String(result.id),
    title: typeof result.title === 'string' ? result.title : '',
    score: result.score,
  }));
}
