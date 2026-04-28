/**
 * Utilidades de acceso a datos de destinos
 * 
 * Propósito: Proporcionar funciones de consulta sobre el diccionario de destinos
 * Alcance: Búsqueda, filtrado y obtención de contenido por modo
 * 
 * Decisiones técnicas:
 * - Funciones puras que operan sobre el diccionario estático
 * - getDestinationContentByMode maneja fallback de contenido
 * - Preparado para migrar a base de datos (misma interfaz)
 * 
 * Limitaciones actuales:
 * - Sin caché (datos estáticos pequeños)
 * - Sin búsqueda full-text
 */

import type { Destination } from '../types/destination.types';
import { 
  allDestinations, 
  publishedDestinations, 
  featuredDestinations 
} from './destinations';
import { getLocalizedText } from '../../../app/i18n';

/**
 * Obtiene un destino por su slug único.
 * 
 * @param slug - Slug del destino (ej: 'museo-del-prado')
 * @returns Destination o undefined si no existe
 */
export function getDestinationBySlug(slug: string): Destination | undefined {
  return allDestinations.find(d => d.slug === slug);
}

/**
 * Obtiene todos los destinos de un país específico.
 * 
 * @param countrySlug - Slug del país
 * @returns Array de destinos del país
 */
export function getDestinationsByCountrySlug(countrySlug: string): Destination[] {
  return allDestinations.filter(d => d.countrySlug === countrySlug);
}

/**
 * Obtiene los destinos publicados de un país.
 * 
 * @param countrySlug - Slug del país
 * @returns Array de destinos publicados
 */
export function getPublishedDestinationsByCountry(countrySlug: string): Destination[] {
  return publishedDestinations.filter(d => d.countrySlug === countrySlug);
}

/**
 * Obtiene todos los destinos de una ciudad específica.
 * 
 * @param countrySlug - Slug del país
 * @param citySlug - Slug de la ciudad
 * @returns Array de destinos de la ciudad
 */
export function getDestinationsByCitySlug(
  countrySlug: string, 
  citySlug: string
): Destination[] {
  return allDestinations.filter(
    d => d.countrySlug === countrySlug && d.citySlug === citySlug
  );
}

/**
 * Obtiene los destinos publicados de una ciudad.
 * 
 * @param countrySlug - Slug del país
 * @param citySlug - Slug de la ciudad
 * @returns Array de destinos publicados de la ciudad
 */
export function getPublishedDestinationsByCity(
  countrySlug: string,
  citySlug: string
): Destination[] {
  return publishedDestinations.filter(
    d => d.countrySlug === countrySlug && d.citySlug === citySlug
  );
}

/**
 * Obtiene todos los destinos publicados.
 * 
 * @returns Array de destinos publicados
 */
export function getPublishedDestinations(): Destination[] {
  return publishedDestinations;
}

/**
 * Obtiene los destinos destacados (publicados).
 * 
 * @returns Array de destinos destacados
 */
export function getFeaturedDestinations(): Destination[] {
  return featuredDestinations;
}

/**
 * Obtiene los destinos destacados de un país.
 * 
 * @param countrySlug - Slug del país
 * @returns Array de destinos destacados del país
 */
export function getFeaturedDestinationsByCountry(countrySlug: string): Destination[] {
  return featuredDestinations.filter(d => d.countrySlug === countrySlug);
}

/**
 * Obtiene los destinos destacados de una ciudad.
 * 
 * @param countrySlug - Slug del país
 * @param citySlug - Slug de la ciudad
 * @returns Array de destinos destacados
 */
export function getFeaturedDestinationsByCity(
  countrySlug: string,
  citySlug: string
): Destination[] {
  return featuredDestinations.filter(
    d => d.countrySlug === countrySlug && d.citySlug === citySlug
  );
}

/**
 * Obtiene el contenido de un destino según el modo de experiencia.
 * Fallback inteligente: modo solicitado → aventura → student → cualquiera disponible
 * 
 * @param destination - Objeto Destination
 * @param mode - Modo de experiencia ('adventure' | 'student')
 * @returns Contenido localizado o string vacío
 */
export function getDestinationContentByMode(
  destination: Destination,
  mode: 'adventure' | 'student' = 'adventure'
): string {
  if (!destination.contentByMode) {
    return destination.summary 
      ? getLocalizedText(destination.summary, 'es') 
      : '';
  }

  const content = destination.contentByMode;

  // Intentar el modo solicitado
  if (content[mode]) {
    return getLocalizedText(content[mode], 'es');
  }

  // Fallback al otro modo
  const otherMode = mode === 'adventure' ? 'student' : 'adventure';
  if (content[otherMode]) {
    return getLocalizedText(content[otherMode], 'es');
  }

  // Fallback al summary
  return destination.summary 
    ? getLocalizedText(destination.summary, 'es') 
    : '';
}

/**
 * Verifica si un destino es navegable (publicado y clickable).
 * 
 * @param destination - Objeto Destination o undefined
 * @returns true si se puede navegar al destino
 */
export function isDestinationClickable(destination: Destination | undefined): boolean {
  return destination?.status === 'published';
}

/**
 * Verifica si un destino está disponible para mostrar.
 * Incluye publicados y próximamente.
 * 
 * @param destination - Objeto Destination o undefined
 * @returns true si está disponible
 */
export function isDestinationAvailable(destination: Destination | undefined): boolean {
  if (!destination) return false;
  return destination.status === 'published' || destination.status === 'comingSoon';
}

/**
 * Obtiene el título localizado de un destino.
 * 
 * @param destination - Objeto Destination
 * @param locale - Código de idioma (default: 'es')
 * @returns Título del destino
 */
export function getDestinationTitle(
  destination: Destination, 
  locale: string = 'es'
): string {
  return getLocalizedText(destination.title, locale as never) || destination.id;
}

/**
 * Obtiene el resumen localizado de un destino.
 * 
 * @param destination - Objeto Destination
 * @param locale - Código de idioma (default: 'es')
 * @returns Resumen o string vacío
 */
export function getDestinationSummary(
  destination: Destination,
  locale: string = 'es'
): string {
  return destination.summary 
    ? getLocalizedText(destination.summary, locale as never)
    : '';
}

/**
 * Obtiene conteos de destinos por estado.
 * 
 * @returns Objeto con conteos
 */
export function getDestinationCounts(): {
  total: number;
  published: number;
  draft: number;
  comingSoon: number;
  disabled: number;
} {
  return {
    total: allDestinations.length,
    published: publishedDestinations.length,
    draft: allDestinations.filter(d => d.status === 'draft').length,
    comingSoon: allDestinations.filter(d => d.status === 'comingSoon').length,
    disabled: allDestinations.filter(d => d.status === 'disabled').length,
  };
}

/**
 * Obtiene conteos de destinos por estado para una ciudad.
 * 
 * @param countrySlug - Slug del país
 * @param citySlug - Slug de la ciudad
 * @returns Objeto con conteos
 */
export function getDestinationCountsByCity(
  countrySlug: string,
  citySlug: string
): {
  total: number;
  published: number;
  draft: number;
  comingSoon: number;
  disabled: number;
} {
  const cityDestinations = getDestinationsByCitySlug(countrySlug, citySlug);
  return {
    total: cityDestinations.length,
    published: cityDestinations.filter(d => d.status === 'published').length,
    draft: cityDestinations.filter(d => d.status === 'draft').length,
    comingSoon: cityDestinations.filter(d => d.status === 'comingSoon').length,
    disabled: cityDestinations.filter(d => d.status === 'disabled').length,
  };
}