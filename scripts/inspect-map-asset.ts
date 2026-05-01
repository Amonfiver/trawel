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
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(title: string, value: string | number, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS.bold}${title}:${COLORS.reset} ${COLORS[color]}${value}${COLORS.reset}`);
}

function logSection(title: string) {
  console.log(`\n${COLORS.cyan}${COLORS.bold}═══ ${title} ═══${COLORS.reset}`);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function similarity(str1: string, str2: string): number {
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

// ============ MAIN ============

const filePath = process.argv[2];

if (!filePath) {
  console.error(`${COLORS.red}Error: Debes especificar la ruta al archivo GeoJSON/TopoJSON${COLORS.reset}`);
  console.error(`Uso: npx tsx scripts/inspect-map-asset.ts <ruta-al-archivo>`);
  process.exit(1);
}

const absolutePath = path.resolve(filePath);

if (!fs.existsSync(absolutePath)) {
  console.error(`${COLORS.red}Error: El archivo no existe: ${absolutePath}${COLORS.reset}`);
  process.exit(1);
}

console.log(`${COLORS.bold}Inspeccionando asset cartográfico...${COLORS.reset}`);
console.log(`${COLORS.dim}Ruta: ${absolutePath}${COLORS.reset}`);

// 1. Información básica del archivo
logSection('INFORMACIÓN DEL ARCHIVO');

const stats = fs.statSync(absolutePath);
log('Nombre', path.basename(absolutePath));
log('Tamaño', formatBytes(stats.size), stats.size > 1024 * 1024 ? 'yellow' : 'green');
log('Modificado', stats.mtime.toISOString().split('T')[0]);

// 2. Leer y parsear contenido
let content: string;
let data: any;

try {
  content = fs.readFileSync(absolutePath, 'utf-8');
  data = JSON.parse(content);
} catch (error) {
  console.error(`${COLORS.red}Error al parsear JSON: ${error}${COLORS.reset}`);
  process.exit(1);
}

// 3. Detectar tipo (GeoJSON vs TopoJSON)
logSection('TIPO DE ARCHIVO');

let isTopoJSON = false;
let isGeoJSON = false;

if (data.type === 'Topology') {
  isTopoJSON = true;
  log('Formato', 'TopoJSON', 'green');
  log('Objetos', Object.keys(data.objects || {}).join(', ') || 'Ninguno', 'yellow');
} else if (data.type === 'FeatureCollection' || data.type === 'Feature') {
  isGeoJSON = true;
  log('Formato', 'GeoJSON', 'green');
} else {
  log('Formato', `Desconocido (${data.type})`, 'red');
}

// 4. Extraer features
logSection('CONTENIDO GEOESPACIAL');

let features: any[] = [];

if (isGeoJSON && data.type === 'FeatureCollection') {
  features = data.features || [];
} else if (isGeoJSON && data.type === 'Feature') {
  features = [data];
} else if (isTopoJSON && data.objects) {
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

log('Total features', features.length, features.length > 0 ? 'green' : 'red');

if (features.length === 0) {
  console.error(`${COLORS.red}No se encontraron features para analizar${COLORS.reset}`);
  process.exit(1);
}

// 5. Analizar propiedades
logSection('PROPIEDADES DISPONIBLES');

// Recolectar todas las keys de properties
const allKeys = new Set<string>();
features.forEach((f: any) => {
  if (f.properties) {
    Object.keys(f.properties).forEach(key => allKeys.add(key));
  }
});

const sortedKeys = Array.from(allKeys).sort();
console.log(`Propiedades encontradas (${sortedKeys.length}):`);
sortedKeys.forEach(key => {
  const values = features
    .map((f: any) => f.properties?.[key])
    .filter((v: any) => v !== undefined && v !== null)
    .slice(0, 3);
  const sample = values.length > 0 ? ` (ej: ${values.map((v: any) => `"${v}"`).join(', ')})` : '';
  console.log(`  • ${COLORS.dim}${key}${COLORS.reset}${sample}`);
});

// 6. Buscar campos de nombre
logSection('ANÁLISIS DE NOMBRES');

const nameFields = sortedKeys.filter(k => 
  /name|nombre|label|title|nm|na/i.test(k)
);

log('Campos de nombre detectados', nameFields.join(', ') || 'Ninguno', nameFields.length > 0 ? 'green' : 'yellow');

// Extraer todos los nombres únicos
const allNames = new Set<string>();
nameFields.forEach(field => {
  features.forEach((f: any) => {
    const value = f.properties?.[field];
    if (value && typeof value === 'string') {
      allNames.add(value);
    }
  });
});

const uniqueNames = Array.from(allNames).sort();
log('Nombres únicos encontrados', uniqueNames.length, uniqueNames.length > 0 ? 'green' : 'red');

if (uniqueNames.length > 0 && uniqueNames.length <= 30) {
  console.log('Lista completa:');
  uniqueNames.forEach(name => console.log(`  • ${name}`));
} else if (uniqueNames.length > 30) {
  console.log('Primeros 30 nombres:');
  uniqueNames.slice(0, 30).forEach(name => console.log(`  • ${name}`));
  console.log(`  ${COLORS.dim}... y ${uniqueNames.length - 30} más${COLORS.reset}`);
}

// 7. Búsqueda de términos específicos
logSection('BÚSQUEDA DE TÉRMINOS CLAVE');

const searchTerms = ['Castellón', 'Castelló', 'Teruel', 'Albarracín', 'Morella'];
const results: Record<string, { exact: string[]; similar: Array<{ name: string; score: number }> }> = {};

searchTerms.forEach(term => {
  results[term] = { exact: [], similar: [] };
  
  uniqueNames.forEach(name => {
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

// Mostrar resultados
searchTerms.forEach(term => {
  const { exact, similar } = results[term];
  
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

// 8. Verificar licencia en metadatos
logSection('METADATOS Y LICENCIA');

if (data.metadata) {
  console.log('Metadatos encontrados:');
  Object.entries(data.metadata).forEach(([key, value]) => {
    console.log(`  ${key}: ${COLORS.dim}${value}${COLORS.reset}`);
  });
} else {
  console.log(`${COLORS.yellow}⚠ No se encontraron metadatos en el archivo${COLORS.reset}`);
  console.log(`${COLORS.dim}Nota: geoBoundaries gbOpen típicamente usa CC BY 4.0${COLORS.reset}`);
  console.log(`${COLORS.dim}Verificar en: https://www.geoboundaries.org/license.html${COLORS.reset}`);
}

// 9. Conclusión
logSection('CONCLUSIÓN PRELIMINAR');

const hasProvincias = uniqueNames.some(n => 
  normalizeText(n).includes('castellon') || 
  normalizeText(n).includes('teruel') ||
  normalizeText(n).includes('madrid') ||
  normalizeText(n).includes('barcelona')
);

const hasLevelField = sortedKeys.some(k => /level|nivel|adm/i.test(k));
const admLevelFromNames = features.some((f: any) => 
  f.properties?.shapeType?.includes('ADM2') || 
  f.properties?.shapeGroup?.includes('ADM2') ||
  f.properties?.level === 'ADM2'
);

if (hasProvincias && (hasLevelField || admLevelFromNames || uniqueNames.length >= 40 && uniqueNames.length <= 60)) {
  console.log(`${COLORS.green}✓ Parece ser ADM2 (provincias/nivel 2)${COLORS.reset}`);
  console.log(`  - Número de features (${features.length}) coincide con ~52 provincias españolas`);
} else if (uniqueNames.length > 0 && uniqueNames.length < 30) {
  console.log(`${COLORS.yellow}⚠ Parece ser ADM1 (autonomías/nivel 1)${COLORS.reset}`);
  console.log(`  - Solo ${uniqueNames.length} regiones detectadas`);
} else {
  console.log(`${COLORS.yellow}? Nivel administrativo no claro${COLORS.reset}`);
}

console.log(`\n${COLORS.dim}────────────────────────────────────${COLORS.reset}`);
console.log('Recomendación: Verificar fuente oficial en');
console.log('https://www.geoboundaries.org/');