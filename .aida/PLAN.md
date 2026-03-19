# Plan d’implémentation — Application d’extraction OCR (image + PDF scanné)

## 1. Stack technique

### Template choisi
- **Template : `express-fullstack`**
- **Justification :** le besoin impose un **backend** pour traiter des uploads de fichiers (images/PDF), faire de l’OCR potentiellement long, et retourner un texte structuré. Un template SPA statique n’est pas adapté.

### Stack cible
- **Frontend :** React + TypeScript + Tailwind (client Vite)
- **Backend :** Express + TypeScript
- **OCR :** `tesseract.js` (OCR multi-format) avec paramètres orientés qualité
- **Parsing PDF scanné :** `pdfjs-dist` côté serveur pour rasteriser les pages PDF en images avant OCR
- **Upload :** `multer` (multipart/form-data)
- **Validation :** `zod`
- **HTTP client front :** `axios`
- **UI utilitaire :** `lucide-react`

### Dépendances supplémentaires à installer (prévision)
- Backend:
  - `multer`
  - `tesseract.js`
  - `pdfjs-dist`
  - `canvas` (rendu image côté Node pour PDF)
  - `zod`
  - `pino` ou `morgan` (logs)
- Frontend:
  - `axios`
  - `react-dropzone`
  - `lucide-react`

---

## 2. Arborescence des fichiers

```text
/workspace/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx                    # Conteneur principal sobre/professionnel
│   │   │   ├── FileDropzone.tsx              # Zone d’upload image/PDF + validations UI
│   │   │   ├── ExtractionControls.tsx        # Bouton lancer extraction + options langue
│   │   │   ├── ProgressPanel.tsx             # Affichage progression OCR
│   │   │   ├── ExtractionResult.tsx          # Rendu texte extrait (paragraphes/titres approx.)
│   │   │   ├── ErrorAlert.tsx                # Affichage d’erreur utilisateur
│   │   │   └── DocumentPreview.tsx           # Aperçu simple du fichier importé
│   │   ├── pages/
│   │   │   └── HomePage.tsx                  # Vue unique: upload -> extraction -> résultat
│   │   ├── services/
│   │   │   └── ocrApi.ts                     # Appels API vers /api/ocr/extract
│   │   ├── types/
│   │   │   └── index.ts                      # Types front partagés
│   │   ├── hooks/
│   │   │   └── useOcrExtraction.ts           # Orchestration état d’extraction
│   │   ├── utils/
│   │   │   ├── fileValidation.ts             # Validation type/taille fichiers
│   │   │   └── textFormatting.ts             # Post-traitement affichage paragraphes/titres
│   │   ├── App.tsx                           # Composition principale
│   │   └── main.tsx                          # Entry point
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   └── ocr.routes.ts                 # Endpoint OCR
│   │   ├── controllers/
│   │   │   └── ocr.controller.ts             # Gestion requête/réponse OCR
│   │   ├── services/
│   │   │   ├── ocr.service.ts                # Pipeline OCR global
│   │   │   ├── imageOcr.service.ts           # OCR sur image
│   │   │   ├── pdfOcr.service.ts             # OCR PDF page par page
│   │   │   └── structure.service.ts          # Heuristiques paragraphes/titres
│   │   ├── middleware/
│   │   │   ├── upload.middleware.ts          # Config multer (types, taille)
│   │   │   └── error.middleware.ts           # Gestion centralisée des erreurs
│   │   ├── validators/
│   │   │   └── ocr.validator.ts              # Validation d’inputs via zod
│   │   ├── types/
│   │   │   └── ocr.types.ts                  # Types backend OCR
│   │   ├── utils/
│   │   │   ├── logger.ts                     # Logging applicatif
│   │   │   └── tempFiles.ts                  # Gestion fichiers temporaires
│   │   └── app.ts                            # Enregistrement routes/middlewares
└── /workspace/.aida/
    ├── PLAN.md
    └── RULES.md
```

---

## 3. Modèles de données

```ts
interface UploadedDocument {
  originalName: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
  tempPath: string;
}

interface OcrExtractRequest {
  language: 'fra' | 'eng' | 'fra+eng';
  preserveLayout: boolean;
}

interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence?: number;
}

interface StructuredBlock {
  type: 'title' | 'paragraph';
  content: string;
}

interface OcrExtractResponse {
  fullText: string;
  blocks: StructuredBlock[];
  pages: OcrPageResult[];
  processingTimeMs: number;
  warnings: string[];
}

interface ApiErrorResponse {
  message: string;
  code: string;
  details?: string[];
}

interface ExtractionState {
  status: 'idle' | 'validating' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  result: OcrExtractResponse | null;
  errorMessage: string | null;
}
```

---

## 4. Architecture des composants

- `App` → monte `HomePage`.
- `HomePage` orchestre:
  - `FileDropzone` (sélection fichier)
  - `ExtractionControls` (langue + lancement)
  - `ProgressPanel` (état OCR)
  - `ErrorAlert` (si erreur)
  - `DocumentPreview` (avant extraction)
  - `ExtractionResult` (après succès)
- Hook `useOcrExtraction` centralise la logique (submit, progression, reset, gestion erreurs).
- Services API (`ocrApi.ts`) isolent la couche HTTP.

---

## 5. Gestion d’état

- **Local state avec `useState` + hook custom** (`useOcrExtraction`) suffisant (application mono-utilisateur, une seule vue).
- Pas de Redux/Context global nécessaire.
- Pas de persistance obligatoire (pas d’édition, pas d’historique demandé).
- Optionnel: mémoriser dernière langue choisie en `localStorage`.

---

## 6. Routing

Application à vue unique:
- `/` → `HomePage`

(Pas de router requis si une seule page ; peut rester sans `react-router-dom`.)

---

## 7. API Design (backend)

### `POST /api/ocr/extract`
- **Content-Type :** `multipart/form-data`
- **Body :**
  - `file`: image/PDF scanné
  - `language`: `fra | eng | fra+eng`
  - `preserveLayout`: `true | false`
- **Response 200 :** `OcrExtractResponse`
- **Erreurs :**
  - `400` fichier invalide / paramètres invalides
  - `413` fichier trop volumineux
  - `415` type non supporté
  - `500` erreur OCR interne

### `GET /api/health`
- Vérification disponibilité backend.

---

## 8. Parties complexes et solutions prévues

1. **OCR fidèle mais potentiellement lent**
   - Prioriser qualité via config Tesseract (PSM adaptés, langue(s) combinées).
   - Afficher progression côté UI pour UX acceptable.

2. **PDF scanné multi-pages**
   - Convertir chaque page en image (pdfjs + canvas) puis OCR page par page.
   - Concaténer proprement les pages, conserver séparateurs.

3. **Conservation approximative paragraphes/titres**
   - Heuristiques post-OCR:
     - lignes courtes en capitales / taille relative → `title`
     - regroupement de lignes proches → `paragraph`
   - Retour structuré `blocks[]` en plus du `fullText`.

4. **Documents de qualité moyenne (bruit/flou)**
   - Prétraitement léger image (niveaux de gris/contraste si faisable dans pipeline serveur).
   - Retourner avertissements si confiance faible.

5. **Gestion mémoire/temporaires**
   - Stockage temporaire contrôlé, suppression systématique après traitement.

---

## 9. Dépendances à installer

```bash
# backend
npm install multer tesseract.js pdfjs-dist canvas zod pino

# frontend
npm install axios react-dropzone lucide-react
```

(Le Principal Agent ajustera selon compatibilité exacte du template.)

---

## 10. Ordre d’implémentation recommandé

1. **Types backend/front** (`server/src/types/ocr.types.ts`, `client/src/types/index.ts`)
2. **Validation & upload middleware** (`ocr.validator.ts`, `upload.middleware.ts`)
3. **Services OCR bas niveau** (`imageOcr.service.ts`, `pdfOcr.service.ts`)
4. **Service structuration texte** (`structure.service.ts`)
5. **Service orchestration OCR** (`ocr.service.ts`)
6. **Controller + route API** (`ocr.controller.ts`, `ocr.routes.ts`)
7. **Gestion erreurs/logs** (`error.middleware.ts`, `logger.ts`, `tempFiles.ts`)
8. **Service API frontend** (`client/src/services/ocrApi.ts`)
9. **Hook d’orchestration UI** (`useOcrExtraction.ts`)
10. **Composants UI atomiques** (`ErrorAlert`, `ProgressPanel`, `ExtractionControls`)
11. **Composants upload/résultat** (`FileDropzone`, `DocumentPreview`, `ExtractionResult`)
12. **Page + composition finale** (`HomePage.tsx`, `App.tsx`)
13. **Tests manuels avec fichiers fournis** (PDF + JPEG uploadés)

---

## Analyse des fichiers de référence uploadés

- `po_goindigo.pdf`: PDF scanné (présence d’objets image dans la structure) → confirme la nécessité d’un pipeline OCR image/page.
- `Image.jpeg`: image JPEG volumineuse avec métadonnées EXIF → confirme support image haute résolution.
- Les deux fichiers servent de base pour les scénarios de test fournis (lisible + réaliste).
