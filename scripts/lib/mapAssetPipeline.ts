/**
 * Utilidades compartidas para el pipeline de procesamiento de assets cartográficos
 * 
 * Este módulo contiene la lógica común usada por:
 * - scripts/process-country-map-queue.ts (worker de producción)
 * - scripts/prepare-spain-map-asset.ts (procesamiento manual de España)
 * 
 * Extracción de funciones reutilizables para evitar duplicación de código
 * mientras se mantiene compatibilidad con el procesamiento existente de España.
 */

import * as https from 'https';
import * as geojson2topojson from 'topojson-server';
import * as topojson from 'topojson-simplify';
import { feature as topojsonFeature } from 'topojson-client';

// ============================================
// TIPOS
// ============================================

export interface GeoBoundariesMetadata {
  gjDownloadURL?: string;
  geoJSON?: string;
  simplifiedGeometryGeoJSON?: string;
  shapeName?: string;
  shapeGroup?: string;
  shapeType?: string;
  license?: string;
  attribution?: string;
  [key: string]: any;
}

export interface PipelineConfig {
  simplificationFactor: number;
  targetSizeKB: number;
  acceptableSizeKB: number;
  countrySlug?: string;
  adminLevel?: string;
}

export interface PipelineResult {
  success: boolean;
  featureCount: number;
  sizeBytes: number;
  error?: string;
  metadata?: {
    license: string;
    attribution: string;
    source: string;
  };
}

// ============================================
// CONFIGURACIÓN POR DEFECTO
// ============================================

export const DEFAULT_CONFIG: PipelineConfig = {
  // Threshold de topojson.simplify. No es un porcentaje de detalle:
  // valores altos pueden colapsar features pequeñas, islas y costas.
  simplificationFactor: 0.0001,
  targetSizeKB: 150,
  acceptableSizeKB: 250,
};

const SIMPLIFICATION_THRESHOLD_OVERRIDES: Record<string, Record<string, number>> = {
  mexico: {
    ADM1: 0.0001,
  },
};

export function resolveSimplificationThreshold(config: Partial<PipelineConfig> = {}): number {
  if (typeof config.simplificationFactor === 'number') {
    return config.simplificationFactor;
  }

  const countrySlug = config.countrySlug?.toLowerCase().trim();
  const adminLevel = config.adminLevel?.toUpperCase().trim();

  if (countrySlug && adminLevel) {
    const countryOverrides = SIMPLIFICATION_THRESHOLD_OVERRIDES[countrySlug];
    const override = countryOverrides?.[adminLevel];

    if (typeof override === 'number') {
      return override;
    }
  }

  return DEFAULT_CONFIG.simplificationFactor;
}

// ============================================
// NORMALIZACIÓN DE POLÍGONOS (Winding)
// ============================================

/**
 * Calcula el área firmada de un anillo usando la fórmula del shoelace.
 * Área positiva = counter-clockwise
 * Área negativa = clockwise
 */
function ringArea(ring: number[][]): number {
  let area = 0;
  const len = ring.length;
  for (let i = 0; i < len; i++) {
    const j = (i + 1) % len;
    area += ring[i][0] * ring[j][1];
    area -= ring[j][0] * ring[i][1];
  }
  return area / 2;
}

/**
 * Invierte el orden de un anillo.
 */
function reverseRing(ring: number[][]): number[][] {
  return [...ring].reverse();
}

/**
 * Normaliza la orientación de un polígono para D3:
 * - Exterior debe tener área negativa (clockwise en proyección cartográfica)
 * - Interiores deben tener área positiva (counter-clockwise)
 * 
 * Esto corrige el problema donde D3 geoPath interpretaba polígonos
 * invertidos y añadía un rectángulo de clip grande a cada provincia.
 */
export function normalizePolygon(rings: number[][][]): number[][][] {
  if (!rings || rings.length === 0) return rings;

  const normalized: number[][][] = [];
  
  // El primer anillo es el exterior
  const exterior = rings[0];
  const exteriorArea = ringArea(exterior);
  
  // Para D3: exterior debe tener área negativa
  // Si el área es positiva, invertimos el anillo
  if (exteriorArea > 0) {
    normalized.push(reverseRing(exterior));
  } else {
    normalized.push([...exterior]);
  }
  
  // Los anillos restantes son interiores (holes)
  for (let i = 1; i < rings.length; i++) {
    const interior = rings[i];
    const interiorArea = ringArea(interior);
    
    // Para D3: interiores deben tener área positiva
    // Si el área es negativa, invertimos el anillo
    if (interiorArea < 0) {
      normalized.push(reverseRing(interior));
    } else {
      normalized.push([...interior]);
    }
  }
  
  return normalized;
}

/**
 * Normaliza la orientación de todas las geometrías de un FeatureCollection.
 */
export function normalizeGeoJSON(geojson: any): any {
  if (!geojson) return geojson;

  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    const normalizedFeatures = geojson.features.map((feature: any) => normalizeFeatureGeometry(feature));

    return {
      ...geojson,
      features: normalizedFeatures
    };
  }

  if (geojson.type === 'Feature') {
    return normalizeFeatureGeometry(geojson);
  }

  return normalizeGeometry(geojson);
}

function normalizeFeatureGeometry(feature: any): any {
    if (!feature.geometry) return feature;

    return {
      ...feature,
      geometry: normalizeGeometry(feature.geometry)
    };
}

function normalizeGeometry(geometry: any): any {
  if (!geometry) return geometry;

  if (geometry.type === 'Polygon') {
    return {
      ...geometry,
      coordinates: normalizePolygon(geometry.coordinates)
    };
  }

  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon: number[][][]) =>
        normalizePolygon(polygon)
      )
    };
  }

  if (geometry.type === 'GeometryCollection' && Array.isArray(geometry.geometries)) {
    return {
      ...geometry,
      geometries: geometry.geometries.map((item: any) => normalizeGeometry(item))
    };
  }

  return geometry;
}

// ============================================
// DESCARGA DE GEOBOUNDARIES
// ============================================

/**
 * Realiza una petición HTTPS y devuelve la respuesta como string
 * Sigue redirecciones automáticamente
 */
function httpsGet(url: string, maxRedirects: number = 5): Promise<{ data: string; statusCode: number }> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Demasiadas redirecciones'));
      return;
    }
    
    https.get(url, (response) => {
      // Seguir redirecciones
      if (response.statusCode === 301 || response.statusCode === 302) {
        const location = response.headers.location;
        if (location) {
          const resolvedUrl = location.startsWith('http') ? location : new URL(location, url).toString();
          httpsGet(resolvedUrl, maxRedirects - 1).then(resolve).catch(reject);
          return;
        }
      }
      
      let data = '';
      
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        resolve({
          data,
          statusCode: response.statusCode || 0
        });
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Consulta la API de geoBoundaries y obtiene metadata
 */
export async function fetchGeoBoundariesMetadata(
  isoAlpha3: string,
  admLevel: string = 'ADM2'
): Promise<GeoBoundariesMetadata> {
  const apiUrls = [
    `https://www.geoboundaries.org/api/current/gbOpen/${isoAlpha3}/${admLevel}`,
    `https://www.geoboundaries.org/api/gb/2.0.0/gbOpen/${isoAlpha3}/${admLevel}`,
  ];

  let lastError = '';

  for (const apiUrl of apiUrls) {
    try {
      const response = await httpsGet(apiUrl);
      
      if (response.statusCode !== 200) {
        lastError = `HTTP ${response.statusCode}`;
        continue;
      }
      
      let metadata: any;
      try {
        metadata = JSON.parse(response.data);
      } catch (e) {
        lastError = `Error parseando JSON: ${e}`;
        continue;
      }
      
      // geoBoundaries devuelve un array
      if (Array.isArray(metadata) && metadata.length > 0) {
        return metadata[0];
      } else if (typeof metadata === 'object' && metadata !== null) {
        return metadata;
      }
      
      lastError = 'Respuesta no válida';
      
    } catch (error) {
      lastError = String(error);
    }
  }
  
  throw new Error(`Todas las URLs de API fallaron. Último error: ${lastError}`);
}

/**
 * Extrae la URL de descarga GeoJSON de la metadata
 */
export function extractGeoJsonUrl(metadata: GeoBoundariesMetadata): string | null {
  const possibleFields = [
    'gjDownloadURL',
    'geoJSON',
    'simplifiedGeometryGeoJSON',
    'gjUrl',
    'downloadURL',
    'geojsonUrl'
  ];
  
  for (const field of possibleFields) {
    const value = metadata[field];
    if (value && typeof value === 'string') {
      return value;
    }
  }
  
  // Si no encontramos campo específico, buscamos cualquier URL que termine en .geojson
  for (const [, value] of Object.entries(metadata)) {
    if (typeof value === 'string' && value.toLowerCase().endsWith('.geojson')) {
      return value;
    }
  }
  
  return null;
}

/**
 * Descarga un archivo desde una URL y devuelve el contenido como string
 */
export function downloadGeoJSON(url: string, maxRedirects: number = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Demasiadas redirecciones'));
      return;
    }
    
    https.get(url, (response) => {
      // Seguir redirecciones
      if (response.statusCode === 301 || response.statusCode === 302) {
        const location = response.headers.location;
        if (location) {
          const resolvedUrl = location.startsWith('http') ? location : new URL(location, url).toString();
          downloadGeoJSON(resolvedUrl, maxRedirects - 1).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve(data));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Extrae información de licencia de la metadata
 */
export function extractLicenseInfo(metadata: GeoBoundariesMetadata): { license: string; attribution: string } {
  const licenseFields = ['license', 'licenseType', 'licenseUrl', 'termsOfUse'];
  const attributionFields = ['attribution', 'citation', 'source', 'attributionText'];
  
  let license = '';
  let attribution = '';
  
  for (const field of licenseFields) {
    const value = metadata[field];
    if (value) {
      license = String(value);
      break;
    }
  }
  
  for (const field of attributionFields) {
    const value = metadata[field];
    if (value) {
      attribution = String(value);
      break;
    }
  }
  
  // geoBoundaries gbOpen típicamente usa CC BY 4.0
  if (!license && !attribution) {
    return {
      license: 'CC BY 4.0',
      attribution: 'Datos cartográficos: geoBoundaries (CC BY 4.0)'
    };
  }
  
  return { license, attribution };
}

// ============================================
// PROCESAMIENTO Y CONVERSIÓN
// ============================================

/**
 * Convierte GeoJSON a TopoJSON simplificado
 */
export function convertToTopoJSON(
  geojson: any,
  objectName: string,
  config: Partial<PipelineConfig> = {}
): { topology: any; featureCount: number } {
  const simplificationThreshold = resolveSimplificationThreshold(config);
  
  // 1. Normalizar orientación de polígonos para D3
  const normalizedGeoJSON = normalizeGeoJSON(geojson);
  
  // 2. Convertir a TopoJSON
  const topology = geojson2topojson.topology({ [objectName]: normalizedGeoJSON });
  
  // 3. Simplificar geometrías. El threshold de topojson.simplify no es un
  // porcentaje de detalle y afecta especialmente a features pequeñas.
  const topologyAny: any = topology;
  const presimplified = topojson.presimplify(topologyAny);
  const simplified = topojson.simplify(presimplified, simplificationThreshold);

  // 4. Re-normalizar después de simplificar. La simplificación puede cambiar
  // anillos pequeños y dejar winding inválido para D3 en algunos países.
  const simplifiedGeoJSON = topojsonFeature(
    simplified as any,
    (simplified.objects as any)[objectName]
  );
  const finalGeoJSON = normalizeGeoJSON(simplifiedGeoJSON);
  const finalTopology = geojson2topojson.topology({ [objectName]: finalGeoJSON });
  
  const featureCount = (finalTopology.objects as any)?.[objectName]?.geometries?.length || 0;
  
  return { topology: finalTopology, featureCount };
}

/**
 * Cuenta características en un GeoJSON
 */
export function countFeatures(geojson: any): number {
  if (!geojson) return 0;
  if (geojson.type === 'FeatureCollection') {
    return geojson.features?.length || 0;
  }
  if (geojson.type === 'Feature') {
    return 1;
  }
  return 0;
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Normaliza texto para comparación (elimina acentos, minúsculas, etc.)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Formatea bytes a formato legible
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
