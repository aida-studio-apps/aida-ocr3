import { Router } from 'express';
import { upload } from '../middleware/upload.middleware.js';
import { extractOcrController } from '../controllers/ocr.controller.js';

const ocrRouter = Router();

ocrRouter.post('/extract', upload.single('file'), extractOcrController);

export default ocrRouter;

