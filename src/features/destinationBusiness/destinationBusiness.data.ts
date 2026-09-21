import type { BusinessPlacement } from './destinationBusiness.types';

/**
 * Destination-scoped presentation data. Cuenca intentionally contains only
 * transparent placeholders, never invented businesses or contact details.
 */
const placementsByDestination: Record<string, readonly BusinessPlacement[]> = {
  cuenca: [
    {
      id: 'cuenca-stay-placeholder',
      destinationSlug: 'cuenca',
      category: 'STAY',
      status: 'PLACEHOLDER',
      name: 'Tu alojamiento aquí',
      shortDescription: 'Un espacio cuidado para alojamientos que quieran aparecer cuando el viaje ya ha empezado a imaginarse.',
      badge: 'Espacio disponible',
      active: true,
      priority: 0,
      sponsored: false,
    },
    {
      id: 'cuenca-eat-placeholder',
      destinationSlug: 'cuenca',
      category: 'EAT',
      status: 'PLACEHOLDER',
      name: 'Tu restaurante aquí',
      shortDescription: 'Un lugar reservado para propuestas gastronómicas locales, presentado con contexto y sin ruido.',
      badge: 'Espacio disponible',
      active: true,
      priority: 0,
      sponsored: false,
    },
    {
      id: 'cuenca-local-experience-placeholder',
      destinationSlug: 'cuenca',
      category: 'LOCAL_EXPERIENCE',
      status: 'PLACEHOLDER',
      name: 'Tu experiencia local aquí',
      shortDescription: 'Un espacio para negocios locales que ayuden a descubrir el destino desde una perspectiva propia.',
      badge: 'Espacio disponible',
      active: true,
      priority: 0,
      sponsored: false,
    },
  ],
};

export function getDestinationBusinessPlacements(destinationSlug: string | undefined): readonly BusinessPlacement[] {
  return placementsByDestination[destinationSlug?.toLowerCase() ?? ''] ?? [];
}
