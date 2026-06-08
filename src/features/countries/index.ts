/**
 * Export público del módulo countries
 */

export { countryCodeToFlagEmoji, formatCountryWithFlag } from './utils/countryHelpers';
export { CountryFlag } from './components/CountryFlag';

// Contenido editorial por país y modo
export {
  countryEditorial,
  getCountryEditorial,
  hasCountryEditorial,
  getCountriesWithEditorial,
} from './data/countryEditorial';
export type {
  CountryEditorialContent,
  CountryEditorialData,
  ExperienceMode,
} from './data/countryEditorial';
