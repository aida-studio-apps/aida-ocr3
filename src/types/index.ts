export type OcrLanguage = 'fra' | 'eng' | 'fra+eng';

export interface StructuredBlock {
  type: 'title' | 'paragraph';
  content: string;
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence?: number;
}

export interface OcrExtractResponse {
  fullText: string;
  blocks: StructuredBlock[];
  pages: OcrPageResult[];
  processingTimeMs: number;
  warnings: string[];
}

