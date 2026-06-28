import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';

export type UserPhotoSubmissionStatus =
  | 'submitted'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived'
  | 'rights_issue'
  | 'removal_requested';

export interface SubmitUserPhotoSubmissionInput {
  authorName: string;
  authorEmail: string;
  countrySlug: string;
  zoneSlug?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  storagePath?: string;
  creditName: string;
  rightsConfirmed: boolean;
  consentConfirmed: boolean;
}

export type SubmitUserPhotoSubmissionResult =
  | {
      ok: true;
      status: 'queued';
      reviewStatus: 'submitted';
    }
  | {
      ok: false;
      status: 'validation_error' | 'not_configured' | 'submit_error';
      message: string;
    };

interface UserPhotoSubmissionQueueRow {
  author_name: string;
  author_email: string;
  country_slug: string;
  zone_slug: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  storage_path: string | null;
  credit_name: string;
  rights_confirmed: true;
  consent_confirmed: true;
}

const USER_PHOTO_SUBMISSIONS_TABLE = 'user_photo_submissions';
const MAX_AUTHOR_NAME_LENGTH = 160;
const MAX_AUTHOR_EMAIL_LENGTH = 320;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CREDIT_NAME_LENGTH = 160;
const MAX_IMAGE_REFERENCE_LENGTH = 1000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function submitUserPhotoSubmission(
  input: SubmitUserPhotoSubmissionInput
): Promise<SubmitUserPhotoSubmissionResult> {
  const validationError = validateUserPhotoSubmissionInput(input);

  if (validationError) {
    return {
      ok: false,
      status: 'validation_error',
      message: validationError,
    };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return {
      ok: false,
      status: 'not_configured',
      message: 'Supabase no esta configurado en este entorno.',
    };
  }

  const row = mapUserPhotoSubmissionInputToQueueRow(input);

  try {
    const { error } = await supabase.from(USER_PHOTO_SUBMISSIONS_TABLE).insert(row);

    if (error) {
      return {
        ok: false,
        status: 'submit_error',
        message: 'No se pudo enviar la foto a la cola de revision.',
      };
    }

    return {
      ok: true,
      status: 'queued',
      reviewStatus: 'submitted',
    };
  } catch {
    return {
      ok: false,
      status: 'submit_error',
      message: 'Error inesperado al enviar la foto a la cola de revision.',
    };
  }
}

function validateUserPhotoSubmissionInput(
  input: SubmitUserPhotoSubmissionInput
): string | null {
  const authorName = input.authorName.trim();
  const authorEmail = input.authorEmail.trim();
  const countrySlug = input.countrySlug.trim();
  const zoneSlug = normalizeOptionalText(input.zoneSlug);
  const title = normalizeOptionalText(input.title);
  const description = normalizeOptionalText(input.description);
  const imageUrl = normalizeOptionalText(input.imageUrl);
  const storagePath = normalizeOptionalText(input.storagePath);
  const creditName = input.creditName.trim();

  if (!input.rightsConfirmed) {
    return 'Debes confirmar que tienes derechos para enviar la foto.';
  }

  if (!input.consentConfirmed) {
    return 'Debes confirmar el consentimiento aplicable antes de enviar la foto.';
  }

  if (!authorName) {
    return 'El nombre del autor es obligatorio.';
  }

  if (authorName.length > MAX_AUTHOR_NAME_LENGTH) {
    return 'El nombre del autor es demasiado largo.';
  }

  if (!isValidEmail(authorEmail)) {
    return 'El email del autor no tiene un formato valido.';
  }

  if (authorEmail.length > MAX_AUTHOR_EMAIL_LENGTH) {
    return 'El email del autor es demasiado largo.';
  }

  if (!countrySlug || !isValidSlug(countrySlug)) {
    return 'El slug de pais no tiene un formato valido.';
  }

  if (zoneSlug && !isValidSlug(zoneSlug)) {
    return 'El slug de zona no tiene un formato valido.';
  }

  if (title && title.length > MAX_TITLE_LENGTH) {
    return 'El titulo es demasiado largo.';
  }

  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return 'La descripcion es demasiado larga.';
  }

  if (!imageUrl && !storagePath) {
    return 'Debes indicar una URL de imagen o una ruta de storage.';
  }

  if (imageUrl && !isValidHttpUrl(imageUrl)) {
    return 'La URL de imagen no tiene un formato valido.';
  }

  if (imageUrl && imageUrl.length > MAX_IMAGE_REFERENCE_LENGTH) {
    return 'La URL de imagen es demasiado larga.';
  }

  if (storagePath && storagePath.length > MAX_IMAGE_REFERENCE_LENGTH) {
    return 'La ruta de storage es demasiado larga.';
  }

  if (!creditName) {
    return 'El credito de la imagen es obligatorio.';
  }

  if (creditName.length > MAX_CREDIT_NAME_LENGTH) {
    return 'El credito de la imagen es demasiado largo.';
  }

  return null;
}

function mapUserPhotoSubmissionInputToQueueRow(
  input: SubmitUserPhotoSubmissionInput
): UserPhotoSubmissionQueueRow {
  const authorName = input.authorName.trim();
  const title = normalizeOptionalText(input.title) || `Foto enviada por ${authorName}`;

  return {
    author_name: authorName,
    author_email: input.authorEmail.trim(),
    country_slug: input.countrySlug.trim(),
    zone_slug: normalizeOptionalText(input.zoneSlug),
    title: title.slice(0, MAX_TITLE_LENGTH),
    description: normalizeOptionalText(input.description),
    image_url: normalizeOptionalText(input.imageUrl),
    storage_path: normalizeOptionalText(input.storagePath),
    credit_name: input.creditName.trim(),
    rights_confirmed: true,
    consent_confirmed: true,
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

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
