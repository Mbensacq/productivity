import type { Root, Text, PhrasingContent } from 'mdast';
import { visit } from 'unist-util-visit';
import { parseWikilinks, wikilinkDisplayText } from '@/domain/wikilinks';

/** URL scheme used to mark links produced from `[[wikilinks]]`. */
export const WIKILINK_PROTOCOL = 'wikilink:';

export function encodeWikilinkUrl(target: string): string {
  return `${WIKILINK_PROTOCOL}${encodeURIComponent(target)}`;
}

export function decodeWikilinkUrl(url: string): string | null {
  if (!url.startsWith(WIKILINK_PROTOCOL)) {
    return null;
  }
  return decodeURIComponent(url.slice(WIKILINK_PROTOCOL.length));
}

/**
 * remark plugin: rewrites `[[Target|Alias]]` text into mdast link nodes with a
 * `wikilink:` URL so react-markdown can render them as navigable links.
 */
export function remarkWikilinks() {
  return (tree: Root): void => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (parent === undefined || index === undefined) {
        return undefined;
      }
      const links = parseWikilinks(node.value);
      if (links.length === 0) {
        return undefined;
      }

      const replacement: PhrasingContent[] = [];
      let cursor = 0;
      for (const link of links) {
        if (link.start > cursor) {
          replacement.push({ type: 'text', value: node.value.slice(cursor, link.start) });
        }
        const target = link.target !== '' ? link.target : (link.heading ?? '');
        replacement.push({
          type: 'link',
          url: encodeWikilinkUrl(target),
          children: [{ type: 'text', value: wikilinkDisplayText(link) }],
        });
        cursor = link.end;
      }
      if (cursor < node.value.length) {
        replacement.push({ type: 'text', value: node.value.slice(cursor) });
      }

      parent.children.splice(index, 1, ...replacement);
      // Resume after the inserted nodes to avoid re-visiting them.
      return index + replacement.length;
    });
  };
}
