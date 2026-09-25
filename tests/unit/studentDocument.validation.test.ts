import assert from 'node:assert/strict';
import test from 'node:test';
import { smokeCanonicalStudentDocument } from '../../src/features/studentDocument/smokeCanonicalStudentDocument.fixture';
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

test('fixture cubre paragraph, headings, figures, lists, facts, callout, timeline y references', () => {
  const types = new Set(smokeCanonicalStudentDocument.blocks.map((block) => block.type));
  for (const type of ['paragraph', 'heading', 'figure', 'list', 'key_facts', 'callout', 'timeline', 'references']) assert.equal(types.has(type), true);
  assert.equal(smokeCanonicalStudentDocument.blocks.filter((block) => block.type === 'figure' && block.placement === 'INLINE').length, 3);
  assert.equal(smokeCanonicalStudentDocument.blocks.filter((block) => block.type === 'figure' && block.placement === 'WIDE').length, 3);
  assert.equal(smokeCanonicalStudentDocument.blocks.filter((block) => block.type === 'heading' && block.level === 2).length, 11);
  assert.equal((smokeCanonicalStudentDocument.blocks.find((block) => block.type === 'timeline') as Extract<typeof smokeCanonicalStudentDocument.blocks[number], { type: 'timeline' }>).items.length, 9);
  assert.equal((smokeCanonicalStudentDocument.blocks.find((block) => block.type === 'references') as Extract<typeof smokeCanonicalStudentDocument.blocks[number], { type: 'references' }>).items.length, 6);
});
