import assert from 'node:assert/strict';
import test from 'node:test';
import { parseEditorialMarkdown } from '../../src/pages/CountryZonePage/editorialMarkdown.utils';

test('mantiene párrafos, headings y listas de Markdown editorial sin mostrarlos como texto literal', () => {
  const blocks = parseEditorialMarkdown(
    'Primer párrafo con **énfasis**.\n\n- Primera clave\n- Segunda clave\n\n## Pregunta de observación\n\nSegundo párrafo.'
  );

  assert.deepEqual(blocks, [
    { type: 'paragraph', content: 'Primer párrafo con **énfasis**.' },
    { type: 'unordered-list', items: ['Primera clave', 'Segunda clave'] },
    { type: 'heading', level: 2, content: 'Pregunta de observación' },
    { type: 'paragraph', content: 'Segundo párrafo.' },
  ]);
});
