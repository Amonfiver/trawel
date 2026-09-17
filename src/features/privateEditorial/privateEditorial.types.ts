export type PrivateEditorialMode = 'adventure' | 'student';

export interface PrivateEditorialDraft {
  id: string;
  entityType: 'zone';
  entityId: string;
  entitySlug: string | null;
  countrySlug: string | null;
  zoneSlug: string | null;
  mode: PrivateEditorialMode;
  headline: string;
  intro: string | null;
  whatMakesSpecial: string | null;
  highlights: unknown[];
  suggestedRoute: string | null;
  practicalTips: unknown[];
  sections: Array<{ heading?: string; content?: string; position?: number }>;
  sources: Array<{ title?: string; url?: string; publisher?: string | null }>;
  metadata: Record<string, unknown>;
  status: 'draft';
  reviewState: string | null;
  publishedAt: null;
  updatedAt: string;
}

export interface PrivateEditorialDestination {
  id: string;
  countrySlug: string;
  name: string;
  slug: string;
  region: string | null;
  status: string;
}

export interface PrivateEditorialReaderData {
  destination: PrivateEditorialDestination;
  role: 'editor' | 'admin';
  drafts: PrivateEditorialDraft[];
}
