import type { TravelerExperience } from './travelerExperiences.types';

/** Future real entries lead the presentation; verified records lead other real entries. */
export function prioritizeTravelerExperiences(experiences: readonly TravelerExperience[]): TravelerExperience[] {
  return [...experiences].sort((left, right) => priority(left) - priority(right));
}

function priority(experience: TravelerExperience): number {
  if (experience.type === 'REAL_USER') return experience.verified ? 0 : 1;
  return 2;
}
