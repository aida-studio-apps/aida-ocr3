import multer from 'multer';
const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            cb(new Error('Type de fichier non supporté. Utilisez PDF, JPG, PNG ou WEBP.'));
            return;
        }
        cb(null, true);
    },
});
