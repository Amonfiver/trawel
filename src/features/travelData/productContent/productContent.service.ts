import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';
import type {
  EditorialContent,
  GetPublishedEditorialContentInput,
  GetPublishedPromotionsForContextInput,
  ProductContentEntityType,
  ProductContentMode,
  Promotion,
  PromotionDisclosureLabel,
  PromotionPlacementType,
  StaticPage,
  StaticPageType,
} from './productContent.types';

type JsonObject = Record<string, unknown>;

interface DBEditorialContent {
  id: string;
  entity_type: string;
  entity_id: string | null;
  entity_slug: string | null;
  country_slug: string | null;
  zone_slug: string | null;
  mode: string | null;
  headline: string;
  intro: string | null;
  what_makes_special: string | null;
  highlights: unknown;
  suggested_route: string | null;
  practical_tips: unknown;
  sections: unknown;
  sources: unknown;
  metadata: unknown;
  presentation_package_id?: string | null;
  status: string;
  review_state: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DBStaticPage {
  id: string;
  slug: string;
  type: string;
  title: string;
  summary: string | null;
  body: unknown;
  version: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_slug: string | null;
  noindex: boolean;
  metadata: unknown;
  status: string;
  review_state: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DBPromotion {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sponsor_name: string;
  sponsor_url: string | null;
  image_asset_id: string | null;
  placement_type: string;
  target_entity_type: string | null;
  target_entity_id: string | null;
  target_entity_slug: string | null;
  country_slug: string | null;
  zone_slug: string | null;
  traveler_type: string | null;
  mode: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  priority: number;
  disclosure_label: string;
  metadata: unknown;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const EDITORIAL_CONTENT_COLUMNS = [
  'id',
  'entity_type',
  'entity_id',
  'entity_slug',
  'country_slug',
  'zone_slug',
  'mode',
  'headline',
  'intro',
  'what_makes_special',
  'highlights',
  'suggested_route',
  'practical_tips',
  'sections',
  'sources',
  'metadata',
  'status',
  'review_state',
  'published_at',
  'created_at',
  'updated_at',
].join(',');

const STATIC_PAGE_COLUMNS = [
  'id',
  'slug',
  'type',
  'title',
  'summary',
  'body',
  'version',
  'seo_title',
  'seo_description',
  'canonical_slug',
  'noindex',
  'metadata',
  'status',
  'review_state',
  'published_at',
  'created_at',
  'updated_at',
].join(',');

const PROMOTION_COLUMNS = [
  'id',
  'slug',
  'title',
  'description',
  'sponsor_name',
  'sponsor_url',
  'image_asset_id',
  'placement_type',
  'target_entity_type',
  'target_entity_id',
  'target_entity_slug',
  'country_slug',
  'zone_slug',
  'traveler_type',
  'mode',
  'starts_at',
  'ends_at',
  'status',
  'priority',
  'disclosure_label',
  'metadata',
  'published_at',
  'created_at',
  'updated_at',
].join(',');

export async function getPublishedEditorialContent(
  input: GetPublishedEditorialContentInput
): Promise<EditorialContent[]> {
  if (!input.entityType || !isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const columns = input.presentationPackageId
      ? `${EDITORIAL_CONTENT_COLUMNS},presentation_package_id`
      : EDITORIAL_CONTENT_COLUMNS;
    let query = supabase
      .from('editorial_contents')
      .select(columns)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .eq('entity_type', input.entityType);

    if (input.entityId) {
      query = query.eq('entity_id', input.entityId);
    }

    if (input.entitySlug) {
      query = query.eq('entity_slug', input.entitySlug);
    }

    if (input.countrySlug) {
      query = query.eq('country_slug', input.countrySlug);
    }

    if (input.zoneSlug) {
      query = query.eq('zone_slug', input.zoneSlug);
    }

    if (input.mode) {
      query = query.eq('mode', input.mode);
    }

    if (input.presentationPackageId) {
      query = query.eq('presentation_package_id', input.presentationPackageId);
    }

    const { data, error } = await query
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });

    if (error) {
      logProductContentError('Error loading published editorial content', error);
      return [];
    }

    return (((data || []) as unknown) as DBEditorialContent[])
      .filter((item) => item.status === 'published')
      .map(mapEditorialContent);
  } catch (error) {
    logProductContentError('Unexpected error loading published editorial content', error);
    return [];
  }
}

export async function getPublishedStaticPageBySlug(slug: string): Promise<StaticPage | null> {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug || !isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('static_pages')
      .select(STATIC_PAGE_COLUMNS)
      .eq('slug', normalizedSlug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      logProductContentError('Error loading published static page', error);
      return null;
    }

    const dbPage = data as unknown as DBStaticPage;

    if (!data || dbPage.status !== 'published') {
      return null;
    }

    return mapStaticPage(dbPage);
  } catch (error) {
    logProductContentError('Unexpected error loading published static page', error);
    return null;
  }
}

export async function getPublishedPromotionsForContext(
  input: GetPublishedPromotionsForContextInput = {}
): Promise<Promotion[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  const now = new Date().toISOString();

  try {
    let query = supabase
      .from('promotions')
      .select(PROMOTION_COLUMNS)
      .eq('status', 'published')
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`);

    if (input.countrySlug) {
      query = query.eq('country_slug', input.countrySlug);
    }

    if (input.zoneSlug) {
      query = query.eq('zone_slug', input.zoneSlug);
    }

    if (input.mode) {
      query = query.eq('mode', input.mode);
    }

    if (input.placementType) {
      query = query.eq('placement_type', input.placementType);
    }

    if (input.targetEntityType) {
      query = query.eq('target_entity_type', input.targetEntityType);
    }

    if (input.targetEntityId) {
      query = query.eq('target_entity_id', input.targetEntityId);
    }

    if (input.targetEntitySlug) {
      query = query.eq('target_entity_slug', input.targetEntitySlug);
    }

    const { data, error } = await query
      .order('priority', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(normalizeLimit(input.limit));

    if (error) {
      logProductContentError('Error loading published promotions', error);
      return [];
    }

    return (((data || []) as unknown) as DBPromotion[])
      .filter(isPublishedPromotionInActiveWindow)
      .map(mapPromotion);
  } catch (error) {
    logProductContentError('Unexpected error loading published promotions', error);
    return [];
  }
}

function mapEditorialContent(db: DBEditorialContent): EditorialContent {
  return {
    id: db.id,
    entityType: db.entity_type as ProductContentEntityType,
    entityId: db.entity_id,
    entitySlug: db.entity_slug,
    countrySlug: db.country_slug,
    zoneSlug: db.zone_slug,
    mode: db.mode as ProductContentMode | null,
    headline: db.headline,
    intro: db.intro,
    whatMakesSpecial: db.what_makes_special,
    highlights: asArray(db.highlights),
    suggestedRoute: db.suggested_route,
    practicalTips: asArray(db.practical_tips),
    sections: asArray(db.sections),
    sources: asArray(db.sources),
    metadata: asObject(db.metadata),
    presentationPackageId: db.presentation_package_id ?? null,
    status: 'published',
    reviewState: db.review_state,
    publishedAt: db.published_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapStaticPage(db: DBStaticPage): StaticPage {
  return {
    id: db.id,
    slug: db.slug,
    type: db.type as StaticPageType,
    title: db.title,
    summary: db.summary,
    body: asObject(db.body),
    version: db.version,
    seoTitle: db.seo_title,
    seoDescription: db.seo_description,
    canonicalSlug: db.canonical_slug,
    noindex: db.noindex,
    metadata: asObject(db.metadata),
    status: 'published',
    reviewState: db.review_state,
    publishedAt: db.published_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapPromotion(db: DBPromotion): Promotion {
  return {
    id: db.id,
    slug: db.slug,
    title: db.title,
    description: db.description,
    sponsorName: db.sponsor_name,
    sponsorUrl: db.sponsor_url,
    imageAssetId: db.image_asset_id,
    placementType: db.placement_type as PromotionPlacementType,
    targetEntityType: db.target_entity_type as ProductContentEntityType | null,
    targetEntityId: db.target_entity_id,
    targetEntitySlug: db.target_entity_slug,
    countrySlug: db.country_slug,
    zoneSlug: db.zone_slug,
    travelerType: db.traveler_type,
    mode: db.mode as ProductContentMode | null,
    startsAt: db.starts_at,
    endsAt: db.ends_at,
    status: 'published',
    priority: db.priority,
    disclosureLabel: normalizeDisclosureLabel(db.disclosure_label),
    metadata: asObject(db.metadata),
    publishedAt: db.published_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function isPublishedPromotionInActiveWindow(promotion: DBPromotion): boolean {
  if (promotion.status !== 'published') {
    return false;
  }

  const now = Date.now();
  const startsAt = promotion.starts_at ? Date.parse(promotion.starts_at) : null;
  const endsAt = promotion.ends_at ? Date.parse(promotion.ends_at) : null;

  return (startsAt === null || startsAt <= now) && (endsAt === null || endsAt > now);
}

function normalizeDisclosureLabel(value: string): PromotionDisclosureLabel {
  if (value === 'Patrocinado' || value === 'Colaborador') {
    return value;
  }

  return 'Promocion';
}

function normalizeLimit(limit: number | null | undefined): number {
  if (!limit || !Number.isFinite(limit)) {
    return 12;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 50);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asObject(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as JsonObject;
}

function logProductContentError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error('[ProductContent]', message, error);
  }
}
