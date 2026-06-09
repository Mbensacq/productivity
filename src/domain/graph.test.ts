import { describe, expect, it } from 'vitest';
import { buildGraph, localGraph } from './graph';
import type { NoteWithBody } from './links';

const notes: NoteWithBody[] = [
  { id: 'a', title: 'A', body: '[[B]] [[B]] [[A]]' }, // duplicate edge + self-link
  { id: 'b', title: 'B', body: '[[C]]' },
  { id: 'c', title: 'C', body: 'leaf' },
  { id: 'd', title: 'D', body: 'isolated' },
];

describe('buildGraph', () => {
  it('creates one node per note', () => {
    expect(buildGraph(notes).nodes).toHaveLength(4);
  });

  it('dedupes edges and drops self-links', () => {
    const edges = buildGraph(notes).edges;
    expect(edges).toContainEqual({ source: 'a', target: 'b' });
    expect(edges).toContainEqual({ source: 'b', target: 'c' });
    expect(edges.filter((e) => e.source === 'a' && e.target === 'b')).toHaveLength(1);
    expect(edges.some((e) => e.source === e.target)).toBe(false);
  });
});

describe('localGraph', () => {
  it('includes only nodes within depth hops (undirected)', () => {
    const graph = buildGraph(notes);
    expect(localGraph(graph, 'a', 1).nodes.map((n) => n.id).sort()).toEqual(['a', 'b']);
    expect(localGraph(graph, 'a', 2).nodes.map((n) => n.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('returns just the root when it has no edges', () => {
    const graph = buildGraph(notes);
    expect(localGraph(graph, 'd', 3).nodes).toEqual([{ id: 'd', title: 'D' }]);
  });
});
