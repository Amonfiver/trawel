/**
 * Script de inspección de assets cartográficos para Trawel
 * 
 * Analiza archivos GeoJSON/TopoJSON descargados y extrae información útil
 * para evaluar si sirven como assets de mapa interno.
 * 
 * Uso: npx tsx scripts/inspect-map-asset.ts <ruta-al-geojson>
 */

import * as fs from 'fs';
import * as path from 'path';

// Colores para output en consola (ANSI)
export const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export function log(title: string, value: string | number, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS.bold}${title}:${COLORS.reset} ${COLORS[color]}${value}${COLORS.reset}`);
}

export function logSection(title: string) {
  console.log(`\n${COLORS.cyan}${COLORS.bold}═══ ${title} ═══${COLORS.reset}`);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function similarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Distancia de Levenshtein simplificada
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLen = Math.max(s1.length, s2.length);
  return maxLen === 0 ? 1 : (maxLen - matrix[s1.length][s2.length]) / maxLen;
}

// ============ TIPOS ============

export interface MapAssetAnalysis {
  filePath: string;
  fileSize: number;
  format: 'GeoJSON' | 'TopoJSON' | 'Unknown';
  featureCount: number;
  properties: string[];
  names: string[];
  searchResults: Record<string, { exact: string[]; similar: Array<{ name: string; score: number }> }>;
  metadata: any;
  isADM2: boolean;
}

// ============ FUNCIONES EXPORTABLES ============

/**
 * Extrae features de un objeto GeoJSON o TopoJSON
 */
export function extractFeatures(data: any): any[] {
  let features: any[] = [];
  
  if (data.type === 'FeatureCollection') {
    features = data.features || [];
  } else if (data.type === 'Feature') {
    features = [data];
  } else if (data.type === 'Topology' && data.objects) {
    // Convertir TopoJSON a features para análisis
    const objectKeys = Object.keys(data.objects);
    for (const key of objectKeys) {
      const obj = data.objects[key];
      if (obj && obj.geometries) {
        features = features.concat(
          obj.geometries.map((g: any) => ({
            type: 'Feature',
            geometry: g,
            properties: g.properties || {}
          }))
        );
      }
    }
  }
  
  return features;
}

/**
 * Analiza las propiedades disponibles en las features
 */
export function analyzeProperties(features: any[]): string[] {
  const allKeys = new Set<string>();
  features.forEach((f: any) => {
    if (f.properties) {
      Object.keys(f.properties).forEach(key => allKeys.add(key));
    }
  });
  return Array.from(allKeys).sort();
}

/**
 * Extrae todos los nombres únicos de los campos de nombre
 */
export function extractNames(features: any[], properties: string[]): string[] {
  const nameFields = properties.filter(k => 
    /name|nombre|label|title|nm|na/i.test(k)
  );
  
  const allNames = new Set<string>();
  nameFields.forEach(field => {
    features.forEach((f: any) => {
      const value = f.properties?.[field];
      if (value && typeof value === 'string') {
        allNames.add(value);
      }
    });
  });
  
  return Array.from(allNames).sort();
}

/**
 * Busca términos específicos en los nombres
 */
export function searchTerms(
  names: string[],
  searchTerms: string[]
): Record<string, { exact: string[]; similar: Array<{ name: string; score: number }> }> {
  const results: Record<string, { exact: string[]; similar: Array<{ name: string; score: number }> }> = {};
  
  searchTerms.forEach(term => {
    results[term] = { exact: [], similar: [] };
    
    names.forEach(name => {
      const normTerm = normalizeText(term);
      const normName = normalizeText(name);
      
      if (normName === normTerm || normName.includes(normTerm) || normTerm.includes(normName)) {
        results[term].exact.push(name);
      } else {
        const score = similarity(term, name);
        if (score > 0.5) {
          results[term].similar.push({ name, score });
        }
      }
    });
    
    // Ordenar similares por score
    results[term].similar.sort((a, b) => b.score - a.score);
  });
  
  return results;
}

/**
 * Detecta si el asset parece ser ADM2 (provincias)
 */
export function detectADM2Level(features: any[], names: string[], properties: string[]): boolean {
  const hasProvincias = names.some(n => 
    normalizeText(n).includes('castellon') || 
    normalizeText(n).includes('teruel') ||
    normalizeText(n).includes('madrid') ||
    normalizeText(n).includes('barcelona')
  );
  
  const hasLevelField = properties.some(k => /level|nivel|adm/i.test(k));
  const admLevelFromNames = features.some((f: any) => 
    f.properties?.shapeType?.includes('ADM2') || 
    f.properties?.shapeGroup?.includes('ADM2') ||
    f.properties?.level === 'ADM2'
  );
  
  return hasProvincias && (hasLevelField || admLevelFromNames || (names.length >= 40 && names.length <= 60));
}

/**
 * Analiza un archivo GeoJSON/TopoJSON y devuelve el análisis completo
 */
export function analyzeMapAsset(filePath: string): MapAssetAnalysis {
  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`El archivo no existe: ${absolutePath}`);
  }
  
  const stats = fs.statSync(absolutePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const data = JSON.parse(content);
  
  // Detectar formato
  let format: 'GeoJSON' | 'TopoJSON' | 'Unknown' = 'Unknown';
  if (data.type === 'Topology') {
    format = 'TopoJSON';
  } else if (data.type === 'FeatureCollection' || data.type === 'Feature') {
    format = 'GeoJSON';
  }
  
  // Extraer features
  const features = extractFeatures(data);
  
  // Analizar propiedades
  const properties = analyzeProperties(features);
  
  // Extraer nombres
  const names = extractNames(features, properties);
  
  // Buscar términos clave
  const searchTermsList = ['Castellón', 'Castelló', 'Teruel', 'Albarracín', 'Morella'];
  const searchResults = searchTerms(names, searchTermsList);
  
  // Detectar nivel ADM2
  const isADM2 = detectADM2Level(features, names, properties);
  
  return {
    filePath: absolutePath,
    fileSize: stats.size,
    format,
    featureCount: features.length,
    properties,
    names,
    searchResults,
    metadata: data.metadata || null,
    isADM2,
  };
}

/**
 * Muestra el análisis por consola de forma formateada
 */
export function displayAnalysis(analysis: MapAssetAnalysis): void {
  console.log(`${COLORS.bold}Inspeccionando asset cartográfico...${COLORS.reset}`);
  console.log(`${COLORS.dim}Ruta: ${analysis.filePath}${COLORS.reset}`);
  
  // 1. Información básica del archivo
  logSection('INFORMACIÓN DEL ARCHIVO');
  log('Nombre', path.basename(analysis.filePath));
  log('Tamaño', formatBytes(analysis.fileSize), analysis.fileSize > 1024 * 1024 ? 'yellow' : 'green');
  log('Formato', analysis.format, analysis.format !== 'Unknown' ? 'green' : 'red');
  
  // 2. Contenido geoespacial
  logSection('CONTENIDO GEOESPACIAL');
  log('Total features', analysis.featureCount, analysis.featureCount > 0 ? 'green' : 'red');
  
  // 3. Propiedades
  logSection('PROPIEDADES DISPONIBLES');
  console.log(`Propiedades encontradas (${analysis.properties.length}):`);
  analysis.properties.forEach(key => {
    console.log(`  • ${COLORS.dim}${key}${COLORS.reset}`);
  });
  
  // 4. Nombres
  logSection('ANÁLISIS DE NOMBRES');
  const nameFields = analysis.properties.filter(k => 
    /name|nombre|label|title|nm|na/i.test(k)
  );
  log('Campos de nombre detectados', nameFields.join(', ') || 'Ninguno', nameFields.length > 0 ? 'green' : 'yellow');
  log('Nombres únicos encontrados', analysis.names.length, analysis.names.length > 0 ? 'green' : 'red');
  
  if (analysis.names.length > 0 && analysis.names.length <= 30) {
    console.log('Lista completa:');
    analysis.names.forEach(name => console.log(`  • ${name}`));
  } else if (analysis.names.length > 30) {
    console.log('Primeros 30 nombres:');
    analysis.names.slice(0, 30).forEach(name => console.log(`  • ${name}`));
    console.log(`  ${COLORS.dim}... y ${analysis.names.length - 30} más${COLORS.reset}`);
  }
  
  // 5. Búsqueda de términos
  logSection('BÚSQUEDA DE TÉRMINOS CLAVE');
  const searchTermsList = ['Castellón', 'Castelló', 'Teruel', 'Albarracín', 'Morella'];
  
  searchTermsList.forEach(term => {
    const { exact, similar } = analysis.searchResults[term];
    
    if (exact.length > 0) {
      console.log(`${COLORS.green}✓${COLORS.reset} ${COLORS.bold}${term}${COLORS.reset}: ${COLORS.green}ENCONTRADO EXACTO${COLORS.reset}`);
      exact.forEach(name => console.log(`    "${name}"`));
    } else if (similar.length > 0) {
      console.log(`${COLORS.yellow}~${COLORS.reset} ${COLORS.bold}${term}${COLORS.reset}: ${COLORS.yellow}SIMILAR${COLORS.reset}`);
      similar.slice(0, 3).forEach(({ name, score }) => {
        console.log(`    "${name}" (${(score * 100).toFixed(0)}%)`);
      });
    } else {
      console.log(`${COLORS.red}✗${COLORS.reset} ${COLORS.bold}${term}${COLORS.reset}: ${COLORS.red}NO ENCONTRADO${COLORS.reset}`);
    }
  });
  
  // 6. Metadatos y licencia
  logSection('METADATOS Y LICENCIA');
  if (analysis.metadata) {
    console.log('Metadatos encontrados:');
    Object.entries(analysis.metadata).forEach(([key, value]) => {
      console.log(`  ${key}: ${COLORS.dim}${value}${COLORS.reset}`);
    });
  } else {
    console.log(`${COLORS.yellow}⚠ No se encontraron metadatos en el archivo${COLORS.reset}`);
    console.log(`${COLORS.dim}Nota: geoBoundaries gbOpen típicamente usa CC BY 4.0${COLORS.reset}`);
  }
  
  // 7. Conclusión
  logSection('CONCLUSIÓN PRELIMINAR');
  
  if (analysis.isADM2) {
    console.log(`${COLORS.green}✓ Parece ser ADM2 (provincias/nivel 2)${COLORS.reset}`);
    console.log(`  - Número de features (${analysis.featureCount}) coincide con ~52 provincias españolas`);
  } else if (analysis.names.length > 0 && analysis.names.length < 30) {
    console.log(`${COLORS.yellow}⚠ Parece ser ADM1 (autonomías/nivel 1)${COLORS.reset}`);
    console.log(`  - Solo ${analysis.names.length} regiones detectadas`);
  } else {
    console.log(`${COLORS.yellow}? Nivel administrativo no claro${COLORS.reset}`);
  }
  
  console.log(`\n${COLORS.dim}────────────────────────────────────${COLORS.reset}`);
}

// ============ MAIN ============

function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error(`${COLORS.red}Error: Debes especificar la ruta al archivo GeoJSON/TopoJSON${COLORS.reset}`);
    console.error(`Uso: npx tsx scripts/inspect-map-asset.ts <ruta-al-archivo>`);
    process.exit(1);
  }
  
  try {
    const analysis = analyzeMapAsset(filePath);
    displayAnalysis(analysis);
  } catch (error) {
    console.error(`${COLORS.red}Error: ${error}${COLORS.reset}`);
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente (no importado)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}