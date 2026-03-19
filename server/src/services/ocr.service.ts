import type { OcrExtractResponse, OcrLanguage, OcrPageResult } from '../types/ocr.types';
import { extractTextFromImageBuffer } from './imageOcr.service';
import { extractTextFromPdfBuffer } from './pdfOcr.service';
import { structureText } from './structure.service';

export async function runOcr(params: {
  file: { mimetype: string; buffer: Buffer };
  language: OcrLanguage;
}): Promise<OcrExtractResponse> {
  const { file, language } = params;
  const start = Date.now();
  let pages: OcrPageResult[] = [];

  if (file.mimetype === 'application/pdf') {
    pages = await extractTextFromPdfBuffer(file.buffer, language);
  } else {
    const page = await extractTextFromImageBuffer(file.buffer, language);
    pages = [page];
  }

  const fullText = pages
    .map((p) => `--- Page ${p.pageNumber} ---\n${p.text.trim()}`)
    .join('\n\n');

  const blocks = structureText(fullText);
  const warnings: string[] = [];
  const avgConfidence =
    pages.reduce((sum, p) => sum + (p.confidence ?? 0), 0) / Math.max(1, pages.length);

  if (avgConfidence < 65) {
    warnings.push('La qualité du document semble moyenne. Le texte extrait peut contenir des erreurs.');
  }

  return {
    fullText,
    blocks,
    pages,
    processingTimeMs: Date.now() - start,
    warnings,
  };
}


