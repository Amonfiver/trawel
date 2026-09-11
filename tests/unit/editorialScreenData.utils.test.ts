import assert from 'node:assert/strict';
import test from 'node:test';
import type { EditorialContent } from '../../src/features/travelData/productContent';
import {
  isZoneEditorialPilot,
  normalizePublishedEditorialContent,
  resolvePilotZoneEditorial,
} from '../../src/features/travelData/screenData/editorialScreenData.utils';

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

test('admite Albarracín publicado para adventure y student sin cruzar perfiles', () => {
  const adventure = resolvePilotZoneEditorial([createEditorial()], {
    countrySlug: 'espana',
    zoneSlug: 'albarracin',
    mode: 'adventure',
  });
  const student = resolvePilotZoneEditorial(
    [createEditorial({ mode: 'student', headline: 'Albarracín para estudiantes' })],
    { countrySlug: 'espana', zoneSlug: 'albarracin', mode: 'student' }
  );

  assert.equal(adventure?.mode, 'adventure');
  assert.equal(student?.mode, 'student');
  assert.equal(
    resolvePilotZoneEditorial([createEditorial()], {
      countrySlug: 'espana',
      zoneSlug: 'albarracin',
      mode: 'student',
    }),
    null
  );
});

test('mantiene fallback para ausencia, borrador, fecha nula e incompletitud', () => {
  const context = { countrySlug: 'espana', zoneSlug: 'albarracin', mode: 'adventure' as const };

  // La capa de consulta devuelve [] tanto ante ausencia como ante error de Supabase.
  assert.equal(resolvePilotZoneEditorial([], context), null);
  assert.equal(
    normalizePublishedEditorialContent(
      createEditorial({ status: 'draft' as unknown as 'published' })
    ),
    null
  );
  assert.equal(normalizePublishedEditorialContent(createEditorial({ publishedAt: null })), null);
  assert.equal(normalizePublishedEditorialContent(createEditorial({ intro: '   ' })), null);
});

test('conserva la normalización que utiliza CountryPage para contenido publicado fechado', () => {
  const countryEditorial = createEditorial({
    entityType: 'country',
    entitySlug: 'espana',
    zoneSlug: null,
  });

  assert.equal(normalizePublishedEditorialContent(countryEditorial)?.headline, countryEditorial.headline);
});

test('no activa otras zonas ni rescata una versión anterior si la ganadora es inválida', () => {
  assert.equal(isZoneEditorialPilot('espana', 'albarracin'), true);
  assert.equal(isZoneEditorialPilot('espana', 'madrid'), false);
  assert.equal(
    resolvePilotZoneEditorial([createEditorial()], {
      countrySlug: 'espana',
      zoneSlug: 'madrid',
      mode: 'adventure',
    }),
    null
  );
  assert.equal(
    resolvePilotZoneEditorial(
      [createEditorial({ intro: '' }), createEditorial({ id: 'older-valid' })],
      { countrySlug: 'espana', zoneSlug: 'albarracin', mode: 'adventure' }
    ),
    null
  );
});
