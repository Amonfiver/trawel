/**
 * Edge Function: protected-public-submit
 *
 * Protege formularios publicos con Cloudflare Turnstile antes de insertar
 * en colas privadas de Supabase.
 *
 * Variables requeridas:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (solo backend)
 * - TURNSTILE_SECRET_KEY (Supabase secrets)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

type ProtectedAction = 'user_message' | 'content_report';
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

    const remoteIp = getClientIp(req);
    const turnstileOk = await verifyTurnstileToken(
      inputValidation.data.turnstileToken,
      turnstileSecretKey,
      remoteIp
    );

    if (!turnstileOk) {
      return jsonResponse(
        { success: false, status: 'validation_error', error: 'No hemos podido validar la verificacion antiabuso.' },
        403
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    if (inputValidation.data.action === 'user_message') {
      const messageValidation = validateUserMessagePayload(inputValidation.data.payload);

      if (!messageValidation.valid) {
        return jsonResponse({ success: false, status: 'validation_error', error: messageValidation.error }, 400);
      }

      const { error } = await supabase.from('user_messages').insert(mapUserMessageRow(messageValidation.data));

      if (error) {
        console.error('protected-public-submit: error insertando user_messages', error.message);
        return jsonResponse({ success: false, status: 'submit_error', error: 'No se pudo enviar el mensaje.' }, 500);
      }

      return jsonResponse({ success: true, status: 'queued', reviewStatus: 'pending_review' });
    }

    const reportValidation = validateContentReportPayload(inputValidation.data.payload);

    if (!reportValidation.valid) {
      return jsonResponse({ success: false, status: 'validation_error', error: reportValidation.error }, 400);
    }

    const { error } = await supabase.from('content_reports').insert(mapContentReportRow(reportValidation.data));

    if (error) {
      console.error('protected-public-submit: error insertando content_reports', error.message);
      return jsonResponse({ success: false, status: 'submit_error', error: 'No se pudo enviar el reporte.' }, 500);
    }

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
      metadata,
    },
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
