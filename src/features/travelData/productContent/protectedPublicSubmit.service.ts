import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';

export type ProtectedPublicSubmitResult =
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

const PROTECTED_PUBLIC_SUBMIT_FUNCTION = 'protected-public-submit';
const RATE_LIMIT_MESSAGE =
  'Has enviado varias aportaciones recientemente. Inténtalo de nuevo más tarde.';

export async function submitProtectedPublicPayload(
  payload: Record<string, unknown>
): Promise<ProtectedPublicSubmitResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      ok: false,
      status: 'not_configured',
      message: 'Supabase no esta configurado en este entorno.',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke(PROTECTED_PUBLIC_SUBMIT_FUNCTION, {
      body: payload,
    });

    if (error) {
      const errorPayload = await getFunctionErrorPayload(error);
      const reason = getProtectedSubmitFailureReason(errorPayload) || getProtectedSubmitFailureReason(error);

      if (getFunctionErrorStatus(error) === 429 || errorPayload?.status === 'rate_limited') {
        return {
          ok: false,
          status: 'rate_limited',
          message: getProtectedSubmitFailureMessage(errorPayload) || RATE_LIMIT_MESSAGE,
          reason,
        };
      }

      return {
        ok: false,
        status: 'submit_error',
        message: getProtectedSubmitFailureMessage(errorPayload) || 'No se pudo enviar el formulario protegido.',
        reason,
      };
    }

    if (!isProtectedSubmitResponse(data)) {
      return {
        ok: false,
        status: 'submit_error',
        message: 'Respuesta inesperada del servidor.',
      };
    }

    if (!data.success) {
      return {
        ok: false,
        status: mapProtectedSubmitErrorStatus(data.status),
        message: data.error || 'No se pudo enviar el formulario protegido.',
        reason: getProtectedSubmitFailureReason(data),
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
      message: 'Error inesperado al enviar el formulario protegido.',
    };
  }
}

function isProtectedSubmitResponse(value: unknown): value is {
  success: boolean;
  status?: string;
  error?: string;
  reason?: string;
  metadata?: {
    reason?: unknown;
  };
} {
  return Boolean(value && typeof value === 'object' && 'success' in value);
}

function mapProtectedSubmitErrorStatus(
  status: string | undefined
): 'validation_error' | 'rate_limited' | 'submit_error' {
  if (status === 'validation_error') {
    return 'validation_error';
  }

  if (status === 'rate_limited') {
    return 'rate_limited';
  }

  return 'submit_error';
}

function getFunctionErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const context = 'context' in error ? (error as { context?: unknown }).context : null;

  if (context && typeof context === 'object' && 'status' in context) {
    const status = (context as { status?: unknown }).status;
    return typeof status === 'number' ? status : null;
  }

  return null;
}

async function getFunctionErrorPayload(error: unknown): Promise<{
  status?: string;
  error?: string;
  message?: string;
  reason?: string;
  metadata?: {
    reason?: unknown;
  };
} | null> {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const context = 'context' in error ? (error as { context?: unknown }).context : null;

  if (!context || typeof context !== 'object' || !('json' in context)) {
    return null;
  }

  try {
    const response = context as Response;
    const payload = await response.clone().json();
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

function getProtectedSubmitFailureMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const message = candidate.error || candidate.message;
  return typeof message === 'string' && message.trim() ? message.trim() : null;
}

function getProtectedSubmitFailureReason(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const directReason = candidate.reason;

  if (typeof directReason === 'string' && directReason.trim()) {
    return directReason.trim();
  }

  const metadata = candidate.metadata;

  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const metadataReason = (metadata as Record<string, unknown>).reason;

    if (typeof metadataReason === 'string' && metadataReason.trim()) {
      return metadataReason.trim();
    }
  }

  return undefined;
}
