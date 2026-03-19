import { z } from 'zod';

export const ocrBodySchema = z.object({
  language: z.enum(['fra', 'eng', 'fra+eng']).default('fra+eng'),
  preserveLayout: z
    .string()
    .optional()
    .transform((v) => (v == null ? true : v === 'true')),
});

export type OcrBody = z.infer<typeof ocrBodySchema>;

