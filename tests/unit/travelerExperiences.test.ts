import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getTravelerExperiences,
  prioritizeTravelerExperiences,
  type TravelerExperience,
} from '../../src/features/travelerExperiences';

test('Cuenca declara cuatro experiencias ilustrativas de IA separadas del contenido editorial', () => {
  const experiences = getTravelerExperiences('cuenca');

  assert.equal(experiences.length, 4);
  assert.ok(experiences.every((experience) => experience.type === 'AI_SAMPLE'));
  assert.ok(experiences.every((experience) => experience.displayName && experience.quote && experience.avatarInitials));
  assert.ok(experiences.every((experience) => !experience.verified && !experience.source && !experience.sourceUrl));
});

test('las experiencias reales futuras se priorizan sobre las muestras IA', () => {
  const entries: TravelerExperience[] = [
    { id: 'ai', type: 'AI_SAMPLE', displayName: 'Muestra IA', quote: 'Ilustrativa.' },
    { id: 'real', type: 'REAL_USER', displayName: 'Viajero', quote: 'Real.' },
    { id: 'verified', type: 'REAL_USER', displayName: 'Viajera verificada', quote: 'Verificada.', verified: true },
  ];

  assert.deepEqual(prioritizeTravelerExperiences(entries).map((entry) => entry.id), ['verified', 'real', 'ai']);
});
