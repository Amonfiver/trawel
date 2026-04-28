/**
 * Servicio de acceso a datos de viaje
 * 
 * Propósito: Proveer una capa de abstracción entre la UI y el origen de datos.
 * Las páginas consumen este servicio en lugar de acceder directamente a los
 * diccionarios de countries/cities/destinations.
 * 
 * Alcance: Funciones síncronas que agregan datos de múltiples features
 * para consumo de páginas.
 * 
 * Decisiones técnicas:
 * - Usa TravelDataSource como contrato abstracto de fuente de datos
 * - Actualmente usa mockTravelDataSource (datos locales)
 * - En el futuro se sustituirá por SupabaseTravelDataSource
 * - Las páginas no conocen la implementación de la fuente
 * 
 * Arquitectura de sources:
 * - travelData.source.types.ts: Contrato TravelDataSource
 * - mockTravelData.source.ts: Implementación mock actual
 * - (futuro) supabaseTravelData.source.ts: Implementación Supabase
 * 
 * NOTA SOBRE FUTURA PERSISTENCIA:
 * 
 * Este servicio está diseñado para facilitar la migración a una base de datos
 * externa (Supabase, API REST, etc.) sin modificar las páginas.
 * 
 * Cuando se implemente persistencia externa:
 * 1. Cambiar travelDataSource en mockTravelData.source.ts
 * 2. Convertir funciones a async si es necesario
 * 3. Agregar manejo de errores con TravelDataResult<T>
 * 4. Implementar caché con React Query/SWR
 * 
 * Las páginas solo necesitarán agregar await y manejo de loading.
 * 
 * Limitaciones actuales:
 * - Datos síncronos y estáticos (fuente mock)
 * - Sin manejo de errores estructurado (usa null para "no encontrado")
 * - Sin caché ni deduplicación de peticiones
 * - Sin soporte para filtros avanzados ni paginación
 */

import { travelDataSource } from '../sources/mockTravelData.source';
import type { City, CityStatus } from '../../cities/types/city.types';
import type { Destination, DestinationStatus } from '../../destinations/types/destination.types';
import type {
  HomePageData,
  CountryPageData,
  CityPageData,
  AdventurePageData,
} from '../types/travelData.types';

/**
 * Cambios recientes (2026-04-28):
 * - Refactorizado para usar TravelDataSource
 * - Separada la fuente de datos (mockTravelDataSource) del servicio
 * - Preparado para sustituir mock por Supabase sin cambiar estas funciones
 */
export function getHomePageData(): HomePageData {
  const countries = travelDataSource.getAllCountries();
  const activeCountries = travelDataSource.getActiveCountries();
  const comingSoonCountries = travelDataSource.getComingSoonCountries();
  const counts = travelDataSource.getCountryCounts();

  return {
    countries,
    activeCountries,
    comingSoonCountries,
    counts: {
      active: counts.active,
      comingSoon: counts.comingSoon,
      total: counts.total,
    },
    // featuredCities y featuredDestinations se pueden agregar en el futuro
    // cuando se implemente lógica de "destacados"
  };
}

/**
 * Obtiene datos agregados para CountryPage
 * 
 * @param countrySlug - Slug del país (ej: 'espana', 'japon')
 * @returns CountryPageData con país, ciudades y conteos
 */
export function getCountryPageData(countrySlug: string): CountryPageData {
  const country = travelDataSource.getCountryBySlug(countrySlug) ?? null;
  
  // Si el país no existe, retornar estructura vacía
  if (!country) {
    return {
      country: null,
      cities: [],
      activeCities: [],
      comingSoonCities: [],
      totalCitiesCount: 0,
      publishedDestinationsCount: 0,
      comingSoonDestinationsCount: 0,
      featuredDestinations: [],
    };
  }

  const cities = travelDataSource.getCitiesByCountrySlug(countrySlug);
  const activeCities = cities.filter((city: City): city is City => 
    city.status === 'active' as CityStatus
  );
  const comingSoonCities = cities.filter((city: City): city is City => 
    city.status === 'comingSoon' as CityStatus
  );

  // Obtener todos los destinos del país
  const allDestinations: Destination[] = [];
  cities.forEach((city: City) => {
    const cityDestinations = travelDataSource.getDestinationsByCitySlug(countrySlug, city.slug);
    allDestinations.push(...cityDestinations);
  });

  // Calcular conteos de destinos
  const publishedDestinations = allDestinations.filter((dest: Destination): dest is Destination => 
    dest.status === 'published' as DestinationStatus
  );
  const comingSoonDestinations = allDestinations.filter((dest: Destination): dest is Destination => 
    dest.status === 'comingSoon' as DestinationStatus
  );
  const featuredDestinations = publishedDestinations.filter((dest: Destination) => dest.featured);

  return {
    country,
    cities,
    activeCities,
    comingSoonCities,
    totalCitiesCount: cities.length,
    publishedDestinationsCount: publishedDestinations.length,
    comingSoonDestinationsCount: comingSoonDestinations.length,
    featuredDestinations,
  };
}

/**
 * Obtiene datos agregados para CityPage
 * 
 * @param countrySlug - Slug del país (ej: 'espana')
 * @param citySlug - Slug de la ciudad (ej: 'madrid')
 * @returns CityPageData con país, ciudad y destinos
 */
export function getCityPageData(countrySlug: string, citySlug: string): CityPageData {
  const country = travelDataSource.getCountryBySlug(countrySlug) ?? null;
  const city = travelDataSource.getCityBySlug(countrySlug, citySlug) ?? null;
  
  // Si la ciudad no existe, retornar estructura vacía
  if (!city) {
    return {
      country,
      city: null,
      destinations: [],
      publishedDestinations: [],
      comingSoonDestinations: [],
    };
  }

  const destinations = travelDataSource.getDestinationsByCitySlug(countrySlug, citySlug);
  const publishedDestinations = destinations.filter((dest: Destination): dest is Destination => 
    dest.status === 'published' as DestinationStatus
  );
  const comingSoonDestinations = destinations.filter((dest: Destination): dest is Destination => 
    dest.status === 'comingSoon' as DestinationStatus
  );

  return {
    country,
    city,
    destinations,
    publishedDestinations,
    comingSoonDestinations,
  };
}

/**
 * Obtiene datos agregados para AdventurePage
 * 
 * @param adventureSlug - Slug del destino/aventura (ej: 'museo-del-prado')
 * @returns AdventurePageData con destino, ciudad y país
 */
export function getAdventurePageData(adventureSlug: string): AdventurePageData {
  const destination = travelDataSource.getDestinationBySlug(adventureSlug);
  
  // Si el destino no existe, retornar estructura vacía
  if (!destination) {
    return {
      destination: null,
      city: null,
      country: null,
    };
  }

  // Obtener ciudad y país relacionados
  const city = destination.citySlug && destination.countrySlug
    ? (travelDataSource.getCityBySlug(destination.countrySlug, destination.citySlug) ?? null)
    : null;
  
  const country = destination.countrySlug
    ? (travelDataSource.getCountryBySlug(destination.countrySlug) ?? null)
    : null;

  return {
    destination,
    city,
    country,
  };
}
