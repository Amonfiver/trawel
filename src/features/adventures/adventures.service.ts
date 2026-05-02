/**
 * Purpose: Read and submit traveler adventures through Supabase public RLS.
 * Scope: Frontend SELECT for approved adventures and INSERT for pending submissions; no moderation/auth/photos.
 * Decisions: Read only public columns; create submissions without status/photo_path and require privacy consent.
 * Limitations: photo_path is returned as metadata only; private bucket images are not rendered yet.
 * Recent changes: Added privacy acceptance and optional marketing consent to pending submissions.
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
  | { success: true }
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

  return { success: true };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
