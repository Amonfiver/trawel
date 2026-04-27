/**
 * Tipos de datos para países en Trawel
 * 
 * Propósito: Definir la estructura completa de datos de países
 * Alcance: Tipos TypeScript para el diccionario de países y utilidades
 * 
 * Decisiones técnicas:
 * - Uso de tipos literales para continentes y estados (type safety)
 * - Campos ISO estandarizados para integración con datos geoespaciales
 * - displayName separado de name para flexibilidad de presentación
 * - destinationCount en lugar de totalDestinations (más semántico)
 * 
 * Limitaciones actuales:
 * - Sin soporte para múltiples idiomas (solo español)
 * - Sin coordenadas geográficas (se añadirán cuando se implemente el mapa)
 */

export type Continent = 'africa' | 'america' | 'asia' | 'europe' | 'oceania';

export type CountryStatus = 'active' | 'comingSoon' | 'disabled';

export interface Country {
  /** Identificador interno único (igual a isoAlpha2 para consistencia) */
  id: string;
  
  /** Código ISO 3166-1 alpha-2 (2 letras): ES, JP, PE */
  isoAlpha2: string;
  
  /** Código ISO 3166-1 alpha-3 (3 letras): ESP, JPN, PER */
  isoAlpha3: string;
  
  /** Código UN M.49 numérico (usado por world-atlas): 724, 392, 604 */
  unM49: string;
  
  /** Slug para URLs amigables: espana, japon, peru */
  slug: string;
  
  /** Nombre técnico/identificador: 'spain', 'japan', 'peru' */
  name: string;
  
  /** Nombre para mostrar en español: 'España', 'Japón', 'Perú' */
  displayName: string;
  
  /** Continente al que pertenece */
  continent: Continent;
  
  /** Estado del país en Trawel */
  status: CountryStatus;
  
  /** Si es un país destacado/promocionado */
  featured?: boolean;
  
  /** Capital del país (opcional) */
  capital?: string;
  
  /** Número de destinos/ciudades disponibles */
  destinationCount?: number;
  
  /** Descripción corta para listados y tarjetas */
  shortDescription?: string;
}

export type CountryDictionary = Record<string, Country>;

/** Datos mínimos necesarios para renderizar un país en el mapa */
export interface CountryMapData {
  isoAlpha2: string;
  displayName: string;
  status: CountryStatus;
  destinationCount?: number;
}