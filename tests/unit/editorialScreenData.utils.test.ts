import assert from 'node:assert/strict';
import test from 'node:test';
import type { EditorialContent } from '../../src/features/travelData/productContent';
import {
  normalizePublishedEditorialContent,
  resolvePublishedZoneEditorial,
} from '../../src/features/travelData/screenData/editorialScreenData.utils';
import {
  CUENCA_STUDENT_067_EXPECTED_QUESTION_COUNT,
  CUENCA_STUDENT_067_EXPECTED_WORD_COUNT,
  cuencaStudent067,
} from '../fixtures/cuencaStudent067.fixture';

function createEditorial(
  overrides: Partial<EditorialContent> = {}
): EditorialContent {
  return {
    id: 'editorial-1',
    entityType: 'zone',
    entityId: 'albarracin',
    entitySlug: 'albarracin',
    countrySlug: 'espana',
    zoneSlug: 'albarracin',
    mode: 'adventure',
    headline: 'Albarracín para viajeros de aventura',
    intro: 'Una introducción editorial completa.',
    whatMakesSpecial: 'Un entorno singular para explorar.',
    highlights: ['Un destacado concreto'],
    suggestedRoute: 'Una ruta sugerida con sentido.',
    practicalTips: ['Un consejo práctico.'],
    sections: [],
    sources: [],
    metadata: {},
    status: 'published',
    reviewState: 'approved_for_publication',
    publishedAt: '2026-09-11T09:00:00.000Z',
    createdAt: '2026-09-11T08:00:00.000Z',
    updatedAt: '2026-09-11T09:00:00.000Z',
    ...overrides,
  };
}

test('admite contenido publicado para adventure y student sin cruzar perfiles', () => {
  const adventure = resolvePublishedZoneEditorial([createEditorial()], {
    countrySlug: 'espana',
    zoneSlug: 'albarracin',
    mode: 'adventure',
  });
  const student = resolvePublishedZoneEditorial(
    [createEditorial({ mode: 'student', headline: 'Albarracín para estudiantes' })],
    { countrySlug: 'espana', zoneSlug: 'albarracin', mode: 'student' }
  );

  assert.equal(adventure?.mode, 'adventure');
  assert.equal(student?.mode, 'student');
  assert.equal(
    resolvePublishedZoneEditorial([createEditorial()], {
      countrySlug: 'espana',
      zoneSlug: 'albarracin',
      mode: 'student',
    }),
    null
  );
});

test('mantiene fallback para ausencia, borrador y fecha nula, sin reevaluar la completitud editorial', () => {
  const context = { countrySlug: 'espana', zoneSlug: 'albarracin', mode: 'adventure' as const };

  // La capa de consulta devuelve [] tanto ante ausencia como ante error de Supabase.
  assert.equal(resolvePublishedZoneEditorial([], context), null);
  assert.equal(
    normalizePublishedEditorialContent(
      createEditorial({ status: 'draft' as unknown as 'published' })
    ),
    null
  );
  assert.equal(normalizePublishedEditorialContent(createEditorial({ publishedAt: null })), null);
  assert.equal(
    normalizePublishedEditorialContent(
      createEditorial({ intro: '   ', highlights: [], suggestedRoute: null, practicalTips: [] })
    )?.status,
    'published'
  );
});

test('conserva la normalización que utiliza CountryPage para contenido publicado fechado', () => {
  const countryEditorial = createEditorial({
    entityType: 'country',
    entitySlug: 'espana',
    zoneSlug: null,
  });

  assert.equal(normalizePublishedEditorialContent(countryEditorial)?.headline, countryEditorial.headline);
});

test('resuelve cualquier zona disponible y no rescata una versión anterior si falta su titular', () => {
  assert.equal(
    resolvePublishedZoneEditorial([createEditorial({ entitySlug: 'cuenca', zoneSlug: 'cuenca' })], {
      countrySlug: 'espana',
      zoneSlug: 'cuenca',
      mode: 'adventure',
    })?.headline,
    createEditorial({ entitySlug: 'cuenca', zoneSlug: 'cuenca' }).headline
  );
  assert.equal(
    resolvePublishedZoneEditorial(
      [createEditorial({ headline: '  ' }), createEditorial({ id: 'older-valid' })],
      { countrySlug: 'espana', zoneSlug: 'albarracin', mode: 'adventure' }
    ),
    null
  );
});

test('preserva todos los bloques estructurados de Cuenca Student 067 sin mezclar Adventure', () => {
  const normalized = resolvePublishedZoneEditorial([cuencaStudent067], {
    countrySlug: 'espana',
    zoneSlug: 'cuenca',
    mode: 'student',
  });

  assert.equal(normalized?.mode, 'student');
  assert.equal(normalized?.sections.length, cuencaStudent067.sections.length);
  assert.deepEqual(
    normalized?.sections.map((section) => section.kind),
    ['history', 'heritage', 'art_culture', 'nature_science', 'daily_life', 'observation', 'study', 'budget', 'risks']
  );
  assert.equal(normalized?.sections.find((section) => section.kind === 'study')?.content.match(/\?/g)?.length, CUENCA_STUDENT_067_EXPECTED_QUESTION_COUNT);
  assert.equal(normalized?.practicalTips instanceof Array, true);
  assert.equal((normalized?.practicalTips as string[]).length, 4);
  assert.ok(CUENCA_STUDENT_067_EXPECTED_WORD_COUNT >= 1400);
  assert.deepEqual(normalizePublishedEditorialContent(createEditorial())?.sections, []);
});
