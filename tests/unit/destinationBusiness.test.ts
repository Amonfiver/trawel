import assert from 'node:assert/strict';
import test from 'node:test';
import { getDestinationBusinessPlacements } from '../../src/features/destinationBusiness';

test('Cuenca declara exactamente los tres placeholders comerciales permitidos', () => {
  const placements = getDestinationBusinessPlacements('cuenca');

  assert.deepEqual(placements.map((placement) => placement.category), ['STAY', 'EAT', 'LOCAL_EXPERIENCE']);
  assert.ok(placements.every((placement) => placement.status === 'PLACEHOLDER'));
  assert.ok(placements.every((placement) => placement.badge === 'Espacio disponible'));
  assert.ok(placements.every((placement) => !placement.phone && !placement.website && !placement.address));
  assert.ok(placements.every((placement) => placement.sponsored === false));
});

test('los placements se resuelven declarativamente por destino sin fallback inventado', () => {
  assert.equal(getDestinationBusinessPlacements('londres').length, 0);
  assert.equal(getDestinationBusinessPlacements(undefined).length, 0);
});
