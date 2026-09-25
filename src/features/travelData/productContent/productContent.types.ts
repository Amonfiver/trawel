export type ProductContentStatus = 'draft' | 'review' | 'published' | 'archived';

export type ProductContentEntityType =
  | 'country'
  | 'zone'
  | 'place'
  | 'route'
  | 'plan'
  | 'static_page'
  | 'generic';

export type ProductContentMode = 'adventure' | 'student';

export type PromotionDisclosureLabel = 'Promocion' | 'Patrocinado' | 'Colaborador';

export type PromotionPlacementType =
  | 'native_block'
  | 'recommended_hotel'
  | 'rental_car'
  | 'travel_insurance'
  | 'local_experience'
  | 'restaurant'
  | 'travel_gear'
  | 'seasonal_offer'
  | 'related_offer';

export interface EditorialContent {
  id: string;
  entityType: ProductContentEntityType;
  entityId: string | null;
  entitySlug: string | null;
  countrySlug: string | null;
  zoneSlug: string | null;
  mode: ProductContentMode | null;
  headline: string;
  intro: string | null;
  whatMakesSpecial: string | null;
  highlights: unknown[];
  suggestedRoute: string | null;
  practicalTips: unknown[];
  sections: unknown[];
  sources: unknown[];
  metadata: Record<string, unknown>;
  presentationPackageId: string | null;
  studentDocument?: unknown;
  status: 'published';
  reviewState: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetPublishedEditorialContentInput {
  entityType: ProductContentEntityType;
  entityId?: string | null;
  entitySlug?: string | null;
  countrySlug?: string | null;
  zoneSlug?: string | null;
  mode?: ProductContentMode | null;
  presentationPackageId?: string | null;
}

export type StaticPageType =
  | 'about'
  | 'contact'
  | 'privacy'
  | 'cookies'
  | 'terms'
  | 'image_credits'
  | 'share'
  | 'trust'
  | 'legal'
  | 'generic';

export interface StaticPage {
  id: string;
  slug: string;
  type: StaticPageType;
  title: string;
  summary: string | null;
  body: Record<string, unknown>;
  version: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalSlug: string | null;
  noindex: boolean;
  metadata: Record<string, unknown>;
  status: 'published';
  reviewState: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sponsorName: string;
  sponsorUrl: string | null;
  imageAssetId: string | null;
  placementType: PromotionPlacementType;
  targetEntityType: ProductContentEntityType | null;
  targetEntityId: string | null;
  targetEntitySlug: string | null;
  countrySlug: string | null;
  zoneSlug: string | null;
  travelerType: string | null;
  mode: ProductContentMode | null;
  startsAt: string | null;
  endsAt: string | null;
  status: 'published';
  priority: number;
  disclosureLabel: PromotionDisclosureLabel;
  metadata: Record<string, unknown>;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetPublishedPromotionsForContextInput {
  countrySlug?: string | null;
  zoneSlug?: string | null;
  mode?: ProductContentMode | null;
  placementType?: PromotionPlacementType | null;
  targetEntityType?: ProductContentEntityType | null;
  targetEntityId?: string | null;
  targetEntitySlug?: string | null;
  limit?: number;
}
