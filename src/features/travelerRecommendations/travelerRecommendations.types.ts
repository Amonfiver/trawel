/**
 * Frontend contract only. A future approved source can populate this without
 * changing the destination visual or editorial contracts.
 */
export interface TravelerRecommendation {
  id: string;
  quote: string;
  authorName?: string;
  authorLocation?: string;
  avatarUrl?: string;
  rating?: number;
  source?: string;
  sourceUrl?: string;
  verified?: boolean;
}
