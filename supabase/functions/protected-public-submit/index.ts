/**
 * Edge Function: protected-public-submit
 *
 * Protege formularios publicos con Cloudflare Turnstile antes de insertar
 * en colas privadas de Supabase. La metadata puede incluir consentimiento
 * opcional de seguimiento editorial por email; esta funcion solo lo guarda.
 *
 * Variables requeridas:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (solo backend)
 * - TURNSTILE_SECRET_KEY (Supabase secrets)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

type ProtectedAction = 'user_message' | 'content_report';
type SupabaseClient = ReturnType<typeof createClient>;
type UserMessageKind =
  | 'contact'
  | 'community_suggestion'
  | 'content_report'
  | 'privacy_request'
  | 'generic';
type ContentReportInputType =
  | 'content_error'
  | 'image_rights'
  | 'removal_request'
  | 'inappropriate_content'
  | 'outdated_information'
  | 'other';
type ContentReportStoredType =
  | 'error'
  | 'abuse'
  | 'image_rights'
  | 'removal_request'
  | 'generic';
type ContentReportTargetEntityType =
  | 'country'
  | 'zone'
  | 'place'
  | 'route'
  | 'plan'
  | 'static_page'
  | 'image_asset'
  | 'promotion'
  | 'generic';

interface ProtectedSubmitInput {
  action: ProtectedAction;
  turnstileToken: string;
  payload: Record<string, unknown>;
}

interface TurnstileSiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

interface RateLimitConfig {
  maxHourlySubmissionsPerEmail: number;
  maxDailySubmissionsPerEmail: number;
}

interface SubmissionEventInput {
  submissionType: string;
  emailHash: string | null;
  ipHash: string | null;
  sourcePage: string | null;
  status: 'accepted' | 'rejected_rate_limit' | 'rejected_turnstile' | 'rejected_validation' | 'error';
  metadata?: Record<string, unknown>;
}

interface EmailNotificationInput {
  notification_type: 'submission_copy' | 'review_status' | 'publication_notice' | 'rejection_notice' | 'admin_alert';
  recipient_email: string;
  recipient_name: string | null;
  related_table: string | null;
  related_id: string | null;
  status: 'pending';
  subject: string;
  body_text: string;
  metadata: Record<string, unknown>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_NAME_LENGTH = 160;
const MAX_EMAIL_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const USER_MESSAGE_KINDS = new Set<UserMessageKind>([
  'contact',
  'community_suggestion',
  'content_report',
  'privacy_request',
  'generic',
]);
const ALLOWED_ENTITY_TYPES = new Set([
  'country',
  'zone',
  'place',
  'route',
  'plan',
  'static_page',
  'generic',
]);
const SUPPORTED_REPORT_TYPES = new Set<ContentReportInputType>([
  'content_error',
  'image_rights',
  'removal_request',
  'inappropriate_content',
  'outdated_information',
  'other',
]);
const SUPPORTED_TARGET_ENTITY_TYPES = new Set<ContentReportTargetEntityType>([
  'country',
  'zone',
  'place',
  'route',
  'plan',
  'static_page',
  'image_asset',
  'promotion',
  'generic',
]);
const DEFAULT_MAX_HOURLY_SUBMISSIONS_PER_EMAIL = 3;
const DEFAULT_MAX_DAILY_SUBMISSIONS_PER_EMAIL = 10;
const RATE_LIMIT_MESSAGE = 'Has enviado varias aportaciones recientemente. Inténtalo de nuevo más tarde.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, status: 'validation_error', error: 'Metodo no permitido.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const turnstileSecretKey = Deno.env.get('TURNSTILE_SECRET_KEY');

    if (!supabaseUrl || !serviceRoleKey || !turnstileSecretKey) {
      console.error('protected-public-submit: configuracion incompleta');
      return jsonResponse({ success: false, status: 'submit_error', error: 'Error de configuracion del servidor.' }, 500);
    }

    const body = await readJsonBody(req);
    const inputValidation = validateProtectedInput(body);

    if (!inputValidation.valid) {
      return jsonResponse({ success: false, status: 'validation_error', error: inputValidation.error }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    const remoteIp = getClientIp(req);
    const rawSubmissionContext = await getRawSubmissionContext(inputValidation.data, remoteIp);
    const turnstileOk = await verifyTurnstileToken(
      inputValidation.data.turnstileToken,
      turnstileSecretKey,
      remoteIp
    );

    if (!turnstileOk) {
      await recordSubmissionEvent(supabase, {
        ...rawSubmissionContext,
        status: 'rejected_turnstile',
        metadata: { reason: 'turnstile_failed' },
      });

      return jsonResponse(
        { success: false, status: 'validation_error', error: 'No hemos podido validar la verificacion antiabuso.' },
        403
      );
    }

    if (inputValidation.data.action === 'user_message') {
      const messageValidation = validateUserMessagePayload(inputValidation.data.payload);

      if (!messageValidation.valid) {
        await recordSubmissionEvent(supabase, {
          ...rawSubmissionContext,
          status: 'rejected_validation',
          metadata: { reason: 'payload_validation_failed' },
        });

        return jsonResponse({ success: false, status: 'validation_error', error: messageValidation.error }, 400);
      }

      const submissionContext = await getUserMessageSubmissionContext(messageValidation.data, remoteIp);
      const rateLimit = await checkEmailRateLimit(supabase, submissionContext.emailHash);

      if (!rateLimit.allowed) {
        await recordSubmissionEvent(supabase, {
          ...submissionContext,
          status: 'rejected_rate_limit',
          metadata: { reason: rateLimit.reason },
        });

        return jsonResponse({ success: false, status: 'rate_limited', error: RATE_LIMIT_MESSAGE }, 429);
      }

      const { data: insertedMessage, error } = await supabase
        .from('user_messages')
        .insert(mapUserMessageRow(messageValidation.data))
        .select('id')
        .single();

      if (error) {
        console.error('protected-public-submit: error insertando user_messages', error.message);
        await recordSubmissionEvent(supabase, {
          ...submissionContext,
          status: 'error',
          metadata: { reason: 'user_messages_insert_failed' },
        });

        return jsonResponse({ success: false, status: 'submit_error', error: 'No se pudo enviar el mensaje.' }, 500);
      }

      const emailQueueStatus = await enqueueSubmissionCopyIfConsented(
        supabase,
        messageValidation.data,
        getInsertedId(insertedMessage)
      );

      await recordSubmissionEvent(supabase, {
        ...submissionContext,
        status: 'accepted',
        metadata: emailQueueStatus,
      });

      return jsonResponse({
        success: true,
        status: 'queued',
        reviewStatus: 'pending_review',
        emailQueue: emailQueueStatus,
      });
    }

    const reportValidation = validateContentReportPayload(inputValidation.data.payload);

    if (!reportValidation.valid) {
      await recordSubmissionEvent(supabase, {
        ...rawSubmissionContext,
        status: 'rejected_validation',
        metadata: { reason: 'payload_validation_failed' },
      });

      return jsonResponse({ success: false, status: 'validation_error', error: reportValidation.error }, 400);
    }

    const submissionContext = await getContentReportSubmissionContext(reportValidation.data, remoteIp);
    const rateLimit = await checkEmailRateLimit(supabase, submissionContext.emailHash);

    if (!rateLimit.allowed) {
      await recordSubmissionEvent(supabase, {
        ...submissionContext,
        status: 'rejected_rate_limit',
        metadata: { reason: rateLimit.reason },
      });

      return jsonResponse({ success: false, status: 'rate_limited', error: RATE_LIMIT_MESSAGE }, 429);
    }

    const { error } = await supabase.from('content_reports').insert(mapContentReportRow(reportValidation.data));

    if (error) {
      console.error('protected-public-submit: error insertando content_reports', error.message);
      await recordSubmissionEvent(supabase, {
        ...submissionContext,
        status: 'error',
        metadata: { reason: 'content_reports_insert_failed' },
      });

      return jsonResponse({ success: false, status: 'submit_error', error: 'No se pudo enviar el reporte.' }, 500);
    }

    await recordSubmissionEvent(supabase, {
      ...submissionContext,
      status: 'accepted',
    });

    return jsonResponse({ success: true, status: 'queued', reviewStatus: 'pending_review' });
  } catch (error) {
    console.error('protected-public-submit: error inesperado', error);
    return jsonResponse({ success: false, status: 'submit_error', error: 'Error interno del servidor.' }, 500);
  }
});

function validateProtectedInput(
  body: unknown
): { valid: true; data: ProtectedSubmitInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Body invalido.' };
  }

  const candidate = body as Record<string, unknown>;
  const action = candidate.action;
  const turnstileToken = candidate.turnstileToken;
  const payload = candidate.payload;

  if (action !== 'user_message' && action !== 'content_report') {
    return { valid: false, error: 'Accion no valida.' };
  }

  if (typeof turnstileToken !== 'string' || turnstileToken.trim().length < 10) {
    return { valid: false, error: 'Token antiabuso obligatorio.' };
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, error: 'Payload invalido.' };
  }

  return {
    valid: true,
    data: {
      action,
      turnstileToken: turnstileToken.trim(),
      payload: payload as Record<string, unknown>,
    },
  };
}

function validateUserMessagePayload(
  payload: Record<string, unknown>
): { valid: true; data: Record<string, unknown> } | { valid: false; error: string } {
  const kind = payload.kind;
  const name = asTrimmedString(payload.name);
  const email = asTrimmedString(payload.email);
  const subject = normalizeOptionalText(payload.subject);
  const message = asTrimmedString(payload.message);
  const sourcePage = normalizeOptionalText(payload.sourcePage);
  const countrySlug = normalizeOptionalText(payload.countrySlug);
  const zoneSlug = normalizeOptionalText(payload.zoneSlug);
  const entityType = normalizeOptionalText(payload.entityType);
  const entitySlug = normalizeOptionalText(payload.entitySlug);
  const metadata = isPlainObject(payload.metadata) ? payload.metadata : {};

  if (typeof kind !== 'string' || !USER_MESSAGE_KINDS.has(kind as UserMessageKind)) {
    return { valid: false, error: 'Tipo de mensaje no valido.' };
  }

  if (!payload.privacyAccepted) {
    return { valid: false, error: 'Debe aceptarse la privacidad antes de enviar.' };
  }

  if (!name) {
    return { valid: false, error: 'El nombre es obligatorio.' };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: 'El nombre es demasiado largo.' };
  }

  if (!email || !isValidEmail(email)) {
    return { valid: false, error: 'El email no tiene un formato valido.' };
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return { valid: false, error: 'El email es demasiado largo.' };
  }

  if (subject && subject.length > MAX_SUBJECT_LENGTH) {
    return { valid: false, error: 'El asunto es demasiado largo.' };
  }

  if (!message) {
    return { valid: false, error: 'El mensaje es obligatorio.' };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: 'El mensaje es demasiado largo.' };
  }

  if (countrySlug && !isValidSlug(countrySlug)) {
    return { valid: false, error: 'El slug de pais no tiene un formato valido.' };
  }

  if (zoneSlug && !isValidSlug(zoneSlug)) {
    return { valid: false, error: 'El slug de zona no tiene un formato valido.' };
  }

  if (entityType && !ALLOWED_ENTITY_TYPES.has(entityType)) {
    return { valid: false, error: 'El tipo de entidad relacionada no es valido.' };
  }

  if (entitySlug && !isValidSlug(entitySlug)) {
    return { valid: false, error: 'El slug de entidad relacionada no tiene un formato valido.' };
  }

  return {
    valid: true,
    data: {
      kind,
      name,
      email,
      subject,
      message,
      sourcePage,
      countrySlug,
      zoneSlug,
      entityType,
      entitySlug,
      metadata: normalizeUserMessageMetadata(metadata),
    },
  };
}

function normalizeUserMessageMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const emailFollowupConsent = metadata.email_followup_consent === true;
  const emailFollowupScope = Array.isArray(metadata.email_followup_scope)
    ? metadata.email_followup_scope.filter((item): item is string => typeof item === 'string')
    : undefined;

  return {
    ...metadata,
    ...(emailFollowupConsent
      ? {
          email_followup_consent: true,
          email_followup_scope: emailFollowupScope ?? [],
        }
      : {
          email_followup_consent: false,
        }),
  };
}

function validateContentReportPayload(
  payload: Record<string, unknown>
): { valid: true; data: Record<string, unknown> } | { valid: false; error: string } {
  const reportType = payload.reportType;
  const reporterName = asTrimmedString(payload.reporterName);
  const reporterEmail = asTrimmedString(payload.reporterEmail);
  const targetEntityType = payload.targetEntityType;
  const targetEntitySlug = asTrimmedString(payload.targetEntitySlug);
  const message = asTrimmedString(payload.message);

  if (typeof reportType !== 'string' || !SUPPORTED_REPORT_TYPES.has(reportType as ContentReportInputType)) {
    return { valid: false, error: 'El tipo de reporte no es valido.' };
  }

  if (!reporterName) {
    return { valid: false, error: 'El nombre de quien reporta es obligatorio.' };
  }

  if (reporterName.length > MAX_NAME_LENGTH) {
    return { valid: false, error: 'El nombre de quien reporta es demasiado largo.' };
  }

  if (!reporterEmail || !isValidEmail(reporterEmail)) {
    return { valid: false, error: 'El email de quien reporta no tiene un formato valido.' };
  }

  if (reporterEmail.length > MAX_EMAIL_LENGTH) {
    return { valid: false, error: 'El email de quien reporta es demasiado largo.' };
  }

  if (
    typeof targetEntityType !== 'string' ||
    !SUPPORTED_TARGET_ENTITY_TYPES.has(targetEntityType as ContentReportTargetEntityType)
  ) {
    return { valid: false, error: 'El tipo de entidad reportada no es valido.' };
  }

  if (!targetEntitySlug || !isValidSlug(targetEntitySlug)) {
    return { valid: false, error: 'El slug de la entidad reportada no tiene un formato valido.' };
  }

  if (!message) {
    return { valid: false, error: 'El mensaje del reporte es obligatorio.' };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: 'El mensaje del reporte es demasiado largo.' };
  }

  return {
    valid: true,
    data: {
      reportType,
      reporterName,
      reporterEmail,
      targetEntityType,
      targetEntitySlug,
      message,
    },
  };
}

function mapUserMessageRow(data: Record<string, unknown>) {
  return {
    type: data.kind,
    kind: data.kind,
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    source_page: data.sourcePage,
    country_slug: data.countrySlug,
    zone_slug: data.zoneSlug,
    related_entity_type: data.entityType,
    related_entity_slug: data.entitySlug,
    entity_type: data.entityType,
    entity_slug: data.entitySlug,
    priority: 'normal',
    metadata: data.metadata,
    privacy_accepted: true,
    created_at: new Date().toISOString(),
  };
}

async function enqueueSubmissionCopyIfConsented(
  supabase: SupabaseClient,
  data: Record<string, unknown>,
  userMessageId: string | null
): Promise<Record<string, unknown>> {
  if (!shouldQueueSubmissionCopy(data)) {
    return { email_queue_status: 'skipped', reason: 'email_followup_consent_false' };
  }

  const notification = buildSubmissionCopyNotification(data, userMessageId);
  const { error } = await supabase.from('email_notification_queue').insert(notification);

  if (error) {
    console.error('protected-public-submit: error insertando email_notification_queue', error.message);
    return { email_queue_status: 'failed', reason: 'email_notification_queue_insert_failed' };
  }

  return { email_queue_status: 'pending', notification_type: 'submission_copy' };
}

function shouldQueueSubmissionCopy(data: Record<string, unknown>): boolean {
  const metadata = isPlainObject(data.metadata) ? data.metadata : {};
  return data.kind === 'community_suggestion' && metadata.email_followup_consent === true;
}

function buildSubmissionCopyNotification(
  data: Record<string, unknown>,
  userMessageId: string | null
): EmailNotificationInput {
  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const subject = 'Hemos recibido tu propuesta en Trawel';
  const contributionSubject = normalizeOptionalText(data.subject) || 'Propuesta recibida';
  const message = String(data.message || '').trim();
  const countrySlug = normalizeOptionalText(data.countrySlug);
  const zoneSlug = normalizeOptionalText(data.zoneSlug);

  return {
    notification_type: 'submission_copy',
    recipient_email: email,
    recipient_name: name || null,
    related_table: 'user_messages',
    related_id: userMessageId,
    status: 'pending',
    subject,
    body_text: [
      `Hola${name ? ` ${name}` : ''},`,
      '',
      'Hemos recibido tu propuesta en Trawel y queda pendiente de revision editorial.',
      '',
      `Resumen: ${contributionSubject}`,
      countrySlug ? `Pais: ${countrySlug}` : null,
      zoneSlug ? `Zona: ${zoneSlug}` : null,
      '',
      'Texto enviado:',
      message,
      '',
      'Nada enviado por usuarios se publica automaticamente. Trawel e Investighost revisaran permisos, clasificacion y encaje editorial antes de cualquier publicacion.',
      '',
      'Gracias por ayudar a construir Trawel.',
      'Equipo Trawel',
    ]
      .filter((line): line is string => line !== null)
      .join('\n'),
    metadata: {
      source: 'protected-public-submit',
      related_kind: data.kind,
      source_page: data.sourcePage,
      country_slug: countrySlug,
      zone_slug: zoneSlug,
      email_provider_active: false,
    },
  };
}

function getInsertedId(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const id = (value as Record<string, unknown>).id;
  return typeof id === 'string' ? id : null;
}

function mapContentReportRow(data: Record<string, unknown>) {
  return {
    report_type: mapReportTypeToStoredType(data.reportType as ContentReportInputType),
    reporter_name: data.reporterName,
    reporter_email: data.reporterEmail,
    target_entity_type: data.targetEntityType,
    target_entity_slug: data.targetEntitySlug,
    message: data.message,
  };
}

async function getRawSubmissionContext(
  input: ProtectedSubmitInput,
  remoteIp: string | null
): Promise<Omit<SubmissionEventInput, 'status' | 'metadata'>> {
  const payload = input.payload;
  const email = normalizeOptionalText(payload.email) || normalizeOptionalText(payload.reporterEmail);
  const sourcePage = normalizeOptionalText(payload.sourcePage);
  const kind = normalizeOptionalText(payload.kind);

  return {
    submissionType: kind || input.action,
    emailHash: email ? await hashValue(email.toLowerCase()) : null,
    ipHash: remoteIp ? await hashValue(remoteIp) : null,
    sourcePage,
  };
}

async function getUserMessageSubmissionContext(
  data: Record<string, unknown>,
  remoteIp: string | null
): Promise<Omit<SubmissionEventInput, 'status' | 'metadata'>> {
  const email = String(data.email).toLowerCase();

  return {
    submissionType: String(data.kind),
    emailHash: await hashValue(email),
    ipHash: remoteIp ? await hashValue(remoteIp) : null,
    sourcePage: normalizeOptionalText(data.sourcePage),
  };
}

async function getContentReportSubmissionContext(
  data: Record<string, unknown>,
  remoteIp: string | null
): Promise<Omit<SubmissionEventInput, 'status' | 'metadata'>> {
  const email = String(data.reporterEmail).toLowerCase();

  return {
    submissionType: 'content_report',
    emailHash: await hashValue(email),
    ipHash: remoteIp ? await hashValue(remoteIp) : null,
    sourcePage: null,
  };
}

async function checkEmailRateLimit(
  supabase: SupabaseClient,
  emailHash: string | null
): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  if (!emailHash) {
    return { allowed: true };
  }

  const config = await readRateLimitConfig(supabase);
  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const hourlyCount = await countAcceptedSubmissionsSince(supabase, emailHash, oneHourAgo);

  if (hourlyCount !== null && hourlyCount >= config.maxHourlySubmissionsPerEmail) {
    return { allowed: false, reason: 'hourly_email_limit' };
  }

  const dailyCount = await countAcceptedSubmissionsSince(supabase, emailHash, oneDayAgo);

  if (dailyCount !== null && dailyCount >= config.maxDailySubmissionsPerEmail) {
    return { allowed: false, reason: 'daily_email_limit' };
  }

  return { allowed: true };
}

async function readRateLimitConfig(supabase: SupabaseClient): Promise<RateLimitConfig> {
  const fallback = {
    maxHourlySubmissionsPerEmail: DEFAULT_MAX_HOURLY_SUBMISSIONS_PER_EMAIL,
    maxDailySubmissionsPerEmail: DEFAULT_MAX_DAILY_SUBMISSIONS_PER_EMAIL,
  };

  const { data, error } = await supabase
    .from('system_flags')
    .select('key,value')
    .in('key', ['max_hourly_submissions_per_email', 'max_daily_submissions_per_email']);

  if (error || !Array.isArray(data)) {
    console.error('protected-public-submit: no se pudieron leer flags de rate limit');
    return fallback;
  }

  const flags = new Map<string, unknown>(data.map((row) => [String(row.key), row.value]));

  return {
    maxHourlySubmissionsPerEmail: parsePositiveIntegerFlag(
      flags.get('max_hourly_submissions_per_email'),
      fallback.maxHourlySubmissionsPerEmail
    ),
    maxDailySubmissionsPerEmail: parsePositiveIntegerFlag(
      flags.get('max_daily_submissions_per_email'),
      fallback.maxDailySubmissionsPerEmail
    ),
  };
}

async function countAcceptedSubmissionsSince(
  supabase: SupabaseClient,
  emailHash: string,
  sinceIso: string
): Promise<number | null> {
  const { count, error } = await supabase
    .from('public_submission_events')
    .select('id', { count: 'exact', head: true })
    .eq('email_hash', emailHash)
    .eq('status', 'accepted')
    .gte('created_at', sinceIso);

  if (error) {
    console.error('protected-public-submit: no se pudieron contar eventos de rate limit');
    return null;
  }

  return count ?? 0;
}

async function recordSubmissionEvent(
  supabase: SupabaseClient,
  input: SubmissionEventInput
): Promise<void> {
  const { error } = await supabase.from('public_submission_events').insert({
    submission_type: input.submissionType,
    email_hash: input.emailHash,
    ip_hash: input.ipHash,
    source_page: input.sourcePage,
    status: input.status,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error('protected-public-submit: no se pudo registrar evento publico protegido');
  }
}

async function hashValue(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function parsePositiveIntegerFlag(value: unknown, fallback: number): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : null;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

async function verifyTurnstileToken(
  token: string,
  secretKey: string,
  remoteIp: string | null
): Promise<boolean> {
  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);

  if (remoteIp) {
    formData.append('remoteip', remoteIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    console.error('protected-public-submit: Turnstile siteverify no disponible');
    return false;
  }

  const result = (await response.json()) as TurnstileSiteverifyResponse;
  return result.success === true;
}

function mapReportTypeToStoredType(reportType: ContentReportInputType): ContentReportStoredType {
  switch (reportType) {
    case 'content_error':
    case 'outdated_information':
      return 'error';
    case 'image_rights':
      return 'image_rights';
    case 'removal_request':
      return 'removal_request';
    case 'inappropriate_content':
      return 'abuse';
    case 'other':
      return 'generic';
  }
}

async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }

  return req.headers.get('cf-connecting-ip');
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isValidEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
