/**
 * Tipos de datos para destinos/aventuras en Trawel
 * 
 * Propósito: Definir la estructura completa de contenido editorial (fichas de destino)
 * Alcance: Tipos TypeScript para destinos turísticos, experiencias y aventuras
 * 
 * Decisiones técnicas:
 * - Uso de LocalizedText para preparar multidioma futuro
 * - contentByMode separa contenido por tipo de experiencia
 * - Status editorial separado del estado de publicación
 * - Campos de trazabilidad preparados para editorial profesional
 * 
 * Limitaciones actuales:
 * - Datos estáticos en TS, sin base de datos
 * - Sin sistema de revisiones o workflow editorial
 * - Sin metadatos SEO avanzados
 */

import type { LocalizedText } from '../../../app/i18n';
import type { Coordinates } from '../../cities/types/city.types';

/** Estado editorial de un destino */
export type DestinationStatus = 'draft' | 'published' | 'comingSoon' | 'disabled';

/** Tipo de experiencia/destino */
export type DestinationType = 
  | 'monument'      // Monumentos, edificios históricos
  | 'museum'        // Museos, galerías
  | 'nature'        // Parques naturales, paisajes
  | 'experience'    // Experiencias, actividades
  | 'food'          // Gastronomía, restaurantes
  | 'hiddenGem';    // Joyas escondidas, lugares secretos

/** Contenido enriquecido por modo de experiencia */
export interface DestinationContentByMode {
  /** Contenido completo para modo aventura (emocional, narrativo) */
  adventure?: LocalizedText;
  /** Contenido completo para modo estudiante (educativo, factual) */
  student?: LocalizedText;
}

/** Fuente o referencia para trazabilidad editorial */
export interface Source {
  /** Tipo de fuente */
  type: 'book' | 'article' | 'website' | 'expert' | 'own';
  /** Título o nombre de la fuente */
  title: string;
  /** Autor o entidad */
  author?: string;
  /** Año de publicación */
  year?: number;
  /** URL si aplica */
  url?: string;
}

/**
 * Representación completa de un destino/aventura en Trawel
 * 
 * Un destino es una ficha editorial sobre un lugar específico
 * (museo, monumento, experiencia, restaurante, etc.)
 * 
 * Preparado para migración futura a CMS o base de datos.
 */
export interface Destination {
  /** Identificador único estable (ej: 'prado-museum', 'senso-ji') */
  id: string;
  
  /** Slug para URLs amigables */
  slug: string;
  
  /** Slug del país al que pertenece */
  countrySlug: string;
  
  /** Slug de la ciudad a la que pertenece */
  citySlug: string;
  
  /** Título del destino en múltiples idiomas */
  title: LocalizedText;
  
  /** Resumen corto para tarjetas y listados */
  summary?: LocalizedText;
  
  /** Contenido principal diferenciado por modo de experiencia */
  contentByMode?: DestinationContentByMode;
  
  /** Estado editorial del destino */
  status: DestinationStatus;
  
  /** Si es un destino destacado */
  featured?: boolean;
  
  /** Tipo de experiencia */
  type?: DestinationType;
  
  /** Etiquetas para categorización y búsqueda */
  tags?: string[];
  
  /** Tiempo estimado de visita (ej: "2 horas", "medio día") */
  estimatedVisitTime?: string;
  
  /** Coordenadas geográficas exactas */
  coordinates?: Coordinates;
  
  /** URL de imagen principal */
  image?: string;
  
  /** Galería de imágenes adicionales */
  gallery?: string[];
  
  /** Fuentes y referencias para trazabilidad */
  sources?: Source[];
  
  /** Precio aproximado si aplica (texto libre) */
  price?: LocalizedText;
  
  /** Horarios si aplica */
  openingHours?: LocalizedText;
  
  /** Timestamps para persistencia futura */
  createdAt?: string;    // ISO 8601
  updatedAt?: string;    // ISO 8601
  publishedAt?: string;  // ISO 8601 - Cuándo se hizo público
}

/** Diccionario indexado por ID de destino */
export type DestinationDictionary = Record<string, Destination>;

/** Datos mínimos para listar un destino */
export interface DestinationListItem {
  id: string;
  slug: string;
  countrySlug: string;
  citySlug: string;
  title: LocalizedText;
  summary?: LocalizedText;
  status: DestinationStatus;
  featured?: boolean;
  type?: DestinationType;
  tags?: string[];
  image?: string;
  estimatedVisitTime?: string;
}