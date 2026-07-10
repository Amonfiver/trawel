import { submitProtectedPublicPayload } from './protectedPublicSubmit.service';

export type ContentReportInputType =
  | 'content_error'
  | 'image_rights'
  | 'removal_request'
  | 'inappropriate_content'
  | 'outdated_information'
  | 'other';

export type ContentReportStoredType =
  | 'error'
  | 'abuse'
  | 'image_rights'
  | 'removal_request'
  | 'generic';

export type ContentReportTargetEntityType =
  | 'country'
  | 'zone'
  | 'place'
  | 'route'
  | 'plan'
  | 'static_page'
  | 'image_asset'
  | 'promotion'
  | 'generic';

export type ContentReportStatus =
  | 'pending_review'
  | 'in_review'
  | 'resolved'
  | 'rejected'
  | 'archived'
  | 'rights_issue'
  | 'removal_requested';

export interface SubmitContentReportInput {
  reportType: ContentReportInputType;
  reporterName: string;
  reporterEmail: string;
  targetEntityType: ContentReportTargetEntityType;
  targetEntitySlug: string;
  message: string;
  turnstileToken: string;
}

export type SubmitContentReportResult =
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

const MAX_REPORTER_NAME_LENGTH = 160;
const MAX_REPORTER_EMAIL_LENGTH = 320;
const MAX_MESSAGE_LENGTH = 5000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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

export async function submitContentReport(
  input: SubmitContentReportInput
): Promise<SubmitContentReportResult> {
  const validationError = validateContentReportInput(input);

  if (validationError) {
    return {
      ok: false,
      status: 'validation_error',
      message: validationError,
    };
  }

  return submitProtectedPublicPayload({
    action: 'content_report',
    turnstileToken: input.turnstileToken,
    payload: {
      reportType: input.reportType,
      reporterName: input.reporterName,
      reporterEmail: input.reporterEmail,
      targetEntityType: input.targetEntityType,
      targetEntitySlug: input.targetEntitySlug,
      message: input.message,
    },
  });
}

function validateContentReportInput(input: SubmitContentReportInput): string | null {
  const reporterName = input.reporterName.trim();
  const reporterEmail = input.reporterEmail.trim();
  const targetEntitySlug = input.targetEntitySlug.trim();
  const message = input.message.trim();
  const turnstileToken = input.turnstileToken.trim();

  if (!SUPPORTED_REPORT_TYPES.has(input.reportType)) {
    return 'El tipo de reporte no es valido.';
  }

  if (!turnstileToken) {
    return 'Completa la verificación antiabuso antes de enviar.';
  }

  if (!reporterName) {
    return 'El nombre de quien reporta es obligatorio.';
  }

  if (reporterName.length > MAX_REPORTER_NAME_LENGTH) {
    return 'El nombre de quien reporta es demasiado largo.';
  }

  if (!isValidEmail(reporterEmail)) {
    return 'El email de quien reporta no tiene un formato valido.';
  }

  if (reporterEmail.length > MAX_REPORTER_EMAIL_LENGTH) {
    return 'El email de quien reporta es demasiado largo.';
  }

  if (!SUPPORTED_TARGET_ENTITY_TYPES.has(input.targetEntityType)) {
    return 'El tipo de entidad reportada no es valido.';
  }

  if (!targetEntitySlug || !isValidSlug(targetEntitySlug)) {
    return 'El slug de la entidad reportada no tiene un formato valido.';
  }

  if (!message) {
    return 'El mensaje del reporte es obligatorio.';
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return 'El mensaje del reporte es demasiado largo.';
  }

  return null;
}

function isValidEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}
