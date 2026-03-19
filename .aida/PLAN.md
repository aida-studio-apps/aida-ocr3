# Plan d’implémentation — Application OCR (Image/PDF scannés → Texte structuré)

## 1. Stack technique

### Template choisi
- **Template : `express-fullstack`**
- **Justification :**
  - Le besoin inclut **upload de fichiers** (images + PDF scannés).
  - Nécessite du **processing serveur** (OCR priorisant la qualité, potentiellement long).
  - Nécessite une **API REST** (`/api/ocr/extract`) pour orchestrer upload, conversion PDF→images, OCR multi-pages et réponse structurée.
  - Une SPA front seule (`vite-react-tailwind`) est insuffisante pour ce traitement robuste.

### Stack détaillée
- **Frontend** : React + TypeScript + Vite + Tailwind (template fullstack)
- **Backend** : Express + TypeScript
- **OCR** : `tesseract.js` (mode serveur worker)
- **PDF rendu image** : `pdfjs-dist` + `canvas` (rasterisation page par page)
- **Upload** : `multer`
- **Validation requêtes** : `zod`
- **Logs** : `pino` + `pino-http`
- **Utilitaires** : `mime-types`, `nanoid`

### Dépendances supplémentaires à prévoir
- Backend:
  - `tesseract.js`
  - `multer`
  - `zod`
  - `pdfjs-dist`
  - `canvas`
  - `pino` `pino-http`
  - `mime-types`
  - `nanoid`
- Frontend:
  - `react-dropzone` (UX upload)
  - `lucide-react` (icônes)
  - `sonner` (notifications)

---

## 2. Arborescence des fichiers (exhaustive)

```text
/workspace/
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx
│   │   │   │   └── Header.tsx
│   │   │   ├── upload/
│   │   │   │   ├── FileDropzone.tsx
│   │   │   │   ├── FileMetaCard.tsx
│   │   │   │   └── ExtractionControls.tsx
│   │   │   ├── extraction/
│   │   │   │   ├── ExtractionProgress.tsx
│   │   │   │   ├── ExtractedTextView.tsx
│   │   │   │   └── PageTextBlock.tsx
│   │   │   └── common/
│   │   │       ├── EmptyState.tsx
│   │   │       ├── ErrorAlert.tsx
│   │   │       └── Spinner.tsx
│   │   ├── pages/
│   │   │   └── HomePage.tsx
│   │   ├── services/
│   │   │   └── ocrApi.ts
│   │   ├── hooks/
│   │   │   ├── useFileUpload.ts
│   │   │   └── useOcrExtraction.ts
│   │   ├── types/
│   │   │   ├── ocr.ts
│   │   │   └── api.ts
│   │   ├── utils/
│   │   │   ├── format.ts
│   │   │   ├── fileValidation.ts
│   │   │   └── textStructure.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── ...
├── server/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   └── ocr.routes.ts
│   │   ├── controllers/
│   │   │   └── ocr.controller.ts
│   │   ├── services/
│   │   │   ├── ocr/
│   │   │   │   ├── ocr.service.ts
│   │   │   │   ├── tesseract.worker.ts
│   │   │   │   └── structurePostProcessor.ts
│   │   │   ├── pdf/
│   │   │   │   └── pdfRasterizer.service.ts
│   │   │   └── files/
│   │   │       ├── fileType.service.ts
│   │   │       └── uploadCleanup.service.ts
│   │   ├── middlewares/
│   │   │   ├── errorHandler.ts
│   │   │   ├── notFound.ts
│   │   │   ├── upload.middleware.ts
│   │   │   └── requestLogger.ts
│   │   ├── schemas/
│   │   │   └── ocr.schema.ts
│   │   ├── types/
│   │   │   ├── api.ts
│   │   │   └── ocr.ts
│   │   └── utils/
│   │       ├── asyncHandler.ts
│   │       ├── errors.ts
│   │       └── timers.ts
│   └── ...
└── references/
    ├── po_goindigo.pdf
    └── Image.jpeg
```

### Description rapide de chaque fichier clé
- `HomePage.tsx` : page unique orientée workflow upload → extraction → consultation.
- `FileDropzone.tsx` : zone d’import drag&drop + sélection fichier.
- `ExtractionControls.tsx` : bouton lancer extraction, reset.
- `ExtractedTextView.tsx` : affichage texte global, structuré en blocs.
- `PageTextBlock.tsx` : rendu d’une page OCR (titre/paragraphes approximés).
- `ocrApi.ts` : client HTTP vers endpoint backend.
- `useOcrExtraction.ts` : orchestration état extraction (idle/loading/success/error).
- `ocr.controller.ts` : reçoit upload, appelle pipeline OCR.
- `ocr.service.ts` : logique métier principale OCR image/PDF.
- `pdfRasterizer.service.ts` : conversion PDF scanné en images exploitables OCR.
- `structurePostProcessor.ts` : heuristiques de reconstruction titres/paragraphes.
- `upload.middleware.ts` : config multer (types/taille autorisés).
- `ocr.schema.ts` : validation des options requête.

---

## 3. Modèles de données (TypeScript)

```ts
interface UploadedFileMeta {
  originalName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf';
  sizeBytes: number;
}

interface OcrRequestOptions {
  language: 'fra' | 'eng' | 'fra+eng';
  preserveLayout: boolean;
}

interface OcrPageResult {
  pageNumber: number;
  rawText: string;
  structuredText: string;
  confidenceMean: number;
}

interface OcrResult {
  documentId: string;
  fileName: string;
  fileType: 'image' | 'pdf';
  pages: OcrPageResult[];
  fullText: string;
  processingTimeMs: number;
  warnings: string[];
}

interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

---

## 4. Architecture des composants

- `App` → `AppShell` → `HomePage`
- `HomePage` compose:
  - `FileDropzone` (input fichier)
  - `FileMetaCard` (nom, type, taille)
  - `ExtractionControls` (démarrer / réinitialiser)
  - `ExtractionProgress` (état en cours)
  - `ErrorAlert` (erreurs)
  - `ExtractedTextView`
    - `PageTextBlock` (par page)
- Composants réutilisables UI:
  - `Spinner`, `EmptyState`

Flux principal:
1. Sélection fichier
2. Validation locale
3. Envoi backend
4. Affichage progression
5. Rendu résultat structuré

---

## 5. Gestion d’état

- **Local state (useState/useReducer)** sur `HomePage` via hook `useOcrExtraction`:
  - `selectedFile`
  - `status` (`idle|validating|uploading|processing|success|error`)
  - `result`
  - `error`
- Pas de Context global nécessaire (application mono-page, mono-utilisateur).
- Pas de persistance locale obligatoire (priorité extraction ponctuelle).

---

## 6. Routing

Application simple :
- `/` → `HomePage`

Aucune route additionnelle requise au MVP.

---

## 7. API Design (backend)

### `POST /api/ocr/extract`
- **But** : uploader image/pdf scanné et lancer OCR
- **Content-Type** : `multipart/form-data`
- **Body** :
  - `file` (obligatoire)
  - `language` (optionnel, défaut `fra`)
  - `preserveLayout` (optionnel, défaut `true`)
- **Response 200** : `OcrResult`
- **Erreurs** :
  - `400` fichier invalide / option invalide
  - `413` fichier trop volumineux
  - `422` OCR impossible (document illisible)
  - `500` erreur interne

### `GET /api/health`
- Healthcheck service.

---

## 8. Parties complexes et solutions prévues

1. **OCR de PDF scannés multi-pages**
   - Solution : rasteriser chaque page PDF (`pdfjs-dist` + `canvas`) en image haute résolution puis OCR page par page.

2. **Qualité d’extraction prioritaire**
   - Solution : config OCR orientée précision (dpi/rendu plus élevé, pipeline plus lent accepté), traitement séquentiel des pages pour stabilité mémoire.

3. **Conservation approximative des titres/paragraphes**
   - Solution : post-traitement heuristique:
     - segmentation par blocs/retours ligne,
     - détection titres via longueur, casse, ponctuation,
     - reconstruction paragraphes par concaténation des lignes proches.

4. **Gestion documents difficiles (faible contraste/bruit)**
   - Solution : prétraitement image serveur léger (grayscale/contrast) avant OCR; warnings de confiance basse dans la réponse.

5. **Nettoyage fichiers temporaires**
   - Solution : suppression systématique après traitement (finally), y compris en cas d’erreur.

---

## 9. Dépendances à installer (prévision)

```bash
# backend
npm install tesseract.js multer zod pdfjs-dist canvas pino pino-http mime-types nanoid

# frontend
npm install react-dropzone lucide-react sonner
```

---

## 10. Ordre d’implémentation recommandé

1. `server/src/types/ocr.ts`, `server/src/types/api.ts`
2. `server/src/config/env.ts`, `server/src/utils/errors.ts`, `server/src/utils/asyncHandler.ts`
3. `server/src/middlewares/requestLogger.ts`, `upload.middleware.ts`, `errorHandler.ts`, `notFound.ts`
4. `server/src/schemas/ocr.schema.ts`
5. `server/src/services/files/fileType.service.ts`, `uploadCleanup.service.ts`
6. `server/src/services/pdf/pdfRasterizer.service.ts`
7. `server/src/services/ocr/tesseract.worker.ts`
8. `server/src/services/ocr/structurePostProcessor.ts`
9. `server/src/services/ocr/ocr.service.ts`
10. `server/src/controllers/ocr.controller.ts`
11. `server/src/routes/ocr.routes.ts`, `server/src/routes/index.ts`
12. `server/src/app.ts`, `server/src/server.ts`
13. `client/src/types/ocr.ts`, `client/src/types/api.ts`
14. `client/src/utils/fileValidation.ts`, `format.ts`, `textStructure.ts`
15. `client/src/services/ocrApi.ts`
16. `client/src/hooks/useFileUpload.ts`, `useOcrExtraction.ts`
17. `client/src/components/common/*`
18. `client/src/components/upload/*`
19. `client/src/components/extraction/*`
20. `client/src/components/layout/*`
21. `client/src/pages/HomePage.tsx`
22. `client/src/app/providers.tsx`, `client/src/App.tsx`, `client/src/main.tsx`
23. Tests manuels avec `references/po_goindigo.pdf` et `references/Image.jpeg`.

---

## 11. Analyse des fichiers de référence (constats utiles)

- `po_goindigo.pdf` : PDF contenant principalement des objets image (scan), cohérent avec besoin OCR document scanné.
- `Image.jpeg` : image JPEG haute résolution (scan photo), utile pour test OCR image.
- Conclusion : les fichiers fournis correspondent exactement au périmètre MVP (image + PDF scannés).
