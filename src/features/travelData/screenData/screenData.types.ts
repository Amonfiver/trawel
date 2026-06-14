import type { Coordinates } from '../../cities/types/city.types';

export type ScreenExperienceMode = 'adventure' | 'student';

export type ScreenEditorialStatus = 'published' | 'fallback' | 'missing';

export type ScreenHeroSource = 'localAsset' | 'fallback';

export type ScreenMapStatus =
  | 'localReady'
  | 'remoteDeferred'
  | 'notAvailable';

export interface ScreenHeroData {
  title: string;
  subtitle: string;
  imageUrl?: string;
  imageAlt: string;
  source: ScreenHeroSource;
  isPremiumFallback: boolean;
}

export interface ScreenEditorialData {
  mode: ScreenExperienceMode;
  status: ScreenEditorialStatus;
  headline: string;
  intro: string;
  whatMakesSpecial?: string;
  highlights: string[];
  suggestedRoute?: string;
  practicalTips?: string;
}

export interface ScreenCommunityCtaData {
  title: string;
  text: string;
  actionLabel?: string;
  href?: string;
  isSecondary: boolean;
}

export interface ScreenCountrySummary {
  id: string;
  slug: string;
  displayName: string;
  isoAlpha2?: string;
  isoAlpha3?: string;
  unM49?: string;
  status?: string;
  isFromWorldCatalog: boolean;
}

export interface ScreenZoneSummary {
  id: string;
  slug: string;
  countrySlug: string;
  name: string;
  type: 'region' | 'province' | 'city' | 'area' | 'island' | 'custom' | 'unknown';
  status?: string;
  featured?: boolean;
  coordinates?: Coordinates;
  summary?: string;
}

export interface CountryScreenData {
  kind: 'country';
  mode: ScreenExperienceMode;
  country: ScreenCountrySummary | null;
  hero: ScreenHeroData;
  editorial: ScreenEditorialData;
  zones: ScreenZoneSummary[];
  mapStatus: {
    status: ScreenMapStatus;
    preferredAdminLevel?: string;
    source: 'localAsset' | 'futureSupabase' | 'none';
  };
  fallback: {
    isUsingPremiumFallback: boolean;
    reason?: string;
  };
  communityCta: ScreenCommunityCtaData;
}

export interface ZoneScreenData {
  kind: 'zone';
  mode: ScreenExperienceMode;
  country: ScreenCountrySummary | null;
  zone: ScreenZoneSummary;
  hero: ScreenHeroData;
  editorial: ScreenEditorialData;
  places: [];
  plans: [];
  routes: [];
  fallback: {
    isUsingPremiumFallback: boolean;
    reason?: string;
  };
  communityCta: ScreenCommunityCtaData;
}
