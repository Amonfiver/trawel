export type BusinessCategory = 'STAY' | 'EAT' | 'LOCAL_EXPERIENCE';

export type BusinessPlacementStatus = 'PLACEHOLDER' | 'READY';

/**
 * Presentation contract only. It deliberately does not imply a backend,
 * commercial approval workflow, tracking, payment or published business.
 */
export interface BusinessPlacement {
  id: string;
  destinationSlug: string;
  category: BusinessCategory;
  status: BusinessPlacementStatus;
  name: string;
  shortDescription: string;
  imageAssetId?: string;
  phone?: string;
  website?: string;
  address?: string;
  badge?: string;
  sponsored?: boolean;
  active?: boolean;
  priority?: number;
  sponsorTier?: string;
  campaign?: string;
  startsAt?: string;
  endsAt?: string;
  trackingKey?: string;
}
