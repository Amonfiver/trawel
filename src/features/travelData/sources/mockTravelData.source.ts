/**
 * Implementación mock de fuente de datos para TravelData
 * 
 * Propósito: Proveer datos desde archivos locales estáticos (mock)
 * 
 * Alcance: Implementación actual de TravelDataSource usando datos locales
 * 
 * Decisiones técnicas:
 * - Delega a las utilidades existentes de countries, cities, destinations
 * - Mantiene compatibilidad con datos actuales
 * - No realiza transformaciones, solo expone los datos
 * 
 * Limitaciones / estado temporal:
 * - Es la implementación temporal hasta migrar a Supabase
 * - Datos estáticos, no persistencia real
 * - Se sustituirá por SupabaseTravelDataSource en el futuro
 * 
 * Cambios recientes (2026-04-28):
 * - Creado para encapsular fuente mock
 * - Separado del servicio público travelData.service.ts
 */

import type { TravelDataSource } from './travelData.source.types';
import type { Country } from '../../countries/data/countries.types';
import type { City } from '../../cities/types/city.types';
import type { Destination } from '../../destinations/types/destination.types';

// Importar utilidades existentes de cada feature
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

/**
 * Implementación mock de TravelDataSource
 * 
 * Usa los diccionarios locales de countries, cities y destinations.
 * En el futuro se sustituirá por una implementación que consulte Supabase.
 */
export const mockTravelDataSource: TravelDataSource = {
  // === Countries ===
  getAllCountries(): Country[] {
    return getAllCountries();
  },

  getActiveCountries(): Country[] {
    return getActiveCountries();
  },

  getComingSoonCountries(): Country[] {
    return getComingSoonCountries();
  },

  getCountryBySlug(slug: string): Country | undefined {
    return getCountryBySlug(slug);
  },

  // === Cities ===
  getCitiesByCountrySlug(countrySlug: string): City[] {
    return getCitiesByCountrySlug(countrySlug);
  },

  getCityBySlug(countrySlug: string, citySlug: string): City | undefined {
    return getCityBySlug(countrySlug, citySlug);
  },

  // === Destinations ===
  getDestinationBySlug(slug: string): Destination | undefined {
    return getDestinationBySlug(slug);
  },

  getDestinationsByCitySlug(countrySlug: string, citySlug: string): Destination[] {
    return getDestinationsByCitySlug(countrySlug, citySlug);
  },

  // === Statistics / Counts ===
  getCountryCounts(): { total: number; active: number; comingSoon: number } {
    return getCountryCounts();
  },
};

/**
 * Factory para crear la fuente de datos
 * 
 * Actualmente siempre retorna mockTravelDataSource.
 * En el futuro, esto permitirá seleccionar la implementación
 * según configuración (mock vs Supabase vs API).
 */
export function createTravelDataSource(): TravelDataSource {
  // TODO: En el futuro, leer de configuración o variable de entorno
  // const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';
  // if (useSupabase) return new SupabaseTravelDataSource();
  
  return mockTravelDataSource;
}

/**
 * Instancia singleton de la fuente de datos
 * 
 * Usar esta instancia en travelData.service.ts
 */
export const travelDataSource = createTravelDataSource();