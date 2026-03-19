import axios from 'axios';
import type { OcrExtractResponse, OcrLanguage } from '../types';

export async function extractOcr(file: File, language: OcrLanguage): Promise<OcrExtractResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', language);
  formData.append('preserveLayout', 'true');

  const response = await axios.post<OcrExtractResponse>('/api/ocr/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

