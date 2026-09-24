import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import type {
  CanonicalDestinationMedia,
  CanonicalDestinationPresentation,
  CanonicalHero,
  DestinationVisualStoryItem,
  EditorialCta,
  PlaceToGoItem,
  PlaceToGoCategory,
  PresentationTone,
  TextPlacement,
} from './destinationPresentation.types';

interface PackageRow { id: string }
interface SelectionRow {
  id: string; asset_id: string; slot: 'HERO' | 'DESTINATION_VISUAL_STORY'; selection_order: number;
  title: string | null; kicker: string | null; short_copy: string | null; caption: string | null;
  presentation_tone: string; text_placement: string; linked_adventure_section: string | null; cta: unknown;
}
interface PlaceRow {
  id: string; category: string; name: string; selection_order: number; area: string | null; asset_id: string | null;
  short_description: string; reason_to_go: string; caption: string | null; presentation_tone: string | null;
  address: string | null; url: string | null; latitude: number | null; longitude: number | null;
}
interface AssetRow {
  id: string; storage_bucket: string | null; storage_path: string | null; public_url: string | null;
  alt: string; caption: string | null; credit: string | null; source: string | null; license: string | null; rights_status: string | null;
}

const toneValues = new Set<PresentationTone>(['IMPACT', 'ADVENTURE', 'CULTURE', 'LANDSCAPE', 'FOOD', 'LOCAL_LIFE', 'NIGHT', 'CALM', 'PREMIUM']);
const placementValues = new Set<TextPlacement>(['OVERLAY', 'BELOW_MEDIA', 'CARD_OVERLAY', 'INLINE']);
const placeCategories = new Set<PlaceToGoCategory>(['STAY', 'EAT', 'DRINK', 'NIGHTLIFE']);

export async function getPublishedCanonicalDestinationPresentation(input: {
  countrySlug: string;
  zoneSlug: string;
  mode: 'adventure' | 'student';
}): Promise<CanonicalDestinationPresentation | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data: packageData, error: packageError } = await supabase
      .from('destination_presentation_packages')
      .select('id')
      .eq('country_slug', input.countrySlug)
      .eq('zone_slug', input.zoneSlug)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (packageError || !packageData) return null;
    const packageRow = packageData as unknown as PackageRow;
    const [{ data: selectionData, error: selectionError }, { data: placeData, error: placeError }] = await Promise.all([
      supabase.from('destination_visual_selections')
        .select('id,asset_id,slot,selection_order,title,kicker,short_copy,caption,presentation_tone,text_placement,linked_adventure_section,cta')
        .eq('package_id', packageRow.id)
        .in('mode', [input.mode, 'both'])
        .order('selection_order', { ascending: true }),
      supabase.from('destination_places_to_go')
        .select('id,category,name,selection_order,area,asset_id,short_description,reason_to_go,caption,presentation_tone,address,url,latitude,longitude')
        .eq('package_id', packageRow.id)
        .order('selection_order', { ascending: true }),
    ]);
    if (selectionError || placeError) return null;
    const selections = (selectionData || []) as unknown as SelectionRow[];
    const places = (placeData || []) as unknown as PlaceRow[];
    const assetIds = [...new Set([...selections.map((selection) => selection.asset_id), ...places.map((place) => place.asset_id).filter((id): id is string => Boolean(id))])];
    if (assetIds.length === 0) return null;
    const { data: assetData, error: assetError } = await supabase
      .from('image_assets')
      .select('id,storage_bucket,storage_path,public_url,alt,caption,credit,source,license,rights_status')
      .in('id', assetIds)
      .eq('status', 'published')
      .eq('rights_status', 'APPROVED_FOR_PUBLIC_USE');
    if (assetError) return null;
    const mediaById = new Map(((assetData || []) as unknown as AssetRow[])
      .map((asset) => [asset.id, toCanonicalMedia(asset)] as const)
      .filter((entry): entry is readonly [string, CanonicalDestinationMedia] => Boolean(entry[1])));
    return normalizePresentation(packageRow.id, selections, places, mediaById);
  } catch {
    return null;
  }
}

function normalizePresentation(
  packageId: string,
  selections: SelectionRow[],
  places: PlaceRow[],
  mediaById: Map<string, CanonicalDestinationMedia>,
): CanonicalDestinationPresentation | null {
  const heroSelection = selections.find((selection) => selection.slot === 'HERO');
  const hero = heroSelection ? toHero(heroSelection, mediaById.get(heroSelection.asset_id)) : null;
  const destinationVisualStory = selections
    .filter((selection) => selection.slot === 'DESTINATION_VISUAL_STORY')
    .map((selection) => toStoryItem(selection, mediaById.get(selection.asset_id)))
    .filter((item): item is DestinationVisualStoryItem => Boolean(item));
  if (!hero || destinationVisualStory.length === 0) return null;
  if (destinationVisualStory.length !== selections.filter((selection) => selection.slot === 'DESTINATION_VISUAL_STORY').length) return null;
  const placesToGo = places.map((place) => toPlace(place, place.asset_id ? mediaById.get(place.asset_id) : undefined))
    .filter((place): place is PlaceToGoItem => Boolean(place));
  if (placesToGo.length !== places.length) return null;
  return { packageId, hero, destinationVisualStory, placesToGo };
}

function toCanonicalMedia(asset: AssetRow): CanonicalDestinationMedia | null {
  const url = text(asset.public_url) || (asset.storage_bucket && asset.storage_path && supabase
    ? supabase.storage.from(asset.storage_bucket).getPublicUrl(asset.storage_path).data.publicUrl : null);
  const alt = text(asset.alt);
  if (!url || !alt || asset.rights_status !== 'APPROVED_FOR_PUBLIC_USE') return null;
  return { id: asset.id, url, alt, rightsStatus: asset.rights_status, ...(text(asset.caption) ? { defaultCaption: text(asset.caption) } : {}), ...(text(asset.credit) ? { credit: text(asset.credit) } : {}), ...(text(asset.source) ? { source: text(asset.source) } : {}), ...(text(asset.license) ? { license: text(asset.license) } : {}) };
}

function toHero(selection: SelectionRow, asset: CanonicalDestinationMedia | undefined): CanonicalHero | null {
  const tone = asTone(selection.presentation_tone); const placement = asPlacement(selection.text_placement);
  const title = text(selection.title); const shortCopy = text(selection.short_copy);
  if (!asset || !tone || !placement || !title || !shortCopy) return null;
  const cta = asCta(selection.cta);
  if (selection.cta && !cta) return null;
  return { asset, title, shortCopy, presentationTone: tone, textPlacement: placement, ...(text(selection.kicker) ? { kicker: text(selection.kicker) } : {}), ...(text(selection.caption) ? { caption: text(selection.caption) } : {}), ...(cta ? { cta } : {}) };
}

function toStoryItem(selection: SelectionRow, asset: CanonicalDestinationMedia | undefined): DestinationVisualStoryItem | null {
  const tone = asTone(selection.presentation_tone); const placement = asPlacement(selection.text_placement); const cta = asCta(selection.cta);
  if (!asset || !tone || !placement || (selection.cta && !cta)) return null;
  return { id: selection.id, asset, order: selection.selection_order, presentationTone: tone, textPlacement: placement, ...(text(selection.title) ? { title: text(selection.title) } : {}), ...(text(selection.kicker) ? { kicker: text(selection.kicker) } : {}), ...(text(selection.short_copy) ? { shortCopy: text(selection.short_copy) } : {}), ...(text(selection.caption) ? { caption: text(selection.caption) } : {}), ...(text(selection.linked_adventure_section) ? { linkedAdventureSection: text(selection.linked_adventure_section) } : {}), ...(cta ? { cta } : {}) };
}

function toPlace(place: PlaceRow, asset?: CanonicalDestinationMedia): PlaceToGoItem | null {
  const category = placeCategories.has(place.category as PlaceToGoCategory) ? place.category as PlaceToGoCategory : null;
  const name = text(place.name); const shortDescription = text(place.short_description); const reasonToGo = text(place.reason_to_go);
  const tone = place.presentation_tone ? asTone(place.presentation_tone) : undefined;
  if (!category || !name || !shortDescription || !reasonToGo || (place.presentation_tone && !tone)) return null;
  const coordinates = typeof place.latitude === 'number' && typeof place.longitude === 'number' ? { latitude: place.latitude, longitude: place.longitude } : undefined;
  return { id: place.id, category, name, order: place.selection_order, shortDescription, reasonToGo, ...(text(place.area) ? { area: text(place.area) } : {}), ...(asset ? { asset } : {}), ...(text(place.caption) ? { caption: text(place.caption) } : {}), ...(tone ? { presentationTone: tone } : {}), ...(text(place.address) ? { address: text(place.address) } : {}), ...(text(place.url) ? { url: text(place.url) } : {}), ...(coordinates ? { coordinates } : {}) };
}

function asTone(value: string): PresentationTone | null { return toneValues.has(value as PresentationTone) ? value as PresentationTone : null; }
function asPlacement(value: string): TextPlacement | null { return placementValues.has(value as TextPlacement) ? value as TextPlacement : null; }
function text(value: string | null | undefined): string | undefined { const normalized = value?.trim(); return normalized || undefined; }
function asCta(value: unknown): EditorialCta | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const cta = value as Record<string, unknown>; const label = text(typeof cta.label === 'string' ? cta.label : null); const target = text(typeof cta.target === 'string' ? cta.target : null);
  if (!label || !target || (cta.actionType !== 'ANCHOR' && cta.actionType !== 'INTERNAL_ROUTE' && cta.actionType !== 'EXTERNAL_URL')) return null;
  return { label, target, actionType: cta.actionType };
}
