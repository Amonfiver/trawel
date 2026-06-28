import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';

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
}

export type SubmitContentReportResult =
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

interface ContentReportQueueRow {
  report_type: ContentReportStoredType;
  reporter_name: string;
  reporter_email: string;
  target_entity_type: ContentReportTargetEntityType;
  target_entity_slug: string;
  message: string;
}

const CONTENT_REPORTS_TABLE = 'content_reports';
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

  if (!isSupabaseConfigured() || !supabase) {
    return {
      ok: false,
      status: 'not_configured',
      message: 'Supabase no esta configurado en este entorno.',
    };
  }

  const row = mapContentReportInputToQueueRow(input);

  try {
    const { error } = await supabase.from(CONTENT_REPORTS_TABLE).insert(row);

    if (error) {
      return {
        ok: false,
        status: 'submit_error',
        message: 'No se pudo enviar el reporte a la cola de revision.',
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
      message: 'Error inesperado al enviar el reporte a la cola de revision.',
    };
  }
}

function validateContentReportInput(input: SubmitContentReportInput): string | null {
  const reporterName = input.reporterName.trim();
  const reporterEmail = input.reporterEmail.trim();
  const targetEntitySlug = input.targetEntitySlug.trim();
  const message = input.message.trim();

  if (!SUPPORTED_REPORT_TYPES.has(input.reportType)) {
    return 'El tipo de reporte no es valido.';
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

function mapContentReportInputToQueueRow(
  input: SubmitContentReportInput
): ContentReportQueueRow {
  return {
    report_type: mapReportTypeToStoredType(input.reportType),
    reporter_name: input.reporterName.trim(),
    reporter_email: input.reporterEmail.trim(),
    target_entity_type: input.targetEntityType,
    target_entity_slug: input.targetEntitySlug.trim(),
    message: input.message.trim(),
  };
}

function mapReportTypeToStoredType(
  reportType: ContentReportInputType
): ContentReportStoredType {
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

function isValidEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}
