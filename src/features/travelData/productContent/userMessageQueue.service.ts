import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';

export type UserMessageReviewStatus =
  | 'pending_review'
  | 'read'
  | 'responded'
  | 'archived'
  | 'rejected'
  | 'priority';

export type UserMessageKind =
  | 'contact'
  | 'community_suggestion'
  | 'content_report'
  | 'privacy_request'
  | 'generic';

export interface SubmitUserMessageInput {
  kind: UserMessageKind;
  name: string;
  email: string;
  message: string;
  subject?: string;
  sourcePage?: string;
  countrySlug?: string;
  zoneSlug?: string;
  entityType?: string;
  entitySlug?: string;
  metadata?: Record<string, unknown>;
  privacyAccepted: boolean;
}

export type SubmitUserMessageResult =
  | {
      ok: true;
      status: 'queued';
      reviewStatus: 'pending_review';
    }
  | {
      ok: false;
      status: 'validation_error' | 'not_configured' | 'submit_error';
      message: string;
    };

interface UserMessageQueueRow {
  type: UserMessageKind;
  kind: UserMessageKind;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  source_page: string | null;
  country_slug: string | null;
  zone_slug: string | null;
  related_entity_type: string | null;
  related_entity_slug: string | null;
  entity_type: string | null;
  entity_slug: string | null;
  status: UserMessageReviewStatus;
  priority: 'normal';
  metadata: Record<string, unknown>;
  privacy_accepted: boolean;
  created_at?: string;
}

const DEFAULT_USER_MESSAGES_TABLE = 'user_messages';
const MAX_NAME_LENGTH = 160;
const MAX_EMAIL_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_ENTITY_TYPES = new Set([
  'country',
  'zone',
  'place',
  'route',
  'plan',
  'static_page',
  'generic',
]);

export async function submitUserMessage(
  input: SubmitUserMessageInput
): Promise<SubmitUserMessageResult> {
  const validationError = validateUserMessageInput(input);

  if (validationError) {
    return {
      ok: false,
      status: 'validation_error',
      message: validationError,
    };
  }

  const tableName = getConfiguredUserMessageQueueTable();

  if (!isSupabaseConfigured() || !supabase) {
    return {
      ok: false,
      status: 'not_configured',
      message: 'Supabase no esta configurado en este entorno.',
    };
  }

  const row = mapUserMessageInputToQueueRow(input);

  try {
    const { error } = await supabase.from(tableName).insert(row);

    if (error) {
      return {
        ok: false,
        status: 'submit_error',
        message: 'No se pudo enviar el mensaje a la cola de revision.',
      };
    }

    return {
      ok: true,
      status: 'queued',
      reviewStatus: 'pending_review',
    };
  } catch {
    return {
      ok: false,
      status: 'submit_error',
      message: 'Error inesperado al enviar el mensaje a la cola de revision.',
    };
  }
}

export function submitContactMessage(
  input: Omit<SubmitUserMessageInput, 'kind'>
): Promise<SubmitUserMessageResult> {
  return submitUserMessage({
    ...input,
    kind: 'contact',
  });
}

export function submitCommunitySuggestion(
  input: Omit<SubmitUserMessageInput, 'kind'>
): Promise<SubmitUserMessageResult> {
  return submitUserMessage({
    ...input,
    kind: 'community_suggestion',
  });
}

function getConfiguredUserMessageQueueTable(): string {
  const tableName = import.meta.env.VITE_TRAWEL_USER_MESSAGES_TABLE;

  if (typeof tableName !== 'string') {
    return DEFAULT_USER_MESSAGES_TABLE;
  }

  const trimmed = tableName.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_USER_MESSAGES_TABLE;
}

function validateUserMessageInput(input: SubmitUserMessageInput): string | null {
  if (!input.privacyAccepted) {
    return 'Debe aceptarse la privacidad antes de enviar un mensaje.';
  }

  const name = input.name.trim();
  const email = input.email.trim();
  const subject = normalizeOptionalText(input.subject);
  const message = input.message.trim();
  const countrySlug = normalizeOptionalText(input.countrySlug);
  const zoneSlug = normalizeOptionalText(input.zoneSlug);
  const entityType = normalizeOptionalText(input.entityType);
  const entitySlug = normalizeOptionalText(input.entitySlug);

  if (!name) {
    return 'El nombre es obligatorio.';
  }

  if (name.length > MAX_NAME_LENGTH) {
    return 'El nombre es demasiado largo.';
  }

  if (!isValidEmail(email)) {
    return 'El email no tiene un formato valido.';
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return 'El email es demasiado largo.';
  }

  if (subject && subject.length > MAX_SUBJECT_LENGTH) {
    return 'El asunto es demasiado largo.';
  }

  if (!message) {
    return 'El mensaje es obligatorio.';
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return 'El mensaje es demasiado largo.';
  }

  if (countrySlug && !isValidSlug(countrySlug)) {
    return 'El slug de pais no tiene un formato valido.';
  }

  if (zoneSlug && !isValidSlug(zoneSlug)) {
    return 'El slug de zona no tiene un formato valido.';
  }

  if (entityType && !ALLOWED_ENTITY_TYPES.has(entityType)) {
    return 'El tipo de entidad relacionada no es valido.';
  }

  if (entitySlug && !isValidSlug(entitySlug)) {
    return 'El slug de entidad relacionada no tiene un formato valido.';
  }

  return null;
}

function mapUserMessageInputToQueueRow(input: SubmitUserMessageInput): UserMessageQueueRow {
  const entityType = normalizeOptionalText(input.entityType);
  const entitySlug = normalizeOptionalText(input.entitySlug);

  return {
    type: input.kind,
    kind: input.kind,
    name: input.name.trim(),
    email: input.email.trim(),
    subject: normalizeOptionalText(input.subject),
    message: input.message.trim(),
    source_page: normalizeOptionalText(input.sourcePage),
    country_slug: normalizeOptionalText(input.countrySlug),
    zone_slug: normalizeOptionalText(input.zoneSlug),
    related_entity_type: entityType,
    related_entity_slug: entitySlug,
    entity_type: entityType,
    entity_slug: entitySlug,
    status: 'pending_review',
    priority: 'normal',
    metadata: input.metadata || {},
    privacy_accepted: true,
    created_at: new Date().toISOString(),
  };
}

function normalizeOptionalText(value: string | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}
