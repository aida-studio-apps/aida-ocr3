import { ocrBodySchema } from '../validators/ocr.validator';
import { runOcr } from '../services/ocr.service';
export async function extractOcrController(req, res, next) {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'Aucun fichier reçu.' });
            return;
        }
        const parsed = ocrBodySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Paramètres invalides.', details: parsed.error.flatten() });
            return;
        }
        const result = await runOcr({
            file: req.file,
            language: parsed.data.language,
        });
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}
