/**
 * Edge Function: process-email-notifications
 *
 * Procesa email_notification_queue desde backend seguro.
 *
 * Seguridad:
 * - No usa secrets en frontend.
 * - No envia nada si falta configuracion SMTP obligatoria.
 * - EMAIL_DRY_RUN queda activo por defecto salvo EMAIL_DRY_RUN="false".
 * - No escribe contrasenas ni secrets en logs ni en la base de datos.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

type SupabaseClient = ReturnType<typeof createClient>;

interface EmailQueueRow {
  id: string;
  notification_type: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body_text: string;
  body_html: string | null;
  scheduled_for: string | null;
  metadata: Record<string, unknown>;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  replyTo: string;
  dryRun: boolean;
}

interface ProcessedEmailResult {
  id: string;
  recipient_email: string;
  notification_type: string;
  status: 'dry_run' | 'sent' | 'failed';
  provider?: 'hostinger_smtp';
  provider_message_id?: string;
  error_message?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_BATCH_LIMIT = 5;
const MAX_BATCH_LIMIT = 10;
const PROVIDER = 'hostinger_smtp';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, reason: 'method_not_allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const smtpConfig = readSmtpConfig();

  if (!supabaseUrl || !serviceRoleKey || !smtpConfig.ok) {
    return jsonResponse({
      ok: false,
      reason: 'email_provider_not_configured',
      missing: [
        ...(!supabaseUrl ? ['SUPABASE_URL'] : []),
        ...(!serviceRoleKey ? ['SUPABASE_SERVICE_ROLE_KEY'] : []),
        ...(smtpConfig.ok ? [] : smtpConfig.missing),
      ],
    });
  }

  const body = await readJsonBody(req);
  const limit = getBatchLimit(body);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: rows, error } = await supabase
    .from('email_notification_queue')
    .select('id,notification_type,recipient_email,recipient_name,subject,body_text,body_html,scheduled_for,metadata')
    .eq('status', 'pending')
    .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('process-email-notifications: error leyendo cola', error.message);
    return jsonResponse({ ok: false, reason: 'queue_read_failed' }, 500);
  }

  const pendingRows = Array.isArray(rows) ? (rows as EmailQueueRow[]) : [];

  if (pendingRows.length === 0) {
    return jsonResponse({
      ok: true,
      dry_run: smtpConfig.config.dryRun,
      processed: 0,
      results: [],
    });
  }

  const results: ProcessedEmailResult[] = [];

  for (const row of pendingRows) {
    if (smtpConfig.config.dryRun) {
      results.push({
        id: row.id,
        recipient_email: row.recipient_email,
        notification_type: row.notification_type,
        status: 'dry_run',
        provider: PROVIDER,
      });
      continue;
    }

    results.push(await processEmailRow(supabase, smtpConfig.config, row));
  }

  return jsonResponse({
    ok: true,
    dry_run: smtpConfig.config.dryRun,
    processed: results.length,
    results,
  });
});

async function processEmailRow(
  supabase: SupabaseClient,
  config: SmtpConfig,
  row: EmailQueueRow
): Promise<ProcessedEmailResult> {
  const now = new Date().toISOString();

  await supabase
    .from('email_notification_queue')
    .update({
      status: 'queued',
      provider: PROVIDER,
      error_message: null,
      updated_at: now,
    })
    .eq('id', row.id)
    .eq('status', 'pending');

  try {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    const info = await transport.sendMail({
      from: config.from,
      to: row.recipient_email,
      replyTo: config.replyTo,
      subject: row.subject,
      text: row.body_text,
      html: row.body_html || undefined,
    });

    const sentAt = new Date().toISOString();
    const providerMessageId = typeof info.messageId === 'string' ? info.messageId : null;

    await supabase
      .from('email_notification_queue')
      .update({
        status: 'sent',
        provider: PROVIDER,
        provider_message_id: providerMessageId,
        sent_at: sentAt,
        failed_at: null,
        error_message: null,
        updated_at: sentAt,
      })
      .eq('id', row.id);

    return {
      id: row.id,
      recipient_email: row.recipient_email,
      notification_type: row.notification_type,
      status: 'sent',
      provider: PROVIDER,
      ...(providerMessageId ? { provider_message_id: providerMessageId } : {}),
    };
  } catch (error) {
    const failedAt = new Date().toISOString();
    const errorMessage = sanitizeErrorMessage(error);

    await supabase
      .from('email_notification_queue')
      .update({
        status: 'failed',
        provider: PROVIDER,
        failed_at: failedAt,
        error_message: errorMessage,
        updated_at: failedAt,
      })
      .eq('id', row.id);

    return {
      id: row.id,
      recipient_email: row.recipient_email,
      notification_type: row.notification_type,
      status: 'failed',
      provider: PROVIDER,
      error_message: errorMessage,
    };
  }
}

function readSmtpConfig():
  | { ok: true; config: SmtpConfig }
  | { ok: false; missing: string[] } {
  const rawConfig = {
    host: Deno.env.get('SMTP_HOST'),
    port: Deno.env.get('SMTP_PORT'),
    secure: Deno.env.get('SMTP_SECURE'),
    user: Deno.env.get('SMTP_USER'),
    password: Deno.env.get('SMTP_PASSWORD'),
    fromName: Deno.env.get('SMTP_FROM_NAME'),
    fromEmail: Deno.env.get('SMTP_FROM_EMAIL'),
    fromFallback: Deno.env.get('SMTP_FROM'),
    replyTo: Deno.env.get('SMTP_REPLY_TO'),
  };
  const requiredConfig = {
    host: rawConfig.host,
    port: rawConfig.port,
    secure: rawConfig.secure,
    user: rawConfig.user,
    password: rawConfig.password,
    replyTo: rawConfig.replyTo,
  };
  const missing = Object.entries(requiredConfig)
    .filter(([, value]) => !value || !value.trim())
    .map(([key]) => key.toUpperCase());
  const from = resolveFromAddress(rawConfig.fromName, rawConfig.fromEmail, rawConfig.fromFallback);
  const replyTo = sanitizeEmailHeaderValue(rawConfig.replyTo);

  if (!from) {
    missing.push('SMTP_FROM_NAME+SMTP_FROM_EMAIL_OR_SMTP_FROM');
  }

  if (!replyTo) {
    missing.push('SMTP_REPLY_TO_VALID');
  }

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  const port = Number(rawConfig.port);

  if (!Number.isInteger(port) || port <= 0) {
    return { ok: false, missing: ['SMTP_PORT_VALID'] };
  }

  return {
    ok: true,
    config: {
      host: rawConfig.host!.trim(),
      port,
      secure: rawConfig.secure!.trim().toLowerCase() === 'true',
      user: rawConfig.user!.trim(),
      password: rawConfig.password!,
      from: from!,
      replyTo,
      dryRun: Deno.env.get('EMAIL_DRY_RUN')?.trim().toLowerCase() !== 'false',
    },
  };
}

function resolveFromAddress(
  rawName: string | undefined,
  rawEmail: string | undefined,
  rawFallback: string | undefined
): string | null {
  const email = sanitizeEmailHeaderValue(rawEmail);

  if (email) {
    const name = sanitizeDisplayName(rawName);
    return name ? `${name} <${email}>` : email;
  }

  const fallback = sanitizeEmailHeaderValue(rawFallback);
  return fallback || null;
}

function sanitizeDisplayName(value: string | undefined): string {
  return (value || '')
    .replace(/[\r\n]/g, ' ')
    .replace(/[<>"]/g, '')
    .trim();
}

function sanitizeEmailHeaderValue(value: string | undefined): string {
  return (value || '')
    .replace(/[\r\n]/g, '')
    .replace(/[<>"]/g, '')
    .trim();
}

function getBatchLimit(body: unknown): number {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return DEFAULT_BATCH_LIMIT;
  }

  const rawLimit = (body as Record<string, unknown>).limit;
  const parsedLimit =
    typeof rawLimit === 'number'
      ? rawLimit
      : typeof rawLimit === 'string'
        ? Number(rawLimit)
        : DEFAULT_BATCH_LIMIT;

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    return DEFAULT_BATCH_LIMIT;
  }

  return Math.min(parsedLimit, MAX_BATCH_LIMIT);
}

async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function sanitizeErrorMessage(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error);
  return rawMessage
    .replace(/SMTP_PASSWORD=[^\s]+/gi, 'SMTP_PASSWORD=[redacted]')
    .replace(/pass(?:word)?[=:]\s*[^\s]+/gi, 'password=[redacted]')
    .slice(0, 1000);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
