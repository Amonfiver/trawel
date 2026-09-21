import type {
  DestinationVisualAsset,
  DestinationVisualManifest,
  ResolvedDestinationVisualAsset,
  ResolvedDestinationVisuals,
} from './destinationVisuals.types';

const manifestCache = new Map<string, Promise<DestinationVisualManifest | null>>();
const visualModes = new Set(['adventure', 'student', 'both']);
const visualUsages = new Set(['hero', 'highlight', 'gallery', 'card', 'itinerary', 'map', 'figure']);

export function loadDestinationVisualManifest(
  destinationSlug: string
): Promise<DestinationVisualManifest | null> {
  const normalizedSlug = destinationSlug.trim().toLowerCase();

  if (!normalizedSlug) {
    return Promise.resolve(null);
  }

  const cachedManifest = manifestCache.get(normalizedSlug);
  if (cachedManifest) {
    return cachedManifest;
  }

  const manifestRequest = fetch(`/destinations/${encodeURIComponent(normalizedSlug)}/manifest.json`)
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }

      return normalizeDestinationVisualManifest(await response.json(), normalizedSlug);
    })
    .catch(() => null);

  manifestCache.set(normalizedSlug, manifestRequest);
  return manifestRequest;
}

export function resolveDestinationVisuals(
  manifest: DestinationVisualManifest,
  mode: 'adventure' | 'student'
): ResolvedDestinationVisuals {
  const assetById = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  const selection = manifest.selections[mode];

  return {
    destinationSlug: manifest.destinationSlug,
    destinationName: manifest.destinationName,
    assets: manifest.assets.map((asset) => ({
      ...asset,
      url: `/destinations/${encodeURIComponent(manifest.destinationSlug)}/${asset.path}`,
    })),
    hero: selection.hero ? resolveAsset(assetById.get(selection.hero), manifest.destinationSlug) : undefined,
    highlights: resolveAssets(selection.highlights, assetById, manifest.destinationSlug),
    gallery: resolveAssets(selection.gallery, assetById, manifest.destinationSlug),
    itinerary: resolveAssets(selection.itinerary, assetById, manifest.destinationSlug),
    map: resolveAssets(selection.map, assetById, manifest.destinationSlug),
  };
}

function resolveAssets(
  assetIds: string[],
  assetById: Map<string, DestinationVisualAsset>,
  destinationSlug: string
): ResolvedDestinationVisualAsset[] {
  return assetIds
    .map((assetId) => resolveAsset(assetById.get(assetId), destinationSlug))
    .filter((asset): asset is ResolvedDestinationVisualAsset => Boolean(asset));
}

function resolveAsset(
  asset: DestinationVisualAsset | undefined,
  destinationSlug: string
): ResolvedDestinationVisualAsset | undefined {
  if (!asset) {
    return undefined;
  }

  return {
    ...asset,
    url: `/destinations/${encodeURIComponent(destinationSlug)}/${asset.path}`,
  };
}

function normalizeDestinationVisualManifest(
  value: unknown,
  expectedSlug: string
): DestinationVisualManifest | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const manifest = value as Partial<DestinationVisualManifest>;
  if (
    manifest.destinationSlug !== expectedSlug ||
    typeof manifest.destinationName !== 'string' ||
    !Array.isArray(manifest.assets) ||
    !manifest.selections ||
    !isSelection(manifest.selections.adventure) ||
    !isSelection(manifest.selections.student)
  ) {
    return null;
  }

  const assets = manifest.assets.filter(isVisualAsset);
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  if (
    assets.length !== manifest.assets.length ||
    assetById.size !== assets.length ||
    !selectionReferencesAreValid(manifest.selections.adventure, assetById) ||
    !selectionReferencesAreValid(manifest.selections.student, assetById)
  ) {
    return null;
  }

  return {
    destinationSlug: manifest.destinationSlug,
    destinationName: manifest.destinationName,
    assets,
    selections: manifest.selections,
  };
}

function selectionReferencesAreValid(
  selection: DestinationVisualManifest['selections']['adventure'],
  assetById: Map<string, DestinationVisualAsset>
): boolean {
  const assetIds = [
    ...(selection.hero ? [selection.hero] : []),
    ...selection.highlights,
    ...selection.gallery,
    ...selection.itinerary,
    ...selection.map,
  ];

  return assetIds.every((assetId) => assetById.has(assetId));
}

function isSelection(value: unknown): value is DestinationVisualManifest['selections']['adventure'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const selection = value as Partial<DestinationVisualManifest['selections']['adventure']>;
  return (
    (selection.hero === undefined || typeof selection.hero === 'string') &&
    Array.isArray(selection.highlights) &&
    Array.isArray(selection.gallery) &&
    Array.isArray(selection.itinerary) &&
    Array.isArray(selection.map) &&
    [...selection.highlights, ...selection.gallery, ...selection.itinerary, ...selection.map].every(
      (assetId) => typeof assetId === 'string'
    )
  );
}

function isVisualAsset(value: unknown): value is DestinationVisualAsset {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const asset = value as Partial<DestinationVisualAsset>;
  return (
    typeof asset.id === 'string' &&
    typeof asset.path === 'string' &&
    typeof asset.category === 'string' &&
    typeof asset.modes === 'string' &&
    visualModes.has(asset.modes) &&
    Array.isArray(asset.usage) &&
    asset.usage.every((usage) => typeof usage === 'string' && visualUsages.has(usage)) &&
    typeof asset.alt === 'string' &&
    typeof asset.caption === 'string' &&
    typeof asset.credit === 'string' &&
    typeof asset.source === 'string' &&
    typeof asset.rightsStatus === 'string' &&
    typeof asset.referenceOnly === 'boolean' &&
    typeof asset.priority === 'number'
  );
}
