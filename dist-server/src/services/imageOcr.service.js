import { createWorker } from 'tesseract.js';
export async function extractTextFromImageBuffer(buffer, language) {
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
    }
    finally {
        await worker.terminate();
    }
}
