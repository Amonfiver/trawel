/**
 * Diccionario de destinos/aventuras de Trawel
 * 
 * Propósito: Contener todas las fichas editoriales de destinos turísticos
 * Alcance: Datos estáticos de destinos, preparados para migración futura
 * 
 * Decisiones técnicas:
 * - Cada destino pertenece a una ciudad y país (relación jerárquica)
 * - Contenido diferenciado por modo de experiencia
 * - Campos de trazabilidad para editorial profesional
 * - IDs estables para no romper URLs
 * 
 * Limitaciones actuales:
 * - Sin imágenes reales (preparado para futuro)
 * - Sin fuentes completas (placeholder)
 * - Contenido solo en español inicialmente
 */

import type { Destination, DestinationDictionary } from '../types/destination.types';
import { createLocalizedText } from '../../../app/i18n';

/**
 * Diccionario completo de destinos.
 * 
 * En producción futura, esto vendría de un CMS o base de datos.
 * Los slugs deben ser estables para no romper URLs.
 */
export const destinations: DestinationDictionary = {
  // Madrid - Museo del Prado
  'prado-museum': {
    id: 'prado-museum',
    slug: 'museo-del-prado',
    countrySlug: 'espana',
    citySlug: 'madrid',
    title: createLocalizedText('Museo del Prado'),
    summary: createLocalizedText('Uno de los mejores museos del mundo, hogar de Las Meninas de Velázquez y el Jardín de las Delicias del Bosco'),
    contentByMode: {
      adventure: createLocalizedText('Sumérgete en siglos de arte español en el Prado. Desde las Meninas de Velázquez hasta los horrores del Jardín de las Delicias de El Bosco, cada sala es un viaje en el tiempo. No te pierdas la colección de Goya, especialmente los Pinturas Negras en la segunda planta.'),
      student: createLocalizedText('El Museo del Prado, inaugurado en 1819, alberga más de 8,000 obras y es considerado el museo de arte más importante de España. Destacan Velázquez (Las Meninas, 1656), Goya (La maja desnuda, 1797-1800) y El Bosco (El jardín de las delicias, 1490-1510). El edificio neoclásico fue diseñado por Juan de Villanueva.'),
    },
    status: 'published',
    featured: true,
    type: 'museum',
    tags: ['arte', 'cultura', 'imprescindible', 'historia'],
    estimatedVisitTime: '2-3 horas',
    price: createLocalizedText('15€ general, gratis de lunes a sábado 18h-20h y domingos 17h-19h'),
    openingHours: createLocalizedText('Lunes a sábado: 10:00 - 20:00. Domingos y festivos: 10:00 - 19:00'),
    sources: [
      { type: 'own', title: 'Guía oficial del Museo del Prado' },
    ],
  },

  // Tokio - Senso-ji
  'senso-ji': {
    id: 'senso-ji',
    slug: 'templo-senso-ji',
    countrySlug: 'japon',
    citySlug: 'tokyo',
    title: createLocalizedText('Templo Senso-ji'),
    summary: createLocalizedText('El templo budista más antiguo de Tokio, famoso por su puerta Thunder Gate y calle Nakamise llena de tradición'),
    contentByMode: {
      adventure: createLocalizedText('Cruza el impresionante Kaminarimon (Puerta del Trueno) con su enorme linterna roja y adéntrate en la calle Nakamise, donde vendedores de dulces tradicionales y souvenirs crean un ambiente mágico. El templo principal, con su incienso eterno, ofrece una experiencia espiritual única en medio del bullicio de Asakusa.'),
      student: createLocalizedText('El Templo Senso-ji, fundado en 645 d.C., es el templo budista más antiguo de Tokio. Dedicado a Kannon, la diosa de la misericordia. La Nakamise-dori, calle comercial que lleva al templo, data del siglo XVIII. El pagoda de cinco pisos (1973) alberga cenizas de Buda. El incienso del templo se cree que tiene poderes curativos.'),
    },
    status: 'published',
    featured: true,
    type: 'monument',
    tags: ['templo', 'budismo', 'historia', 'cultura', 'imprescindible'],
    estimatedVisitTime: '1-2 horas',
    price: createLocalizedText('Gratis (acepta donaciones)'),
    openingHours: createLocalizedText('Siempre abierto (el templo principal 6:00 - 17:00)'),
    sources: [
      { type: 'own', title: 'Folletos oficiales del templo Senso-ji' },
    ],
  },

  // Cusco - Machu Picchu
  'machu-picchu': {
    id: 'machu-picchu',
    slug: 'machu-picchu',
    countrySlug: 'peru',
    citySlug: 'cusco',
    title: createLocalizedText('Machu Picchu'),
    summary: createLocalizedText('La ciudad perdida de los incas, maravilla del mundo y destino imperdible de Sudamérica'),
    contentByMode: {
      adventure: createLocalizedText('Despierta antes del amanecer en Aguas Calientes y sube en bus serpenteando hasta la entrada. Cuando la niebla se disipa y las primeras luces iluminan las terrazas de piedra, entenderás por qué es una de las maravillas del mundo moderno. Camina hasta la Puerta del Sol para la vista clásica, o sube al Huayna Picchu si te atreves (reserva con meses de anticipación).'),
      student: createLocalizedText('Machu Picchu, construida alrededor de 1450 durante el imperio inca de Pachacútec, fue abandonada en el siglo XVI durante la conquista española. Redescubierta por Hiram Bingham en 1911. Patrimonio de la Humanidad desde 1983 y una de las Nuevas Siete Maravillas del Mundo Moderno. El sitio incluye más de 150 edificios: templos, almacenes y residencias. La arquitectura se adapta perfectamente a la geografía montañosa.'),
    },
    status: 'published',
    featured: true,
    type: 'monument',
    tags: ['incas', 'arqueología', 'patrimonio', 'naturaleza', 'imprescindible', 'montaña'],
    estimatedVisitTime: 'Medio día completo',
    price: createLocalizedText('152 soles (≈40€) entrada general. Huayna Picchu: 200 soles adicionales. Obligatorio guía oficial desde 2024.'),
    openingHours: createLocalizedText('6:00 - 17:30 (última entrada 14:00). Dos turnos: mañana (6:00-12:00) y tarde (12:00-17:30)'),
    sources: [
      { type: 'website', title: 'Ministerio de Cultura del Perú', url: 'https://www.machupicchu.gob.pe' },
      { type: 'book', title: 'Machu Picchu: Unveiling the Mystery of the Incas', author: 'Richard L. Burger', year: 2004 },
    ],
  },

  // Madrid - Retiro
  'retiro-park': {
    id: 'retiro-park',
    slug: 'parque-del-retiro',
    countrySlug: 'espana',
    citySlug: 'madrid',
    title: createLocalizedText('Parque del Retiro'),
    summary: createLocalizedText('El pulmón verde de Madrid con estanque, palacio de cristal y jardines históricos'),
    contentByMode: {
      adventure: createLocalizedText('Alquila una barca de remos en el estanque del Retiro con el monumento a Alfonso XII de fondo. Explora el Palacio de Velázquez y el mágico Palacio de Cristal, donde la luz se filtra creando un ambiente etéreo. Los jardines secretos como el Rosaleda ofrecen rincones de paz en medio de la ciudad.'),
      student: createLocalizedText('El Parque del Buen Retiro fue creado en el siglo XVII como jardín privado de la monarquía española. Abierto al público en 1868. 125 hectáreas con más de 15,000 árboles. Destacan: el Palacio de Cristal (1887, estilo victoriano), el estanque artificial (año 1634) y la estatua del Ángel Caído (1878, única escultura del mundo dedicada al demonio).'),
    },
    status: 'published',
    featured: false,
    type: 'nature',
    tags: ['parque', 'naturaleza', 'jardines', 'gratis'],
    estimatedVisitTime: '2 horas',
    price: createLocalizedText('Gratis'),
    openingHours: createLocalizedText('6:00 - 00:00 (horario variable según estación)'),
  },

  // Kioto - Fushimi Inari
  'fushimi-inari': {
    id: 'fushimi-inari',
    slug: 'fushimi-inari',
    countrySlug: 'japon',
    citySlug: 'kioto',
    title: createLocalizedText('Fushimi Inari Taisha'),
    summary: createLocalizedText('Santuario shinto famoso por sus miles de torii rojos formando túneles en la montaña'),
    contentByMode: {
      adventure: createLocalizedText('Camina entre los 10,000 torii rojos que serpentean por la montaña sagrada. Cada puerta fue donada por un empresario buscando el favor de Inari, dios del arroz y el negocio. Subir hasta la cumbre toma 2-3 horas y ofrece vistas espectaculares de Kioto. Los santuarios más pequeños en la cima son mágicos y casi vacíos de turistas.'),
      student: createLocalizedText('Fushimi Inari Taisha es el santuario principal de los 30,000 santuarios dedicados a Inari en Japón. Fundado en el año 711. Los famosos torii rojos (vermillón) comenzaron a donarse en el período Edo (1603-1868). El santuario incluye el monte Inari (233m) con senderos que toman 2-3 horas recorrer. Inari es dios del arroz, sake, fertilidad y éxito en los negocios.'),
    },
    status: 'published',
    featured: true,
    type: 'monument',
    tags: ['santuario', 'shinto', 'senderismo', 'gratis', 'imprescindible'],
    estimatedVisitTime: '2-3 horas (ida y vuelta completa)',
    price: createLocalizedText('Gratis'),
    openingHours: createLocalizedText('Siempre abierto'),
  },
};

/** Lista de todos los destinos como array */
export const allDestinations: Destination[] = Object.values(destinations);

/** Destinos publicados (visibles) */
export const publishedDestinations: Destination[] = allDestinations.filter(d => d.status === 'published');

/** Destinos destacados */
export const featuredDestinations: Destination[] = publishedDestinations.filter(d => d.featured);