import heroImage from '../../../assets/home/heroimagen.png';
import heroLogo from '../../../assets/brand/trawelogo-transparent.png';
import spainImage from '../../../assets/home/destinations/spain.png';
import mexicoImage from '../../../assets/home/destinations/mexico.png';
import italyImage from '../../../assets/home/destinations/italy.png';
import indiaImage from '../../../assets/home/destinations/india.png';
import albarracinImage from '../../../assets/home/plans/albarracin.png';
import amalfitanaImage from '../../../assets/home/plans/amalfitana.png';
import rajasthanImage from '../../../assets/home/plans/rajasthan.png';
import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';
import { getPublishedPromotionsForContext } from '../productContent';
import type { Promotion } from '../productContent';
import type { ScreenExperienceMode } from './screenData.types';

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export type HomeImageKind = 'pais' | 'ciudad' | 'paisaje' | 'monumento' | 'aventura' | 'ruta';

export interface HomeScreenImage {
  url?: string;
  alt: string;
  kind: HomeImageKind;
}

export interface HomeScreenHeroData {
  wallpaperImageUrl: string;
  logoImageUrl: string;
  logoAlt: string;
  titleLines: {
    first: string;
    second: string;
    accent: string;
  };
  subtitle: string;
  primaryCta: {
    href: string;
    label: string;
    icon: string;
  };
  secondaryCta: {
    href: string;
    label: string;
  };
}

export interface HomeFeaturedDestination {
  slug: string;
  name: string;
  flagCode: string;
  description: string;
  image: HomeScreenImage;
}

export interface HomeFeaturedAdventure {
  id: string;
  title: string;
  location: string;
  type: string;
  description: string;
  comingSoon: boolean;
  image: HomeScreenImage;
}

export interface HomeCommunityCtaData {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  label: string;
}

export interface ResolvedHomeScreenData {
  hero: HomeScreenHeroData;
  featuredDestinations: HomeFeaturedDestination[];
  featuredAdventures: HomeFeaturedAdventure[];
  homePromotions: Promotion[];
  communityCta: HomeCommunityCtaData;
  metadata: {
    source:
      | 'localFallback'
      | 'remoteFeaturedCountries'
      | 'remoteFeaturedAdventures'
      | 'remoteFeaturedCountriesAndAdventures';
    hasRemoteData: boolean;
    hasRemoteFeaturedCountries: boolean;
    hasRemoteFeaturedAdventures: boolean;
    hasRemoteHomePromotions: boolean;
  };
}

// =============================================================================
// INTERNAL TYPES
// =============================================================================

interface DBHomeCountry {
  id: string;
  slug: string | null;
  name_es: string | null;
  emoji: string | null;
  description_es: string | null;
  status: string | null;
  featured: boolean | null;
}

interface DBHomeDestination {
  id: string;
  slug: string | null;
  title_es: string | null;
  summary_es: string | null;
  type: string | null;
  estimated_visit_time: string | null;
  status: string | null;
  featured: boolean | null;
}

interface RemoteFeaturedCountry {
  slug: string;
  name: string;
  flagCode: string;
  description: string;
}

interface RemoteFeaturedAdventure {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  estimatedVisitTime?: string;
}

// =============================================================================
// LOCAL FALLBACK DATA
// =============================================================================

const featuredDestinations: HomeFeaturedDestination[] = [
  {
    slug: 'espana',
    name: 'España',
    flagCode: 'ES',
    description: 'Desde pueblos medievales hasta costas atlánticas. Historia, gastronomía y rutas para todos los gustos.',
    image: {
      url: spainImage,
      alt: 'Ronda, Andalucía',
      kind: 'pais',
    },
  },
  {
    slug: 'mexico',
    name: 'México',
    flagCode: 'MX',
    description: 'Cultura milenaria, pueblos mágicos y una gastronomía reconocida en todo el mundo.',
    image: {
      url: mexicoImage,
      alt: 'Guanajuato',
      kind: 'pais',
    },
  },
  {
    slug: 'italia',
    name: 'Italia',
    flagCode: 'IT',
    description: 'Arte, historia y paisajes que han inspirado a viajeros durante siglos.',
    image: {
      url: italyImage,
      alt: "Val d'Orcia, Toscana",
      kind: 'pais',
    },
  },
  {
    slug: 'india',
    name: 'India',
    flagCode: 'IN',
    description: 'Un continente de contrastes donde cada región ofrece una experiencia única.',
    image: {
      url: indiaImage,
      alt: 'Taj Mahal, Agra',
      kind: 'monumento',
    },
  },
];

const featuredAdventures: HomeFeaturedAdventure[] = [
  {
    id: '1',
    title: 'Ruta por el encanto medieval de Albarracín',
    location: 'Albarracín, Teruel, España',
    type: 'Cultura y naturaleza',
    description: 'Camina entre murallas rojizas, callejuelas empedradas y miradores que convierten este rincón de Teruel en una escapada inolvidable.',
    comingSoon: false,
    image: {
      url: albarracinImage,
      alt: 'Albarracín, Teruel, España',
      kind: 'ciudad',
    },
  },
  {
    id: '2',
    title: 'Escapada por la Costa Amalfitana',
    location: 'Costa Amalfitana, Italia',
    type: 'Aventura costera',
    description: 'Pueblos suspendidos sobre el Mediterráneo, carreteras panorámicas, limoneros y atardeceres que hacen que cada parada parezca una postal.',
    comingSoon: true,
    image: {
      url: amalfitanaImage,
      alt: 'Costa Amalfitana, Italia',
      kind: 'paisaje',
    },
  },
  {
    id: '3',
    title: 'Palacios, templos y bazares de Rajasthan',
    location: 'Rajasthan, India',
    type: 'Viaje cultural',
    description: 'Una ruta llena de color entre fortalezas, mercados vibrantes, arquitectura majestuosa y tradiciones que muestran la India más fascinante.',
    comingSoon: true,
    image: {
      url: rajasthanImage,
      alt: 'Rajasthan, India',
      kind: 'monumento',
    },
  },
];

// =============================================================================
// FALLBACK AND RESOLVED HOME DATA
// =============================================================================

export function getHomeScreenFallbackData(mode: ScreenExperienceMode): ResolvedHomeScreenData {
  return {
    hero: buildHomeHero(mode),
    featuredDestinations,
    featuredAdventures,
    homePromotions: [],
    communityCta: {
      eyebrow: 'Comunidad',
      title: '¿Tienes una experiencia que contar o recomiendas un sitio para visitar?',
      description:
        'Comparte tu aventura o recomienda ese lugar que merece aparecer en el mapa. Todas las propuestas se revisan antes de publicarse.',
      href: '/compartir',
      label: 'Compartir mi aventura',
    },
    metadata: buildHomeMetadata(false, false),
  };
}

export async function getResolvedHomeScreenData(
  mode: ScreenExperienceMode
): Promise<ResolvedHomeScreenData> {
  const fallbackScreenData = getHomeScreenFallbackData(mode);
  const [remoteFeaturedDestinations, remoteFeaturedAdventures, homePromotions] = await Promise.all([
    fetchRemoteFeaturedCountries(),
    fetchRemoteFeaturedAdventures(),
    fetchRemoteHomePromotions(mode),
  ]);
  const hasEnoughRemoteCountries =
    remoteFeaturedDestinations.length >= fallbackScreenData.featuredDestinations.length;
  const hasEnoughRemoteAdventures =
    remoteFeaturedAdventures.length >= fallbackScreenData.featuredAdventures.length;

  if (!hasEnoughRemoteCountries && !hasEnoughRemoteAdventures) {
    return fallbackScreenData;
  }

  return {
    ...fallbackScreenData,
    featuredDestinations: hasEnoughRemoteCountries
      ? remoteFeaturedDestinations.slice(0, fallbackScreenData.featuredDestinations.length)
      : fallbackScreenData.featuredDestinations,
    featuredAdventures: hasEnoughRemoteAdventures
      ? remoteFeaturedAdventures.slice(0, fallbackScreenData.featuredAdventures.length)
      : fallbackScreenData.featuredAdventures,
    homePromotions,
    metadata: buildHomeMetadata(
      hasEnoughRemoteCountries,
      hasEnoughRemoteAdventures,
      homePromotions.length > 0
    ),
  };
}

// =============================================================================
// REMOTE READERS
// =============================================================================

async function fetchRemoteFeaturedCountries(): Promise<HomeFeaturedDestination[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('countries')
      .select('id,slug,name_es,emoji,description_es,status,featured')
      .in('status', ['active', 'comingSoon'])
      .eq('featured', true)
      .order('updated_at', { ascending: false });

    if (error) {
      logHomeScreenDataError('Error loading remote featured countries', error);
      return [];
    }

    return ((data || []) as DBHomeCountry[])
      .map(normalizeRemoteFeaturedCountry)
      .filter((country): country is RemoteFeaturedCountry => Boolean(country))
      .map(mapRemoteCountryToFeaturedDestination);
  } catch (error) {
    logHomeScreenDataError('Unexpected error loading remote featured countries', error);
    return [];
  }
}

async function fetchRemoteFeaturedAdventures(): Promise<HomeFeaturedAdventure[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('destinations')
      .select('id,slug,title_es,summary_es,type,estimated_visit_time,status,featured')
      .eq('status', 'published')
      .eq('featured', true)
      .order('updated_at', { ascending: false });

    if (error) {
      logHomeScreenDataError('Error loading remote featured adventures', error);
      return [];
    }

    return ((data || []) as DBHomeDestination[])
      .map(normalizeRemoteFeaturedAdventure)
      .filter((adventure): adventure is RemoteFeaturedAdventure => Boolean(adventure))
      .map(mapRemoteDestinationToFeaturedAdventure);
  } catch (error) {
    logHomeScreenDataError('Unexpected error loading remote featured adventures', error);
    return [];
  }
}

async function fetchRemoteHomePromotions(mode: ScreenExperienceMode): Promise<Promotion[]> {
  return getPublishedPromotionsForContext({
    mode,
    placementType: 'native_block',
    targetEntityType: 'generic',
    targetEntitySlug: 'home',
    limit: 3,
  });
}

// =============================================================================
// BUILDERS
// =============================================================================

function buildHomeHero(mode: ScreenExperienceMode): HomeScreenHeroData {
  return {
    wallpaperImageUrl: heroImage,
    logoImageUrl: heroLogo,
    logoAlt: 'Trawel',
    titleLines: {
      first: 'El mundo no empieza',
      second: 'en una lista.',
      accent: 'Empieza en un mapa.',
    },
    subtitle:
      mode === 'student'
        ? 'Descubre el mundo a través de su historia, cultura y contexto. Una forma diferente de viajar antes de emprender el camino.'
        : 'Explora países, descubre rutas y transforma cada destino en una aventura real. Historias vividas, planes detallados.',
    primaryCta: {
      href: '#atlas-mundial',
      label: 'Abrir el atlas',
      icon: '🗺️',
    },
    secondaryCta: {
      href: '#destinos',
      label: 'Explorar destinos',
    },
  };
}

function buildHomeMetadata(
  hasRemoteFeaturedCountries: boolean,
  hasRemoteFeaturedAdventures: boolean,
  hasRemoteHomePromotions = false
): ResolvedHomeScreenData['metadata'] {
  return {
    source: getHomeScreenSource(hasRemoteFeaturedCountries, hasRemoteFeaturedAdventures),
    hasRemoteData:
      hasRemoteFeaturedCountries || hasRemoteFeaturedAdventures || hasRemoteHomePromotions,
    hasRemoteFeaturedCountries,
    hasRemoteFeaturedAdventures,
    hasRemoteHomePromotions,
  };
}

function mapRemoteCountryToFeaturedDestination(
  country: RemoteFeaturedCountry
): HomeFeaturedDestination {
  const fallbackDestination = featuredDestinations.find(
    (destination) => destination.slug === country.slug
  );

  return {
    slug: country.slug,
    name: country.name,
    flagCode: country.flagCode,
    description: country.description,
    image: fallbackDestination?.image || {
      alt: country.name,
      kind: 'pais',
    },
  };
}

function mapRemoteDestinationToFeaturedAdventure(
  destination: RemoteFeaturedAdventure
): HomeFeaturedAdventure {
  const fallbackAdventure = featuredAdventures.find(
    (adventure) => adventure.id === destination.id || adventure.id === destination.slug
  );

  return {
    id: destination.id,
    title: destination.title,
    location: destination.estimatedVisitTime || fallbackAdventure?.location || 'Destino destacado',
    type: destination.type,
    description: destination.description,
    comingSoon: false,
    image: fallbackAdventure?.image || {
      alt: destination.title,
      kind: 'aventura',
    },
  };
}

// =============================================================================
// NORMALIZERS AND HELPERS
// =============================================================================

function normalizeRemoteFeaturedCountry(db: DBHomeCountry): RemoteFeaturedCountry | null {
  const slug = normalizeRequiredText(db.slug);
  const name = normalizeRequiredText(db.name_es);
  const description = normalizeRequiredText(db.description_es);

  if (!slug || !name || !description) {
    return null;
  }

  const flagCode = inferCountryFlagCode(slug, db.emoji);

  if (!flagCode) {
    return null;
  }

  return {
    slug,
    name,
    flagCode,
    description,
  };
}

function normalizeRemoteFeaturedAdventure(
  db: DBHomeDestination
): RemoteFeaturedAdventure | null {
  const id = normalizeRequiredText(db.id);
  const slug = normalizeRequiredText(db.slug);
  const title = normalizeRequiredText(db.title_es);
  const description = normalizeRequiredText(db.summary_es);

  if (!id || !slug || !title || !description) {
    return null;
  }

  return {
    id,
    slug,
    title,
    description,
    type: normalizeRequiredText(db.type) || 'Experiencia destacada',
    estimatedVisitTime: normalizeRequiredText(db.estimated_visit_time) || undefined,
  };
}

function getHomeScreenSource(
  hasRemoteCountries: boolean,
  hasRemoteAdventures: boolean
): ResolvedHomeScreenData['metadata']['source'] {
  if (hasRemoteCountries && hasRemoteAdventures) {
    return 'remoteFeaturedCountriesAndAdventures';
  }

  if (hasRemoteCountries) {
    return 'remoteFeaturedCountries';
  }

  if (hasRemoteAdventures) {
    return 'remoteFeaturedAdventures';
  }

  return 'localFallback';
}

function inferCountryFlagCode(slug: string, emoji: string | null): string | null {
  const knownFlagCodesBySlug: Record<string, string> = {
    espana: 'ES',
    mexico: 'MX',
    italia: 'IT',
    india: 'IN',
  };

  if (knownFlagCodesBySlug[slug]) {
    return knownFlagCodesBySlug[slug];
  }

  const inferredFromEmoji = flagEmojiToIsoAlpha2(emoji);
  return inferredFromEmoji || null;
}

function flagEmojiToIsoAlpha2(emoji: string | null): string | null {
  if (!emoji) {
    return null;
  }

  const flag = Array.from(emoji.trim()).slice(0, 2);

  if (flag.length !== 2) {
    return null;
  }

  const code = flag
    .map((char) => char.codePointAt(0))
    .map((codePoint) => (codePoint ? codePoint - 0x1f1e6 + 65 : null));

  if (code.some((codePoint) => !codePoint || codePoint < 65 || codePoint > 90)) {
    return null;
  }

  return String.fromCharCode(...(code as number[]));
}

function normalizeRequiredText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

function logHomeScreenDataError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error('[HomeScreenData]', message, error);
  }
}
