export const STUDENT_DOCUMENT_V1 = 'student-document-v1' as const;

export type StudentFigurePlacement = 'INLINE' | 'WIDE';

export type StudentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string; id?: string }
  | { type: 'figure'; assetId: string; placement: StudentFigurePlacement; caption?: string; alt: string }
  | { type: 'list'; style: 'unordered' | 'ordered'; items: string[] }
  | { type: 'key_facts'; title?: string; items: Array<{ label: string; value: string }> }
  | { type: 'callout'; tone: 'NOTE' | 'CONTEXT' | 'DEFINITION'; title?: string; text: string }
  | { type: 'timeline'; title?: string; items: Array<{ label: string; text: string }> }
  | { type: 'references'; items: Array<{ label?: string; title: string; source?: string; url?: string }> };

/** Ordered editorial contract. Investighost owns every block and its position. */
export interface StudentDocumentV1 {
  version: typeof STUDENT_DOCUMENT_V1;
  headline: string;
  lead: string[];
  blocks: StudentBlock[];
}

export interface StudentDocumentMediaAsset {
  id: string;
  url: string;
  alt: string;
  credit?: string;
  source?: string;
  license?: string;
}
