import { describe, expect, it } from 'vitest';
import { computeNoteTags, resolveBodyLinkTargets } from './noteMetadata';

describe('computeNoteTags', () => {
  it('extracts tags from a body', () => {
    expect(computeNoteTags('todo #work and #area/home')).toEqual(['work', 'area/home']);
  });
});

describe('resolveBodyLinkTargets', () => {
  const notes = [
    { id: 'a', title: 'Alpha' },
    { id: 'b', title: 'Beta' },
  ];

  it('resolves existing targets and leaves missing ones null', () => {
    expect(resolveBodyLinkTargets('see [[alpha]] and [[Ghost]]', notes)).toEqual([
      { targetTitle: 'alpha', targetId: 'a' },
      { targetTitle: 'Ghost', targetId: null },
    ]);
  });

  it('returns an empty list when there are no links', () => {
    expect(resolveBodyLinkTargets('no links', notes)).toEqual([]);
  });
});
