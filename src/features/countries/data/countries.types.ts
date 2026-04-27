export type Continent = 'africa' | 'america' | 'asia' | 'europe' | 'oceania';

export type CountryStatus = 'active' | 'coming-soon' | 'hidden';

export interface Country {
  id: string;              // ISO 3166-1 alpha-2 (ES, JP, PE)
  name: string;            // Nombre en español
  slug: string;            // Para URLs (espana, japon, peru)
  nameEn?: string;         // Nombre en inglés
  continent: Continent;
  status: CountryStatus;
  capital: string;
  shortDescription: string;
  totalDestinations: number;  // Número de ciudades/aventuras
  heroImage?: string;      // URL de imagen hero (opcional)
}

export type CountryDictionary = Record<string, Country>;