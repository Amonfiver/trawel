/**
 * Tipos de datos agregados para páginas
 * 
 * Propósito: Definir estructuras de datos que consumen las páginas,
 * independientes del origen de datos (local, API, Supabase, etc.)
 * 
 * Alcance: Tipos agregados que combinan entidades de countries, cities, destinations
 * 
 * Decisiones técnicas:
 * - Tipos planos y serializables para facilitar futura migración a API
 * - No incluir funciones, solo datos
 * - Campos opcionales marcados explícitamente
 * 
 * Limitaciones actuales:
 * - Datos sincrónicos (futuro: async con suspense/query)
 * - Sin caché de datos (futuro: React Query/SWR)
 */

import type { Country } from '../../countries/data/countries.types';
import type { City } from '../../cities/types/city.types';
import type { Destination } from '../../destinations/types/destination.types';

/**
 * Datos agregados para HomePage
 * 
 * Incluye información de países para el mapa, estadísticas y contenido destacado
 */
export interface HomePageData {
  /** Todos los países disponibles */
  countries: Country[];
  /** Países con status 'active' (navegables) */
  activeCountries: Country[];
  /** Países con status 'comingSoon' */
  comingSoonCountries: Country[];
  /** Conteos por estado */
  counts: {
    active: number;
    comingSoon: number;
    total: number;
  };
  /** Ciudades destacadas (opcional, para futuro carrusel) */
  featuredCities?: City[];
  /** Destinos destacados (opcional, para futuro sección destacada) */
  featuredDestinations?: Destination[];
}

/**
 * Datos agregados para CountryPage
 * 
 * Incluye información del país y sus ciudades
 */
export interface CountryPageData {
  /** País solicitado o null si no existe */
  country: Country | null;
  /** Todas las ciudades del país */
  cities: City[];
  /** Ciudades con status 'active' (navegables) */
  activeCities: City[];
  /** Ciudades con status 'comingSoon' */
  comingSoonCities: City[];
  /** Número total de ciudades */
  totalCitiesCount: number;
  /** Número de destinos publicados en el país */
  publishedDestinationsCount: number;
  /** Número de destinos próximamente en el país */
  comingSoonDestinationsCount: number;
  /** Destinos destacados del país */
  featuredDestinations: Destination[];
}

/**
 * Datos agregados para CityPage
 * 
 * Incluye información de la ciudad, su país y sus destinos
 */
export interface CityPageData {
  /** País de la ciudad o null si no existe */
  country: Country | null;
  /** Ciudad solicitada o null si no existe */
  city: City | null;
  /** Todos los destinos de la ciudad */
  destinations: Destination[];
  /** Destinos con status 'published' */
  publishedDestinations: Destination[];
  /** Destinos con status 'comingSoon' */
  comingSoonDestinations: Destination[];
}

/**
 * Datos agregados para AdventurePage
 * 
 * Incluye información del destino, su ciudad y su país
 */
export interface AdventurePageData {
  /** Destino solicitado o null si no existe */
  destination: Destination | null;
  /** Ciudad del destino o null */
  city: City | null;
  /** País del destino o null */
  country: Country | null;
}

/**
 * Resultado de operación con datos de viaje
 * 
 * Patrón Result para manejar errores de forma explícita
 * sin excepciones (preparado para futuras operaciones async)
 */
export interface TravelDataResult<T> {
  /** Indica si la operación fue exitosa */
  success: boolean;
  /** Datos solicitados (solo si success es true) */
  data?: T;
  /** Mensaje de error (solo si success es false) */
  error?: string;
  /** Código de error para manejo programático */
  errorCode?: 'NOT_FOUND' | 'INVALID_PARAMS' | 'UNKNOWN';
}