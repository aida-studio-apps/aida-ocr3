import { createWorker } from 'tesseract.js';
import type { OcrLanguage, OcrPageResult } from '../types/ocr.types.js';

export async function extractTextFromImageBuffer(
  buffer: Buffer,
  language: OcrLanguage,
): Promise<OcrPageResult> {
  const worker = await createWorker(language);

  try {
    await worker.setParameters({
      preserve_interword_spaces: '1',
    });

    const result = await worker.recognize(buffer);
    return {
      pageNumber: 1,
      text: result.data.text ?? '',
      confidence: result.data.confidence,
    };
  } finally {
    await worker.terminate();
  }
}


