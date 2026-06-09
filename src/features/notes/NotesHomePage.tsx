import { useMemo, useState } from 'react';
import { normalizeTitle } from '@/domain/links';
import { t } from '@/lib/i18n';
import { NoteEditor } from './NoteEditor';
import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useNotesQuery,
  useUpdateNoteMutation,
} from './notesQueries';
import { useRealtimeNotes } from './useRealtimeNotes';

export default function NotesHomePage() {
  const notesQuery = useNotesQuery();
  useRealtimeNotes(true);
  const createNote = useCreateNoteMutation();
  const updateNote = useUpdateNoteMutation();
  const deleteNote = useDeleteNoteMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);
  const selected = notes.find((note) => note.id === selectedId) ?? null;

  const createAndSelect = (title: string): void => {
    createNote.mutate({ title, body: '' }, { onSuccess: (note) => setSelectedId(note.id) });
  };

  const openByTitle = (title: string): void => {
    const existing = notes.find((note) => normalizeTitle(note.title) === normalizeTitle(title));
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    createAndSelect(title);
  };

  const listButtonStyle = {
    width: '100%',
    textAlign: 'left' as const,
    background: 'transparent',
    color: 'var(--color-text)',
    border: '1px solid transparent',
    borderRadius: '0.4rem',
    padding: '0.4rem 0.5rem',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      <aside style={{ width: '15rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => createAndSelect(t('notes.new'))}
          style={{
            width: '100%',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-contrast)',
            border: 'none',
            borderRadius: '0.4rem',
            padding: '0.5rem',
            cursor: 'pointer',
            marginBottom: '0.75rem',
          }}
        >
          + {t('notes.new')}
        </button>

        {notesQuery.isLoading && <p>{t('app.loading')}</p>}
        {notesQuery.isError && <p role="alert">{t('notes.loadError')}</p>}
        {!notesQuery.isLoading && notes.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('notes.empty')}</p>
        )}

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.15rem' }}>
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                aria-current={note.id === selectedId}
                onClick={() => setSelectedId(note.id)}
                style={{
                  ...listButtonStyle,
                  background: note.id === selectedId ? 'var(--color-bg-subtle)' : 'transparent',
                }}
              >
                {note.title.trim() === '' ? t('notes.untitled') : note.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section style={{ flex: 1, minWidth: 0 }}>
        {selected ? (
          <NoteEditor
            key={selected.id}
            note={selected}
            notes={notes}
            onPatch={(patch) => updateNote.mutate({ id: selected.id, patch })}
            onDelete={() => {
              deleteNote.mutate(selected.id);
              setSelectedId(null);
            }}
            onOpenByTitle={openByTitle}
          />
        ) : (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('notes.selectPrompt')}</p>
        )}
      </section>
    </div>
  );
}
