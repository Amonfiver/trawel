import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import type {
  PrivateEditorialDestination,
  PrivateEditorialDraft,
  PrivateEditorialReaderData,
} from './privateEditorial.types';

interface DBPrivateDraft {
  id: string;
  entity_type: 'zone';
  entity_id: string;
  entity_slug: string | null;
  country_slug: string | null;
  zone_slug: string | null;
  mode: 'adventure' | 'student';
  headline: string;
  intro: string | null;
  what_makes_special: string | null;
  highlights: unknown;
  suggested_route: string | null;
  practical_tips: unknown;
  sections: unknown;
  sources: unknown;
  metadata: unknown;
  status: 'draft';
  review_state: string | null;
  published_at: null;
  updated_at: string;
}

interface DBPrivateDestination {
  id: string;
  country_slug: string;
  name: string;
  slug: string;
  region: string | null;
  status: string;
}

interface DBReaderResponse {
  destination: DBPrivateDestination;
  role: 'editor' | 'admin';
  drafts: DBPrivateDraft[];
}

export async function getPrivateEditorialDrafts(
  locationId: string
): Promise<PrivateEditorialReaderData> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('La lectura editorial privada no está configurada.');
  }

  const { data, error } = await supabase.functions.invoke('private-editorial-reader', {
    body: { locationId },
  });

  if (error) {
    throw new Error('No se pudo autorizar la lectura editorial privada.');
  }

  if (!isReaderResponse(data)) {
    throw new Error('La respuesta del lector editorial privado no es válida.');
  }

  return {
    destination: mapDestination(data.destination),
    role: data.role,
    drafts: data.drafts.map(mapDraft),
  };
}

function mapDestination(value: DBPrivateDestination): PrivateEditorialDestination {
  return {
    id: value.id,
    countrySlug: value.country_slug,
    name: value.name,
    slug: value.slug,
    region: value.region,
    status: value.status,
  };
}

function mapDraft(value: DBPrivateDraft): PrivateEditorialDraft {
  return {
    id: value.id,
    entityType: value.entity_type,
    entityId: value.entity_id,
    entitySlug: value.entity_slug,
    countrySlug: value.country_slug,
    zoneSlug: value.zone_slug,
    mode: value.mode,
    headline: value.headline,
    intro: value.intro,
    whatMakesSpecial: value.what_makes_special,
    highlights: asArray(value.highlights),
    suggestedRoute: value.suggested_route,
    practicalTips: asArray(value.practical_tips),
    sections: asSections(value.sections),
    sources: asSources(value.sources),
    metadata: asObject(value.metadata),
    status: value.status,
    reviewState: value.review_state,
    publishedAt: value.published_at,
    updatedAt: value.updated_at,
  };
}

function isReaderResponse(value: unknown): value is DBReaderResponse {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'destination' in value &&
      'drafts' in value &&
      Array.isArray(value.drafts) &&
      'role' in value &&
      (value.role === 'editor' || value.role === 'admin')
  );
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asSections(value: unknown): PrivateEditorialDraft['sections'] {
  return asArray(value).filter(
    (item): item is PrivateEditorialDraft['sections'][number] =>
      Boolean(item && typeof item === 'object' && !Array.isArray(item))
  );
}

function asSources(value: unknown): PrivateEditorialDraft['sources'] {
  return asArray(value).filter(
    (item): item is PrivateEditorialDraft['sources'][number] =>
      Boolean(item && typeof item === 'object' && !Array.isArray(item))
  );
}
