import { localCountryZoneScreenDataRepository } from './localCountryZoneScreenData.repository';
import { getPublishedEditorialContent, getPublishedPromotionsForContext } from '../productContent';
import type { Promotion } from '../productContent';
import { getCountryPageData } from '../services/travelData.service';
import type { CountryPageData } from '../types/travelData.types';
import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';
import {
  isZoneEditorialPilot,
  normalizePublishedEditorialContent,
  resolvePilotZoneEditorial,
} from './editorialScreenData.utils';
import type {
  CountryScreenData,
  CountryZoneScreenDataRepository,
  ScreenCountrySummary,
  ScreenEditorialData,
  ScreenExperienceMode,
  ZoneScreenData,
} from './screenData.types';

const activeCountryZoneScreenDataRepository: CountryZoneScreenDataRepository =
  localCountryZoneScreenDataRepository;

// Future repositories can implement CountryZoneScreenDataRepository:
// - Supabase legacy trawel-prod repository.
// - Supabase data-driven repository.

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export interface ResolvedCountryScreenData extends CountryScreenData {
  countryName: string;
  countrySlug: string;
  countryCode?: string;
  isoAlpha2?: string;
  isoAlpha3?: string;
  unM49?: string;
  status?: string;
  pageData: CountryPageData;
  countryPromotions: Promotion[];
  metadata: {
    source: 'localFallback' | 'remoteCountry' | 'remoteEditorial' | 'remoteCountryAndEditorial';
    hasRemoteCountry: boolean;
    hasRemoteEditorial: boolean;
    hasRemoteCountryPromotions: boolean;
    isFromWorldCatalog: boolean;
  };
}

export interface ResolvedZoneScreenData extends ZoneScreenData {
  countrySlug: string;
  zoneSlug: string;
  countryName: string;
  zoneName: string;
  promotions: Promotion[];
  metadata: {
    source:
      | 'localFallback'
      | 'remoteZone'
      | 'remotePromotions'
      | 'remoteZoneAndPromotions';
    hasRemoteZone: boolean;
    hasRemotePromotions: boolean;
    hasRemoteEditorial: boolean;
    isUsingPremiumFallback: boolean;
  };
}

// =============================================================================
// INTERNAL TYPES
// =============================================================================

interface RemoteCountryBaseData {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  featured?: boolean;
  capital?: string;
  continent?: string;
  shortDescription?: string;
}

interface DBCountryBase {
  id: string;
  slug: string | null;
  name_es: string | null;
  capital_es: string | null;
  continent_es: string | null;
  description_es: string | null;
  status: string | null;
  featured: boolean | null;
}

interface RemoteZoneBaseData {
  id: string;
  slug: string;
  name: string;
  status: string;
  featured?: boolean;
  summary?: string;
}

interface DBCityBase {
  id: string;
  slug: string | null;
  name_es: string | null;
  short_description_es: string | null;
  status: string | null;
  featured: boolean | null;
}

// =============================================================================
// BASE FALLBACK READERS
// =============================================================================

export function getCountryScreenData(
  countrySlug: string,
  mode: ScreenExperienceMode
): CountryScreenData {
  return activeCountryZoneScreenDataRepository.getCountryScreenData(countrySlug, mode);
}

export function getCountryScreenFallbackData(
  countrySlug: string,
  mode: ScreenExperienceMode
): ResolvedCountryScreenData {
  const normalizedCountrySlug = normalizeSlug(countrySlug);
  const fallbackScreenData = getCountryScreenData(normalizedCountrySlug, mode);

  return buildResolvedCountryScreenData(fallbackScreenData, {
    source: 'localFallback',
    hasRemoteCountry: false,
    hasRemoteEditorial: false,
  });
}

export function getZoneScreenData(
  countrySlug: string,
  zoneSlug: string,
  mode: ScreenExperienceMode
): ZoneScreenData {
  return activeCountryZoneScreenDataRepository.getZoneScreenData(countrySlug, zoneSlug, mode);
}

export function getZoneScreenFallbackData(
  countrySlug: string,
  zoneSlug: string,
  mode: ScreenExperienceMode
): ResolvedZoneScreenData {
  const normalizedCountrySlug = normalizeSlug(countrySlug);
  const normalizedZoneSlug = normalizeSlug(zoneSlug);
  const fallbackScreenData = getZoneScreenData(normalizedCountrySlug, normalizedZoneSlug, mode);

  return buildResolvedZoneScreenData(fallbackScreenData, [], {
    source: 'localFallback',
    hasRemoteZone: false,
    hasRemoteEditorial: false,
  });
}

// =============================================================================
// RESOLVED SCREEN DATA
// =============================================================================

export async function getResolvedCountryScreenData(
  countrySlug: string,
  mode: ScreenExperienceMode
): Promise<ResolvedCountryScreenData> {
  const normalizedCountrySlug = normalizeSlug(countrySlug);
  const fallbackScreenData = getCountryScreenFallbackData(normalizedCountrySlug, mode);
  const remoteCountry = await fetchRemoteCountryBaseBySlug(normalizedCountrySlug);
  const countryScreenData = remoteCountry
    ? applyRemoteCountryBaseData(fallbackScreenData, remoteCountry)
    : fallbackScreenData;
  const [remoteEditorial, countryPromotions] = await Promise.all([
    fetchRemoteCountryEditorial(normalizedCountrySlug, mode),
    fetchRemoteCountryPromotions(normalizedCountrySlug, mode),
  ]);

  if (!remoteEditorial) {
    logCountryScreenDataResolution('usando fallback editorial local', {
      countrySlug: normalizedCountrySlug,
      mode,
    });

    return buildResolvedCountryScreenData(
      countryScreenData,
      {
        source: remoteCountry ? 'remoteCountry' : 'localFallback',
        hasRemoteCountry: Boolean(remoteCountry),
        hasRemoteEditorial: false,
      },
      undefined,
      countryPromotions
    );
  }

  logCountryScreenDataResolution('editorial remoto publicado cargado', {
    countrySlug: normalizedCountrySlug,
    mode,
  });

  return buildResolvedCountryScreenData(
    {
      ...countryScreenData,
      editorial: remoteEditorial,
      fallback: {
        ...countryScreenData.fallback,
        isUsingPremiumFallback: countryScreenData.hero.isPremiumFallback,
        reason: countryScreenData.fallback.reason,
      },
    },
    {
      source: remoteCountry ? 'remoteCountryAndEditorial' : 'remoteEditorial',
      hasRemoteCountry: Boolean(remoteCountry),
      hasRemoteEditorial: true,
    },
    undefined,
    countryPromotions
  );
}

export async function getResolvedZoneScreenData(
  countrySlug: string,
  zoneSlug: string,
  mode: ScreenExperienceMode
): Promise<ResolvedZoneScreenData> {
  const normalizedCountrySlug = normalizeSlug(countrySlug);
  const normalizedZoneSlug = normalizeSlug(zoneSlug);
  const fallbackScreenData = getZoneScreenFallbackData(
    normalizedCountrySlug,
    normalizedZoneSlug,
    mode
  );
  const remoteZone = await fetchRemoteZoneBaseBySlugs(
    normalizedCountrySlug,
    normalizedZoneSlug
  );
  const zoneScreenData = remoteZone
    ? applyRemoteZoneBaseData(fallbackScreenData, remoteZone)
    : fallbackScreenData;
  const [promotions, remoteEditorial] = await Promise.all([
    fetchRemoteZonePromotions(normalizedCountrySlug, normalizedZoneSlug, mode),
    fetchRemoteZoneEditorial(normalizedCountrySlug, normalizedZoneSlug, mode),
  ]);

  const resolvedZoneScreenData = remoteEditorial
    ? {
        ...zoneScreenData,
        editorial: remoteEditorial,
      }
    : zoneScreenData;

  return buildResolvedZoneScreenData(resolvedZoneScreenData, promotions, {
    source: getResolvedZoneSource(Boolean(remoteZone), promotions.length > 0),
    hasRemoteZone: Boolean(remoteZone),
    hasRemoteEditorial: Boolean(remoteEditorial),
  });
}

// =============================================================================
// REMOTE COUNTRY READERS
// =============================================================================

async function fetchRemoteCountryBaseBySlug(
  countrySlug: string
): Promise<RemoteCountryBaseData | null> {
  if (!countrySlug || !isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('countries')
      .select('id,slug,name_es,capital_es,continent_es,description_es,status,featured')
      .eq('slug', countrySlug)
      .in('status', ['active', 'comingSoon'])
      .maybeSingle();

    if (error) {
      logScreenDataError('Error loading remote country base data', error);
      return null;
    }

    return normalizeRemoteCountryBaseData(data as DBCountryBase | null);
  } catch (error) {
    logScreenDataError('Unexpected error loading remote country base data', error);
    return null;
  }
}

async function fetchRemoteCountryEditorial(
  countrySlug: string,
  mode: ScreenExperienceMode
): Promise<ScreenEditorialData | null> {
  const contents = await getPublishedEditorialContent({
    entityType: 'country',
    entitySlug: countrySlug,
    countrySlug,
    mode,
  });

  return normalizePublishedEditorialContent(contents[0]);
}

async function fetchRemoteCountryPromotions(
  countrySlug: string,
  mode: ScreenExperienceMode
): Promise<Promotion[]> {
  return getPublishedPromotionsForContext({
    countrySlug,
    mode,
    limit: 3,
  });
}

function normalizeRemoteCountryBaseData(db: DBCountryBase | null): RemoteCountryBaseData | null {
  if (!db) {
    return null;
  }

  const slug = normalizeRequiredText(db.slug);
  const displayName = normalizeRequiredText(db.name_es);
  const status = normalizeRequiredText(db.status);

  if (!slug || !displayName || !status) {
    return null;
  }

  return {
    id: db.id,
    slug,
    displayName,
    status,
    featured: Boolean(db.featured),
    capital: normalizeRequiredText(db.capital_es) || undefined,
    continent: normalizeRequiredText(db.continent_es) || undefined,
    shortDescription: normalizeRequiredText(db.description_es) || undefined,
  };
}

function applyRemoteCountryBaseData(
  fallbackScreenData: ResolvedCountryScreenData,
  remoteCountry: RemoteCountryBaseData
): ResolvedCountryScreenData {
  const fallbackCountry = fallbackScreenData.country;
  const country: ScreenCountrySummary = {
    id: fallbackCountry?.id || remoteCountry.id,
    slug: remoteCountry.slug,
    displayName: remoteCountry.displayName,
    isoAlpha2: fallbackCountry?.isoAlpha2,
    isoAlpha3: fallbackCountry?.isoAlpha3,
    unM49: fallbackCountry?.unM49,
    status: remoteCountry.status,
    isFromWorldCatalog: Boolean(fallbackCountry?.isFromWorldCatalog),
  };
  const pageData = fallbackScreenData.pageData.country
    ? {
        ...fallbackScreenData.pageData,
        country: {
          ...fallbackScreenData.pageData.country,
          id: fallbackScreenData.pageData.country.id || remoteCountry.id,
          slug: remoteCountry.slug,
          displayName: remoteCountry.displayName,
          name: fallbackScreenData.pageData.country.name || remoteCountry.slug,
          status: normalizeCountryStatus(remoteCountry.status),
          featured: remoteCountry.featured ?? fallbackScreenData.pageData.country.featured,
          capital: remoteCountry.capital || fallbackScreenData.pageData.country.capital,
          shortDescription:
            remoteCountry.shortDescription ||
            fallbackScreenData.pageData.country.shortDescription,
        },
      }
    : fallbackScreenData.pageData;

  return buildResolvedCountryScreenData(
    {
      ...fallbackScreenData,
      country,
    },
    {
      source: 'remoteCountry',
      hasRemoteCountry: true,
      hasRemoteEditorial: fallbackScreenData.metadata.hasRemoteEditorial,
    },
    pageData
  );
}

// =============================================================================
// REMOTE ZONE READERS
// =============================================================================

async function fetchRemoteZoneBaseBySlugs(
  countrySlug: string,
  zoneSlug: string
): Promise<RemoteZoneBaseData | null> {
  if (!countrySlug || !zoneSlug || !isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data: countryData, error: countryError } = await supabase
      .from('countries')
      .select('id')
      .eq('slug', countrySlug)
      .in('status', ['active', 'comingSoon'])
      .maybeSingle();

    if (countryError) {
      logScreenDataError('Error loading remote zone country id', countryError);
      return null;
    }

    const countryId = normalizeRequiredText((countryData as { id?: string } | null)?.id);

    if (!countryId) {
      return null;
    }

    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('id,slug,name_es,short_description_es,status,featured')
      .eq('country_id', countryId)
      .eq('slug', zoneSlug)
      .in('status', ['active', 'comingSoon'])
      .maybeSingle();

    if (cityError) {
      logScreenDataError('Error loading remote zone base data', cityError);
      return null;
    }

    return normalizeRemoteZoneBaseData(cityData as DBCityBase | null);
  } catch (error) {
    logScreenDataError('Unexpected error loading remote zone base data', error);
    return null;
  }
}

async function fetchRemoteZonePromotions(
  countrySlug: string,
  zoneSlug: string,
  mode: ScreenExperienceMode
): Promise<Promotion[]> {
  return getPublishedPromotionsForContext({
    countrySlug,
    zoneSlug,
    mode,
    limit: 3,
  });
}

async function fetchRemoteZoneEditorial(
  countrySlug: string,
  zoneSlug: string,
  mode: ScreenExperienceMode
): Promise<ScreenEditorialData | null> {
  if (!isZoneEditorialPilot(countrySlug, zoneSlug)) {
    return null;
  }

  const contents = await getPublishedEditorialContent({
    entityType: 'zone',
    entitySlug: zoneSlug,
    countrySlug,
    zoneSlug,
    mode,
  });

  return resolvePilotZoneEditorial(contents, { countrySlug, zoneSlug, mode });
}

function normalizeRemoteZoneBaseData(db: DBCityBase | null): RemoteZoneBaseData | null {
  if (!db) {
    return null;
  }

  const slug = normalizeRequiredText(db.slug);
  const name = normalizeRequiredText(db.name_es);
  const status = normalizeRequiredText(db.status);

  if (!slug || !name || !status) {
    return null;
  }

  return {
    id: db.id,
    slug,
    name,
    status,
    featured: Boolean(db.featured),
    summary: normalizeRequiredText(db.short_description_es) || undefined,
  };
}

function applyRemoteZoneBaseData(
  fallbackScreenData: ResolvedZoneScreenData,
  remoteZone: RemoteZoneBaseData
): ResolvedZoneScreenData {
  return buildResolvedZoneScreenData(
    {
      ...fallbackScreenData,
      zone: {
        ...fallbackScreenData.zone,
        id: fallbackScreenData.zone.id || remoteZone.id,
        slug: remoteZone.slug,
        name: remoteZone.name,
        status: remoteZone.status,
        featured: remoteZone.featured ?? fallbackScreenData.zone.featured,
        summary: remoteZone.summary || fallbackScreenData.zone.summary,
      },
    },
    fallbackScreenData.promotions,
    {
      source: 'remoteZone',
      hasRemoteZone: true,
      hasRemoteEditorial: fallbackScreenData.metadata.hasRemoteEditorial,
    }
  );
}

// =============================================================================
// BUILDERS
// =============================================================================

function buildResolvedCountryScreenData(
  screenData: CountryScreenData,
  metadata: Pick<
    ResolvedCountryScreenData['metadata'],
    'source' | 'hasRemoteCountry' | 'hasRemoteEditorial'
  >,
  resolvedPageData?: CountryPageData,
  countryPromotions: Promotion[] = []
): ResolvedCountryScreenData {
  const countrySlug = screenData.country?.slug || '';
  const pageData = resolvedPageData || getCountryPageData(countrySlug);
  const countryName = screenData.country?.displayName || screenData.hero.title;
  const isoAlpha2 = screenData.country?.isoAlpha2;

  return {
    ...screenData,
    countryName,
    countrySlug,
    countryCode: isoAlpha2,
    isoAlpha2,
    isoAlpha3: screenData.country?.isoAlpha3,
    unM49: screenData.country?.unM49,
    status: screenData.country?.status,
    pageData,
    countryPromotions,
    metadata: {
      ...metadata,
      hasRemoteCountryPromotions: countryPromotions.length > 0,
      isFromWorldCatalog: Boolean(screenData.country?.isFromWorldCatalog),
    },
  };
}

function buildResolvedZoneScreenData(
  screenData: ZoneScreenData,
  promotions: Promotion[],
  metadata: Pick<
    ResolvedZoneScreenData['metadata'],
    'source' | 'hasRemoteZone' | 'hasRemoteEditorial'
  >
): ResolvedZoneScreenData {
  const countrySlug = screenData.country?.slug || screenData.zone.countrySlug;
  const zoneSlug = screenData.zone.slug;
  const countryName = screenData.country?.displayName || 'este país';
  const zoneName = screenData.zone.name;

  return {
    ...screenData,
    countrySlug,
    zoneSlug,
    countryName,
    zoneName,
    promotions,
    metadata: {
      ...metadata,
      hasRemotePromotions: promotions.length > 0,
      hasRemoteEditorial: metadata.hasRemoteEditorial,
      isUsingPremiumFallback: screenData.fallback.isUsingPremiumFallback,
    },
  };
}

function getResolvedZoneSource(
  hasRemoteZone: boolean,
  hasRemotePromotions: boolean
): ResolvedZoneScreenData['metadata']['source'] {
  if (hasRemoteZone && hasRemotePromotions) {
    return 'remoteZoneAndPromotions';
  }

  if (hasRemoteZone) {
    return 'remoteZone';
  }

  if (hasRemotePromotions) {
    return 'remotePromotions';
  }

  return 'localFallback';
}

// =============================================================================
// NORMALIZERS AND LOGGING
// =============================================================================

function normalizeCountryStatus(status: string): 'active' | 'comingSoon' | 'disabled' {
  if (status === 'active' || status === 'comingSoon' || status === 'disabled') {
    return status;
  }

  return 'comingSoon';
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeRequiredText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

function logCountryScreenDataResolution(
  message: string,
  details: { countrySlug: string; mode: ScreenExperienceMode }
): void {
  if (import.meta.env.DEV) {
    console.info('[CountryScreenData]', message, details);
  }
}

function logScreenDataError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error('[CountryScreenData]', message, error);
  }
}
