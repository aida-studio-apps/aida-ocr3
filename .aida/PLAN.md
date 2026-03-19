# Plan d’implémentation — Application d’extraction OCR (images + PDF scannés)

## 1) Stack technique

### Template choisi
**Template: `express-fullstack`**

### Justification
Le besoin impose :
- upload de fichiers lourds (image 5MB+ et PDF),
- traitement OCR potentiellement long,
- pipeline de prétraitement pour maximiser la fidélité,
- endpoints API dédiés (`/api/...`) entre UI et moteur OCR.

Un backend est donc **obligatoire**. `express-fullstack` est le meilleur choix (frontend React + backend Express TypeScript dans un même projet).

### Dépendances supplémentaires recommandées (à installer plus tard par l’Agent Principal)

#### Frontend
- `react-router-dom` — routing SPA
- `axios` — client HTTP API
- `lucide-react` — icônes sobres
- `clsx` — composition de classes utilitaire

#### Backend
- `multer` — upload multipart/form-data
- `tesseract.js` — OCR principal
- `pdfjs-dist` — rendu pages PDF en images exploitables
- `sharp` — prétraitement image (grayscale, contraste, netteté)
- `pino` + `pino-http` — logs structurés
- `zod` — validation stricte des entrées API
- `uuid` — identifiants de jobs
- `mime-types` — validation type MIME
- `express-rate-limit` — protection anti-abus simple

#### Dev / types
- `@types/multer`, `@types/mime-types`

---

## 2) Arborescence des fichiers

```txt
/workspace/
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── router.tsx
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx
│   │   │   │   └── TopBar.tsx
│   │   │   ├── upload/
│   │   │   │   ├── FileDropzone.tsx
│   │   │   │   ├── FileConstraintsHint.tsx
│   │   │   │   └── UploadActions.tsx
│   │   │   ├── extraction/
│   │   │   │   ├── ExtractionProgress.tsx
│   │   │   │   ├── ExtractionResult.tsx
│   │   │   │   ├── ResultToolbar.tsx
│   │   │   │   └── EmptyResultState.tsx
│   │   │   ├── feedback/
│   │   │   │   ├── ErrorAlert.tsx
│   │   │   │   └── LoadingOverlay.tsx
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       └── SectionTitle.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── hooks/
│   │   │   ├── useFileSelection.ts
│   │   │   ├── useExtraction.ts
│   │   │   └── useNotifications.ts
│   │   ├── services/
│   │   │   ├── apiClient.ts
│   │   │   └── extractionApi.ts
│   │   ├── types/
│   │   │   ├── extraction.ts
│   │   │   ├── api.ts
│   │   │   └── ui.ts
│   │   ├── utils/
│   │   │   ├── fileValidation.ts
│   │   │   ├── format.ts
│   │   │   └── download.ts
│   │   ├── styles/
│   │   │   └── app.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── ...
├── server/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── constants.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   └── extraction.routes.ts
│   │   ├── controllers/
│   │   │   └── extraction.controller.ts
│   │   ├── services/
│   │   │   ├── extraction.service.ts
│   │   │   ├── ocr.service.ts
│   │   │   ├── pdfRasterization.service.ts
│   │   │   └── imagePreprocessing.service.ts
│   │   ├── middleware/
│   │   │   ├── upload.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   ├── validators/
│   │   │   └── extraction.validator.ts
│   │   ├── types/
│   │   │   ├── extraction.ts
│   │   │   └── api.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── fileCleanup.ts
│   │   │   └── textStructuring.ts
│   │   └── temp/
│   │       ├── uploads/
│   │       └── processed/
│   └── ...
└── .env.example
```

Chaque fichier listé ci-dessus doit être créé pour isoler clairement UI, API, OCR, validation, erreurs et utilitaires.

---

## 3) Modèles de données (TypeScript)

### Frontend (`client/src/types/extraction.ts`)
```ts
interface SelectedFile {
  file: File;
  previewUrl?: string;
  kind: 'image' | 'pdf';
}

interface ExtractionRequestPayload {
  language: 'fra' | 'eng' | 'fra+eng';
  preserveLayout: boolean;
}

interface ExtractionResultData {
  id: string;
  rawText: string;
  structuredText: string;
  confidence: number;
  pageCount: number;
  processingMs: number;
  warnings: string[];
  createdAt: string;
}

interface ExtractionError {
  code: string;
  message: string;
  details?: string[];
}
```

### Backend (`server/src/types/extraction.ts`)
```ts
interface ExtractionJobOptions {
  language: string;
  preserveLayout: boolean;
}

interface OCRPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
}

interface OCRAggregateResult {
  rawText: string;
  avgConfidence: number;
  pageResults: OCRPageResult[];
}

interface StructuredTextResult {
  structuredText: string;
  headingsDetected: number;
  paragraphsDetected: number;
  warnings: string[];
}

interface ExtractionServiceResult {
  id: string;
  rawText: string;
  structuredText: string;
  confidence: number;
  pageCount: number;
  processingMs: number;
  warnings: string[];
  createdAt: string;
}
```

### API générique (`client/src/types/api.ts` + `server/src/types/api.ts`)
```ts
interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}
```

---

## 4) Architecture des composants

- `AppShell` (layout global)
  - `TopBar`
  - `HomePage`

- `HomePage`
  - bloc upload: `FileDropzone`, `FileConstraintsHint`, `UploadActions`
  - bloc progression: `ExtractionProgress` / `LoadingOverlay`
  - bloc résultat: `ResultToolbar`, `ExtractionResult` ou `EmptyResultState`
  - feedback: `ErrorAlert`

### Flux parent-enfant
- `HomePage` porte l’état principal (fichier sélectionné, statut extraction, résultat, erreur).
- `FileDropzone` remonte `onFileSelected(file)`.
- `UploadActions` déclenche `onStartExtraction()`.
- `ExtractionResult` reçoit texte structuré en lecture seule.
- `ResultToolbar` gère copie et export `.txt`.

---

## 5) Gestion d’état

- **Local state**: `useState` (fichier, loading, progression simplifiée, résultat, erreur).
- **Logique métier UI factorisée**: hooks custom
  - `useFileSelection` (validation type/poids, reset)
  - `useExtraction` (appel API, annulation, transitions d’état)
- **Pas de Redux/Context global** nécessaire (application mono-utilisateur, écran principal unique).
- **Persistance**: aucune obligatoire; optionnelle pour conserver dernier texte extrait en `sessionStorage`.

---

## 6) Routing

- `/` → `HomePage`
- `*` → `NotFoundPage`

Routing minimal via `react-router-dom`.

---

## 7) API Design (backend)

### `POST /api/extraction`
- **But**: uploader image/PDF et lancer extraction OCR.
- **Body**: multipart/form-data
  - `file`: image/jpeg, image/png, application/pdf
  - `language` (optionnel): `fra|eng|fra+eng` (défaut `fra`)
  - `preserveLayout` (optionnel): `true|false` (défaut `true`)
- **Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "rawText": "...",
    "structuredText": "...",
    "confidence": 87.4,
    "pageCount": 2,
    "processingMs": 5840,
    "warnings": [],
    "createdAt": "2026-..."
  }
}
```
- **Erreurs**: 400 (fichier invalide), 413 (taille), 422 (OCR impossible), 500.

### `GET /api/health`
- **But**: healthcheck API.
- **Response 200**: statut simple.

---

## 8) Parties complexes et solutions

1. **OCR fidèle sur scans difficiles**
   - Prétraitement via `sharp` (grayscale, normalisation contraste, sharpen, seuil adaptatif simple).
   - Paramètres OCR orientés précision plutôt que vitesse.

2. **PDF scanné multi-pages**
   - Rasterisation page par page (`pdfjs-dist`) en images haute définition.
   - OCR par page puis agrégation ordonnée.

3. **Conservation approximative paragraphes/titres**
   - Heuristiques post-traitement dans `textStructuring.ts`:
     - détection lignes courtes/majuscules pour titres,
     - regroupement de lignes proches en paragraphes,
     - normalisation des sauts de ligne.

4. **Temps de traitement potentiellement long**
   - UI avec état “extraction en cours”, spinner/overlay et message explicite.
   - Timeout serveur configurable, message d’erreur clair si dépassement.

5. **Gestion des fichiers temporaires**
   - stockage en `server/src/temp/`
   - nettoyage systématique en fin de traitement (success/failure) via `fileCleanup.ts`.

---

## 9) Dépendances à installer

```bash
# Front
npm install react-router-dom axios lucide-react clsx

# Back
npm install multer tesseract.js pdfjs-dist sharp pino pino-http zod uuid mime-types express-rate-limit

# Types
npm install -D @types/multer @types/mime-types
```

---

## 10) Ordre d’implémentation recommandé

1. **Types partagés et modèles**
   - `client/src/types/*`
   - `server/src/types/*`
2. **Config backend + constantes + logger**
   - `server/src/config/*`, `server/src/utils/logger.ts`
3. **Validation et middleware upload/erreurs**
   - `validators`, `middleware`
4. **Services backend cœur OCR**
   - `imagePreprocessing.service.ts`
   - `pdfRasterization.service.ts`
   - `ocr.service.ts`
   - `textStructuring.ts`
   - `extraction.service.ts`
5. **Controller + routes + app bootstrap**
   - `extraction.controller.ts`, `extraction.routes.ts`, `routes/index.ts`, `app.ts`, `server.ts`
6. **Client services API**
   - `apiClient.ts`, `extractionApi.ts`
7. **Hooks frontend**
   - `useFileSelection.ts`, `useExtraction.ts`
8. **Composants UI de base**
   - `common/*`, `layout/*`, `feedback/*`
9. **Composants métier extraction/upload**
   - `upload/*`, `extraction/*`
10. **Pages + routing final**
   - `HomePage.tsx`, `NotFoundPage.tsx`, `router.tsx`, `App.tsx`, `main.tsx`
11. **Polish final**
   - accessibilité, messages d’erreur, états vides, tests manuels avec les 2 fichiers fournis.

---

## Notes issues des fichiers de référence

- `po_goindigo.pdf` est un PDF scanné (présence d’objets image XObject, source scanner Canon), cohérent avec un workflow OCR image-based.
- `Image.jpeg` est un JPEG volumineux (Exif présent), utile pour tester prétraitement et OCR sur image brute.
- Ces fichiers confirment la nécessité d’un pipeline serveur orienté extraction robuste.

