import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { normalizeTitle } from '@/domain/links';
import { buildDailyNoteInput, formatDailyDate } from '@/domain/daily';
import { CommandPalette } from '@/features/command-palette/CommandPalette';
import { t } from '@/lib/i18n';
import { NoteEditor } from './NoteEditor';

const GraphView = lazy(() => import('./GraphView'));
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);
  const selected = notes.find((note) => note.id === selectedId) ?? null;

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

  const openDaily = (): void => {
    const iso = formatDailyDate(new Date());
    const existing = notes.find((note) => note.isDaily && note.dailyDate === iso);
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    createNote.mutate(buildDailyNoteInput(new Date()), {
      onSuccess: (note) => setSelectedId(note.id),
    });
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

        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <button
            type="button"
            onClick={openDaily}
            style={{
              flex: 1,
              background: 'var(--color-bg-subtle)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.4rem',
              padding: '0.4rem',
              cursor: 'pointer',
            }}
          >
            {t('notes.daily')}
          </button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-keyshortcuts="Control+K Meta+K"
            style={{
              flex: 1,
              background: 'var(--color-bg-subtle)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.4rem',
              padding: '0.4rem',
              cursor: 'pointer',
            }}
          >
            {t('palette.open')}
          </button>
          <button
            type="button"
            onClick={() => setShowGraph(true)}
            style={{
              flex: 1,
              background: 'var(--color-bg-subtle)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.4rem',
              padding: '0.4rem',
              cursor: 'pointer',
            }}
          >
            {t('graph.open')}
          </button>
        </div>

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

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        notes={notes.map((note) => ({ id: note.id, title: note.title }))}
        onSelectNote={(id) => setSelectedId(id)}
        onCreateNote={() => createAndSelect(t('notes.new'))}
        onOpenDaily={openDaily}
      />

      {showGraph && (
        <Suspense fallback={null}>
          <GraphView
            notes={notes.map((note) => ({ id: note.id, title: note.title, body: note.body }))}
            onClose={() => setShowGraph(false)}
            onSelectNote={(id) => {
              setSelectedId(id);
              setShowGraph(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
