import assert from 'node:assert/strict';
import test from 'node:test';
import { getAdventureExpectations } from '../../src/pages/CountryZonePage/adventureVisuals.utils';
import type { ResolvedDestinationVisualAsset } from '../../src/features/destinationVisuals';

function asset(
  id: string,
  category: ResolvedDestinationVisualAsset['category'],
  usage: ResolvedDestinationVisualAsset['usage'],
): ResolvedDestinationVisualAsset {
  return {
    id,
    url: `/destinations/example/${id}.jpg`,
    path: `${id}.jpg`,
    category,
    modes: 'adventure',
    usage,
    alt: id,
    caption: id,
    priority: 1,
  };
}

test('deriva los cuatro momentos Adventure desde categorías del manifest sin depender del slug', () => {
  const moments = getAdventureExpectations([
    asset('wild', 'landscape', ['gallery']),
    asset('old-town', 'landmark', ['highlight']),
    asset('trail', 'atmosphere', ['itinerary']),
    asset('table', 'food', ['card']),
  ]);

  assert.deepEqual(moments.map(({ title, asset: visual }) => [title, visual.id]), [
    ['Naturaleza', 'wild'],
    ['Patrimonio vivo', 'old-town'],
    ['Rutas', 'trail'],
    ['Sabores', 'table'],
  ]);
});
