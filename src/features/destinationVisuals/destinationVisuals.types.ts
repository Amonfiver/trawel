export type DestinationVisualMode = 'adventure' | 'student' | 'both';

export type DestinationVisualUsage =
  | 'hero'
  | 'highlight'
  | 'gallery'
  | 'card'
  | 'itinerary'
  | 'map'
  | 'figure';

export interface DestinationVisualAsset {
  id: string;
  path: string;
  category: string;
  modes: DestinationVisualMode;
  usage: DestinationVisualUsage[];
  alt: string;
  caption: string;
  credit: string;
  source: string;
  rightsStatus: string;
  referenceOnly: boolean;
  priority: number;
}

export interface DestinationVisualSelection {
  hero?: string;
  highlights: string[];
  gallery: string[];
  itinerary: string[];
  map: string[];
}

export interface DestinationVisualManifest {
  destinationSlug: string;
  destinationName: string;
  assets: DestinationVisualAsset[];
  selections: {
    adventure: DestinationVisualSelection;
    student: DestinationVisualSelection;
  };
}

export interface ResolvedDestinationVisualAsset extends DestinationVisualAsset {
  url: string;
}

export interface ResolvedDestinationVisuals {
  destinationSlug: string;
  destinationName: string;
  hero?: ResolvedDestinationVisualAsset;
  highlights: ResolvedDestinationVisualAsset[];
  gallery: ResolvedDestinationVisualAsset[];
  itinerary: ResolvedDestinationVisualAsset[];
  map: ResolvedDestinationVisualAsset[];
}
