export type PresentationTone =
  | 'IMPACT'
  | 'ADVENTURE'
  | 'CULTURE'
  | 'LANDSCAPE'
  | 'FOOD'
  | 'LOCAL_LIFE'
  | 'NIGHT'
  | 'CALM'
  | 'PREMIUM';

export type TextPlacement = 'OVERLAY' | 'BELOW_MEDIA' | 'CARD_OVERLAY' | 'INLINE';
export type PlaceToGoCategory = 'STAY' | 'EAT' | 'DRINK' | 'NIGHTLIFE';

export interface EditorialCta {
  label: string;
  actionType: 'ANCHOR' | 'INTERNAL_ROUTE' | 'EXTERNAL_URL';
  target: string;
}

export interface CanonicalDestinationMedia {
  id: string;
  url: string;
  alt: string;
  defaultCaption?: string;
  credit?: string;
  source?: string;
  license?: string;
  rightsStatus: string;
}

export interface CanonicalHero {
  asset: CanonicalDestinationMedia;
  title: string;
  shortCopy: string;
  presentationTone: PresentationTone;
  textPlacement: TextPlacement;
  kicker?: string;
  caption?: string;
  cta?: EditorialCta;
}

export interface DestinationVisualStoryItem {
  id: string;
  asset: CanonicalDestinationMedia;
  order: number;
  title?: string;
  kicker?: string;
  shortCopy?: string;
  caption?: string;
  presentationTone: PresentationTone;
  textPlacement: TextPlacement;
  linkedAdventureSection?: string;
  cta?: EditorialCta;
}

export interface PlaceToGoItem {
  id: string;
  category: PlaceToGoCategory;
  name: string;
  order: number;
  shortDescription: string;
  reasonToGo: string;
  area?: string;
  asset?: CanonicalDestinationMedia;
  caption?: string;
  presentationTone?: PresentationTone;
  address?: string;
  url?: string;
  coordinates?: { latitude: number; longitude: number };
}

export interface CanonicalDestinationPresentation {
  packageId: string;
  hero: CanonicalHero;
  destinationVisualStory: DestinationVisualStoryItem[];
  placesToGo: PlaceToGoItem[];
}
