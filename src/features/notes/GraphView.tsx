import { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { buildGraph } from '@/domain/graph';
import type { NoteWithBody } from '@/domain/links';
import { t } from '@/lib/i18n';

interface GraphViewNote {
  id: string;
  title: string;
  body: string;
}

interface GraphViewProps {
  notes: GraphViewNote[];
  onSelectNote: (id: string) => void;
  onClose: () => void;
}

/** Fullscreen interactive force-directed graph of the note links. Lazy-loaded. */
export default function GraphView({ notes, onSelectNote, onClose }: GraphViewProps) {
  const data = useMemo(() => {
    const withBodies: NoteWithBody[] = notes.map((note) => ({
      id: note.id,
      title: note.title,
      body: note.body,
    }));
    const graph = buildGraph(withBodies);
    return {
      nodes: graph.nodes.map((node) => ({ id: node.id, name: node.title || t('notes.untitled') })),
      links: graph.edges.map((edge) => ({ source: edge.source, target: edge.target })),
    };
  }, [notes]);

  const width = typeof window === 'undefined' ? 800 : window.innerWidth;
  const height = typeof window === 'undefined' ? 600 : Math.max(window.innerHeight - 56, 320);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('graph.title')}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-bg)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 1rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <strong>{t('graph.title')}</strong>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'var(--color-bg-subtle)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.4rem',
            padding: '0.35rem 0.7rem',
            cursor: 'pointer',
          }}
        >
          {t('graph.close')}
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {data.nodes.length === 0 ? (
          <p style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>{t('graph.empty')}</p>
        ) : (
          <ForceGraph2D
            graphData={data}
            width={width}
            height={height}
            nodeLabel="name"
            nodeRelSize={5}
            linkColor={() => 'rgba(127,127,127,0.45)'}
            onNodeClick={(node) => {
              if (typeof node.id === 'string') {
                onSelectNote(node.id);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
