/**
 * Script de optimización de asset cartográfico para España
 * 
 * Convierte el GeoJSON raw (40+ MB) a TopoJSON optimizado (<100KB objetivo)
 * 
 * Proceso:
 * 1. Lee el GeoJSON raw descargado de geoBoundaries
 * 2. Convierte a TopoJSON (formato más compacto)
 * 3. Simplifica geometrías manteniendo forma recognoscible
 * 4. Valida que se conserven todas las provincias y propiedades clave
 * 5. Guarda el asset optimizado
 * 
 * Uso: npm run maps:spain:optimize
 */

import * as fs from 'fs';
import * as path from 'path';
import * as geojson2topojson from 'topojson-server';
import * as topojson from 'topojson-simplify';

// Dependencias utilizadas:
// - topojson-server: Convierte GeoJSON a TopoJSON (formato estándar D3)
// - topojson-simplify: Simplifica geometrías TopoJSON preservando topología

const CONFIG = {
  inputFile: 'public/maps/countries/spain/spain-adm2-raw.geojson',
  outputFile: 'public/maps/countries/spain/spain-adm2.topojson',
  // Nivel de simplificación: 0.01 = 1% de detalle (muy agresivo pero reconoscible)
  // 0.05 = 5% (balance), 0.1 = 10% (conservador)
  simplificationFactor: 0.05,
  targetSizeKB: 100,
  acceptableSizeKB: 250,
};

// Colores para consola
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
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

// ============ MAIN ============

async function main() {
  console.log(`${COLORS.bold}${COLORS.cyan}
╔══════════════════════════════════════════════════════════╗
║  Optimización: Asset España ADM2 (GeoJSON → TopoJSON)   ║
╚══════════════════════════════════════════════════════════╝
${COLORS.reset}\n`);

  const inputPath = path.resolve(CONFIG.inputFile);
  const outputPath = path.resolve(CONFIG.outputFile);

  // PASO 1: Verificar archivo de entrada
  logSection('PASO 1: VERIFICAR ARCHIVO DE ENTRADA');
  
  if (!fs.existsSync(inputPath)) {
    console.error(`${COLORS.red}✗ ERROR: No se encuentra el archivo de entrada${COLORS.reset}`);
    console.error(`  ${inputPath}`);
    console.error(`\nEjecuta primero: npm run maps:spain:prepare`);
    process.exit(1);
  }

  const inputStats = fs.statSync(inputPath);
  log('Archivo raw', CONFIG.inputFile);
  log('Tamaño raw', formatBytes(inputStats.size), inputStats.size > 1024 * 1024 ? 'yellow' : 'green');

  // PASO 2: Leer GeoJSON
  logSection('PASO 2: LEER GEOJSON');
  
  console.log(`Leyendo GeoJSON...`);
  const geojsonContent = fs.readFileSync(inputPath, 'utf-8');
  const geojson = JSON.parse(geojsonContent);
  
  const originalFeatures = geojson.features?.length || 0;
  log('Features originales', originalFeatures, originalFeatures > 0 ? 'green' : 'red');
  
  if (originalFeatures === 0) {
    console.error(`${COLORS.red}✗ ERROR: No se encontraron features en el GeoJSON${COLORS.reset}`);
    process.exit(1);
  }

  // Verificar propiedades de provincias clave antes de convertir
  const names = geojson.features.map((f: any) => f.properties?.shapeName).filter(Boolean);
  const hasCastellon = names.some((n: string) => normalizeText(n).includes('castellon'));
  const hasTeruel = names.some((n: string) => normalizeText(n).includes('teruel'));
  
  log('Provincia Castellón', hasCastellon ? '✓ Encontrada' : '✗ No encontrada', hasCastellon ? 'green' : 'red');
  log('Provincia Teruel', hasTeruel ? '✓ Encontrada' : '✗ No encontrada', hasTeruel ? 'green' : 'red');

  // PASO 3: Convertir a TopoJSON
  logSection('PASO 3: CONVERTIR A TOPOJSON');
  
  console.log(`Convirtiendo GeoJSON a TopoJSON...`);
  
  // Usar topojson-server para convertir
  // El objeto debe tener una clave para cada colección de geometrías
  const topology = geojson2topojson.topology({ spain: geojson });
  
  log('Objetos en topología', Object.keys(topology.objects).join(', '));
  
  // PASO 4: Simplificar geometrías
  logSection('PASO 4: SIMPLIFICAR GEOMETRÍAS');
  
  console.log(`Factor de simplificación: ${(CONFIG.simplificationFactor * 100).toFixed(1)}%`);
  
  // Preservar topología durante la simplificación
  // Usar any para evitar problemas de tipos con las librerías de topojson
  const topologyAny: any = topology;
  const simplified: any = topojson.presimplify(topologyAny);
  const simplifiedTopology = topojson.simplify(simplified, CONFIG.simplificationFactor);
  
  // PASO 5: Guardar resultado
  logSection('PASO 5: GUARDAR TOPOJSON OPTIMIZADO');
  
  // Asegurar que el directorio existe
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Guardar con formato compacto (sin espacios)
  const topojsonString = JSON.stringify(simplifiedTopology);
  fs.writeFileSync(outputPath, topojsonString);
  
  const outputStats = fs.statSync(outputPath);
  const compressionRatio = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
  
  log('Archivo guardado', CONFIG.outputFile);
  log('Tamaño final', formatBytes(outputStats.size), outputStats.size <= CONFIG.targetSizeKB * 1024 ? 'green' : outputStats.size <= CONFIG.acceptableSizeKB * 1024 ? 'yellow' : 'red');
  log('Ratio de compresión', `${compressionRatio}%`);

  // PASO 6: Validar resultado
  logSection('PASO 6: VALIDAR RESULTADO');
  
  const outputTopo = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  const outputGeometries = outputTopo.objects?.spain?.geometries?.length || 0;
  
  log('Geometrías en TopoJSON', outputGeometries, outputGeometries === originalFeatures ? 'green' : 'yellow');
  
  // Verificar que las provincias clave siguen presentes
  const outputNames = outputTopo.objects?.spain?.geometries?.map((g: any) => g.properties?.shapeName).filter(Boolean) || [];
  const outputHasCastellon = outputNames.some((n: string) => normalizeText(n).includes('castellon'));
  const outputHasTeruel = outputNames.some((n: string) => normalizeText(n).includes('teruel'));
  
  log('Castellón presente', outputHasCastellon ? '✓ Sí' : '✗ No', outputHasCastellon ? 'green' : 'red');
  log('Teruel presente', outputHasTeruel ? '✓ Sí' : '✗ No', outputHasTeruel ? 'green' : 'red');
  
  // Verificar arcos (medida de complejidad del TopoJSON)
  const arcCount = outputTopo.arcs?.length || 0;
  log('Número de arcos', arcCount, 'cyan');

  // PASO 7: Resumen final
  logSection('RESUMEN FINAL');
  
  console.log(`${COLORS.bold}Transformación:${COLORS.reset}`);
  console.log(`  ${formatBytes(inputStats.size)} → ${formatBytes(outputStats.size)} (${compressionRatio}% reducción)`);
  
  console.log(`\n${COLORS.bold}Archivos:${COLORS.reset}`);
  console.log(`  📄 Raw:      ${CONFIG.inputFile}`);
  console.log(`  📄 Optimizado: ${CONFIG.outputFile}`);
  
  console.log(`\n${COLORS.bold}Validación:${COLORS.reset}`);
  console.log(`  • Features:   ${originalFeatures} → ${outputGeometries} ${originalFeatures === outputGeometries ? '✓' : '⚠'}`);
  console.log(`  • Castellón:  ${outputHasCastellon ? '✓' : '✗'}`);
  console.log(`  • Teruel:     ${outputHasTeruel ? '✓' : '✗'}`);
  
  // Conclusión
  const sizeOK = outputStats.size <= CONFIG.acceptableSizeKB * 1024;
  const featuresOK = outputGeometries === originalFeatures;
  const keysOK = outputHasCastellon && outputHasTeruel;
  
  console.log(`\n${COLORS.bold}Conclusión:${COLORS.reset}`);
  
  if (sizeOK && featuresOK && keysOK) {
    console.log(`${COLORS.green}✓ ASSET APTO PARA PRODUCCIÓN${COLORS.reset}`);
    console.log(`  El TopoJSON optimizado está listo para integración visual.`);
    
    if (outputStats.size <= CONFIG.targetSizeKB * 1024) {
      console.log(`  ${COLORS.green}✓ Tamaño ideal (<${CONFIG.targetSizeKB}KB)${COLORS.reset}`);
    } else {
      console.log(`  ${COLORS.yellow}⚠ Tamaño aceptable pero no ideal (>${CONFIG.targetSizeKB}KB)${COLORS.reset}`);
      console.log(`    Considera aumentar simplificaciónFactor a 0.1 si la forma se mantiene`);
    }
  } else {
    console.log(`${COLORS.yellow}⚠ ASSET NECESITA REVISIÓN${COLORS.reset}`);
    if (!sizeOK) console.log(`  - Tamaño excesivo: ${formatBytes(outputStats.size)}`);
    if (!featuresOK) console.log(`  - Pérdida de features: ${originalFeatures - outputGeometries}`);
    if (!keysOK) console.log(`  - Faltan provincias clave`);
  }
  
  console.log('');
}

main().catch(err => {
  console.error(`${COLORS.red}✗ Error inesperado:${COLORS.reset}`, err);
  process.exit(1);
});