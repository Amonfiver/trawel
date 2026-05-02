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
 * - Solicitar generación de mapas mediante Edge Function (request-country-map)
 * - Validar estados y condiciones de disponibilidad
 * 
 * Decisiones técnicas:
 * - Usa cliente Supabase anónimo (RLS permite SELECT público)
 * - Usa supabase.functions.invoke para llamar Edge Functions
 * - NO escribe directamente en la base de datos (usa Edge Function segura)
 * - NO usa service role key en frontend
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
 * - Requiere que el bucket 'map-assets' sea público para lectura
 * - No incluye caching (la capa superior puede implementarlo si es necesario)
 */

import { supabase, isSupabaseConfigured } from '../../../lib/supabaseClient';
import type { CountryMapAdminLevel } from '../config/countryMapProfiles';

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
 * @throws Lanza errores reales de consulta. Devuelve null solo si no existe registro.
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
  countrySlug: string,
  adminLevel?: CountryMapAdminLevel
): Promise<CountryMapAsset | null> {
  // Verificar que Supabase está configurado
  if (!isSupabaseConfigured()) {
    console.warn('[CountryMapAssets] Supabase no está configurado');
    return null;
  }

  try {
    let query = supabase!
      .from('country_map_assets')
      .select('*')
      .eq('country_slug', countrySlug);

    if (adminLevel) {
      query = query.eq('admin_level', adminLevel);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      // Compatibilidad: PGRST116/406 era el caso "sin fila" al usar .single().
      if (error.code === 'PGRST116') {
        return null;
      }
      
      console.error('[CountryMapAssets] Error consultando asset:', error.message);
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapDBRecordToAsset(data);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[CountryMapAssets] Error inesperado:', errorMsg);
    throw err;
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

    return addAssetCacheBuster(data.publicUrl, asset);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[CountryMapAssets] Error obteniendo URL:', errorMsg);
    return null;
  }
}

function addAssetCacheBuster(publicUrl: string, asset: CountryMapAsset): string {
  const version =
    asset.generatedAt?.toISOString() ||
    asset.updatedAt?.toISOString() ||
    (asset.sizeBytes !== undefined ? String(asset.sizeBytes) : null);

  if (!version) {
    return publicUrl;
  }

  const separator = publicUrl.includes('?') ? '&' : '?';
  return `${publicUrl}${separator}v=${encodeURIComponent(version)}`;
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

// ============================================
// SOLICITUD DE GENERACIÓN (Edge Function)
// ============================================

/**
 * Input para solicitar generación de mapa
 */
export interface RequestCountryMapGenerationInput {
  /** Slug del país (obligatorio) - ej: 'mexico', 'francia', 'japon' */
  countrySlug: string;
  /** Nombre del país (opcional pero recomendable) - ej: 'México' */
  countryName?: string;
  /** Código ISO Alpha-2 (opcional) - ej: 'MX' */
  isoAlpha2?: string;
  /** Código ISO Alpha-3 (recomendable para geoBoundaries) - ej: 'MEX' */
  isoAlpha3?: string;
  /** Nivel administrativo (default: ADM2) */
  adminLevel?: 'ADM0' | 'ADM1' | 'ADM2' | 'ADM3' | 'ADM4' | 'ADM5';
  /** Fuente de datos (default: 'unknown') */
  source?: string;
}

/**
 * Respuesta de la solicitud de generación de mapa
 */
export interface RequestCountryMapGenerationResponse {
  success: boolean;
  countrySlug: string;
  status: 'missing' | 'queued' | 'generating' | 'ready' | 'failed';
  message: string;
  requestedCount: number;
  lastRequestedAt: string | null;
  error?: string;
}

/**
 * Solicita la generación de un mapa interno de país mediante Edge Function
 * 
 * Esta función invoca la Edge Function 'request-country-map' de forma segura,
 * sin exponer service role key en el frontend.
 * 
 * Comportamiento por estado:
 * - missing: Crea nuevo registro con status 'queued'
 * - queued/generating: Incrementa requested_count, actualiza last_requested_at
 * - ready: No regenera, solo incrementa métricas y devuelve estado
 * - failed/missing: Reintenta cambiando a 'queued' y limpiando error_message
 * 
 * @param input - Datos del país para generar el mapa
 * @returns Promise con la respuesta de la Edge Function
 * @throws No lanza errores - devuelve objeto con success: false en caso de fallo
 * 
 * @example
 * ```typescript
 * const result = await requestCountryMapGeneration({
 *   countrySlug: 'mexico',
 *   countryName: 'México',
 *   isoAlpha2: 'MX',
 *   isoAlpha3: 'MEX',
 *   adminLevel: 'ADM1',
 *   source: 'world_map'
 * });
 * 
 * if (result.success) {
 *   console.log('Estado:', result.status);
 *   console.log('Mensaje:', result.message);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export async function requestCountryMapGeneration(
  input: RequestCountryMapGenerationInput
): Promise<RequestCountryMapGenerationResponse> {
  // Verificar que Supabase está configurado
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[CountryMapAssets] Supabase no está configurado');
    return {
      success: false,
      countrySlug: input.countrySlug,
      status: 'missing',
      message: 'Supabase no está configurado',
      requestedCount: 0,
      lastRequestedAt: null,
      error: 'Supabase no está configurado. Verifica las variables de entorno.',
    };
  }

  try {
    const payload = {
      countrySlug: input.countrySlug,
      countryName: input.countryName,
      isoAlpha2: input.isoAlpha2,
      isoAlpha3: input.isoAlpha3,
      adminLevel: input.adminLevel,
      source: input.source,
    };

    const { data, error } = await supabase.functions.invoke('request-country-map', {
      body: payload,
    });

    if (error) {
      console.error('[CountryMapAssets] Error invocando Edge Function:', error);
      return {
        success: false,
        countrySlug: input.countrySlug,
        status: 'missing',
        message: 'Error al solicitar generación del mapa',
        requestedCount: 0,
        lastRequestedAt: null,
        error: error.message || 'Error desconocido al invocar Edge Function',
      };
    }

    if (!data || typeof data !== 'object') {
      return {
        success: false,
        countrySlug: input.countrySlug,
        status: 'missing',
        message: 'No se recibió respuesta de la Edge Function',
        requestedCount: 0,
        lastRequestedAt: null,
        error: 'Respuesta vacía de la Edge Function',
      };
    }

    const response = data as Partial<RequestCountryMapGenerationResponse>;
    const success = response.success === true;
    const status = isCountryMapAssetStatus(response.status) ? response.status : 'missing';

    return {
      success,
      countrySlug: response.countrySlug || input.countrySlug,
      status,
      message: response.message || (success ? 'Solicitud procesada' : 'La Edge Function devolvió un error'),
      requestedCount: response.requestedCount ?? 0,
      lastRequestedAt: response.lastRequestedAt ?? null,
      error: response.error,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[CountryMapAssets] Error inesperado:', errorMsg);
    return {
      success: false,
      countrySlug: input.countrySlug,
      status: 'missing',
      message: 'Error inesperado al solicitar generación',
      requestedCount: 0,
      lastRequestedAt: null,
      error: errorMsg,
    };
  }
}

function isCountryMapAssetStatus(value: unknown): value is RequestCountryMapGenerationResponse['status'] {
  return (
    value === 'missing' ||
    value === 'queued' ||
    value === 'generating' ||
    value === 'ready' ||
    value === 'failed'
  );
}
