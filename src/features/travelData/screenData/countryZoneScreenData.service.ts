import { localCountryZoneScreenDataRepository } from './localCountryZoneScreenData.repository';
import { getPublishedEditorialContent } from '../productContent';
import type { EditorialContent } from '../productContent';
import type {
  CountryScreenData,
  CountryZoneScreenDataRepository,
  ScreenEditorialData,
  ScreenExperienceMode,
  ZoneScreenData,
} from './screenData.types';

const activeCountryZoneScreenDataRepository: CountryZoneScreenDataRepository =
  localCountryZoneScreenDataRepository;

// Future repositories can implement CountryZoneScreenDataRepository:
// - Supabase legacy trawel-prod repository.
// - Supabase data-driven repository.

export function getCountryScreenData(
  countrySlug: string,
  mode: ScreenExperienceMode
): CountryScreenData {
  return activeCountryZoneScreenDataRepository.getCountryScreenData(countrySlug, mode);
}

export async function getResolvedCountryScreenData(
  countrySlug: string,
  mode: ScreenExperienceMode
): Promise<CountryScreenData> {
  const normalizedCountrySlug = countrySlug.trim().toLowerCase();
  const fallbackScreenData = getCountryScreenData(normalizedCountrySlug, mode);

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
    return fallbackScreenData;
  }

  logCountryScreenDataResolution('editorial remoto publicado cargado', {
    countrySlug: normalizedCountrySlug,
    mode,
  });

  return {
    ...fallbackScreenData,
    editorial: remoteEditorial,
    fallback: {
      ...fallbackScreenData.fallback,
      isUsingPremiumFallback: fallbackScreenData.hero.isPremiumFallback,
      reason: fallbackScreenData.fallback.reason,
    },
  };
}

export function getZoneScreenData(
  countrySlug: string,
  zoneSlug: string,
  mode: ScreenExperienceMode
): ZoneScreenData {
  return activeCountryZoneScreenDataRepository.getZoneScreenData(countrySlug, zoneSlug, mode);
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
