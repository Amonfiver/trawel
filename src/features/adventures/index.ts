/**
 * Purpose: Public exports for real traveler adventures.
 * Scope: Keeps adventure service imports stable as the feature grows.
 * Decisions: Export approved reads, pending submissions, and the active privacy text version.
 * Limitations: No moderation, upload or auth API is exposed yet.
 * Recent changes: Added privacy consent version export.
 */

export {
  createTravelerAdventure,
  getApprovedAdventuresByZone,
  TRAVELER_ADVENTURE_PRIVACY_VERSION,
  type CreateTravelerAdventureInput,
  type TravelerAdventurePublic,
} from './adventures.service';
