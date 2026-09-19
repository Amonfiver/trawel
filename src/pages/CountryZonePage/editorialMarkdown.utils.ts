export type EditorialMarkdownBlock =
  | { type: 'heading'; content: string; level: number }
  | { type: 'paragraph'; content: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] };

const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/;
const UNORDERED_LIST_PATTERN = /^[-*+]\s+(.+)$/;
const ORDERED_LIST_PATTERN = /^\d+[.)]\s+(.+)$/;

/**
 * Convierte el subconjunto editorial de Markdown en bloques semánticos sin
 * interpretar HTML. Los textos siguen escapados por React al renderizarse.
 */
export function parseEditorialMarkdown(value: string): EditorialMarkdownBlock[] {
  const lines = value.replace(/\r\n?/g, '\n').split('\n');
  const blocks: EditorialMarkdownBlock[] = [];
  let paragraph: string[] = [];
  let listType: 'unordered-list' | 'ordered-list' | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    const content = paragraph.join(' ').trim();
    if (content) {
      blocks.push({ type: 'paragraph', content });
    }
    paragraph = [];
  };

  const flushList = () => {
    if (listType && listItems.length > 0) {
      blocks.push({ type: listType, items: listItems });
    }
    listType = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(HEADING_PATTERN);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: heading[1].length, content: heading[2].trim() });
      continue;
    }

    const unorderedItem = line.match(UNORDERED_LIST_PATTERN);
    const orderedItem = line.match(ORDERED_LIST_PATTERN);
    const nextListType = unorderedItem ? 'unordered-list' : orderedItem ? 'ordered-list' : null;

    if (nextListType) {
      flushParagraph();
      if (listType && listType !== nextListType) {
        flushList();
      }
      listType = nextListType;
      listItems.push((unorderedItem?.[1] || orderedItem?.[1] || '').trim());
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}
