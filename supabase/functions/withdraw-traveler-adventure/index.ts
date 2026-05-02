/**
 * Edge Function: withdraw-traveler-adventure
 *
 * Propósito:
 * Retirar una aventura de viajero todavía pendiente usando un token privado.
 *
 * Seguridad:
 * - Usa SUPABASE_SERVICE_ROLE_KEY solo dentro de la Edge Function.
 * - Recibe el token en claro, calcula SHA-256 y compara contra el hash guardado.
 * - Solo permite retirar aventuras con status `pending`.
 *
 * Limitaciones:
 * - No borra físicamente la fila; marca `status = withdrawn` para mantener auditoría mínima.
 * - No envía emails ni recupera tokens perdidos.
 *
 * Cambios recientes:
 * - Función inicial para flujo token privado -> pending -> withdrawn.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface WithdrawAdventureInput {
  token: string;
}

interface TravelerAdventureWithdrawalRow {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { success: false, error: 'Método no permitido. Usa POST.' },
      405
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno no configuradas');
      return jsonResponse({ success: false, error: 'Error de configuración del servidor' }, 500);
    }

    const body = await readJsonBody(req);
    const validation = validateInput(body);

    if (!validation.valid) {
      return jsonResponse({ success: false, error: validation.error }, 400);
    }

    const tokenHash = await sha256Hex(validation.data.token);
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: adventure, error: queryError } = await supabase
      .from('traveler_adventures')
      .select('id,status')
      .eq('withdrawal_token_hash', tokenHash)
      .maybeSingle<TravelerAdventureWithdrawalRow>();

    if (queryError) {
      console.error('Error consultando token de retirada:', queryError);
      return jsonResponse({ success: false, error: 'No pudimos validar el token.' }, 500);
    }

    if (!adventure) {
      return jsonResponse({ success: false, error: 'El enlace o código de retirada no es válido.' }, 404);
    }

    if (adventure.status !== 'pending') {
      return jsonResponse(
        {
          success: false,
          error: 'Esta aventura ya no está pendiente y no puede retirarse con este enlace.',
        },
        409
      );
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('traveler_adventures')
      .update({
        status: 'withdrawn',
        withdrawn_at: now,
        moderation_notes: 'Retirada por token privado antes de revisión.',
        updated_at: now,
      })
      .eq('id', adventure.id)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Error retirando aventura:', updateError);
      return jsonResponse({ success: false, error: 'No pudimos retirar la aventura.' }, 500);
    }

    return jsonResponse({
      success: true,
      message: 'Tu aventura se ha retirado y ya no se revisará para publicación.',
    });
  } catch (error) {
    console.error('Error inesperado:', error);
    return jsonResponse({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

function validateInput(
  body: unknown
): { valid: true; data: WithdrawAdventureInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Body debe ser un objeto JSON válido.' };
  }

  const token = (body as Record<string, unknown>).token;

  if (typeof token !== 'string' || token.trim().length < 24) {
    return { valid: false, error: 'Token de retirada inválido.' };
  }

  return { valid: true, data: { token: token.trim() } };
}

async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
