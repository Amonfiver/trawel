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
      if (getFunctionErrorStatus(error) === 429) {
        return {
          ok: false,
          status: 'rate_limited',
          message: RATE_LIMIT_MESSAGE,
        };
      }

      return {
        ok: false,
        status: 'submit_error',
        message: 'No se pudo enviar el formulario protegido.',
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
