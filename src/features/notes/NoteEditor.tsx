import { useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import type { Note, NoteInput } from '@/db/noteMapping';
import { computeBacklinks, type NoteWithBody } from '@/domain/links';
import { getActiveWikilinkQuery } from '@/domain/wikilinks';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { resolveTheme } from '@/hooks/useApplyTheme';
import { useUiStore } from '@/store/uiStore';
import { t } from '@/lib/i18n';
import { MarkdownPreview } from './MarkdownPreview';

function makeWikilinkCompletions(titles: readonly string[]) {
  return (context: CompletionContext): CompletionResult | null => {
    const query = getActiveWikilinkQuery(context.state.sliceDoc(0, context.pos));
    if (query === null) {
      return null;
    }
    const lower = query.toLowerCase();
    const options = titles
      .filter((title) => title.toLowerCase().includes(lower))
      .slice(0, 20)
      .map((title) => ({ label: title, apply: `${title}]]` }));
    return { from: context.pos - query.length, options, validFor: /^[^\]\n]*$/ };
  };
}

interface NoteEditorProps {
  note: Note;
  notes: Note[];
  onPatch: (patch: NoteInput) => void;
  onDelete: () => void;
  onOpenByTitle: (title: string) => void;
}

export function NoteEditor({ note, notes, onPatch, onDelete, onOpenByTitle }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [showPreview, setShowPreview] = useState(false);
  const themePreference = useUiStore((state) => state.theme);

  const debouncedPatch = useDebouncedCallback(onPatch, 600);

  const titles = useMemo(
    () => notes.map((n) => n.title).filter((value) => value.trim() !== ''),
    [notes],
  );
  const extensions = useMemo(
    () => [
      markdown(),
      EditorView.lineWrapping,
      autocompletion({ override: [makeWikilinkCompletions(titles)] }),
    ],
    [titles],
  );

  const titleById = useMemo(() => new Map(notes.map((n) => [n.id, n.title])), [notes]);
  const backlinks = useMemo(() => {
    const withBodies: NoteWithBody[] = notes.map((n) => ({ id: n.id, title: n.title, body: n.body }));
    return computeBacklinks(withBodies).get(note.id) ?? [];
  }, [notes, note.id]);

  const buttonStyle = {
    background: 'var(--color-bg-subtle)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.4rem',
    padding: '0.4rem 0.7rem',
    cursor: 'pointer',
  } as const;

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <input
          aria-label={t('notes.titleLabel')}
          value={title}
          placeholder={t('notes.titlePlaceholder')}
          onChange={(event) => {
            setTitle(event.target.value);
            debouncedPatch({ title: event.target.value });
          }}
          style={{
            flex: 1,
            fontSize: '1.2rem',
            padding: '0.4rem 0.5rem',
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.4rem',
          }}
        />
        <button type="button" onClick={() => setShowPreview((value) => !value)} style={buttonStyle}>
          {showPreview ? t('notes.edit') : t('notes.preview')}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t('notes.deleteConfirm'))) {
              onDelete();
            }
          }}
          style={{ ...buttonStyle, color: 'var(--color-danger)' }}
        >
          {t('notes.delete')}
        </button>
      </div>

      {showPreview ? (
        <MarkdownPreview body={body} onWikilinkClick={onOpenByTitle} />
      ) : (
        <CodeMirror
          value={body}
          extensions={extensions}
          theme={resolveTheme(themePreference)}
          onChange={(value) => {
            setBody(value);
            debouncedPatch({ body: value });
          }}
          basicSetup={{ lineNumbers: false, foldGutter: false }}
        />
      )}

      <section aria-label={t('notes.backlinks')} style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '0.95rem' }}>{t('notes.backlinks')}</h2>
        {backlinks.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('notes.noBacklinks')}</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.25rem' }}>
            {backlinks.map((backlink) => (
              <li key={backlink.sourceId}>
                <button
                  type="button"
                  onClick={() => {
                    const sourceTitle = titleById.get(backlink.sourceId);
                    if (sourceTitle !== undefined) {
                      onOpenByTitle(sourceTitle);
                    }
                  }}
                  style={{ ...buttonStyle, width: '100%', textAlign: 'left' }}
                >
                  {titleById.get(backlink.sourceId) ?? t('notes.untitled')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
