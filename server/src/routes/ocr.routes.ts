import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { extractOcrController } from '../controllers/ocr.controller';

const ocrRouter = Router();

ocrRouter.post('/extract', upload.single('file'), extractOcrController);

export default ocrRouter;

