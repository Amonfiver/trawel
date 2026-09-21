import type { TravelerExperience } from './travelerExperiences.types';

const experiencesByDestination: Record<string, readonly TravelerExperience[]> = {
  cuenca: [
    {
      id: 'cuenca-ai-sofia-r',
      type: 'AI_SAMPLE',
      displayName: 'Sofía R.',
      avatarInitials: 'SR',
      quote: 'Me sorprendió cómo la ciudad parece crecer desde la roca y el paisaje.',
    },
    {
      id: 'cuenca-ai-diego-t',
      type: 'AI_SAMPLE',
      displayName: 'Diego T.',
      avatarInitials: 'DT',
      quote: 'Entre patrimonio y paisaje, Cuenca invita a bajar el ritmo y mirar con más calma.',
    },
    {
      id: 'cuenca-ai-camila-m',
      type: 'AI_SAMPLE',
      displayName: 'Camila M.',
      avatarInitials: 'CM',
      quote: 'La mezcla de calles con historia y naturaleza deja ganas de seguir descubriendo.',
    },
    {
      id: 'cuenca-ai-javier-l',
      type: 'AI_SAMPLE',
      displayName: 'Javier L.',
      avatarInitials: 'JL',
      quote: 'No esperaba que arte, ciudad y paisaje se sintieran tan cerca.',
    },
  ],
};

/** Keeps destination configuration declarative and independent from editorial data. */
export function getTravelerExperiences(destinationSlug: string | undefined): readonly TravelerExperience[] {
  return experiencesByDestination[destinationSlug?.toLowerCase() ?? ''] ?? [];
}
