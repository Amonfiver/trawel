import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';

export interface PublicCountryOption {
  id: string;
  slug: string;
  value: string;
  label: string;
  featured: boolean;
}

export interface PublicZoneOption {
  id: string;
  slug: string;
  value: string;
  label: string;
  countryId: string;
  featured: boolean;
}

interface DBCountryOption {
  id: string | null;
  slug: string | null;
  name_es: string | null;
  status: string | null;
  featured: boolean | null;
}

interface DBCityOption {
  id: string | null;
  slug: string | null;
  name_es: string | null;
  country_id: string | null;
  status: string | null;
  featured: boolean | null;
}

const PUBLIC_STATUS = 'active';

const COUNTRY_OPTION_COLUMNS = [
  'id',
  'slug',
  'name_es',
  'status',
  'featured',
].join(',');

const CITY_OPTION_COLUMNS = [
  'id',
  'slug',
  'name_es',
  'country_id',
  'status',
  'featured',
].join(',');

export async function getPublicCountryOptions(): Promise<PublicCountryOption[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('countries')
      .select(COUNTRY_OPTION_COLUMNS)
      .eq('status', PUBLIC_STATUS)
      .order('featured', { ascending: false })
      .order('name_es', { ascending: true });

    if (error) {
      logPublicLocationOptionsWarning('Error loading public country options', error);
      return [];
    }

    return (((data || []) as unknown) as DBCountryOption[])
      .map(mapCountryOption)
      .filter((option): option is PublicCountryOption => Boolean(option));
  } catch (error) {
    logPublicLocationOptionsWarning('Unexpected error loading public country options', error);
    return [];
  }
}

export async function getPublicZoneOptionsByCountrySlug(
  countrySlug: string
): Promise<PublicZoneOption[]> {
  const normalizedCountrySlug = normalizeSlug(countrySlug);

  if (!normalizedCountrySlug || !isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const countryId = await getPublicCountryIdBySlug(normalizedCountrySlug);

    if (!countryId) {
      return [];
    }

    const { data, error } = await supabase
      .from('cities')
      .select(CITY_OPTION_COLUMNS)
      .eq('country_id', countryId)
      .eq('status', PUBLIC_STATUS)
      .order('featured', { ascending: false })
      .order('name_es', { ascending: true });

    if (error) {
      logPublicLocationOptionsWarning('Error loading public zone options', error);
      return [];
    }

    return (((data || []) as unknown) as DBCityOption[])
      .map(mapZoneOption)
      .filter((option): option is PublicZoneOption => Boolean(option));
  } catch (error) {
    logPublicLocationOptionsWarning('Unexpected error loading public zone options', error);
    return [];
  }
}

async function getPublicCountryIdBySlug(countrySlug: string): Promise<string | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('countries')
      .select('id,slug,status')
      .eq('slug', countrySlug)
      .eq('status', PUBLIC_STATUS)
      .maybeSingle();

    if (error) {
      logPublicLocationOptionsWarning('Error loading public country id for zones', error);
      return null;
    }

    const country = data as { id?: string | null; slug?: string | null; status?: string | null } | null;

    if (country?.status !== PUBLIC_STATUS) {
      return null;
    }

    return normalizeRequiredText(country.id);
  } catch (error) {
    logPublicLocationOptionsWarning('Unexpected error loading public country id for zones', error);
    return null;
  }
}

function mapCountryOption(db: DBCountryOption): PublicCountryOption | null {
  const id = normalizeRequiredText(db.id);
  const slug = normalizeSlug(db.slug || '');
  const label = normalizeRequiredText(db.name_es);

  if (!id || !slug || !label || db.status !== PUBLIC_STATUS) {
    return null;
  }

  return {
    id,
    slug,
    value: slug,
    label,
    featured: Boolean(db.featured),
  };
}

function mapZoneOption(db: DBCityOption): PublicZoneOption | null {
  const id = normalizeRequiredText(db.id);
  const slug = normalizeSlug(db.slug || '');
  const label = normalizeRequiredText(db.name_es);
  const countryId = normalizeRequiredText(db.country_id);

  if (!id || !slug || !label || !countryId || db.status !== PUBLIC_STATUS) {
    return null;
  }

  return {
    id,
    slug,
    value: slug,
    label,
    countryId,
    featured: Boolean(db.featured),
  };
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeRequiredText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

function logPublicLocationOptionsWarning(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.warn('[PublicLocationOptions]', message, error);
  }
}
