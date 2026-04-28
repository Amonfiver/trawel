/**
 * Export público del sistema de internacionalización (i18n) de Trawel
 * 
 * Propósito: Centralizar exports de tipos y utilidades i18n
 * Alcance: Re-exports desde i18n.types.ts e i18n.utils.ts
 */

// Tipos y constantes
export {
  type Locale,
  type LocalizedText,
  type LocalizedContent,
  type LocaleConfig,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_CONFIGS,
  isLocale,
} from './i18n.types';

// Utilidades
export {
  getLocalizedText,
  isSupportedLocale,
  normalizeLocale,
  getLocaleName,
  getLocaleNameEs,
  isLocaleProductionReady,
  getProductionReadyLocales,
  createLocalizedText,
  addTranslation,
} from './i18n.utils';