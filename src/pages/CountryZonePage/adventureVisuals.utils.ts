import type { ResolvedDestinationVisualAsset } from '../../features/destinationVisuals';

export interface AdventureExpectation {
  asset: ResolvedDestinationVisualAsset;
  title: string;
}

const expectationDefinitions: Array<{
  title: string;
  matches: (asset: ResolvedDestinationVisualAsset) => boolean;
}> = [
  {
    title: 'Naturaleza',
    matches: (asset) => asset.category === 'landscape',
  },
  {
    title: 'Patrimonio vivo',
    matches: (asset) => asset.category === 'landmark',
  },
  {
    title: 'Rutas',
    matches: (asset) => asset.usage.includes('itinerary'),
  },
  {
    title: 'Sabores',
    matches: (asset) => asset.category === 'food',
  },
];

/**
 * Resolves visual moments from the destination manifest only. The labels are
 * product navigation, while the assets remain destination-owned metadata.
 */
export function getAdventureExpectations(
  assets: ResolvedDestinationVisualAsset[],
): AdventureExpectation[] {
  const usedAssetIds = new Set<string>();

  return expectationDefinitions.flatMap(({ title, matches }) => {
    const asset = assets.find(
      (candidate) => !usedAssetIds.has(candidate.id) && matches(candidate),
    );

    if (!asset) {
      return [];
    }

    usedAssetIds.add(asset.id);
    return [{ asset, title }];
  });
}
