/**
 * Purpose: Centralize per-country map asset recommendations for CountryInternalMap.
 * Scope: Selects the preferred administrative level used by frontend requests and the worker.
 * Decisions: Defaults to ADM1 for main travel regions; ADM2 is an explicit exception.
 * Limitations: Profiles are keyed by Trawel country slug, not ISO code.
 * Recent changes: India, Rumania and Italia use ADM1 to avoid excessive ADM2 granularity.
 */
export type CountryMapAdminLevel = 'ADM0' | 'ADM1' | 'ADM2' | 'ADM3' | 'ADM4' | 'ADM5';

export interface CountryMapProfile {
  preferredAdminLevel: CountryMapAdminLevel;
  technicalLabel?: string;
  note?: string;
}

export const DEFAULT_COUNTRY_MAP_ADMIN_LEVEL: CountryMapAdminLevel = 'ADM1';

export const countryMapProfiles: Record<string, CountryMapProfile> = {
  espana: {
    preferredAdminLevel: 'ADM2',
    technicalLabel: 'Provincias',
    note: 'España conserva ADM2 porque las provincias son el nivel útil para exploración editorial.',
  },
  mexico: {
    preferredAdminLevel: 'ADM1',
    technicalLabel: 'Estados',
    note: 'México usa ADM1 para evitar un mapa excesivamente granular y priorizar estados.',
  },
  italia: {
    preferredAdminLevel: 'ADM1',
    technicalLabel: 'Regiones',
    note: 'Italia usa ADM1 para mostrar regiones principales; las ciudades se gestionan como contenido editorial.',
  },
  rumania: {
    preferredAdminLevel: 'ADM1',
    technicalLabel: 'Regiones principales',
    note: 'Rumanía usa ADM1 porque ADM2 genera miles de subdivisiones demasiado pequeñas para la experiencia pública.',
  },
  india: {
    preferredAdminLevel: 'ADM1',
    technicalLabel: 'Estados y territorios',
    note: 'India usa ADM1 para mostrar estados/territorios principales; ADM2 es demasiado granular para Trawel.',
  },
  'estados-unidos': {
    preferredAdminLevel: 'ADM1',
    technicalLabel: 'Estados',
    note: 'Estados Unidos usa ADM1 por utilidad UX/comercial y para evitar granularidad excesiva o fallos con ADM2.',
  },
};

export function getCountryMapProfile(countrySlug: string): CountryMapProfile {
  return countryMapProfiles[countrySlug] ?? {
    preferredAdminLevel: DEFAULT_COUNTRY_MAP_ADMIN_LEVEL,
  };
}

export function getPreferredAdminLevel(countrySlug: string): CountryMapAdminLevel {
  return getCountryMapProfile(countrySlug).preferredAdminLevel;
}
