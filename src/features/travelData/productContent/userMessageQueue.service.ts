import { submitProtectedPublicPayload } from './protectedPublicSubmit.service';

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
  turnstileToken: string;
}

export type SubmitUserMessageResult =
  | {
      ok: true;
      status: 'queued';
      reviewStatus: 'pending_review';
    }
  | {
      ok: false;
      status: 'validation_error' | 'rate_limited' | 'not_configured' | 'submit_error';
      message: string;
      reason?: string;
    };

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

  return submitProtectedPublicPayload({
    action: 'user_message',
    turnstileToken: input.turnstileToken,
    payload: {
      kind: input.kind,
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      sourcePage: input.sourcePage,
      countrySlug: input.countrySlug,
      zoneSlug: input.zoneSlug,
      entityType: input.entityType,
      entitySlug: input.entitySlug,
      metadata: input.metadata,
      privacyAccepted: input.privacyAccepted,
    },
  });
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

function validateUserMessageInput(input: SubmitUserMessageInput): string | null {
  if (!input.privacyAccepted) {
    return 'Debe aceptarse la privacidad antes de enviar un mensaje.';
  }

  if (!input.turnstileToken.trim()) {
    return 'Completa la verificación antiabuso antes de enviar.';
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
