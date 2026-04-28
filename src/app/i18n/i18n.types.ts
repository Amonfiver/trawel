/**
 * Tipos del sistema de internacionalización (i18n) de Trawel
 * 
 * Propósito: Definir los tipos base para el soporte multidioma
 * Alcance: Locales soportados, textos localizados, y utilidades de tipo
 * 
 * Decisiones técnicas:
 * - Locale como union type para type safety
 * - LocalizedText permite traducciones parciales (no exige todos los idiomas)
 * - Fallback configurable en utils, no en tipos
 * 
 * Limitaciones actuales:
 * - Solo español tiene contenido completo durante el MVP
 * - Los demás idiomas se añadirán cuando el contenido esté estable
 */

/** Códigos de idioma soportados por Trawel */
export type Locale = 'es' | 'en' | 'fr' | 'it' | 'uk';

/** Idioma por defecto y principal durante el MVP */
export const DEFAULT_LOCALE: Locale = 'es';

/** Lista de todos los idiomas soportados */
export const SUPPORTED_LOCALES: Locale[] = ['es', 'en', 'fr', 'it', 'uk'];

/** 
 * Texto localizado que puede tener traducciones parciales.
 * No exige todos los idiomas, permite añadir traducciones gradualmente.
 * 
 * Ejemplo:
 * ```typescript
 * const title: LocalizedText = {
 *   es: 'Bienvenido a Trawel',
 *   en: 'Welcome to Trawel',
 *   // fr, it, uk se añadirán más adelante
 * };
 * ```
 */
export type LocalizedText = Partial<Record<Locale, string>>;

/**
 * Contenido traducible genérico.
 * Útil para objetos más complejos que necesitan campos traducidos.
 * 
 * Ejemplo:
 * ```typescript
 * interface CountryContent {
 *   name: LocalizedText;
 *   description: LocalizedText;
 *   shortDescription: LocalizedText;
 * }
 * ```
 */
export interface LocalizedContent {
  [key: string]: LocalizedText | string | number | boolean | undefined;
}

/**
 * Configuración de idioma con metadatos
 */
export interface LocaleConfig {
  /** Código del idioma */
  code: Locale;
  
  /** Nombre del idioma en su propio idioma */
  name: string;
  
  /** Nombre del idioma en español (para debug/admin) */
  nameEs: string;
  
  /** Dirección de escritura */
  direction: 'ltr' | 'rtl';
  
  /** ¿Está disponible en producción? */
  isProductionReady: boolean;
}

/** Configuración de cada idioma soportado */
export const LOCALE_CONFIGS: Record<Locale, LocaleConfig> = {
  es: {
    code: 'es',
    name: 'Español',
    nameEs: 'Español',
    direction: 'ltr',
    isProductionReady: true,
  },
  en: {
    code: 'en',
    name: 'English',
    nameEs: 'Inglés',
    direction: 'ltr',
    isProductionReady: false, // Se activará cuando haya contenido
  },
  fr: {
    code: 'fr',
    name: 'Français',
    nameEs: 'Francés',
    direction: 'ltr',
    isProductionReady: false,
  },
  it: {
    code: 'it',
    name: 'Italiano',
    nameEs: 'Italiano',
    direction: 'ltr',
    isProductionReady: false,
  },
  uk: {
    code: 'uk',
    name: 'Українська',
    nameEs: 'Ucraniano',
    direction: 'ltr',
    isProductionReady: false,
  },
};

/**
 * Verifica si un valor es un locale soportado
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);
}