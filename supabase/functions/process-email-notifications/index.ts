/**
 * Edge Function: process-email-notifications
 *
 * Stub seguro para la futura cola email_notification_queue.
 *
 * Estado actual:
 * - No envia emails reales.
 * - No procesa cola.
 * - No marca filas pending como sent.
 * - Si EMAIL_PROVIDER falta o es "disabled", responde desactivado.
 */

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
      { ok: false, reason: 'method_not_allowed' },
      405
    );
  }

  const emailProvider = normalizeProvider(Deno.env.get('EMAIL_PROVIDER'));

  if (!emailProvider || emailProvider === 'disabled') {
    return jsonResponse({
      ok: false,
      reason: 'email_provider_not_configured',
    });
  }

  return jsonResponse({
    ok: false,
    reason: 'email_processor_stub_only',
    provider: emailProvider,
  });
});

function normalizeProvider(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
