/**
 * Utilidades de internacionalización (i18n) de Trawel
 * 
 * Propósito: Proporcionar funciones para obtener textos localizados con fallback
 * Alcance: getLocalizedText, validación de locales, normalización
 * 
 * Decisiones técnicas:
 * - Fallback en cascada: solicitado → español → inglés → primer disponible → ''
 * - No usa librería externa (i18next, react-intl) para mantener bundle ligero
 * - Funciones puras, fáciles de testear
 * 
 * Limitaciones actuales:
 * - Solo español tiene contenido completo durante el MVP
 * - Los demás idiomas activarán fallback a español
 */

import {
  type Locale,
  type LocalizedText,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_CONFIGS,
} from './i18n.types';

/**
 * Orden de fallback para búsqueda de textos:
 * 1. Idioma solicitado
 * 2. Español (DEFAULT_LOCALE)
 * 3. Inglés (idioma internacional fallback)
 * 4. Primer texto disponible en cualquier idioma
 * 5. String vacío (último recurso)
 */
const FALLBACK_CHAIN: Locale[] = [
  DEFAULT_LOCALE, // es
  'en',           // inglés como fallback internacional
];

/**
 * Obtiene el texto localizado con fallback inteligente.
 * 
 * Estrategia de fallback:
 * 1. Devuelve el texto en el idioma solicitado si existe
 * 2. Si no, devuelve el texto en español (DEFAULT_LOCALE)
 * 3. Si no, devuelve el texto en inglés
 * 4. Si no, devuelve el primer texto disponible en cualquier idioma
 * 5. Si no hay nada, devuelve string vacío
 * 
 * @param text - Objeto con traducciones parciales
 * @param locale - Idioma deseado
 * @returns Texto en el idioma solicitado o fallback
 * 
 * @example
 * ```typescript
 * const title = { es: 'Hola', en: 'Hello' };
 * getLocalizedText(title, 'es'); // 'Hola'
 * getLocalizedText(title, 'fr'); // 'Hola' (fallback a español)
 * ```
 */
export function getLocalizedText(
  text: LocalizedText | undefined | null,
  locale: Locale = DEFAULT_LOCALE
): string {
  // Casos edge
  if (!text || typeof text !== 'object') {
    return '';
  }

  // 1. Idioma solicitado
  if (text[locale] && text[locale].trim() !== '') {
    return text[locale];
  }

  // 2-3. Fallback chain (español → inglés)
  for (const fallbackLocale of FALLBACK_CHAIN) {
    if (text[fallbackLocale] && text[fallbackLocale].trim() !== '') {
      return text[fallbackLocale];
    }
  }

  // 4. Primer texto disponible en cualquier idioma
  const firstAvailable = Object.values(text).find(
    (value): value is string => typeof value === 'string' && value.trim() !== ''
  );
  if (firstAvailable) {
    return firstAvailable;
  }

  // 5. Nada disponible
  return '';
}

/**
 * Verifica si un string es un locale soportado.
 * 
 * @param value - Valor a verificar
 * @returns true si es un locale válido
 * 
 * @example
 * ```typescript
 * isSupportedLocale('es'); // true
 * isSupportedLocale('de'); // false
 * ```
 */
export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);
}

/**
 * Normaliza un string a un locale válido.
 * 
 * - Convierte a minúsculas
 * - Extrae código de idioma si viene con región (ej: 'en-US' → 'en')
 * - Verifica si está soportado
 * - Devuelve DEFAULT_LOCALE si no es válido
 * 
 * @param value - Valor a normalizar
 * @returns Locale válido o DEFAULT_LOCALE
 * 
 * @example
 * ```typescript
 * normalizeLocale('ES');      // 'es'
 * normalizeLocale('en-US');   // 'en'
 * normalizeLocale('de');      // 'es' (default, no soportado)
 * ```
 */
export function normalizeLocale(value: unknown): Locale {
  if (typeof value !== 'string') {
    return DEFAULT_LOCALE;
  }

  // Limpiar y normalizar
  const cleaned = value.toLowerCase().trim();

  // Extraer código base si tiene región (ej: 'en-us' → 'en')
  const baseLocale = cleaned.split('-')[0] as Locale;

  // Verificar si es soportado
  if (SUPPORTED_LOCALES.includes(baseLocale)) {
    return baseLocale;
  }

  // Fallback a default
  return DEFAULT_LOCALE;
}

/**
 * Obtiene el nombre de un idioma en su propio idioma.
 * 
 * @param locale - Código de idioma
 * @returns Nombre del idioma (ej: 'Español', 'English')
 */
export function getLocaleName(locale: Locale): string {
  return LOCALE_CONFIGS[locale]?.name ?? locale;
}

/**
 * Obtiene el nombre de un idioma en español.
 * Útil para debug o interfaces de administración.
 * 
 * @param locale - Código de idioma
 * @returns Nombre en español (ej: 'Español', 'Inglés')
 */
export function getLocaleNameEs(locale: Locale): string {
  return LOCALE_CONFIGS[locale]?.nameEs ?? locale;
}

/**
 * Verifica si un idioma está listo para producción.
 * 
 * @param locale - Código de idioma
 * @returns true si tiene contenido completo
 */
export function isLocaleProductionReady(locale: Locale): boolean {
  return LOCALE_CONFIGS[locale]?.isProductionReady ?? false;
}

/**
 * Obtiene la lista de idiomas disponibles para producción.
 * 
 * @returns Array de locales listos para producción
 */
export function getProductionReadyLocales(): Locale[] {
  return SUPPORTED_LOCALES.filter(isLocaleProductionReady);
}

/**
 * Crea un objeto LocalizedText a partir de un texto en español.
 * Utilidad para crear contenido inicial que luego se traducirá.
 * 
 * @param es - Texto en español
 * @returns LocalizedText con solo español
 * 
 * @example
 * ```typescript
 * const title = createLocalizedText('Bienvenidos');
 * // { es: 'Bienvenidos' }
 * ```
 */
export function createLocalizedText(es: string): LocalizedText {
  return { es };
}

/**
 * Añade una traducción a un LocalizedText existente.
 * 
 * @param text - Objeto LocalizedText existente
 * @param locale - Idioma de la traducción
 * @param translation - Texto traducido
 * @returns Nuevo objeto con la traducción añadida
 * 
 * @example
 * ```typescript
 * const title = { es: 'Hola' };
 * const titleEn = addTranslation(title, 'en', 'Hello');
 * // { es: 'Hola', en: 'Hello' }
 * ```
 */
export function addTranslation(
  text: LocalizedText,
  locale: Locale,
  translation: string
): LocalizedText {
  return {
    ...text,
    [locale]: translation,
  };
}