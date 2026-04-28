/**
 * Factory de fuentes de datos para TravelData
 * 
 * Propósito: Proveer la fuente de datos según configuración (mock o Supabase)
 * 
 * Alcance: Exporta la fuente de datos activa según VITE_TRAVEL_DATA_SOURCE
 * 
 * Decisiones técnicas:
 * - Lee VITE_TRAVEL_DATA_SOURCE para seleccionar fuente ('mock' | 'supabase')
 * - Mock por defecto si no está definida o tiene valor inválido
 * - Mantiene compatibilidad con código existente (sin cambios en páginas)
 * 
 * Limitaciones / estado temporal:
 * - Supabase requiere inicialización asíncrona (no compatible con interfaz síncrona)
 * - Para usar Supabase, las páginas deben adaptarse a async
 * 
 * Cambios recientes (2026-04-29):
 * - Agregado soporte para VITE_TRAVEL_DATA_SOURCE
 * - Export de supabaseTravelDataSource para inicialización manual
 * - Factory createTravelDataSource() mantiene compatibilidad
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

// Importar implementación Supabase (para export y uso manual)
import { supabaseTravelDataSource } from './supabaseTravelData.source';

/**
 * Implementación mock de TravelDataSource
 * 
 * Usa los diccionarios locales de countries, cities y destinations.
 * Es la implementación por defecto y no requiere configuración externa.
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
 * Determina qué fuente de datos usar según configuración
 * 
 * Lee VITE_TRAVEL_DATA_SOURCE:
 * - 'mock' → mockTravelDataSource (default)
 * - 'supabase' → supabaseTravelDataSource (requiere inicialización)
 * - cualquier otro → mockTravelDataSource
 */
function getConfiguredDataSource(): TravelDataSource {
  const source = import.meta.env.VITE_TRAVEL_DATA_SOURCE;
  
  if (source === 'supabase') {
    // NOTA: Supabase requiere inicialización asíncrona antes de usar
    // Las páginas deben llamar a supabaseTravelDataSource.initialize() primero
    // o usar createSupabaseTravelDataSource() para obtener instancia lista
    console.warn(
      '[TravelDataSource] Usando Supabase. ' +
      'Asegúrate de llamar supabaseTravelDataSource.initialize() antes de usar los datos.'
    );
    return supabaseTravelDataSource;
  }
  
  // Default: mock
  if (source && source !== 'mock') {
    console.warn(`[TravelDataSource] Valor desconocido "${source}", usando mock por defecto`);
  }
  
  return mockTravelDataSource;
}

/**
 * Factory para crear la fuente de datos configurada
 * 
 * @returns TravelDataSource según VITE_TRAVEL_DATA_SOURCE
 */
export function createTravelDataSource(): TravelDataSource {
  return getConfiguredDataSource();
}

/**
 * Instancia singleton de la fuente de datos
 * 
 * Usar esta instancia en travelData.service.ts
 * 
 * NOTA: Si VITE_TRAVEL_DATA_SOURCE=supabase, debes inicializar antes:
 *   await supabaseTravelDataSource.initialize();
 */
export const travelDataSource = createTravelDataSource();

// Re-exportar supabaseTravelDataSource para inicialización manual
export { supabaseTravelDataSource };
