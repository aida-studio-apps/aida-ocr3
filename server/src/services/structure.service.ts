import type { StructuredBlock } from '../types/ocr.types.js';

export function structureText(rawText: string): StructuredBlock[] {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: StructuredBlock[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      blocks.push({ type: 'paragraph', content: paragraphBuffer.join(' ') });
      paragraphBuffer = [];
    }
  };

  for (const line of lines) {
    const isLikelyTitle =
      line.length < 80 &&
      (line === line.toUpperCase() || /^[A-ZÀ-Ÿ][A-Za-zÀ-ÿ0-9\s\-:]{0,60}$/.test(line));

    if (isLikelyTitle) {
      flushParagraph();
      blocks.push({ type: 'title', content: line });
      continue;
    }

    paragraphBuffer.push(line);

    if (/[.!?:]$/.test(line)) {
      flushParagraph();
    }
  }

  flushParagraph();
  return blocks;
}

