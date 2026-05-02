/**
 * Purpose: Read and submit traveler adventures through Supabase public RLS.
 * Scope: Frontend SELECT for approved adventures and INSERT for pending submissions; no moderation/auth/photos.
 * Decisions: Read public columns only; create pending submissions with privacy consent and withdrawal hash.
 * Limitations: photo_path is returned as metadata only; private bucket images are not rendered yet.
 * Recent changes: Added private withdrawal token generation and withdrawal Edge Function call.
 */

import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

export interface TravelerAdventurePublic {
  id: string;
  country_slug: string;
  zone_slug: string;
  zone_name: string | null;
  title: string;
  story: string;
  practical_tips: string | null;
  author_name: string;
  photo_path: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface CreateTravelerAdventureInput {
  countrySlug: string;
  zoneSlug: string;
  zoneName?: string | null;
  title: string;
  story: string;
  practicalTips?: string | null;
  authorName: string;
  authorEmail: string;
  privacyAccepted: boolean;
  marketingConsent: boolean;
}

export type CreateTravelerAdventureResult =
  | { success: true; withdrawalToken: string; withdrawalUrl: string }
  | { success: false; error: string };

export type WithdrawTravelerAdventureResult =
  | { success: true; message: string }
  | { success: false; error: string };

const PUBLIC_ADVENTURE_COLUMNS = [
  'id',
  'country_slug',
  'zone_slug',
  'zone_name',
  'title',
  'story',
  'practical_tips',
  'author_name',
  'photo_path',
  'created_at',
  'approved_at',
].join(',');

export const TRAVELER_ADVENTURE_PRIVACY_VERSION = '2026-05-02';

export async function getApprovedAdventuresByZone(
  countrySlug: string,
  zoneSlug: string
): Promise<TravelerAdventurePublic[]> {
  if (!countrySlug || !zoneSlug || !isSupabaseConfigured() || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('traveler_adventures')
    .select(PUBLIC_ADVENTURE_COLUMNS)
    .eq('country_slug', countrySlug)
    .eq('zone_slug', zoneSlug)
    .eq('status', 'approved')
    .order('approved_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    if (import.meta.env.DEV) {
      console.error('[AdventuresService] Error loading approved traveler adventures', {
        countrySlug,
        zoneSlug,
        error,
      });
    }

    throw new Error('No se pudieron cargar las aventuras aprobadas de esta zona');
  }

  return ((data || []) as unknown) as TravelerAdventurePublic[];
}

export async function createTravelerAdventure(
  input: CreateTravelerAdventureInput
): Promise<CreateTravelerAdventureResult> {
  if (!input.privacyAccepted) {
    return {
      success: false,
      error: 'Debes aceptar la política de privacidad para enviar tu aventura.',
    };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Supabase no está configurado. Inténtalo de nuevo más tarde.',
    };
  }

  const consentTimestamp = new Date().toISOString();
  const withdrawalToken = createWithdrawalToken();
  const withdrawalTokenHash = await sha256Hex(withdrawalToken);
  const payload = {
    country_slug: input.countrySlug,
    zone_slug: input.zoneSlug,
    zone_name: normalizeOptionalText(input.zoneName),
    title: input.title.trim(),
    story: input.story.trim(),
    practical_tips: normalizeOptionalText(input.practicalTips),
    author_name: input.authorName.trim(),
    author_email: input.authorEmail.trim(),
    privacy_accepted_at: consentTimestamp,
    privacy_version: TRAVELER_ADVENTURE_PRIVACY_VERSION,
    marketing_consent: input.marketingConsent,
    marketing_consent_at: input.marketingConsent ? consentTimestamp : null,
    withdrawal_token_hash: withdrawalTokenHash,
    withdrawal_token_created_at: consentTimestamp,
  };

  const { error } = await supabase
    .from('traveler_adventures')
    .insert(payload);

  if (error) {
    if (import.meta.env.DEV) {
      console.error('[AdventuresService] Error creating pending traveler adventure', {
        countrySlug: input.countrySlug,
        zoneSlug: input.zoneSlug,
        error,
      });
    }

    return {
      success: false,
      error: 'No pudimos enviar tu aventura. Revisa los campos e inténtalo de nuevo.',
    };
  }

  return {
    success: true,
    withdrawalToken,
    withdrawalUrl: createWithdrawalUrl(withdrawalToken),
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function withdrawTravelerAdventure(
  token: string
): Promise<WithdrawTravelerAdventureResult> {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    return {
      success: false,
      error: 'Introduce el código o enlace de retirada.',
    };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Supabase no está configurado. Inténtalo de nuevo más tarde.',
    };
  }

  const { data, error } = await supabase.functions.invoke<WithdrawTravelerAdventureResult>(
    'withdraw-traveler-adventure',
    {
      body: { token: trimmedToken },
    }
  );

  if (error) {
    if (import.meta.env.DEV) {
      console.error('[AdventuresService] Error withdrawing traveler adventure', error);
    }

    return {
      success: false,
      error: 'No pudimos retirar la aventura con ese código.',
    };
  }

  return data || {
    success: false,
    error: 'No pudimos retirar la aventura con ese código.',
  };
}

function createWithdrawalToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function createWithdrawalUrl(token: string): string {
  const path = `/retirar-aventura?token=${encodeURIComponent(token)}`;

  if (typeof window === 'undefined') {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}
