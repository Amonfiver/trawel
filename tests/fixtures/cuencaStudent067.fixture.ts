import type { EditorialContent } from '../../src/features/travelData/productContent';

/**
 * Fixture estructural de la entrega Student 067. Conserva las identificaciones,
 * el orden y los tipos de bloques reales; los marcadores evitan duplicar texto
 * editorial de producción en los tests.
 */
export const CUENCA_STUDENT_067_EXPECTED_WORD_COUNT = 1491;
export const CUENCA_STUDENT_067_EXPECTED_QUESTION_COUNT = 8;

export const cuencaStudent067: EditorialContent = {
  id: 'b5714c59-f68c-4dea-a10b-b57ecc9cdd56',
  entityType: 'zone',
  entityId: 'c2c1bf05-45f4-4b04-bc3f-e4894c909bf4',
  entitySlug: 'cuenca',
  countrySlug: 'espana',
  zoneSlug: 'cuenca',
  mode: 'student',
  headline: '[student-067-headline]',
  intro: '[student-067-intro]',
  whatMakesSpecial: '[student-067-overview]',
  highlights: ['[student-067-highlight]'],
  suggestedRoute: '[student-067-route]',
  practicalTips: [
    '[student-067-practical-1]',
    '[student-067-practical-2]',
    '[student-067-practical-3]',
    '[student-067-practical-4]',
  ],
  sections: [
    { position: 2, kind: 'history', heading: '2. Historia en pocas claves', content: '[student-067-history]' },
    { position: 3, kind: 'heritage', heading: '3. Patrimonio que debes reconocer', content: '[student-067-heritage]' },
    { position: 4, kind: 'art_culture', heading: '4. Arte y cultura', content: '[student-067-art-culture]' },
    { position: 5, kind: 'nature_science', heading: '5. Naturaleza y ciencia', content: '[student-067-nature-science]' },
    { position: 6, kind: 'daily_life', heading: '6. Gastronomía y tradiciones', content: '[student-067-daily-life]' },
    { position: 7, kind: 'observation', heading: '7. Qué observar durante la visita', content: '- [student-067-list-item]' },
    {
      position: 8,
      kind: 'study',
      heading: '8. Preguntas para aprender',
      content: '¿Pregunta 1? ¿Pregunta 2? ¿Pregunta 3? ¿Pregunta 4? ¿Pregunta 5? ¿Pregunta 6? ¿Pregunta 7? ¿Pregunta 8?',
    },
    { position: 9, kind: 'budget', heading: '9. Preparar el presupuesto', content: '[student-067-budget]' },
    { position: 11, kind: 'risks', heading: 'Un límite útil para aprender', content: '[student-067-risks]' },
  ],
  sources: [],
  metadata: {
    versionId: '717ee311-ad7d-40c8-8b93-054a52dbad25',
    revisionId: 'f431c8f8-a19-4076-a94f-2eed3b5ef838',
    versionHash: '868a1c2a2ba3982fe4ef6e3b9cce3545d180e301fe50afd62a0eaa53593d0331',
    contentHash: '876bfc025d32da49aa8184d08d8d2cfada4f3017bb5e73b828d835e9b976c9b3',
  },
  status: 'published',
  reviewState: 'approved_for_publication',
  publishedAt: '2026-09-19T00:00:00.000Z',
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};
