import { STUDENT_DOCUMENT_V1, type StudentBlock, type StudentDocumentV1 } from './studentDocument.types';

const safeHttpsUrl = (value: string) => /^https:\/\//i.test(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** Technical shape validation only; editorial quality remains Investighost's responsibility. */
export function parseStudentDocumentV1(value: unknown): StudentDocumentV1 | null {
  if (!object(value) || value.version !== STUDENT_DOCUMENT_V1 || !text(value.headline) || !Array.isArray(value.lead) || !value.lead.every(text) || !Array.isArray(value.blocks)) return null;
  const blocks = value.blocks.map(parseBlock);
  return blocks.every((block): block is StudentBlock => block !== null)
    ? { version: STUDENT_DOCUMENT_V1, headline: value.headline.trim(), lead: value.lead.map((item) => item.trim()), blocks }
    : null;
}

function parseBlock(value: unknown): StudentBlock | null {
  if (!object(value) || !text(value.type)) return null;
  if (value.type === 'paragraph') return text(value.text) ? { type: 'paragraph', text: value.text.trim() } : null;
  if (value.type === 'heading') return (value.level === 2 || value.level === 3) && text(value.text) && (value.id === undefined || text(value.id)) ? { type: 'heading', level: value.level, text: value.text.trim(), ...(text(value.id) ? { id: value.id.trim() } : {}) } : null;
  if (value.type === 'figure') return text(value.assetId) && text(value.alt) && (value.placement === 'INLINE' || value.placement === 'WIDE') && (value.caption === undefined || text(value.caption)) ? { type: 'figure', assetId: value.assetId.trim(), alt: value.alt.trim(), placement: value.placement, ...(text(value.caption) ? { caption: value.caption.trim() } : {}) } : null;
  if (value.type === 'list') return (value.style === 'ordered' || value.style === 'unordered') && Array.isArray(value.items) && value.items.length > 0 && value.items.every(text) ? { type: 'list', style: value.style, items: value.items.map((item) => item.trim()) } : null;
  if (value.type === 'key_facts') return optionalTitle(value.title) !== false && Array.isArray(value.items) && value.items.length > 0 && value.items.every((item) => object(item) && text(item.label) && text(item.value)) ? { type: 'key_facts', ...(text(value.title) ? { title: value.title.trim() } : {}), items: value.items.map((item) => ({ label: (item as Record<string, string>).label.trim(), value: (item as Record<string, string>).value.trim() })) } : null;
  if (value.type === 'callout') return (value.tone === 'NOTE' || value.tone === 'CONTEXT' || value.tone === 'DEFINITION') && text(value.text) && optionalTitle(value.title) !== false ? { type: 'callout', tone: value.tone, text: value.text.trim(), ...(text(value.title) ? { title: value.title.trim() } : {}) } : null;
  if (value.type === 'timeline') return optionalTitle(value.title) !== false && Array.isArray(value.items) && value.items.length > 0 && value.items.every((item) => object(item) && text(item.label) && text(item.text)) ? { type: 'timeline', ...(text(value.title) ? { title: value.title.trim() } : {}), items: value.items.map((item) => ({ label: (item as Record<string, string>).label.trim(), text: (item as Record<string, string>).text.trim() })) } : null;
  if (value.type === 'references') return Array.isArray(value.items) && value.items.length > 0 && value.items.every((item) => object(item) && text(item.title) && (item.label === undefined || text(item.label)) && (item.source === undefined || text(item.source)) && (item.url === undefined || (text(item.url) && safeHttpsUrl(item.url)))) ? { type: 'references', items: value.items.map((item) => ({ title: (item as Record<string, string>).title.trim(), ...(text((item as Record<string, unknown>).label) ? { label: (item as Record<string, string>).label.trim() } : {}), ...(text((item as Record<string, unknown>).source) ? { source: (item as Record<string, string>).source.trim() } : {}), ...(text((item as Record<string, unknown>).url) ? { url: (item as Record<string, string>).url.trim() } : {}) })) } : null;
  return null;
}

function optionalTitle(value: unknown): boolean { return value === undefined || text(value); }
