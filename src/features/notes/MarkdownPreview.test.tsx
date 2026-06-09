import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MarkdownPreview } from './MarkdownPreview';

describe('MarkdownPreview', () => {
  it('renders standard markdown', () => {
    render(<MarkdownPreview body={'# Title\n\nsome text'} />);
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
  });

  it('renders a wikilink as a button and reports its target on click', async () => {
    const onWikilinkClick = vi.fn();
    render(<MarkdownPreview body={'see [[Note A|alias]] here'} onWikilinkClick={onWikilinkClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'alias' }));
    expect(onWikilinkClick).toHaveBeenCalledWith('Note A');
  });

  it('renders external links as anchors', () => {
    render(<MarkdownPreview body={'[ext](https://example.com)'} />);
    expect(screen.getByRole('link', { name: 'ext' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
  });
});
