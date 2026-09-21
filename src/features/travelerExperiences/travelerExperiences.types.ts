export type TravelerExperienceType = 'AI_SAMPLE' | 'REAL_USER';

/**
 * Presentation-only model. Real-user records can be supplied later without
 * coupling this UI layer to a backend, provider or editorial content.
 */
export interface TravelerExperience {
  id: string;
  type: TravelerExperienceType;
  displayName: string;
  location?: string;
  quote: string;
  avatarInitials?: string;
  avatarUrl?: string;
  rating?: number;
  createdAt?: string;
  source?: string;
  sourceUrl?: string;
  verified?: boolean;
}
