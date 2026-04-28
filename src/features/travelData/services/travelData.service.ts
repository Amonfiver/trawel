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
 * - Funciones síncronas por ahora (datos locales estáticos)
 * - En el futuro este módulo será el punto de sustitución para Supabase/API
 * - Cada función devuelve datos agregados listos para consumo de páginas
 * - Sin lógica de caché ni estado (las páginas manejan su propio estado)
 * 
 * NOTA SOBRE FUTURA PERSISTENCIA:
 * 
 * Este servicio está diseñado para facilitar la migración a una base de datos
 * externa (Supabase, API REST, etc.) sin modificar las páginas.
 * 
 * Cuando se implemente persistencia externa:
 * 1. Convertir estas funciones a async
 * 2. Agregar manejo de errores con TravelDataResult<T>
 * 3. Implementar caché con React Query/SWR
 * 4. Las páginas solo necesitarán agregar await y manejo de loading
 * 
 * Ejemplo de migración futura:
 * 
 * // Antes (actual):
 * const data = getCountryPageData(countrySlug);
 * 
 * // Después (con API):
 * const { data, isLoading, error } = useCountryPageData(countrySlug);
 * 
 * Limitaciones actuales:
 * - Datos síncronos y estáticos
 * - Sin manejo de errores estructurado (usa null para "no encontrado")
 * - Sin caché ni deduplicación de peticiones
 * - Sin soporte para filtros avanzados ni paginación
 */

import {
  getActiveCountries,
  getAllCountries,
  getComingSoonCountries,
  getCountryBySlug,
  getCountryCounts,
} from '../../countries/data/countries.utils';
import {
  getCitiesByCountrySlug,
  getCityBySlug,
} from '../../cities/data/cities.utils';
import {
  getDestinationBySlug,
  getDestinationsByCitySlug,
} from '../../destinations/data/destinations.utils';
import type { City, CityStatus } from '../../cities/types/city.types';
import type { Destination, DestinationStatus } from '../../destinations/types/destination.types';
import type {
  HomePageData,
  CountryPageData,
  CityPageData,
  AdventurePageData,
} from '../types/travelData.types';

/**
 * Obtiene datos agregados para HomePage
 * 
 * Combina información de países activos, próximamente y estadísticas
 * 
 * @returns HomePageData con todos los datos necesarios para la página de inicio
 */
export function getHomePageData(): HomePageData {
  const countries = getAllCountries();
  const activeCountries = getActiveCountries();
  const comingSoonCountries = getComingSoonCountries();
  const counts = getCountryCounts();

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
  const country = getCountryBySlug(countrySlug) ?? null;
  
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

  const cities = getCitiesByCountrySlug(countrySlug);
  const activeCities = cities.filter((city): city is City => 
    city.status === 'active' as CityStatus
  );
  const comingSoonCities = cities.filter((city): city is City => 
    city.status === 'comingSoon' as CityStatus
  );

  // Obtener todos los destinos del país
  const allDestinations: Destination[] = [];
  cities.forEach(city => {
    const cityDestinations = getDestinationsByCitySlug(countrySlug, city.slug);
    allDestinations.push(...cityDestinations);
  });

  // Calcular conteos de destinos
  const publishedDestinations = allDestinations.filter((dest): dest is Destination => 
    dest.status === 'published' as DestinationStatus
  );
  const comingSoonDestinations = allDestinations.filter((dest): dest is Destination => 
    dest.status === 'comingSoon' as DestinationStatus
  );
  const featuredDestinations = publishedDestinations.filter(dest => dest.featured);

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
  const country = getCountryBySlug(countrySlug) ?? null;
  const city = getCityBySlug(countrySlug, citySlug) ?? null;
  
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

  const destinations = getDestinationsByCitySlug(countrySlug, citySlug);
  const publishedDestinations = destinations.filter((dest): dest is Destination => 
    dest.status === 'published' as DestinationStatus
  );
  const comingSoonDestinations = destinations.filter((dest): dest is Destination => 
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
  const destination = getDestinationBySlug(adventureSlug);
  
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
    ? (getCityBySlug(destination.countrySlug, destination.citySlug) ?? null)
    : null;
  
  const country = destination.countrySlug
    ? (getCountryBySlug(destination.countrySlug) ?? null)
    : null;

  return {
    destination,
    city,
    country,
  };
}