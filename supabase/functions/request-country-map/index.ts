/**
 * Edge Function: request-country-map
 * 
 * Propósito:
 * Endpoint seguro para solicitar generación de mapas internos de países.
 * Actúa como puerta de entrada controlada para el sistema de generación automática (DA-030).
 * 
 * Seguridad:
 * - Usa SUPABASE_SERVICE_ROLE_KEY solo dentro de la Edge Function (nunca en frontend)
 * - Valida input antes de procesar
 * - No expone datos sensibles
 * 
 * Estados manejados:
 * - missing: Crea nuevo registro con status 'queued'
 * - queued/generating: Incrementa requested_count, actualiza last_requested_at
 * - ready: No regenera, solo incrementa métricas y devuelve estado
 * - failed/missing: Reintenta cambiando a 'queued' y limpiando error_message
 * 
 * Variables de entorno requeridas:
 * - SUPABASE_URL: URL del proyecto Supabase
 * - SUPABASE_SERVICE_ROLE_KEY: Clave de servicio (nunca expuesta al frontend)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

// ============================================
// TIPOS
// ============================================

interface RequestCountryMapInput {
  countrySlug: string;
  countryName?: string;
  isoAlpha2?: string;
  isoAlpha3?: string;
  adminLevel?: 'ADM0' | 'ADM1' | 'ADM2' | 'ADM3' | 'ADM4' | 'ADM5';
  source?: string;
}

interface RequestCountryMapResponse {
  success: boolean;
  countrySlug: string;
  status: 'missing' | 'queued' | 'generating' | 'ready' | 'failed';
  message: string;
  requestedCount: number;
  lastRequestedAt: string | null;
  error?: string;
}

// ============================================
// CORS
// ============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================
// VALIDACIÓN
// ============================================

/**
 * Valida el input de la solicitud
 */
function validateInput(body: unknown): { valid: true; data: RequestCountryMapInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Body debe ser un objeto JSON válido' };
  }

  const input = body as Record<string, unknown>;

  // countrySlug es obligatorio
  if (!input.countrySlug || typeof input.countrySlug !== 'string') {
    return { valid: false, error: 'countrySlug es obligatorio y debe ser string' };
  }

  const countrySlug = input.countrySlug.trim().toLowerCase();

  if (countrySlug.length < 2) {
    return { valid: false, error: 'countrySlug debe tener al menos 2 caracteres' };
  }

  if (!/^[a-z0-9-]+$/.test(countrySlug)) {
    return { valid: false, error: 'countrySlug solo puede contener letras minúsculas, números y guiones' };
  }

  const result: RequestCountryMapInput = {
    countrySlug,
    countryName: input.countryName && typeof input.countryName === 'string' 
      ? input.countryName.trim() 
      : undefined,
    isoAlpha2: input.isoAlpha2 && typeof input.isoAlpha2 === 'string' 
      ? input.isoAlpha2.trim().toUpperCase() 
      : undefined,
    isoAlpha3: input.isoAlpha3 && typeof input.isoAlpha3 === 'string' 
      ? input.isoAlpha3.trim().toUpperCase() 
      : undefined,
    adminLevel: validateAdminLevel(input.adminLevel) || 'ADM1',
    source: input.source && typeof input.source === 'string' 
      ? input.source.trim() 
      : 'unknown',
  };

  return { valid: true, data: result };
}

/**
 * Valida el nivel administrativo
 */
function validateAdminLevel(value: unknown): RequestCountryMapInput['adminLevel'] | null {
  if (!value || typeof value !== 'string') return null;
  
  const validLevels = ['ADM0', 'ADM1', 'ADM2', 'ADM3', 'ADM4', 'ADM5'];
  return validLevels.includes(value.toUpperCase()) 
    ? value.toUpperCase() as RequestCountryMapInput['adminLevel']
    : null;
}

// ============================================
// LÓGICA PRINCIPAL
// ============================================

/**
 * Maneja la solicitud de generación de mapa
 */
async function handleRequest(
  input: RequestCountryMapInput,
  supabase: ReturnType<typeof createClient>
): Promise<RequestCountryMapResponse> {
  const now = new Date().toISOString();

  // 1. Buscar registro existente
  const { data: existing, error: queryError } = await supabase
    .from('country_map_assets')
    .select('*')
    .eq('country_slug', input.countrySlug)
    .maybeSingle();

  if (queryError) {
    console.error('Error consultando registro:', queryError);
    throw new Error(`Error consultando base de datos: ${queryError.message}`);
  }

  // 2. Si no existe, crear nuevo registro con status 'queued'
  if (!existing) {
    const { data: inserted, error: insertError } = await supabase
      .from('country_map_assets')
      .insert({
        country_slug: input.countrySlug,
        country_name: input.countryName || null,
        iso_alpha2: input.isoAlpha2 || null,
        iso_alpha3: input.isoAlpha3 || null,
        admin_level: input.adminLevel,
        status: 'queued',
        source: input.source,
        requested_count: 1,
        last_requested_at: now,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando registro:', insertError);
      throw new Error(`Error creando solicitud: ${insertError.message}`);
    }

    return {
      success: true,
      countrySlug: input.countrySlug,
      status: 'queued',
      message: 'Solicitud de generación creada. El mapa será procesado pronto.',
      requestedCount: 1,
      lastRequestedAt: now,
    };
  }

  // 3. Si existe, manejar según el estado actual
  const currentStatus = existing.status as RequestCountryMapResponse['status'];
  
  switch (currentStatus) {
    case 'ready': {
      // NO regenerar, solo incrementar métricas
      const newCount = (existing.requested_count || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('country_map_assets')
        .update({
          requested_count: newCount,
          last_requested_at: now,
          updated_at: now,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error actualizando métricas:', updateError);
        // No es crítico, continuamos
      }

      return {
        success: true,
        countrySlug: input.countrySlug,
        status: 'ready',
        message: 'El mapa ya está disponible. Se ha registrado tu interés.',
        requestedCount: newCount,
        lastRequestedAt: now,
      };
    }

    case 'queued':
    case 'generating': {
      // Incrementar contador y actualizar timestamp
      const newCount = (existing.requested_count || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('country_map_assets')
        .update({
          requested_count: newCount,
          last_requested_at: now,
          updated_at: now,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error actualizando solicitud:', updateError);
        throw new Error(`Error actualizando solicitud: ${updateError.message}`);
      }

      return {
        success: true,
        countrySlug: input.countrySlug,
        status: currentStatus,
        message: currentStatus === 'queued' 
          ? 'El mapa está en cola de procesamiento. Pronto estará disponible.'
          : 'El mapa se está generando en este momento. Vuelve a consultar pronto.',
        requestedCount: newCount,
        lastRequestedAt: now,
      };
    }

    case 'failed':
    case 'missing': {
      // Reintentar: cambiar a queued, limpiar error, incrementar contador
      const newCount = (existing.requested_count || 0) + 1;
      
      const { data: updated, error: updateError } = await supabase
        .from('country_map_assets')
        .update({
          status: 'queued',
          error_message: null, // Limpiar error anterior
          requested_count: newCount,
          last_requested_at: now,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error reintentando solicitud:', updateError);
        throw new Error(`Error reintentando solicitud: ${updateError.message}`);
      }

      return {
        success: true,
        countrySlug: input.countrySlug,
        status: 'queued',
        message: 'Se ha reintentado la generación del mapa. Será procesado pronto.',
        requestedCount: newCount,
        lastRequestedAt: now,
      };
    }

    default: {
      // Estado desconocido, tratar como missing
      console.warn(`Estado desconocido: ${currentStatus}`);
      
      const { error: updateError } = await supabase
        .from('country_map_assets')
        .update({
          status: 'queued',
          requested_count: (existing.requested_count || 0) + 1,
          last_requested_at: now,
          updated_at: now,
        })
        .eq('id', existing.id);

      return {
        success: true,
        countrySlug: input.countrySlug,
        status: 'queued',
        message: 'Solicitud procesada. El mapa será generado.',
        requestedCount: (existing.requested_count || 0) + 1,
        lastRequestedAt: now,
      };
    }
  }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

Deno.serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  // Solo aceptar POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Método no permitido. Usa POST.' 
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // 1. Verificar variables de entorno
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno no configuradas');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error de configuración del servidor' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. Parsear body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Body JSON inválido' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 3. Validar input
    const validation = validateInput(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: validation.error 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 4. Crear cliente Supabase con service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 5. Procesar solicitud
    const result = await handleRequest(validation.data, supabase);

    // 6. Responder éxito
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error inesperado:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error interno del servidor';

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});