import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';

export type ProtectedPublicSubmitResult =
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

const PROTECTED_PUBLIC_SUBMIT_FUNCTION = 'protected-public-submit';

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
        status: data.status === 'validation_error' ? 'validation_error' : 'submit_error',
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
