/**
 * Export público de la feature cities
 */

export type {
  City,
  CityDictionary,
  CityListItem,
  CityStatus,
  CityContentByMode,
  Coordinates,
} from './types/city.types';

export {
  cities,
  allCities,
  activeCities,
  featuredCities,
} from './data/cities';

export {
  getCitiesByCountrySlug,
  getCityBySlug,
  getActiveCitiesByCountrySlug,
  getFeaturedCities,
  getFeaturedCitiesByCountrySlug,
  isCityClickable,
  isCityAvailable,
  getCityDisplayName,
  getCityShortDescription,
  getCityCounts,
  getCityCountsByCountry,
} from './data/cities.utils';