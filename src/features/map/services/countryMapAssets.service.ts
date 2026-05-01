/**
 * Servicio de consulta de assets cartográficos por país
 * 
 * Propósito:
 * Proveer acceso read-only a los metadatos de mapas internos almacenados en Supabase.
 * Este servicio es frontend-only y NO requiere service role key.
 * 
 * Alcance:
 * - Consultar tabla country_map_assets por country_slug
 * - Obtener URL pública de Storage cuando el asset está listo
 * - Validar estados y condiciones de disponibilidad
 * 
 * Decisiones técnicas:
 * - Usa cliente Supabase anónimo (RLS permite SELECT público)
 * - NO escribe en la base de datos (solo lectura)
 * - NO solicita generación (eso será responsabilidad de otro servicio)
 * - Devuelve null de forma segura cuando no hay registro
 * - Maneja errores sin romper la aplicación
 * 
 * Estados del mapa (DA-030):
 * - missing: No existe asset para este país
 * - queued: Solicitado, esperando worker
 * - generating: Procesando (descarga, conversión)
 * - ready: Asset disponible en Storage
 * - failed: Error en generación
 * 
 * Integración:
 * - Usado por hooks de mapa (useCountryMap) para conocer estado del asset
 * - SpainMap actual sigue usando asset local (no requiere este servicio todavía)
 * - CountryMap futuro usará este servicio para decidir si cargar desde Storage
 * 
 * Limitaciones:
 * - Solo consulta, no genera
 * - Requiere que el bucket 'map-assets' sea público para lectura
 * - No incluye caching (la capa superior puede implementarlo si es necesario)
 */

import { supabase, isSupabaseConfigured } from '../../../lib/supabaseClient';

// ============================================
// TIPOS
// ============================================

/**
 * Estados posibles del asset cartográfico de un país
 * @see DA-030 - Arquitectura de generación automática de mapas
 */
export type CountryMapAssetStatus = 
  | 'missing'      // No existe asset para este país
  | 'queued'       // Solicitado, esperando worker
  | 'generating'   // Procesando (descarga, conversión)
  | 'ready'        // Asset disponible en Storage
  | 'failed';      // Error en generación

/**
 * Metadatos del asset cartográfico de un país
 * 
 * Representa un registro de la tabla country_map_assets en Supabase.
 * Todos los campos son opcionales excepto los identificadores y estado.
 */
export interface CountryMapAsset {
  /** Identificador único UUID */
  id: string;
  
  /** Slug del país (ej: 'espana', 'francia', 'japon') - único por país */
  countrySlug: string;
  
  /** Nombre del país en español */
  countryName?: string;
  
  /** Código ISO 3166-1 alpha-2 (ej: 'ES', 'FR', 'JP') */
  isoAlpha2?: string;
  
  /** Código ISO 3166-1 alpha-3 (ej: 'ESP', 'FRA', 'JPN') */
  isoAlpha3?: string;
  
  /** Nivel administrativo: ADM0 (país), ADM1 (regiones), ADM2 (provincias), etc. */
  adminLevel: 'ADM0' | 'ADM1' | 'ADM2' | 'ADM3' | 'ADM4' | 'ADM5';
  
  /** Estado actual de generación del asset */
  status: CountryMapAssetStatus;
  
  /** Nombre del bucket en Supabase Storage (default: 'map-assets') */
  storageBucket?: string;
  
  /** Ruta relativa dentro del bucket (ej: 'countries/espana/espana-adm2.topojson') */
  storagePath?: string;
  
  /** Fuente de los datos cartográficos (ej: 'geoBoundaries') */
  source?: string;
  
  /** Licencia de los datos (ej: 'CC BY 4.0') */
  license?: string;
  
  /** Texto de atribución requerida */
  attribution?: string;
  
  /** Número de features (provincias, regiones) en el asset */
  featureCount?: number;
  
  /** Tamaño del archivo en bytes */
  sizeBytes?: number;
  
  /** Contador de solicitudes de generación (métrica de demanda) */
  requestedCount: number;
  
  /** Timestamp de última solicitud */
  lastRequestedAt?: Date;
  
  /** Timestamp de cuando se generó el asset */
  generatedAt?: Date;
  
  /** Mensaje de error (solo cuando status === 'failed') */
  errorMessage?: string;
  
  /** Timestamp de creación del registro */
  createdAt: Date;
  
  /** Timestamp de última actualización */
  updatedAt: Date;
}

// ============================================
// MAPEADORES
// ============================================

/**
 * Mapea un registro de Supabase al tipo CountryMapAsset
 */
function mapDBRecordToAsset(dbRecord: Record<string, unknown>): CountryMapAsset {
  return {
    id: dbRecord.id as string,
    countrySlug: dbRecord.country_slug as string,
    countryName: dbRecord.country_name as string | undefined,
    isoAlpha2: dbRecord.iso_alpha2 as string | undefined,
    isoAlpha3: dbRecord.iso_alpha3 as string | undefined,
    adminLevel: dbRecord.admin_level as CountryMapAsset['adminLevel'],
    status: dbRecord.status as CountryMapAssetStatus,
    storageBucket: dbRecord.storage_bucket as string | undefined,
    storagePath: dbRecord.storage_path as string | undefined,
    source: dbRecord.source as string | undefined,
    license: dbRecord.license as string | undefined,
    attribution: dbRecord.attribution as string | undefined,
    featureCount: dbRecord.feature_count as number | undefined,
    sizeBytes: dbRecord.size_bytes as number | undefined,
    requestedCount: (dbRecord.requested_count as number) ?? 0,
    lastRequestedAt: dbRecord.last_requested_at 
      ? new Date(dbRecord.last_requested_at as string) 
      : undefined,
    generatedAt: dbRecord.generated_at 
      ? new Date(dbRecord.generated_at as string) 
      : undefined,
    errorMessage: dbRecord.error_message as string | undefined,
    createdAt: new Date(dbRecord.created_at as string),
    updatedAt: new Date(dbRecord.updated_at as string),
  };
}

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Consulta el estado del asset cartográfico de un país
 * 
 * @param countrySlug - Slug del país (ej: 'espana', 'francia')
 * @returns Promise<CountryMapAsset | null> - Datos del asset o null si no existe
 * @throws No lanza errores - devuelve null en caso de fallo
 * 
 * @example
 * ```typescript
 * const asset = await getCountryMapAsset('francia');
 * if (!asset) {
 *   console.log('No hay registro para este país');
 * } else if (asset.status === 'ready') {
 *   console.log('Mapa disponible');
 * } else {
 *   console.log('Estado:', asset.status);
 * }
 * ```
 */
export async function getCountryMapAsset(
  countrySlug: string
): Promise<CountryMapAsset | null> {
  // Verificar que Supabase está configurado
  if (!isSupabaseConfigured()) {
    console.warn('[CountryMapAssets] Supabase no está configurado');
    return null;
  }

  try {
    const { data, error } = await supabase!
      .from('country_map_assets')
      .select('*')
      .eq('country_slug', countrySlug)
      .single();

    if (error) {
      // Código PGRST116 = no se encontró registro (no es error real)
      if (error.code === 'PGRST116') {
        return null;
      }
      
      console.error('[CountryMapAssets] Error consultando asset:', error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    return mapDBRecordToAsset(data);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[CountryMapAssets] Error inesperado:', errorMsg);
    return null;
  }
}

/**
 * Obtiene la URL pública del asset en Supabase Storage
 * 
 * Requisitos:
 * - El asset debe existir y tener status === 'ready'
 * - Debe tener storage_bucket y storage_path definidos
 * - El bucket debe ser público (policy SELECT pública)
 * 
 * @param asset - Objeto CountryMapAsset obtenido de getCountryMapAsset
 * @returns string | null - URL pública para descargar el TopoJSON, o null si no es válido
 * 
 * @example
 * ```typescript
 * const asset = await getCountryMapAsset('francia');
 * const url = getCountryMapPublicUrl(asset);
 * if (url) {
 *   const response = await fetch(url);
 *   const topojson = await response.json();
 * }
 * ```
 */
export function getCountryMapPublicUrl(asset: CountryMapAsset | null): string | null {
  // Validaciones previas
  if (!asset) {
    return null;
  }

  if (asset.status !== 'ready') {
    console.warn(
      `[CountryMapAssets] Asset no está listo. Status: ${asset.status}`
    );
    return null;
  }

  if (!asset.storageBucket || !asset.storagePath) {
    console.warn(
      '[CountryMapAssets] Asset no tiene storage_bucket o storage_path definidos'
    );
    return null;
  }

  // Verificar que Supabase está configurado
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[CountryMapAssets] Supabase no está configurado');
    return null;
  }

  try {
    const { data } = supabase.storage
      .from(asset.storageBucket)
      .getPublicUrl(asset.storagePath);

    if (!data?.publicUrl) {
      console.warn('[CountryMapAssets] No se pudo obtener URL pública');
      return null;
    }

    return data.publicUrl;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[CountryMapAssets] Error obteniendo URL:', errorMsg);
    return null;
  }
}

/**
 * Verifica si el asset de un país está listo para usar
 * 
 * Helper conveniente para evitar verificar manualmente el status
 * 
 * @param asset - Objeto CountryMapAsset o null
 * @returns boolean - true si el asset existe y está en estado 'ready'
 * 
 * @example
 * ```typescript
 * const asset = await getCountryMapAsset('francia');
 * if (isCountryMapReady(asset)) {
 *   // Cargar y mostrar el mapa
 * }
 * ```
 */
export function isCountryMapReady(asset: CountryMapAsset | null): boolean {
  return asset !== null && asset.status === 'ready';
}