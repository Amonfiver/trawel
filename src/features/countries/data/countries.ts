/**
 * Diccionario de países de Trawel
 * 
 * Propósito: Fuente de verdad de todos los países disponibles en la plataforma
 * Alcance: Datos estáticos de países con metadatos para UI y navegación
 * 
 * Decisiones técnicas:
 * - Clave del diccionario = isoAlpha2 para búsqueda rápida O(1)
 * - Campos ISO estandarizados para futura integración con world-atlas
 * - Estados: active (navegable), comingSoon (visible no clickeable), disabled (oculto)
 * 
 * Limitaciones actuales:
 * - Solo 5 países definidos (3 activos, 2 próximamente)
 * - Sin datos de coordenadas geográficas
 * - Sin imágenes reales
 */

import type { CountryDictionary } from './countries.types';

export const countries: CountryDictionary = {
  ES: {
    id: 'ES',
    isoAlpha2: 'ES',
    isoAlpha3: 'ESP',
    unM49: '724',
    slug: 'espana',
    name: 'spain',
    displayName: 'España',
    continent: 'europe',
    status: 'active',
    featured: true,
    capital: 'Madrid',
    destinationCount: 3,
    shortDescription: 'Desde la Alhambra hasta la Sagrada Familia',
  },
  JP: {
    id: 'JP',
    isoAlpha2: 'JP',
    isoAlpha3: 'JPN',
    unM49: '392',
    slug: 'japon',
    name: 'japan',
    displayName: 'Japón',
    continent: 'asia',
    status: 'active',
    featured: true,
    capital: 'Tokio',
    destinationCount: 2,
    shortDescription: 'Tradición y futuro en perfecta armonía',
  },
  PE: {
    id: 'PE',
    isoAlpha2: 'PE',
    isoAlpha3: 'PER',
    unM49: '604',
    slug: 'peru',
    name: 'peru',
    displayName: 'Perú',
    continent: 'america',
    status: 'active',
    featured: false,
    capital: 'Lima',
    destinationCount: 2,
    shortDescription: 'Machu Picchu y mucho más',
  },
  // Países "Próximamente" - visibles pero sin contenido aún
  FR: {
    id: 'FR',
    isoAlpha2: 'FR',
    isoAlpha3: 'FRA',
    unM49: '250',
    slug: 'francia',
    name: 'france',
    displayName: 'Francia',
    continent: 'europe',
    status: 'comingSoon',
    featured: false,
    capital: 'París',
    destinationCount: 0,
    shortDescription: 'Próximamente',
  },
  IT: {
    id: 'IT',
    isoAlpha2: 'IT',
    isoAlpha3: 'ITA',
    unM49: '380',
    slug: 'italia',
    name: 'italy',
    displayName: 'Italia',
    continent: 'europe',
    status: 'comingSoon',
    featured: false,
    capital: 'Roma',
    destinationCount: 0,
    shortDescription: 'Próximamente',
  },
};