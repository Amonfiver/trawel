import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';

export type UserMessageReviewStatus =
  | 'pending_review'
  | 'read'
  | 'responded'
  | 'archived'
  | 'rejected';

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
  kind: UserMessageKind;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  source_page: string | null;
  country_slug: string | null;
  zone_slug: string | null;
  entity_type: string | null;
  entity_slug: string | null;
  status: UserMessageReviewStatus;
  metadata: Record<string, unknown>;
  privacy_accepted: boolean;
  created_at?: string;
}

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

  if (!tableName) {
    return {
      ok: false,
      status: 'not_configured',
      message:
        'La cola de mensajes aun no tiene tabla Supabase configurada. El envio queda preparado para un bloque de schema explicito.',
    };
  }

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

function getConfiguredUserMessageQueueTable(): string | null {
  const tableName = import.meta.env.VITE_TRAWEL_USER_MESSAGES_TABLE;

  if (typeof tableName !== 'string') {
    return null;
  }

  const trimmed = tableName.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateUserMessageInput(input: SubmitUserMessageInput): string | null {
  if (!input.privacyAccepted) {
    return 'Debe aceptarse la privacidad antes de enviar un mensaje.';
  }

  if (!input.name.trim()) {
    return 'El nombre es obligatorio.';
  }

  if (!isValidEmail(input.email)) {
    return 'El email no tiene un formato valido.';
  }

  if (!input.message.trim()) {
    return 'El mensaje es obligatorio.';
  }

  return null;
}

function mapUserMessageInputToQueueRow(input: SubmitUserMessageInput): UserMessageQueueRow {
  return {
    kind: input.kind,
    name: input.name.trim(),
    email: input.email.trim(),
    subject: normalizeOptionalText(input.subject),
    message: input.message.trim(),
    source_page: normalizeOptionalText(input.sourcePage),
    country_slug: normalizeOptionalText(input.countrySlug),
    zone_slug: normalizeOptionalText(input.zoneSlug),
    entity_type: normalizeOptionalText(input.entityType),
    entity_slug: normalizeOptionalText(input.entitySlug),
    status: 'pending_review',
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
