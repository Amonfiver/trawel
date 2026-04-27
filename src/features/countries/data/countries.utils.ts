/**
 * Utilidades de acceso a datos de países
 * 
 * Propósito: Funciones helper para consultar el diccionario de países
 * Alcance: Búsquedas por diferentes criterios y filtros de estado
 * 
 * Decisiones técnicas:
 * - Todas las funciones son puras y no mutan datos
 * - Uso de Object.values para convertir diccionario a array
 * - Comparaciones de strings en minúsculas para slugs
 * 
 * Limitaciones actuales:
 * - Sin caching (cada llamada recorre el diccionario)
 * - Sin búsqueda fuzzy o por coincidencia parcial
 */

import { countries } from './countries';
import type { Country, CountryStatus } from './countries.types';

/**
 * Obtiene un país por su slug (URL-friendly)
 * @param slug - Slug del país (ej: 'espana', 'japon')
 * @returns Country | undefined
 */
export function getCountryBySlug(slug: string): Country | undefined {
  return Object.values(countries).find(
    (country) => country.slug.toLowerCase() === slug.toLowerCase()
  );
}

/**
 * Obtiene un país por su código ISO Alpha-2
 * @param isoAlpha2 - Código ISO de 2 letras (ej: 'ES', 'JP')
 * @returns Country | undefined
 */
export function getCountryByIsoAlpha2(isoAlpha2: string): Country | undefined {
  return countries[isoAlpha2.toUpperCase()];
}

/**
 * Obtiene un país por su código UN M.49
 * @param unM49 - Código numérico UN (ej: '724', '392')
 * @returns Country | undefined
 */
export function getCountryByUnM49(unM49: string): Country | undefined {
  return Object.values(countries).find((country) => country.unM49 === unM49);
}

/**
 * Obtiene todos los países activos (navegables)
 * @returns Array de países con status 'active'
 */
export function getActiveCountries(): Country[] {
  return Object.values(countries).filter((country) => country.status === 'active');
}

/**
 * Obtiene todos los países "Próximamente"
 * @returns Array de países con status 'comingSoon'
 */
export function getComingSoonCountries(): Country[] {
  return Object.values(countries).filter((country) => country.status === 'comingSoon');
}

/**
 * Obtiene países destacados
 * @returns Array de países con featured = true
 */
export function getFeaturedCountries(): Country[] {
  return Object.values(countries).filter((country) => country.featured);
}

/**
 * Obtiene países por continente
 * @param continent - Nombre del continente
 * @returns Array de países del continente especificado
 */
export function getCountriesByContinent(continent: string): Country[] {
  return Object.values(countries).filter(
    (country) => country.continent.toLowerCase() === continent.toLowerCase()
  );
}

/**
 * Verifica si un país es clickeable/navegable
 * Un país es clickeable solo si su status es 'active'
 * @param country - País a verificar
 * @returns boolean
 */
export function isCountryClickable(country: Country): boolean {
  return country.status === 'active';
}

/**
 * Verifica si un país está disponible (activo o próximamente)
 * @param country - País a verificar
 * @returns boolean
 */
export function isCountryAvailable(country: Country): boolean {
  return country.status === 'active' || country.status === 'comingSoon';
}

/**
 * Obtiene el color del estado para UI
 * @param status - Estado del país
 * @returns string con clase CSS o identificador de color
 */
export function getStatusLabel(status: CountryStatus): string {
  const labels: Record<CountryStatus, string> = {
    active: 'Disponible',
    comingSoon: 'Próximamente',
    disabled: 'No disponible',
  };
  return labels[status];
}

/**
 * Obtiene todos los países como array
 * @returns Array con todos los países
 */
export function getAllCountries(): Country[] {
  return Object.values(countries);
}

/**
 * Cuenta países por estado
 * @returns Objeto con conteos por estado
 */
export function getCountryCounts(): {
  total: number;
  active: number;
  comingSoon: number;
  disabled: number;
} {
  const all = getAllCountries();
  return {
    total: all.length,
    active: all.filter((c) => c.status === 'active').length,
    comingSoon: all.filter((c) => c.status === 'comingSoon').length,
    disabled: all.filter((c) => c.status === 'disabled').length,
  };
}