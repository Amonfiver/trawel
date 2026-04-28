/**
 * Utilidades de acceso a datos de ciudades
 * 
 * Propósito: Proporcionar funciones de consulta sobre el diccionario de ciudades
 * Alcance: Búsqueda, filtrado y validación de ciudades
 * 
 * Decisiones técnicas:
 * - Funciones puras que operan sobre el diccionario estático
 * - Preparado para migrar a base de datos (misma interfaz)
 * - Manejo seguro de casos no encontrados (retorna undefined)
 * 
 * Limitaciones actuales:
 * - Sin caché (datos estáticos pequeños, no necesario)
 * - Sin búsqueda fuzzy o full-text
 * - Sin paginación
 */

import type { City } from '../types/city.types';
import { allCities, activeCities, featuredCities } from './cities';
import { getLocalizedText } from '../../../app/i18n';

/**
 * Obtiene todas las ciudades de un país específico.
 * 
 * @param countrySlug - Slug del país (ej: 'espana', 'japon')
 * @returns Array de ciudades del país
 * 
 * @example
 * getCitiesByCountrySlug('espana') // [Madrid, Barcelona, Castellón]
 */
export function getCitiesByCountrySlug(countrySlug: string): City[] {
  return allCities.filter(city => city.countrySlug === countrySlug);
}

/**
 * Obtiene una ciudad específica por su slug y el del país.
 * 
 * @param countrySlug - Slug del país
 * @param citySlug - Slug de la ciudad
 * @returns City o undefined si no existe
 * 
 * @example
 * getCityBySlug('espana', 'madrid') // City de Madrid
 */
export function getCityBySlug(countrySlug: string, citySlug: string): City | undefined {
  return allCities.find(
    city => city.countrySlug === countrySlug && city.slug === citySlug
  );
}

/**
 * Obtiene las ciudades activas (navegables) de un país.
 * 
 * @param countrySlug - Slug del país
 * @returns Array de ciudades activas
 */
export function getActiveCitiesByCountrySlug(countrySlug: string): City[] {
  return activeCities.filter(city => city.countrySlug === countrySlug);
}

/**
 * Obtiene todas las ciudades destacadas (activas).
 * 
 * @returns Array de ciudades destacadas
 */
export function getFeaturedCities(): City[] {
  return featuredCities;
}

/**
 * Obtiene ciudades destacadas de un país específico.
 * 
 * @param countrySlug - Slug del país
 * @returns Array de ciudades destacadas del país
 */
export function getFeaturedCitiesByCountrySlug(countrySlug: string): City[] {
  return featuredCities.filter(city => city.countrySlug === countrySlug);
}

/**
 * Verifica si una ciudad es navegable (clickable).
 * Una ciudad es clickable si está activa.
 * 
 * @param city - Objeto City o undefined
 * @returns true si la ciudad se puede navegar
 */
export function isCityClickable(city: City | undefined): boolean {
  return city?.status === 'active';
}

/**
 * Verifica si una ciudad está disponible (visible).
 * Incluye activas y próximamente.
 * 
 * @param city - Objeto City o undefined
 * @returns true si la ciudad está disponible
 */
export function isCityAvailable(city: City | undefined): boolean {
  if (!city) return false;
  return city.status === 'active' || city.status === 'comingSoon';
}

/**
 * Obtiene el nombre localizado de una ciudad.
 * Fallback a español si no hay traducción.
 * 
 * @param city - Objeto City
 * @param locale - Código de idioma (default: 'es')
 * @returns Nombre de la ciudad en el idioma solicitado
 */
export function getCityDisplayName(city: City, locale: string = 'es'): string {
  return getLocalizedText(city.name, locale as never) || city.id;
}

/**
 * Obtiene la descripción corta localizada de una ciudad.
 * 
 * @param city - Objeto City
 * @param locale - Código de idioma (default: 'es')
 * @returns Descripción o string vacío
 */
export function getCityShortDescription(city: City, locale: string = 'es'): string {
  return city.shortDescription 
    ? getLocalizedText(city.shortDescription, locale as never) 
    : '';
}

/**
 * Obtiene conteos de ciudades por estado.
 * 
 * @returns Objeto con conteos { total, active, comingSoon, disabled }
 */
export function getCityCounts(): { 
  total: number; 
  active: number; 
  comingSoon: number; 
  disabled: number;
} {
  return {
    total: allCities.length,
    active: activeCities.length,
    comingSoon: allCities.filter(c => c.status === 'comingSoon').length,
    disabled: allCities.filter(c => c.status === 'disabled').length,
  };
}

/**
 * Obtiene conteos de ciudades por estado para un país específico.
 * 
 * @param countrySlug - Slug del país
 * @returns Objeto con conteos
 */
export function getCityCountsByCountry(countrySlug: string): {
  total: number;
  active: number;
  comingSoon: number;
  disabled: number;
} {
  const countryCities = getCitiesByCountrySlug(countrySlug);
  return {
    total: countryCities.length,
    active: countryCities.filter(c => c.status === 'active').length,
    comingSoon: countryCities.filter(c => c.status === 'comingSoon').length,
    disabled: countryCities.filter(c => c.status === 'disabled').length,
  };
}