import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';

export interface PublicCountryOption {
  id: string;
  slug: string;
  value: string;
  label: string;
  iso2: string;
  iso3: string | null;
  continent: string | null;
  hasPublicContent: boolean;
}

export interface PublicZoneOption {
  id: string;
  slug: string;
  value: string;
  label: string;
  countryId: string | null;
  countrySlug: string;
  region: string | null;
  adminArea: string | null;
}

interface DBCountryOption {
  id: string | null;
  slug: string | null;
  name_es: string | null;
  iso2: string | null;
  iso3: string | null;
  continent: string | null;
  is_active: boolean | null;
  has_public_content: boolean | null;
}

interface DBCityOption {
  id: string | null;
  slug: string | null;
  name: string | null;
  country_id: string | null;
  country_slug: string | null;
  region: string | null;
  admin_area: string | null;
  status: string | null;
}

const PUBLIC_STATUS = 'active';

const COUNTRY_OPTION_COLUMNS = [
  'id',
  'slug',
  'name_es',
  'iso2',
  'iso3',
  'continent',
  'is_active',
  'has_public_content',
].join(',');

const CITY_OPTION_COLUMNS = [
  'id',
  'slug',
  'name',
  'country_id',
  'country_slug',
  'region',
  'admin_area',
  'status',
].join(',');

export async function getPublicCountryOptions(): Promise<PublicCountryOption[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('location_countries')
      .select(COUNTRY_OPTION_COLUMNS)
      .eq('is_active', true)
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
    const { data, error } = await supabase
      .from('location_cities')
      .select(CITY_OPTION_COLUMNS)
      .eq('country_slug', normalizedCountrySlug)
      .eq('status', PUBLIC_STATUS)
      .order('name', { ascending: true });

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

function mapCountryOption(db: DBCountryOption): PublicCountryOption | null {
  const id = normalizeRequiredText(db.id);
  const slug = normalizeSlug(db.slug || '');
  const label = normalizeRequiredText(db.name_es);
  const iso2 = normalizeRequiredText(db.iso2)?.toUpperCase();

  if (!id || !slug || !label || !iso2 || db.is_active !== true) {
    return null;
  }

  return {
    id,
    slug,
    value: slug,
    label,
    iso2,
    iso3: normalizeRequiredText(db.iso3)?.toUpperCase() || null,
    continent: normalizeRequiredText(db.continent),
    hasPublicContent: Boolean(db.has_public_content),
  };
}

function mapZoneOption(db: DBCityOption): PublicZoneOption | null {
  const id = normalizeRequiredText(db.id);
  const slug = normalizeSlug(db.slug || '');
  const label = normalizeRequiredText(db.name);
  const countrySlug = normalizeSlug(db.country_slug || '');

  if (!id || !slug || !label || !countrySlug || db.status !== PUBLIC_STATUS) {
    return null;
  }

  return {
    id,
    slug,
    value: slug,
    label,
    countryId: normalizeRequiredText(db.country_id),
    countrySlug,
    region: normalizeRequiredText(db.region),
    adminArea: normalizeRequiredText(db.admin_area),
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
