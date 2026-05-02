/**
 * Purpose: Public exports for real traveler adventures.
 * Scope: Keeps adventure service imports stable as the feature grows.
 * Decisions: Export approved reads, pending submissions, withdrawals, and active privacy version.
 * Limitations: No moderation, upload or auth API is exposed yet.
 * Recent changes: Added withdrawal service export.
 */

export {
  createTravelerAdventure,
  getApprovedAdventuresByZone,
  TRAVELER_ADVENTURE_PRIVACY_VERSION,
  withdrawTravelerAdventure,
  type CreateTravelerAdventureInput,
  type CreateTravelerAdventureResult,
  type TravelerAdventurePublic,
  type WithdrawTravelerAdventureResult,
} from './adventures.service';
