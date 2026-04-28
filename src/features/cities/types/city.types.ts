/**
 * Tipos de datos para ciudades en Trawel
 * 
 * Propósito: Definir la estructura completa de datos de ciudades/destinos urbanos
 * Alcance: Tipos TypeScript para el diccionario de ciudades y utilidades
 * 
 * Decisiones técnicas:
 * - Uso de LocalizedText para preparar multidioma futuro
 * - contentByMode separa descripciones por tipo de experiencia
 * - Campos opcionales para facilitar creación gradual de contenido
 * - Timestamps opcionales preparados para persistencia futura
 * 
 * Limitaciones actuales:
 * - Datos estáticos en TS, sin base de datos
 * - Sin validación automática de slugs únicos
 * - Sin relaciones explícitas con base de datos
 */

import type { LocalizedText } from '../../../app/i18n';

/** Estado editorial de una ciudad */
export type CityStatus = 'active' | 'comingSoon' | 'disabled';

/** Coordenadas geográficas */
export interface Coordinates {
  lat: number;
  lng: number;
}

/** Contenido diferenciado por modo de experiencia */
export interface CityContentByMode {
  /** Descripción para modo aventura (emocional, explorador) */
  adventure?: LocalizedText;
  /** Descripción para modo estudiante (educativo, cultural) */
  student?: LocalizedText;
}

/**
 * Representación completa de una ciudad en Trawel
 * 
 * Preparado para migración futura a base de datos relacional.
 * Los campos opcionales permiten crear ciudades gradualmente.
 */
export interface City {
  /** Identificador único estable (ej: 'madrid', 'tokyo') */
  id: string;
  
  /** Slug para URLs amigables: madrid, tokyo, lima */
  slug: string;
  
  /** Slug del país al que pertenece (relación) */
  countrySlug: string;
  
  /** Nombre de la ciudad en múltiples idiomas */
  name: LocalizedText;
  
  /** Descripción corta para listados (opcional) */
  shortDescription?: LocalizedText;
  
  /** Contenido específico por modo de experiencia */
  contentByMode?: CityContentByMode;
  
  /** Estado editorial de la ciudad */
  status: CityStatus;
  
  /** Si es una ciudad destacada/promocionada */
  featured?: boolean;
  
  /** Número de destinos/aventuras disponibles en la ciudad */
  destinationCount?: number;
  
  /** Coordenadas geográficas para mapas futuros */
  coordinates?: Coordinates;
  
  /** URL de imagen principal (preparado para futuro) */
  image?: string;
  
  /** Timestamps para persistencia futura */
  createdAt?: string; // ISO 8601
  updatedAt?: string; // ISO 8601
}

/** Diccionario indexado por ID de ciudad */
export type CityDictionary = Record<string, City>;

/** Datos mínimos para listar una ciudad */
export interface CityListItem {
  id: string;
  slug: string;
  countrySlug: string;
  name: LocalizedText;
  status: CityStatus;
  featured?: boolean;
  destinationCount?: number;
  image?: string;
}