import type { CountryDictionary } from './countries.types';

export const countries: CountryDictionary = {
  ES: {
    id: 'ES',
    name: 'España',
    slug: 'espana',
    nameEn: 'Spain',
    continent: 'europe',
    status: 'active',
    capital: 'Madrid',
    shortDescription: 'Desde la Alhambra hasta la Sagrada Familia',
    totalDestinations: 3,
  },
  JP: {
    id: 'JP',
    name: 'Japón',
    slug: 'japon',
    nameEn: 'Japan',
    continent: 'asia',
    status: 'active',
    capital: 'Tokio',
    shortDescription: 'Tradición y futuro en perfecta armonía',
    totalDestinations: 2,
  },
  PE: {
    id: 'PE',
    name: 'Perú',
    slug: 'peru',
    nameEn: 'Peru',
    continent: 'america',
    status: 'active',
    capital: 'Lima',
    shortDescription: 'Machu Picchu y mucho más',
    totalDestinations: 2,
  },
  // Países "Próximamente" - visibles pero sin contenido aún
  FR: {
    id: 'FR',
    name: 'Francia',
    slug: 'francia',
    nameEn: 'France',
    continent: 'europe',
    status: 'coming-soon',
    capital: 'París',
    shortDescription: 'Próximamente',
    totalDestinations: 0,
  },
  IT: {
    id: 'IT',
    name: 'Italia',
    slug: 'italia',
    nameEn: 'Italy',
    continent: 'europe',
    status: 'coming-soon',
    capital: 'Roma',
    shortDescription: 'Próximamente',
    totalDestinations: 0,
  },
};

export const getActiveCountries = () => 
  Object.values(countries).filter(c => c.status === 'active');

export const getCountryBySlug = (slug: string) => 
  Object.values(countries).find(c => c.slug === slug);

export const getCountryById = (id: string) => 
  countries[id];