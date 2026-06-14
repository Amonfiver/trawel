/**
 * Export público de la feature travelData
 * 
 * Propósito: Centralizar exports de tipos y servicios de acceso a datos
 * 
 * Alcance: Tipos agregados para páginas y funciones de acceso a datos
 * 
 * Uso:
 * ```
 * import { getHomePageData, type HomePageData } from '@/features/travelData';
 * ```
 */

// Tipos
export type {
  HomePageData,
  CountryPageData,
  CityPageData,
  AdventurePageData,
  TravelDataResult,
} from './types/travelData.types';

export type {
  CountryScreenData,
  CountryZoneScreenDataRepository,
  ZoneScreenData,
  ScreenCommunityCtaData,
  ScreenCountrySummary,
  ScreenEditorialData,
  ScreenEditorialStatus,
  ScreenExperienceMode,
  ScreenHeroData,
  ScreenHeroSource,
  ScreenMapStatus,
  ScreenZoneSummary,
} from './screenData';

// Servicios
export {
  getHomePageData,
  getCountryPageData,
  getCityPageData,
  getAdventurePageData,
  initializeTravelDataSource,
  isTravelDataSourceInitialized,
  getTravelDataSourceState,
} from './services/travelData.service';

export {
  getCountryScreenData,
  getZoneScreenData,
} from './screenData';
