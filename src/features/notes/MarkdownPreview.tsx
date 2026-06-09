import { useMemo } from 'react';
import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { decodeWikilinkUrl, remarkWikilinks, WIKILINK_PROTOCOL } from './remarkWikilinks';

interface MarkdownPreviewProps {
  body: string;
  /** Called when a `[[wikilink]]` is activated, with the raw target title. */
  onWikilinkClick?: (target: string) => void;
}

export function MarkdownPreview({ body, onWikilinkClick }: MarkdownPreviewProps) {
  const components = useMemo<Components>(
    () => ({
      a({ href, children }) {
        const target = href ? decodeWikilinkUrl(href) : null;
        if (target !== null) {
          return (
            <button
              type="button"
              className="wikilink"
              onClick={() => onWikilinkClick?.(target)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
                color: 'var(--color-primary)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              {children}
            </button>
          );
        }
        return (
          <a href={href} target="_blank" rel="noreferrer noopener">
            {children}
          </a>
        );
      },
    }),
    [onWikilinkClick],
  );

  return (
    <div className="markdown-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkWikilinks]}
        components={components}
        urlTransform={(url) =>
          url.startsWith(WIKILINK_PROTOCOL) ? url : defaultUrlTransform(url)
        }
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
