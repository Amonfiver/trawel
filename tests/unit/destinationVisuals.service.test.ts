import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDestinationVisualAssetUrl,
  getDestinationVisualManifestUrl,
  resolveDestinationVisuals,
  type DestinationVisualManifest,
} from '../../src/features/destinationVisuals';

const manifest: DestinationVisualManifest = {
  destinationSlug: 'cuenca',
  destinationName: 'Cuenca',
  assets: [
    {
      id: 'hero',
      path: 'shared/hero/cuenca.png',
      category: 'landmark',
      modes: 'both',
      usage: ['hero'],
      alt: 'Hero de Cuenca',
      caption: 'Hero',
      credit: 'Visual lab',
      source: 'Visual lab',
      rightsStatus: 'prototype',
      referenceOnly: true,
      priority: 100,
    },
    {
      id: 'student-figure',
      path: 'shared/detail/cuenca.png',
      category: 'detail',
      modes: 'student',
      usage: ['gallery', 'figure'],
      alt: 'Detalle de Cuenca',
      caption: 'Detalle',
      credit: 'Visual lab',
      source: 'Visual lab',
      rightsStatus: 'prototype',
      referenceOnly: true,
      priority: 80,
    },
  ],
  selections: {
    adventure: { hero: 'hero', highlights: [], gallery: ['hero'], itinerary: [], map: [] },
    student: { hero: 'student-figure', highlights: [], gallery: ['student-figure'], itinerary: [], map: [] },
  },
};

test('resuelve de forma determinista los assets seleccionados por el manifest y el modo', () => {
  const adventure = resolveDestinationVisuals(manifest, 'adventure');
  const student = resolveDestinationVisuals(manifest, 'student');

  assert.equal(adventure.hero?.id, 'hero');
  assert.equal(adventure.assets.length, 2);
  assert.equal(adventure.assets[1]?.url, '/destinations/cuenca/shared/detail/cuenca.png');
  assert.equal(adventure.hero?.referenceOnly, true);
  assert.equal(adventure.gallery[0]?.url, '/destinations/cuenca/shared/hero/cuenca.png');
  assert.equal(student.hero?.id, 'student-figure');
  assert.equal(student.gallery[0]?.usage.includes('figure'), true);
});

test('construye URLs visuales desde la raíz pública, también bajo una ruta SPA profunda', () => {
  assert.equal(getDestinationVisualManifestUrl('cuenca'), '/destinations/cuenca/manifest.json');
  assert.equal(
    getDestinationVisualAssetUrl('cuenca', 'shared/hero/cuenca.png'),
    '/destinations/cuenca/shared/hero/cuenca.png',
  );
});
