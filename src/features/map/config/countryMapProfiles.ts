export type CountryMapAdminLevel = 'ADM0' | 'ADM1' | 'ADM2' | 'ADM3' | 'ADM4' | 'ADM5';

export interface CountryMapProfile {
  preferredAdminLevel: CountryMapAdminLevel;
  technicalLabel?: string;
  note?: string;
}

export const DEFAULT_COUNTRY_MAP_ADMIN_LEVEL: CountryMapAdminLevel = 'ADM2';

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
};

export function getCountryMapProfile(countrySlug: string): CountryMapProfile {
  return countryMapProfiles[countrySlug] ?? {
    preferredAdminLevel: DEFAULT_COUNTRY_MAP_ADMIN_LEVEL,
  };
}

export function getPreferredAdminLevel(countrySlug: string): CountryMapAdminLevel {
  return getCountryMapProfile(countrySlug).preferredAdminLevel;
}
