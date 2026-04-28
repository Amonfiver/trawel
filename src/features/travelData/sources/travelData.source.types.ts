/**
 * Contrato de fuente de datos para TravelData
 * 
 * Propósito: Definir la interfaz que cualquier fuente de datos debe implementar
 * para ser usada por travelData.service.ts
 * 
 * Alcance: Contrato abstracto independiente de la implementación (mock, Supabase, API)
 * 
 * Decisiones técnicas:
 * - Interfaz síncrona por ahora (preparada para async en el futuro)
 * - Tipos de retorno estables para no romper páginas
 * - Funciones específicas para cada página/screen
 * 
 * Limitaciones / estado temporal:
 * - Actualmente solo existe implementación mock
 * - En el futuro se añadirá implementación Supabase/API
 * 
 * Cambios recientes (2026-04-28):
 * - Creado contrato para separar fuente de datos del servicio público
 * - Preparado para sustitución de mock por base de datos real
 */

import type { Country } from '../../countries/data/countries.types';
import type { City } from '../../cities/types/city.types';
import type { Destination } from '../../destinations/types/destination.types';

/**
 * Contrato que debe implementar cualquier fuente de datos de Trawel
 * 
 * Implementaciones:
 * - MockTravelDataSource: Datos locales estáticos (actual)
 * - SupabaseTravelDataSource: Base de datos Supabase (futuro)
 * - ApiTravelDataSource: API REST externa (futuro)
 */
export interface TravelDataSource {
  // === Countries ===
  getAllCountries(): Country[];
  getActiveCountries(): Country[];
  getComingSoonCountries(): Country[];
  getCountryBySlug(slug: string): Country | undefined;
  
  // === Cities ===
  getCitiesByCountrySlug(countrySlug: string): City[];
  getCityBySlug(countrySlug: string, citySlug: string): City | undefined;
  
  // === Destinations ===
  getDestinationBySlug(slug: string): Destination | undefined;
  getDestinationsByCitySlug(countrySlug: string, citySlug: string): Destination[];
  
  // === Statistics / Counts ===
  getCountryCounts(): {
    total: number;
    active: number;
    comingSoon: number;
  };
}

/**
 * TODO: Implementación futura con Supabase
 * 
 * Cuando se migre a Supabase:
 * 
 * 1. Crear SupabaseTravelDataSource implementando TravelDataSource
 * 2. Convertir funciones a async
 * 3. Usar cliente Supabase para queries
 * 4. Cambiar travelData.service.ts para usar la nueva fuente
 * 
 * Ejemplo:
 * ```typescript
 * export class SupabaseTravelDataSource implements TravelDataSource {
 *   async getAllCountries(): Promise<Country[]> {
 *     const { data, error } = await supabase.from('countries').select('*');
 *     if (error) throw error;
 *     return data;
 *   }
 *   // ... resto de funciones
 * }
 * ```
 */