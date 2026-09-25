import assert from 'node:assert/strict';
import test from 'node:test';
import { smokeCanonicalShortStudentDocument, smokeCanonicalStudentDocument } from '../../src/features/studentDocument/smokeCanonicalStudentDocument.fixture';
import { parseStudentDocumentV1 } from '../../src/features/studentDocument/studentDocument.validation';

test('STUDENT_DOCUMENT_V1_ACCEPTED y orden preservado', () => {
  const parsed = parseStudentDocumentV1(smokeCanonicalStudentDocument);
  assert.ok(parsed);
  assert.deepEqual(parsed.blocks.map((block) => block.type), smokeCanonicalStudentDocument.blocks.map((block) => block.type));
});

test('valida tipos, placement, niveles y URLs seguras', () => {
  assert.equal(parseStudentDocumentV1({ ...smokeCanonicalStudentDocument, blocks: [{ type: 'heading', level: 4, text: 'No' }] }), null);
  assert.equal(parseStudentDocumentV1({ ...smokeCanonicalStudentDocument, blocks: [{ type: 'figure', assetId: 'a', alt: 'a', placement: 'FULL_BLEED' }] }), null);
  assert.equal(parseStudentDocumentV1({ ...smokeCanonicalStudentDocument, blocks: [{ type: 'references', items: [{ title: 'Unsafe', url: 'javascript:alert(1)' }] }] }), null);
});

test('SHORT_STUDENT_VALID: permite un documento breve sin bloques ricos opcionales', () => {
  const parsed = parseStudentDocumentV1(smokeCanonicalShortStudentDocument);
  assert.ok(parsed);
  assert.equal(parsed.blocks.some((block) => block.type === 'timeline' || block.type === 'key_facts' || block.type === 'figure'), false);
  assert.deepEqual(parsed.blocks.map((block) => block.type), smokeCanonicalShortStudentDocument.blocks.map((block) => block.type));
  assert.ok(parseStudentDocumentV1({ ...smokeCanonicalShortStudentDocument, lead: [] }));
});

test('NO_EMPTY_BLOCKS: rechaza documentos sin bloque informativo o con arrays vacíos', () => {
  assert.equal(parseStudentDocumentV1({ ...smokeCanonicalShortStudentDocument, blocks: [] }), null);
  assert.equal(parseStudentDocumentV1({ ...smokeCanonicalShortStudentDocument, blocks: [{ type: 'heading', level: 2, text: 'Solo título' }] }), null);
  assert.equal(parseStudentDocumentV1({ ...smokeCanonicalShortStudentDocument, blocks: [{ type: 'list', style: 'unordered', items: [] }] }), null);
});

test('fixture cubre paragraph, headings, figures, lists, facts, callout, timeline y references', () => {
  const types = new Set(smokeCanonicalStudentDocument.blocks.map((block) => block.type));
  for (const type of ['paragraph', 'heading', 'figure', 'list', 'key_facts', 'callout', 'timeline', 'references']) assert.equal(types.has(type), true);
  assert.equal(smokeCanonicalStudentDocument.blocks.filter((block) => block.type === 'figure' && block.placement === 'INLINE').length, 3);
  assert.equal(smokeCanonicalStudentDocument.blocks.filter((block) => block.type === 'figure' && block.placement === 'WIDE').length, 3);
  assert.equal(smokeCanonicalStudentDocument.blocks.filter((block) => block.type === 'heading' && block.level === 2).length, 11);
  assert.equal((smokeCanonicalStudentDocument.blocks.find((block) => block.type === 'timeline') as Extract<typeof smokeCanonicalStudentDocument.blocks[number], { type: 'timeline' }>).items.length, 9);
  assert.equal((smokeCanonicalStudentDocument.blocks.find((block) => block.type === 'references') as Extract<typeof smokeCanonicalStudentDocument.blocks[number], { type: 'references' }>).items.length, 6);
});
