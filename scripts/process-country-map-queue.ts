#!/usr/bin/env node
/**
 * Worker de procesamiento de cola de assets cartográficos
 * 
 * Propósito:
 * Procesar registros en country_map_assets con status='queued' y generar
 * automáticamente el mapa interno del país en formato TopoJSON.
 * 
 * Flujo:
 * 1. Buscar registros con status='queued' en Supabase
 * 2. Para cada país: descargar geoBoundaries → procesar → subir a Storage
 * 3. Actualizar tabla con status='ready' y metadatos del asset
 * 
 * Uso:
 *   npm run maps:queue:process              # Procesar toda la cola
 *   npm run maps:queue:process -- --country mexico  # Procesar solo México
 *   npm run maps:queue:process -- --limit 1         # Procesar solo 1 elemento
 *   npm run maps:queue:process -- --country mexico --force  # Reprocesar aunque esté ready
 * 
 * Variables de entorno requeridas:
 *   SUPABASE_URL              - URL del proyecto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY - Clave de servicio (requerida para Storage)
 * 
 * DA-030: Sistema técnico de generación automática de mapas de Trawel
 */

import { createClient } from '@supabase/supabase-js';
import {
  fetchGeoBoundariesMetadata,
  extractGeoJsonUrl,
  extractLicenseInfo,
  downloadGeoJSON,
  convertToTopoJSON,
  formatBytes,
  resolveSimplificationThreshold,
} from './lib/mapAssetPipeline.js';
import { getPreferredAdminLevel } from '../src/features/map/config/countryMapProfiles.js';

// ============================================
// CONFIGURACIÓN Y TIPOS
// ============================================

interface WorkerConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  storageBucket: string;
  dryRun: boolean;
  force: boolean;
  countryFilter?: string;
  limit?: number;
}

interface QueuedRecord {
  id: string;
  country_slug: string;
  country_name: string | null;
  iso_alpha2: string | null;
  iso_alpha3: string | null;
  admin_level: string;
  source: string | null;
  status: string;
}

interface ProcessingResult {
  success: boolean;
  countrySlug: string;
  status: 'ready' | 'failed';
  featureCount?: number;
  sizeBytes?: number;
  storagePath?: string;
  errorMessage?: string;
}

// Colores para output en consola
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

// ============================================
// UTILIDADES DE CONSOLA
// ============================================

function log(title: string, value: string | number, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS.bold}${title}:${COLORS.reset} ${COLORS[color]}${value}${COLORS.reset}`);
}

function logSection(title: string) {
  console.log(`\n${COLORS.cyan}${COLORS.bold}═══ ${title} ═══${COLORS.reset}`);
}

function logError(message: string) {
  console.error(`${COLORS.red}✗ ${message}${COLORS.reset}`);
}

function logSuccess(message: string) {
  console.log(`${COLORS.green}✓ ${message}${COLORS.reset}`);
}

function logWarning(message: string) {
  console.log(`${COLORS.yellow}⚠ ${message}${COLORS.reset}`);
}

// ============================================
// PARSEADO DE ARGUMENTOS CLI
// ============================================

function parseArgs(): { country?: string; limit?: number; dryRun: boolean; force: boolean } {
  const args = process.argv.slice(2);
  const result: { country?: string; limit?: number; dryRun: boolean; force: boolean } = {
    dryRun: false,
    force: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--country' && i + 1 < args.length) {
      result.country = args[++i].toLowerCase().trim();
    } else if (arg === '--limit' && i + 1 < args.length) {
      const limit = parseInt(args[++i], 10);
      if (!isNaN(limit) && limit > 0) {
        result.limit = limit;
      }
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--force') {
      result.force = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return result;
}

function showHelp() {
  console.log(`
${COLORS.bold}Worker de procesamiento de cola de mapas${COLORS.reset}

Uso:
  npm run maps:queue:process [opciones]

Opciones:
  --country <slug>   Procesar solo un país específico (ej: mexico)
  --limit <n>        Procesar máximo n elementos de la cola
  --dry-run          Simular proceso sin modificar datos
  --force            Reprocesar el país indicado aunque no esté queued
  --help, -h         Mostrar esta ayuda

Ejemplos:
  npm run maps:queue:process              # Procesar toda la cola
  npm run maps:queue:process -- --country mexico     # Solo México
  npm run maps:queue:process -- --country mexico --force  # Reprocesar México aunque esté ready
  npm run maps:queue:process -- --limit 1            # Solo 1 elemento
  npm run maps:queue:process -- --country mexico --dry-run  # Simular

Variables de entorno requeridas:
  SUPABASE_URL              - URL de Supabase
  SUPABASE_SERVICE_ROLE_KEY - Clave de servicio
`);
}

// ============================================
// VALIDACIÓN DE CONFIGURACIÓN
// ============================================

function loadConfig(): WorkerConfig {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const args = parseArgs();

  if (args.force && !args.country) {
    logError('--force requiere --country <slug> para evitar reprocesados masivos');
    process.exit(1);
  }

  if (!supabaseUrl) {
    logError('Variable de entorno SUPABASE_URL no configurada');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    logError('Variable de entorno SUPABASE_SERVICE_ROLE_KEY no configurada');
    console.log(`${COLORS.dim}Nota: Se requiere service role key para acceso a Storage${COLORS.reset}`);
    process.exit(1);
  }

  return {
    supabaseUrl,
    supabaseServiceKey,
    storageBucket: 'map-assets',
    dryRun: args.dryRun,
    force: args.force,
    countryFilter: args.country,
    limit: args.limit,
  };
}

// ============================================
// OPERACIONES DE SUPABASE
// ============================================

async function getQueuedRecords(
  supabase: any,
  config: WorkerConfig
): Promise<QueuedRecord[]> {
  let query = supabase
    .from('country_map_assets')
    .select('id, country_slug, country_name, iso_alpha2, iso_alpha3, admin_level, source, status');

  if (!config.force) {
    query = query.eq('status', 'queued');
  }

  // Si hay filtro por país, buscar ese específico
  if (config.countryFilter) {
    query = query.eq('country_slug', config.countryFilter);
  }

  // Aplicar límite si existe
  if (config.limit) {
    query = query.limit(config.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error consultando cola: ${error.message}`);
  }

  return data || [];
}

async function updateStatusToGenerating(
  supabase: any,
  id: string,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`${COLORS.dim}[DRY-RUN] Actualizaría status a 'generating'${COLORS.reset}`);
    return;
  }

  const { error } = await supabase
    .from('country_map_assets')
    .update({
      status: 'generating',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Error actualizando a generating: ${error.message}`);
  }
}

async function updateStatusToReady(
  supabase: any,
  id: string,
  result: {
    storagePath: string;
    featureCount: number;
    sizeBytes: number;
    license: string;
    attribution: string;
    source: string;
    adminLevel: string;
  },
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`${COLORS.dim}[DRY-RUN] Actualizaría status a 'ready'${COLORS.reset}`);
    return;
  }

  const { error } = await supabase
    .from('country_map_assets')
    .update({
      status: 'ready',
      storage_path: result.storagePath,
      storage_bucket: 'map-assets',
      feature_count: result.featureCount,
      size_bytes: result.sizeBytes,
      license: result.license,
      attribution: result.attribution,
      source: result.source,
      admin_level: result.adminLevel,
      generated_at: new Date().toISOString(),
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Error actualizando a ready: ${error.message}`);
  }
}

async function updateStatusToFailed(
  supabase: any,
  id: string,
  errorMessage: string,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`${COLORS.dim}[DRY-RUN] Actualizaría status a 'failed': ${errorMessage}${COLORS.reset}`);
    return;
  }

  const { error } = await supabase
    .from('country_map_assets')
    .update({
      status: 'failed',
      error_message: errorMessage.substring(0, 1000), // Limitar longitud
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error(`${COLORS.red}Error crítico: no se pudo actualizar estado a failed: ${error.message}${COLORS.reset}`);
  }
}

// ============================================
// OPERACIONES DE STORAGE
// ============================================

async function uploadToStorage(
  supabase: any,
  config: WorkerConfig,
  countrySlug: string,
  topology: any,
  adminLevel: string
): Promise<{ path: string; sizeBytes: number }> {
  const objectName = `${countrySlug}-${adminLevel.toLowerCase()}`;
  const filePath = `countries/${countrySlug}/${objectName}.topojson`;
  
  // Convertir a Buffer para upload
  const content = JSON.stringify(topology);
  const buffer = Buffer.from(content, 'utf-8');
  
  if (config.dryRun) {
    console.log(`${COLORS.dim}[DRY-RUN] Subiría ${filePath} (${formatBytes(buffer.length)})${COLORS.reset}`);
    return { path: filePath, sizeBytes: buffer.length };
  }

  const { error } = await supabase.storage
    .from(config.storageBucket)
    .upload(filePath, buffer, {
      contentType: 'application/json',
      upsert: true,
    });

  if (error) {
    throw new Error(`Error subiendo a Storage: ${error.message}`);
  }

  return { path: filePath, sizeBytes: buffer.length };
}

// ============================================
// PROCESAMIENTO DE PAÍS
// ============================================

async function processCountry(
  supabase: any,
  config: WorkerConfig,
  record: QueuedRecord
): Promise<ProcessingResult> {
  const { id, country_slug, country_name, iso_alpha3, admin_level } = record;
  const preferredAdminLevel = getPreferredAdminLevel(country_slug);
  const effectiveAdminLevel = preferredAdminLevel || admin_level;
  
  console.log(`\n${COLORS.bold}Procesando: ${country_name || country_slug}${COLORS.reset}`);
  console.log(`${COLORS.dim}  ISO Alpha-3: ${iso_alpha3 || 'no especificado'}${COLORS.reset}`);
  console.log(`${COLORS.dim}  Admin Level: ${effectiveAdminLevel}${COLORS.reset}`);
  if (admin_level !== effectiveAdminLevel) {
    console.log(`${COLORS.dim}  Admin Level en DB: ${admin_level} -> perfil país: ${effectiveAdminLevel}${COLORS.reset}`);
  }
  console.log(`${COLORS.dim}  Status actual: ${record.status}${COLORS.reset}`);

  try {
    // 1. Actualizar estado a 'generating'
    await updateStatusToGenerating(supabase, id, config.dryRun);

    // 2. Validar que tenemos código ISO
    if (!iso_alpha3) {
      throw new Error('Se requiere iso_alpha3 para descargar de geoBoundaries');
    }

    // 3. Consultar metadata de geoBoundaries
    console.log(`  ${COLORS.dim}Consultando geoBoundaries API...${COLORS.reset}`);
    const metadata = await fetchGeoBoundariesMetadata(iso_alpha3, effectiveAdminLevel);
    
    // 4. Extraer URL de descarga
    const downloadUrl = extractGeoJsonUrl(metadata);
    if (!downloadUrl) {
      throw new Error('No se encontró URL de descarga GeoJSON en la metadata');
    }
    console.log(`  ${COLORS.dim}URL de descarga encontrada${COLORS.reset}`);

    // 5. Extraer información de licencia
    const licenseInfo = extractLicenseInfo(metadata);

    // 6. Descargar GeoJSON
    console.log(`  ${COLORS.dim}Descargando GeoJSON...${COLORS.reset}`);
    const geojsonContent = await downloadGeoJSON(downloadUrl);
    const geojson = JSON.parse(geojsonContent);
    console.log(`  ${COLORS.dim}GeoJSON descargado: ${formatBytes(geojsonContent.length)}${COLORS.reset}`);

    // 7. Procesar a TopoJSON
    const simplificationThreshold = resolveSimplificationThreshold({
      countrySlug: country_slug,
      adminLevel: effectiveAdminLevel,
    });
    console.log(`  ${COLORS.dim}Convirtiendo a TopoJSON...${COLORS.reset}`);
    console.log(`  ${COLORS.dim}Threshold de simplificación: ${simplificationThreshold}${COLORS.reset}`);
    const { topology, featureCount } = convertToTopoJSON(
      geojson,
      country_slug,
      {
        countrySlug: country_slug,
        adminLevel: effectiveAdminLevel,
      }
    );
    console.log(`  ${COLORS.dim}Features procesados: ${featureCount}${COLORS.reset}`);

    // 8. Subir a Storage
    const { path: storagePath, sizeBytes } = await uploadToStorage(
      supabase,
      config,
      country_slug,
      topology,
      effectiveAdminLevel
    );
    console.log(`  ${COLORS.dim}Subido a Storage: ${storagePath}${COLORS.reset}`);

    // 9. Actualizar estado a 'ready'
    await updateStatusToReady(supabase, id, {
      storagePath,
      featureCount,
      sizeBytes,
      license: licenseInfo.license,
      attribution: licenseInfo.attribution,
      source: 'geoBoundaries',
      adminLevel: effectiveAdminLevel,
    }, config.dryRun);

    logSuccess(`Procesamiento completado: ${country_slug}`);

    return {
      success: true,
      countrySlug: country_slug,
      status: 'ready',
      featureCount,
      sizeBytes,
      storagePath,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`Error procesando ${country_slug}: ${errorMessage}`);

    // Actualizar estado a 'failed'
    await updateStatusToFailed(supabase, id, errorMessage, config.dryRun);

    return {
      success: false,
      countrySlug: country_slug,
      status: 'failed',
      errorMessage,
    };
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log(`${COLORS.bold}${COLORS.cyan}
╔══════════════════════════════════════════════════════════════╗
║  Worker: Procesamiento de Cola de Mapas (DA-030)            ║
║  Trawel - Sistema Técnico de Mapas                          ║
╚══════════════════════════════════════════════════════════════╝
${COLORS.reset}\n`);

  // Cargar configuración
  const config = loadConfig();
  
  if (config.dryRun) {
    logWarning('MODO DRY-RUN: No se realizarán cambios en la base de datos');
  }
  if (config.force) {
    logWarning('MODO FORCE: se reprocesará el país indicado aunque no esté queued');
  }

  logSection('CONFIGURACIÓN');
  log('Supabase URL', config.supabaseUrl.replace(/https:\/\/([^.]+).*/, '$1...****'));
  log('Storage Bucket', config.storageBucket);
  if (config.countryFilter) log('Filtro país', config.countryFilter, 'yellow');
  if (config.limit) log('Límite', config.limit.toString(), 'yellow');
  if (config.force) log('Force', 'activado', 'yellow');

  // Crear cliente Supabase con service role
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Obtener registros en cola
  logSection('CONSULTANDO COLA');
  let queuedRecords: QueuedRecord[];
  
  try {
    queuedRecords = await getQueuedRecords(supabase, config);
  } catch (error) {
    logError(`Error consultando cola: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (queuedRecords.length === 0) {
    console.log(`${COLORS.yellow}No hay registros en cola para procesar${COLORS.reset}`);
    process.exit(0);
  }

  log('Registros encontrados', queuedRecords.length.toString(), 'cyan');

  // Procesar cada registro
  logSection('PROCESANDO REGISTROS');
  
  const results: ProcessingResult[] = [];
  
  for (const record of queuedRecords) {
    const result = await processCountry(supabase, config, record);
    results.push(result);
  }

  // Resumen final
  logSection('RESUMEN');
  
  const successful = results.filter(r => r.success && r.status === 'ready');
  const failed = results.filter(r => !r.success);

  console.log(`${COLORS.bold}Resultados:${COLORS.reset}`);
  console.log(`  ${COLORS.green}✓ Exitosos:${COLORS.reset} ${successful.length}`);
  console.log(`  ${COLORS.red}✗ Fallidos:${COLORS.reset} ${failed.length}`);

  if (successful.length > 0) {
    console.log(`\n${COLORS.bold}Assets generados:${COLORS.reset}`);
    successful.forEach(r => {
      console.log(`  • ${r.countrySlug}: ${r.featureCount} features, ${formatBytes(r.sizeBytes || 0)}`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n${COLORS.bold}Errores:${COLORS.reset}`);
    failed.forEach(r => {
      console.log(`  • ${r.countrySlug}: ${r.errorMessage}`);
    });
    process.exit(1);
  }

  console.log(`\n${COLORS.green}${COLORS.bold}✓ Proceso completado exitosamente${COLORS.reset}\n`);
}

// Ejecutar
main().catch(err => {
  console.error(`${COLORS.red}✗ Error fatal:${COLORS.reset}`, err);
  process.exit(1);
});
