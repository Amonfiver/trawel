/**
 * Implementación Supabase de fuente de datos para TravelData
 * 
 * Propósito: Proveer datos desde base de datos Supabase
 * 
 * Alcance: Implementación de TravelDataSource usando cliente Supabase
 * 
 * Decisiones técnicas:
 * - Implementación síncrona con cache en memoria (compatibilidad con interfaz actual)
 * - Mapeo de campos _es a LocalizedText
 * - Lazy loading: carga datos solo cuando se necesitan
 * - Fallback a mock si Supabase no está configurado
 * 
 * Limitaciones / estado temporal:
 * - Cache en memoria, no se actualiza automáticamente
 * - Para datos siempre frescos, se necesitaría conversión a async
 * 
 * Cambios recientes (2026-04-29):
 * - Creada implementación Supabase
 * - Mapeo de schema SQL a tipos de aplicación
 */

import type { TravelDataSource } from './travelData.source.types';
import type { Country } from '../../countries/data/countries.types';
import type { City, Coordinates } from '../../cities/types/city.types';
import type { Destination, Source } from '../../destinations/types/destination.types';
import type { LocalizedText } from '../../../app/i18n';
import { supabase, isSupabaseConfigured } from '../../../lib/supabaseClient';

// ============================================
// TIPOS DE BASE DE DATOS (raw)
// ============================================

/** Country como viene de Supabase */
interface DBCountry {
  id: string;
  slug: string;
  name_es: string;
  emoji?: string;
  capital_es?: string;
  continent_es?: string;
  description_es?: string;
  status: 'active' | 'comingSoon' | 'disabled';
  featured: boolean;
  created_at: string;
  updated_at: string;
}

/** City como viene de Supabase */
interface DBCity {
  id: string;
  country_id: string;
  slug: string;
  name_es: string;
  short_description_es?: string;
  adventure_content_es?: string;
  student_content_es?: string;
  lat?: number;
  lng?: number;
  recommended_duration?: string;
  best_season_es?: string;
  sleeping_advice_es?: string;
  food_advice_es?: string;
  pending_verification: string[];
  status: 'active' | 'comingSoon' | 'disabled';
  featured: boolean;
  created_at: string;
  updated_at: string;
}

/** Destination como viene de Supabase */
interface DBDestination {
  id: string;
  country_id: string;
  city_id: string;
  slug: string;
  title_es: string;
  summary_es?: string;
  adventure_content_es?: string;
  student_content_es?: string;
  type?: string;
  tags: string[];
  estimated_visit_time?: string;
  price?: string;
  opening_hours?: string;
  practical_tip_es?: string;
  verification_status: string;
  status: 'draft' | 'published' | 'comingSoon' | 'disabled';
  featured: boolean;
  pending_verification: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// MAPEADORES
// ============================================

/** Convierte texto simple a LocalizedText */
function toLocalizedText(text: string | undefined): LocalizedText | undefined {
  if (!text) return undefined;
  return { es: text };
}

/** Mapea DBCountry a Country */
function mapDBCountryToCountry(db: DBCountry): Country {
  // Mapear continent a tipo válido o default
  const continentMap: Record<string, Country['continent']> = {
    'africa': 'africa',
    'america': 'america',
    'asia': 'asia',
    'europe': 'europe',
    'oceania': 'oceania',
    'áfrica': 'africa',
    'américa': 'america',
    'europa': 'europe',
    'oceanía': 'oceania',
  };
  
  return {
    id: db.slug, // Usamos slug como id para consistencia con mock
    isoAlpha2: db.slug.slice(0, 2).toUpperCase(), // Fallback: usar primeros 2 chars del slug
    isoAlpha3: db.slug.slice(0, 3).toUpperCase(), // Fallback: usar primeros 3 chars del slug
    unM49: '000', // No disponible en schema actual
    slug: db.slug,
    name: db.name_es,
    displayName: `${db.emoji ? db.emoji + ' ' : ''}${db.name_es}`,
    capital: db.capital_es,
    continent: continentMap[db.continent_es?.toLowerCase() || ''] || 'europe',
    status: db.status,
    featured: db.featured,
  };
}

/** Mapea DBCity a City */
function mapDBCityToCity(db: DBCity, countrySlug: string): City {
  const coordinates: Coordinates | undefined = 
    db.lat !== undefined && db.lng !== undefined
      ? { lat: Number(db.lat), lng: Number(db.lng) }
      : undefined;

  return {
    id: db.slug,
    slug: db.slug,
    countrySlug,
    name: { es: db.name_es },
    shortDescription: toLocalizedText(db.short_description_es),
    contentByMode: db.adventure_content_es || db.student_content_es
      ? {
          adventure: toLocalizedText(db.adventure_content_es),
          student: toLocalizedText(db.student_content_es),
        }
      : undefined,
    status: db.status,
    featured: db.featured,
    coordinates,
  };
}

/** Mapea DBDestination a Destination */
function mapDBDestinationToDestination(
  db: DBDestination,
  countrySlug: string,
  citySlug: string
): Destination {
  const sources: Source[] | undefined = undefined; // TODO: Cargar desde destination_sources si es necesario

  return {
    id: db.slug,
    slug: db.slug,
    countrySlug,
    citySlug,
    title: { es: db.title_es },
    summary: toLocalizedText(db.summary_es),
    contentByMode: db.adventure_content_es || db.student_content_es
      ? {
          adventure: toLocalizedText(db.adventure_content_es),
          student: toLocalizedText(db.student_content_es),
        }
      : undefined,
    status: db.status,
    featured: db.featured,
    type: db.type as Destination['type'],
    tags: db.tags.length > 0 ? db.tags : undefined,
    estimatedVisitTime: db.estimated_visit_time,
    price: toLocalizedText(db.price),
    openingHours: toLocalizedText(db.opening_hours),
    sources,
  };
}

// ============================================
// CACHE
// ============================================

interface Cache {
  countries: Map<string, Country>; // slug -> Country
  countriesById: Map<string, string>; // id -> slug
  cities: Map<string, City>; // `${countrySlug}:${citySlug}` -> City
  citiesByCountry: Map<string, City[]>; // countrySlug -> City[]
  destinations: Map<string, Destination>; // slug -> Destination
  destinationsByCity: Map<string, Destination[]>; // `${countrySlug}:${citySlug}` -> Destination[]
  loaded: boolean;
}

const cache: Cache = {
  countries: new Map(),
  countriesById: new Map(),
  cities: new Map(),
  citiesByCountry: new Map(),
  destinations: new Map(),
  destinationsByCity: new Map(),
  loaded: false,
};

// ============================================
// CARGA DE DATOS
// ============================================

async function loadAllData(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  // Limpiar cache
  cache.countries.clear();
  cache.countriesById.clear();
  cache.cities.clear();
  cache.citiesByCountry.clear();
  cache.destinations.clear();
  cache.destinationsByCity.clear();

  // Cargar countries
  const { data: dbCountries, error: countriesError } = await supabase
    .from('countries')
    .select('*');

  if (countriesError) {
    throw new Error(`Error cargando countries: ${countriesError.message}`);
  }

  // Indexar countries
  for (const dbCountry of (dbCountries as DBCountry[] || [])) {
    const country = mapDBCountryToCountry(dbCountry);
    cache.countries.set(country.slug, country);
    cache.countriesById.set(dbCountry.id, country.slug);
  }

  // Cargar cities
  const { data: dbCities, error: citiesError } = await supabase
    .from('cities')
    .select('*');

  if (citiesError) {
    throw new Error(`Error cargando cities: ${citiesError.message}`);
  }

  // Indexar cities
  for (const dbCity of (dbCities as DBCity[] || [])) {
    const countrySlug = cache.countriesById.get(dbCity.country_id);
    if (!countrySlug) continue; // Skip si no encontramos el país

    const city = mapDBCityToCity(dbCity, countrySlug);
    const key = `${countrySlug}:${city.slug}`;
    cache.cities.set(key, city);

    // Agregar a lista por país
    const countryCities = cache.citiesByCountry.get(countrySlug) || [];
    countryCities.push(city);
    cache.citiesByCountry.set(countrySlug, countryCities);
  }

  // Cargar destinations
  const { data: dbDestinations, error: destinationsError } = await supabase
    .from('destinations')
    .select('*');

  if (destinationsError) {
    throw new Error(`Error cargando destinations: ${destinationsError.message}`);
  }

  // Indexar destinations
  for (const dbDest of (dbDestinations as DBDestination[] || [])) {
    const countrySlug = cache.countriesById.get(dbDest.country_id);
    
    if (!countrySlug) continue; // Skip si no encontramos el país

    // Encontrar citySlug
    const citySlug = Array.from(cache.cities.values()).find(
      c => c.id === cache.countriesById.get(dbDest.city_id)
    )?.slug;

    if (!citySlug) continue; // Skip si no encontramos la ciudad

    const destination = mapDBDestinationToDestination(dbDest, countrySlug, citySlug);
    cache.destinations.set(destination.slug, destination);

    // Agregar a lista por ciudad
    const cityDestKey = `${countrySlug}:${citySlug}`;
    const cityDestinations = cache.destinationsByCity.get(cityDestKey) || [];
    cityDestinations.push(destination);
    cache.destinationsByCity.set(cityDestKey, cityDestinations);
  }

  cache.loaded = true;
}

// Asegurar que los datos están cargados
function ensureLoaded(): void {
  if (!cache.loaded) {
    throw new Error(
      'SupabaseTravelDataSource no está inicializado. ' +
      'Llama a initialize() antes de usar.'
    );
  }
}

// ============================================
// IMPLEMENTACIÓN
// ============================================

export const supabaseTravelDataSource: TravelDataSource & { 
  initialize(): Promise<void>;
  isInitialized(): boolean;
} = {
  // === Inicialización ===
  
  async initialize(): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase no está configurado. ' +
        'Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
      );
    }
    await loadAllData();
  },

  isInitialized(): boolean {
    return cache.loaded;
  },

  // === Countries ===
  
  getAllCountries(): Country[] {
    ensureLoaded();
    return Array.from(cache.countries.values());
  },

  getActiveCountries(): Country[] {
    ensureLoaded();
    return Array.from(cache.countries.values()).filter(c => c.status === 'active');
  },

  getComingSoonCountries(): Country[] {
    ensureLoaded();
    return Array.from(cache.countries.values()).filter(c => c.status === 'comingSoon');
  },

  getCountryBySlug(slug: string): Country | undefined {
    ensureLoaded();
    return cache.countries.get(slug);
  },

  // === Cities ===
  
  getCitiesByCountrySlug(countrySlug: string): City[] {
    ensureLoaded();
    return cache.citiesByCountry.get(countrySlug) || [];
  },

  getCityBySlug(countrySlug: string, citySlug: string): City | undefined {
    ensureLoaded();
    return cache.cities.get(`${countrySlug}:${citySlug}`);
  },

  // === Destinations ===
  
  getDestinationBySlug(slug: string): Destination | undefined {
    ensureLoaded();
    return cache.destinations.get(slug);
  },

  getDestinationsByCitySlug(countrySlug: string, citySlug: string): Destination[] {
    ensureLoaded();
    return cache.destinationsByCity.get(`${countrySlug}:${citySlug}`) || [];
  },

  // === Statistics / Counts ===
  
  getCountryCounts(): { total: number; active: number; comingSoon: number } {
    ensureLoaded();
    const countries = Array.from(cache.countries.values());
    return {
      total: countries.length,
      active: countries.filter(c => c.status === 'active').length,
      comingSoon: countries.filter(c => c.status === 'comingSoon').length,
    };
  },
};

// ============================================
// FACTORY
// ============================================

/**
 * Crea una instancia de SupabaseTravelDataSource inicializada
 * 
 * Uso:
 *   const source = await createSupabaseTravelDataSource();
 *   const countries = source.getAllCountries();
 */
export async function createSupabaseTravelDataSource(): Promise<TravelDataSource> {
  await supabaseTravelDataSource.initialize();
  return supabaseTravelDataSource;
}