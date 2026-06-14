import { getLocalizedText } from '../../../app/i18n';
import { getCityBySlug } from '../../cities/data/cities.utils';
import type { City } from '../../cities/types/city.types';
import { getCountryEditorial } from '../../countries';
import { getWorldCountryBySlug } from '../../countries/data/worldCountries';
import { getPreferredAdminLevel } from '../../map/config/countryMapProfiles';
import { getCountryPageData } from '../services/travelData.service';
import type {
  CountryScreenData,
  CountryZoneScreenDataRepository,
  ScreenCountrySummary,
  ScreenEditorialData,
  ScreenExperienceMode,
  ScreenHeroData,
  ScreenZoneSummary,
  ZoneScreenData,
} from './screenData.types';

const countryHeroImages = import.meta.glob<{ default: string }>(
  '../../../assets/countries/hero/*.webp',
  { eager: true }
);

const zoneHeroImages = import.meta.glob<{ default: string }>(
  '../../../assets/zones/hero/*.webp',
  { eager: true }
);

const countryHeroImageMap = buildImageMap(countryHeroImages);
const zoneHeroImageMap = buildImageMap(zoneHeroImages);

const LOCAL_MAP_COUNTRIES = new Set(['espana']);

export const localCountryZoneScreenDataRepository: CountryZoneScreenDataRepository = {
  getCountryScreenData,
  getZoneScreenData,
};

function getCountryScreenData(
  countrySlug: string,
  mode: ScreenExperienceMode
): CountryScreenData {
  const normalizedCountrySlug = normalizeSlug(countrySlug);
  const pageData = getCountryPageData(normalizedCountrySlug);
  const worldCountry = getWorldCountryBySlug(normalizedCountrySlug);
  const country = toCountrySummary(pageData.country, worldCountry, normalizedCountrySlug);
  const displayName = country?.displayName || createNameFromSlug(normalizedCountrySlug);
  const hero = buildCountryHero(normalizedCountrySlug, displayName);
  const editorial = buildCountryEditorial(
    normalizedCountrySlug,
    mode,
    displayName,
    pageData.country?.shortDescription
  );
  const zones = [...pageData.activeCities, ...pageData.comingSoonCities].map((city) =>
    cityToZoneSummary(city)
  );

  return {
    kind: 'country',
    mode,
    country,
    hero,
    editorial,
    zones,
    mapStatus: {
      status: LOCAL_MAP_COUNTRIES.has(normalizedCountrySlug) ? 'localReady' : 'remoteDeferred',
      preferredAdminLevel: getPreferredAdminLevel(normalizedCountrySlug),
      source: LOCAL_MAP_COUNTRIES.has(normalizedCountrySlug) ? 'localAsset' : 'futureSupabase',
    },
    fallback: {
      isUsingPremiumFallback: hero.isPremiumFallback || editorial.status !== 'published',
      reason: hero.isPremiumFallback
        ? 'No hay imagen hero local aprobada para este pais.'
        : undefined,
    },
    communityCta: {
      title: 'Colabora con Trawel',
      text: `¿Tienes una foto o experiencia de ${displayName}? Puedes ayudar a completar este destino con contenido revisado.`,
      isSecondary: true,
    },
  };
}

function getZoneScreenData(
  countrySlug: string,
  zoneSlug: string,
  mode: ScreenExperienceMode
): ZoneScreenData {
  const normalizedCountrySlug = normalizeSlug(countrySlug);
  const normalizedZoneSlug = normalizeSlug(zoneSlug);
  const countryData = getCountryScreenData(normalizedCountrySlug, mode);
  const city = getCityBySlug(normalizedCountrySlug, normalizedZoneSlug);
  const zone = city
    ? cityToZoneSummary(city)
    : buildFallbackZoneSummary(normalizedCountrySlug, normalizedZoneSlug);
  const hero = buildZoneHero(zone);
  const editorial = buildZoneEditorial(zone, city, mode);

  return {
    kind: 'zone',
    mode,
    country: countryData.country,
    zone,
    hero,
    editorial,
    places: [],
    plans: [],
    routes: [],
    fallback: {
      isUsingPremiumFallback: hero.isPremiumFallback || editorial.status !== 'published',
      reason: hero.isPremiumFallback
        ? 'No hay imagen hero local aprobada para esta zona.'
        : undefined,
    },
    communityCta: {
      title: 'Comunidad de viajeros',
      text: `Las experiencias reales de ${zone.name} podran complementar la guia editorial cuando esten revisadas.`,
      actionLabel: 'Compartir una aventura',
      isSecondary: true,
    },
  };
}

function buildImageMap(modules: Record<string, { default: string }>): Record<string, string> {
  return Object.entries(modules).reduce<Record<string, string>>((acc, [path, module]) => {
    const match = path.match(/[\\/]([^\\/]+)\.webp$/i);
    if (match) {
      acc[match[1]] = module.default;
    }
    return acc;
  }, {});
}

function buildCountryHero(slug: string, displayName: string): ScreenHeroData {
  const imageUrl = countryHeroImageMap[slug];

  return {
    title: displayName,
    subtitle: imageUrl
      ? `Descubre ${displayName} desde sus regiones, rutas y lugares esenciales.`
      : 'Un destino en preparacion para viajeros curiosos. Muy pronto reuniremos rutas, lugares y consejos para descubrirlo con calma.',
    imageUrl,
    imageAlt: imageUrl
      ? `Imagen panoramica de ${displayName}`
      : `Portada temporal del pais ${displayName}`,
    source: imageUrl ? 'localAsset' : 'fallback',
    isPremiumFallback: !imageUrl,
  };
}

function buildZoneHero(zone: ScreenZoneSummary): ScreenHeroData {
  const imageUrl = zoneHeroImageMap[zone.slug];

  return {
    title: zone.name,
    subtitle: zone.summary || 'Un lugar en preparacion para viajeros curiosos.',
    imageUrl,
    imageAlt: imageUrl
      ? `Imagen panoramica de ${zone.name}`
      : `Portada temporal de la zona ${zone.name}`,
    source: imageUrl ? 'localAsset' : 'fallback',
    isPremiumFallback: !imageUrl,
  };
}

function buildCountryEditorial(
  slug: string,
  mode: ScreenExperienceMode,
  displayName: string,
  fallbackDescription?: string
): ScreenEditorialData {
  const editorial = getCountryEditorial(slug, mode);

  if (editorial) {
    return {
      mode,
      status: 'published',
      headline: editorial.headline,
      intro: editorial.intro,
      whatMakesSpecial: editorial.whatMakesSpecial,
      highlights: editorial.explorationIdeas,
      suggestedRoute: editorial.suggestedRoute,
      practicalTips: editorial.quickTip,
    };
  }

  return {
    mode,
    status: fallbackDescription ? 'fallback' : 'missing',
    headline: `Por que explorar ${displayName}`,
    intro:
      fallbackDescription ||
      `Estamos preparando contenido editorial para ${displayName} con estructura data-driven.`,
    highlights: [],
  };
}

function buildZoneEditorial(
  zone: ScreenZoneSummary,
  city: City | undefined,
  mode: ScreenExperienceMode
): ScreenEditorialData {
  const content =
    city?.contentByMode?.[mode] || city?.contentByMode?.adventure || city?.contentByMode?.student;
  const intro = content ? getLocalizedText(content, 'es') : zone.summary;

  return {
    mode,
    status: intro ? 'fallback' : 'missing',
    headline: `Explorar ${zone.name}`,
    intro:
      intro ||
      `Estamos preparando una guia editorial de ${zone.name} con lugares, rutas, planes y consejos practicos.`,
    highlights: [],
  };
}

function toCountrySummary(
  country: ReturnType<typeof getCountryPageData>['country'],
  worldCountry: ReturnType<typeof getWorldCountryBySlug>,
  slug: string
): ScreenCountrySummary | null {
  if (country) {
    return {
      id: country.id,
      slug: country.slug,
      displayName: country.displayName,
      isoAlpha2: country.isoAlpha2,
      isoAlpha3: country.isoAlpha3,
      unM49: country.unM49,
      status: country.status,
      isFromWorldCatalog: false,
    };
  }

  if (worldCountry) {
    return {
      id: worldCountry.isoAlpha2,
      slug: worldCountry.slug,
      displayName: worldCountry.displayName,
      isoAlpha2: worldCountry.isoAlpha2,
      isoAlpha3: worldCountry.isoAlpha3,
      unM49: worldCountry.unM49,
      status: 'discovering',
      isFromWorldCatalog: true,
    };
  }

  if (!slug) {
    return null;
  }

  return {
    id: slug,
    slug,
    displayName: createNameFromSlug(slug),
    status: 'missing',
    isFromWorldCatalog: false,
  };
}

function cityToZoneSummary(city: City): ScreenZoneSummary {
  return {
    id: city.id,
    slug: city.slug,
    countrySlug: city.countrySlug,
    name: getLocalizedText(city.name, 'es') || createNameFromSlug(city.slug),
    type: 'city',
    status: city.status,
    featured: city.featured,
    coordinates: city.coordinates,
    summary: city.shortDescription ? getLocalizedText(city.shortDescription, 'es') : undefined,
  };
}

function buildFallbackZoneSummary(countrySlug: string, zoneSlug: string): ScreenZoneSummary {
  return {
    id: zoneSlug,
    slug: zoneSlug,
    countrySlug,
    name: createNameFromSlug(zoneSlug),
    type: 'unknown',
    status: 'discovering',
  };
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

function createNameFromSlug(slug: string): string {
  const words = slug
    .split('-')
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return 'Destino por descubrir';
  }

  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
