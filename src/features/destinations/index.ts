/**
 * Export público de la feature destinations
 */

export type {
  Destination,
  DestinationDictionary,
  DestinationListItem,
  DestinationStatus,
  DestinationType,
  DestinationContentByMode,
  Source,
} from './types/destination.types';

export {
  destinations,
  allDestinations,
  publishedDestinations,
  featuredDestinations,
} from './data/destinations';

export {
  getDestinationBySlug,
  getDestinationsByCountrySlug,
  getPublishedDestinationsByCountry,
  getDestinationsByCitySlug,
  getPublishedDestinationsByCity,
  getPublishedDestinations,
  getFeaturedDestinations,
  getFeaturedDestinationsByCountry,
  getFeaturedDestinationsByCity,
  getDestinationContentByMode,
  isDestinationClickable,
  isDestinationAvailable,
  getDestinationTitle,
  getDestinationSummary,
  getDestinationCounts,
  getDestinationCountsByCity,
} from './data/destinations.utils';