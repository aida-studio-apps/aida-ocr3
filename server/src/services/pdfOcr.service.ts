import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import { createWorker } from 'tesseract.js';
import type { OcrLanguage, OcrPageResult } from '../types/ocr.types';

export async function extractTextFromPdfBuffer(
  buffer: Buffer,
  language: OcrLanguage,
): Promise<OcrPageResult[]> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const worker = await createWorker(language);
  await worker.setParameters({
    preserve_interword_spaces: '1',
  });

  const pages: OcrPageResult[] = [];

  try {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext('2d');

      await page.render({
        canvas: canvas as never,
        canvasContext: context as never,
        viewport,
      }).promise;

      const imageBuffer = canvas.toBuffer('image/png');
      const result = await worker.recognize(imageBuffer);

      pages.push({
        pageNumber: pageNum,
        text: result.data.text ?? '',
        confidence: result.data.confidence,
      });
    }
  } finally {
    await worker.terminate();
  }

  return pages;
}



