/**
 * Diccionario de ciudades de Trawel
 * 
 * Propósito: Contener todas las ciudades/destinos urbanos disponibles
 * Alcance: Datos estáticos de ciudades, preparados para migración futura
 * 
 * Decisiones técnicas:
 * - Diccionario indexado por ID para acceso O(1)
 * - Uso de LocalizedText aunque solo tengamos español inicialmente
 * - contentByMode preparado para diferenciar experiencias
 * - Timestamps opcionales para facilitar migración a base de datos
 * 
 * Limitaciones actuales:
 * - Datos estáticos, requieren redeploy para actualizar
 * - Sin validación automática de consistencia de slugs
 * - Sin imágenes reales (preparado para futuro)
 */

import type { City, CityDictionary } from '../types/city.types';
import { createLocalizedText } from '../../../app/i18n';

/**
 * Diccionario completo de ciudades.
 * 
 * En producción futura, esto vendría de una base de datos.
 * Los IDs deben ser estables para no romper URLs ni referencias.
 */
export const cities: CityDictionary = {
  // España
  madrid: {
    id: 'madrid',
    slug: 'madrid',
    countrySlug: 'espana',
    name: createLocalizedText('Madrid'),
    shortDescription: createLocalizedText('Capital vibrante con museos de clase mundial y vida nocturna inigualable'),
    contentByMode: {
      adventure: createLocalizedText('Descubre Madrid como nunca antes: desde el arte del Prado hasta la movida de Malasaña. Una ciudad que nunca duerme donde cada rincón esconde una aventura.'),
      student: createLocalizedText('Madrid, capital de España desde 1561. Hogar del Museo del Prado, uno de los mejores del mundo. Su arquitectura mezcla los Austrias con la modernidad del siglo XXI.'),
    },
    status: 'active',
    featured: true,
    destinationCount: 3,
    coordinates: { lat: 40.4168, lng: -3.7038 },
  },
  
  barcelona: {
    id: 'barcelona',
    slug: 'barcelona',
    countrySlug: 'espana',
    name: createLocalizedText('Barcelona'),
    shortDescription: createLocalizedText('Arquitectura modernista, playas mediterráneas y cultura catalana vibrante'),
    contentByMode: {
      adventure: createLocalizedText('Barcelona te espera con la Sagrada Familia, las playas del Mediterráneo y el bullicio de Las Ramblas. Una ciudad donde Gaudí dejó su huella mágica.'),
      student: createLocalizedText('Barcelona, capital de Cataluña. Famosa por la arquitectura modernista de Gaudí, incluyendo la Sagrada Familia, obra inconclusa desde 1882. Ciudad olímpica en 1992.'),
    },
    status: 'active',
    featured: true,
    destinationCount: 2,
    coordinates: { lat: 41.3851, lng: 2.1734 },
  },
  
  castellon: {
    id: 'castellon',
    slug: 'castellon',
    countrySlug: 'espana',
    name: createLocalizedText('Castellón de la Plana'),
    shortDescription: createLocalizedText('Auténtico encanto mediterráneo lejos del turismo masivo'),
    contentByMode: {
      adventure: createLocalizedText('Castellón, la joya escondida de la costa mediterránea. Playas vírgenes, montañas para senderismo y una gastronomía que sorprende.'),
      student: createLocalizedText('Castellón de la Plana, capital de la provincia homónima. Fundada en 1251, conserva un casco antiguo medieval y es puerta al Parque Natural de la Serra d\'Espadà.'),
    },
    status: 'active',
    featured: false,
    destinationCount: 1,
    coordinates: { lat: 39.9857, lng: -0.0494 },
  },
  
  morella: {
    id: 'morella',
    slug: 'morella',
    countrySlug: 'espana',
    name: createLocalizedText('Morella'),
    shortDescription: createLocalizedText('Ciudad amurallada medieval en lo alto de la meseta, con vistas espectaculares del Maestrazgo'),
    contentByMode: {
      adventure: createLocalizedText('Empieza tu visita subiendo al castillo por la mañana temprano, cuando la niebla aún envuelve el valle. Camina por murallas milenarias, explora la prisión medieval y contempla vistas que conquistaron romanos, árabes y cristianos. Dedica tiempo a perderte por las calles empedradas sin rumbo fijo, descubriendo rincones secretos entre contrafuertes góticos y ventanas ojivales.'),
      student: createLocalizedText('Morella es una ciudad amurallada de la provincia de Castellón, situada en lo alto de una meseta rocosa a 1.000 metros de altitud. Su ubicación estratégica en la frontera entre Aragón y Cataluña la convirtió en un enclave militar codiciado durante siglos. El conjunto amurallado conserva restos de ocupación ibérica, romana y medieval, con murallas del siglo XIV y el castillo que domina el paisaje desde la Edad Media.'),
    },
    status: 'active',
    featured: true,
    destinationCount: 1,
    coordinates: { lat: 40.6208, lng: 0.0994 },
  },

  // Japón
  tokyo: {
    id: 'tokyo',
    slug: 'tokyo',
    countrySlug: 'japon',
    name: createLocalizedText('Tokio'),
    shortDescription: createLocalizedText('Metrópolis futurista donde tradición milenaria convive con tecnología de vanguardia'),
    contentByMode: {
      adventure: createLocalizedText('Tokio: del bullicio de Shibuya a la serenidad de los templos de Asakusa. Una ciudad que desafía todos los sentidos con su energía única.'),
      student: createLocalizedText('Tokio, capital de Japón desde 1868. Con 37 millones de habitantes en su área metropolitana, es la mayor aglomeración urbana del mundo. Mezcla perfecta de tradición y tecnología.'),
    },
    status: 'active',
    featured: true,
    destinationCount: 2,
    coordinates: { lat: 35.6762, lng: 139.6503 },
  },
  
  kyoto: {
    id: 'kyoto',
    slug: 'kioto',
    countrySlug: 'japon',
    name: createLocalizedText('Kioto'),
    shortDescription: createLocalizedText('Antigua capital imperial con templos milenarios y geishas'),
    contentByMode: {
      adventure: createLocalizedText('Kioto, el alma tradicional de Japón. Pasea entre los torii rojos del Fushimi Inari, descubre templos zen y quizás avistes a una geisha en Gion.'),
      student: createLocalizedText('Kioto fue capital de Japón durante más de 1,000 años (794-1868). Patrimonio de la Humanidad con 17 sitios, incluyendo el templo dorado Kinkaku-ji y el bosque de bambú de Arashiyama.'),
    },
    status: 'active',
    featured: true,
    destinationCount: 2,
    coordinates: { lat: 35.0116, lng: 135.7681 },
  },

  // Perú
  lima: {
    id: 'lima',
    slug: 'lima',
    countrySlug: 'peru',
    name: createLocalizedText('Lima'),
    shortDescription: createLocalizedText('Ciudad de reyes con gastronomía premiada y costa pacífica'),
    contentByMode: {
      adventure: createLocalizedText('Lima, donde la historia colonial se encuentra con olas del Pacífico. Explora el centro histórico, saborea la mejor gastronomía de Sudamérica y surfea en sus playas.'),
      student: createLocalizedText('Lima, capital de Perú. Fundada en 1535 por Francisco Pizarro. Centro histórico Patrimonio de la Humanidad. Reconocida como capital gastronómica de América con mezcla de tradiciones andinas y europeas.'),
    },
    status: 'active',
    featured: true,
    destinationCount: 1,
    coordinates: { lat: -12.0464, lng: -77.0428 },
  },
  
  cusco: {
    id: 'cusco',
    slug: 'cusco',
    countrySlug: 'peru',
    name: createLocalizedText('Cusco'),
    shortDescription: createLocalizedText('Ombligo del mundo inca y puerta de entrada a Machu Picchu'),
    contentByMode: {
      adventure: createLocalizedText('Cusco te lleva a 3,400 metros de altura, entre calles de piedra inca y templos coloniales. La puerta sagrada a Machu Picchu y el Valle Sagrado de los Incas.'),
      student: createLocalizedText('Cusco fue capital del Imperio Inca hasta la conquista española en 1533. Ciudad Patrimonio de la Humanidad donde se superponen arquitectura inca y colonial. Punto de partida para Machu Picchu.'),
    },
    status: 'active',
    featured: true,
    destinationCount: 2,
    coordinates: { lat: -13.1631, lng: -72.5450 },
  },
};

/** Lista de todas las ciudades como array */
export const allCities: City[] = Object.values(cities);

/** Ciudades activas */
export const activeCities: City[] = allCities.filter(c => c.status === 'active');

/** Ciudades destacadas */
export const featuredCities: City[] = allCities.filter(c => c.featured && c.status === 'active');