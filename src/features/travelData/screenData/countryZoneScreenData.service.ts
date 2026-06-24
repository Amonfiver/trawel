import { localCountryZoneScreenDataRepository } from './localCountryZoneScreenData.repository';
import { getPublishedEditorialContent, getPublishedPromotionsForContext } from '../productContent';
import type { EditorialContent, Promotion } from '../productContent';
import { getCountryPageData } from '../services/travelData.service';
import type { CountryPageData } from '../types/travelData.types';
import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';
import type {
  CountryScreenData,
  CountryZoneScreenDataRepository,
  ScreenEditorialData,
  ScreenExperienceMode,
  ScreenCountrySummary,
  ZoneScreenData,
} from './screenData.types';

const activeCountryZoneScreenDataRepository: CountryZoneScreenDataRepository =
  localCountryZoneScreenDataRepository;

export interface ResolvedCountryScreenData extends CountryScreenData {
  countryName: string;
  countrySlug: string;
  countryCode?: string;
  isoAlpha2?: string;
  isoAlpha3?: string;
  unM49?: string;
  status?: string;
  pageData: CountryPageData;
  metadata: {
    source: 'localFallback' | 'remoteCountry' | 'remoteEditorial' | 'remoteCountryAndEditorial';
    hasRemoteCountry: boolean;
    hasRemoteEditorial: boolean;
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
    source: 'localFallback' | 'remotePromotions';
    hasRemotePromotions: boolean;
    isUsingPremiumFallback: boolean;
  };
}

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

// Future repositories can implement CountryZoneScreenDataRepository:
// - Supabase legacy trawel-prod repository.
// - Supabase data-driven repository.

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
  const normalizedCountrySlug = countrySlug.trim().toLowerCase();
  const fallbackScreenData = getCountryScreenData(normalizedCountrySlug, mode);

  return buildResolvedCountryScreenData(fallbackScreenData, {
    source: 'localFallback',
    hasRemoteCountry: false,
    hasRemoteEditorial: false,
  });
}

export async function getResolvedCountryScreenData(
  countrySlug: string,
  mode: ScreenExperienceMode
): Promise<ResolvedCountryScreenData> {
  const normalizedCountrySlug = countrySlug.trim().toLowerCase();
  const fallbackScreenData = getCountryScreenFallbackData(normalizedCountrySlug, mode);
  const remoteCountry = await getPublishedRemoteCountryBySlug(normalizedCountrySlug);
  const countryScreenData = remoteCountry
    ? mergeRemoteCountryBaseData(fallbackScreenData, remoteCountry)
    : fallbackScreenData;

  const contents = await getPublishedEditorialContent({
    entityType: 'country',
    entitySlug: normalizedCountrySlug,
    countrySlug: normalizedCountrySlug,
    mode,
  });

  const remoteEditorial = normalizeRemoteEditorialContent(contents[0]);

  if (!remoteEditorial) {
    logCountryScreenDataResolution('usando fallback editorial local', {
      countrySlug: normalizedCountrySlug,
      mode,
    });
    return remoteCountry
      ? buildResolvedCountryScreenData(countryScreenData, {
          source: 'remoteCountry',
          hasRemoteCountry: true,
          hasRemoteEditorial: false,
        })
      : fallbackScreenData;
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
    }
  );
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
  const normalizedCountrySlug = countrySlug.trim().toLowerCase();
  const normalizedZoneSlug = zoneSlug.trim().toLowerCase();
  const fallbackScreenData = getZoneScreenData(normalizedCountrySlug, normalizedZoneSlug, mode);

  return buildResolvedZoneScreenData(fallbackScreenData, [], 'localFallback');
}

export async function getResolvedZoneScreenData(
  countrySlug: string,
  zoneSlug: string,
  mode: ScreenExperienceMode
): Promise<ResolvedZoneScreenData> {
  const normalizedCountrySlug = countrySlug.trim().toLowerCase();
  const normalizedZoneSlug = zoneSlug.trim().toLowerCase();
  const fallbackScreenData = getZoneScreenFallbackData(
    normalizedCountrySlug,
    normalizedZoneSlug,
    mode
  );

  const promotions = await getPublishedPromotionsForContext({
    countrySlug: normalizedCountrySlug,
    zoneSlug: normalizedZoneSlug,
    mode,
    limit: 3,
  });

  return buildResolvedZoneScreenData(
    fallbackScreenData,
    promotions,
    promotions.length > 0 ? 'remotePromotions' : 'localFallback'
  );
}

function normalizeRemoteEditorialContent(
  content: EditorialContent | undefined
): ScreenEditorialData | null {
  if (!content || content.status !== 'published' || !content.mode) {
    return null;
  }

  const headline = normalizeRequiredText(content.headline);
  const intro = normalizeRequiredText(content.intro);
  const whatMakesSpecial = normalizeRequiredText(content.whatMakesSpecial);
  const highlights = normalizeRequiredStringList(content.highlights);
  const suggestedRoute = normalizeRequiredText(content.suggestedRoute);
  const practicalTips = normalizeRequiredTextList(content.practicalTips);

  if (
    !headline ||
    !intro ||
    !whatMakesSpecial ||
    highlights.length === 0 ||
    !suggestedRoute ||
    !practicalTips
  ) {
    return null;
  }

  return {
    mode: content.mode,
    status: 'published',
    headline,
    intro,
    whatMakesSpecial,
    highlights,
    suggestedRoute,
    practicalTips,
  };
}

async function getPublishedRemoteCountryBySlug(
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
      logCountryScreenDataError('Error loading remote country base data', error);
      return null;
    }

    return normalizeRemoteCountryBaseData(data as DBCountryBase | null);
  } catch (error) {
    logCountryScreenDataError('Unexpected error loading remote country base data', error);
    return null;
  }
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

function mergeRemoteCountryBaseData(
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

function normalizeCountryStatus(status: string): 'active' | 'comingSoon' | 'disabled' {
  if (status === 'active' || status === 'comingSoon' || status === 'disabled') {
    return status;
  }

  return 'comingSoon';
}

function buildResolvedCountryScreenData(
  screenData: CountryScreenData,
  metadata: Pick<
    ResolvedCountryScreenData['metadata'],
    'source' | 'hasRemoteCountry' | 'hasRemoteEditorial'
  >,
  resolvedPageData?: CountryPageData
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
    metadata: {
      ...metadata,
      isFromWorldCatalog: Boolean(screenData.country?.isFromWorldCatalog),
    },
  };
}

function buildResolvedZoneScreenData(
  screenData: ZoneScreenData,
  promotions: Promotion[],
  source: ResolvedZoneScreenData['metadata']['source']
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
      source,
      hasRemotePromotions: promotions.length > 0,
      isUsingPremiumFallback: screenData.fallback.isUsingPremiumFallback,
    },
  };
}

function normalizeRequiredText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

function normalizeRequiredStringList(value: unknown[]): string[] {
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeRequiredTextList(value: unknown[]): string | null {
  const items = normalizeRequiredStringList(value);
  return items.length > 0 ? items.join(' ') : null;
}

function logCountryScreenDataResolution(
  message: string,
  details: { countrySlug: string; mode: ScreenExperienceMode }
): void {
  if (import.meta.env.DEV) {
    console.info('[CountryScreenData]', message, details);
  }
}

function logCountryScreenDataError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error('[CountryScreenData]', message, error);
  }
}
