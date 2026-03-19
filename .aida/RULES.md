# Conventions de code — Projet OCR fullstack

## 1. Principes généraux
- TypeScript strict partout (frontend + backend).
- Lisibilité et simplicité d’abord, pas de sur‑ingénierie.
- Une responsabilité par fichier/service/composant.
- Aucun `any` autorisé.

## 2. Nommage
- Composants React: `PascalCase` (ex: `ExtractionResult.tsx`).
- Hooks: `useCamelCase` (ex: `useExtraction.ts`).
- Fonctions/variables: `camelCase`.
- Constantes globales: `UPPER_SNAKE_CASE`.
- Fichiers backend service/controller/middleware: suffixes explicites:
  - `*.service.ts`, `*.controller.ts`, `*.middleware.ts`, `*.validator.ts`.

## 3. Exports
- Composants React: `export default`.
- Utilitaires, hooks, services backend/frontend: exports nommés.
- Types/interfaces: exports nommés uniquement.

## 4. Imports (ordre obligatoire)
1. React / Node built-ins
2. Librairies tierces
3. Imports internes absolus/alias (si configurés)
4. Imports relatifs locaux
5. Types `type` imports séparés si possible

## 5. Style React
- Composants fonctionnels en arrow functions.
- Props toujours typées.
- Pas de logique métier lourde dans JSX: déplacer vers hooks/utils.
- UI en Tailwind prioritairement, sobre et professionnelle.
- Éviter la duplication: extraire composants réutilisables.

## 6. Gestion d’état frontend
- `useState` pour état local simple.
- `useMemo`/`useCallback` uniquement si utile (pas systématique).
- Appels API centralisés dans `services/`.
- Aucune mutation directe d’objet d’état.

## 7. API & backend
- Validation d’entrée systématique via `zod` avant logique métier.
- Controllers minces, logique dans `services`.
- Middleware d’erreurs global unique.
- Réponses API homogènes:
  - succès: `{ success: true, data }`
  - erreur: `{ success: false, error }`

## 8. Gestion d’erreurs
- Backend: `try/catch` dans controllers/services critiques + logs structurés.
- Frontend: afficher messages utilisateur explicites (composant d’alerte).
- Ne jamais exposer une stack technique brute côté client.

## 9. Upload et fichiers
- Valider type MIME + extension + taille max.
- Nettoyer tous les fichiers temporaires après traitement (succès/échec).
- Refuser tout fichier hors whitelist (jpg, jpeg, png, pdf).

## 10. Qualité & formatting
- Fonctions courtes, noms explicites.
- Commentaires seulement pour expliquer le “pourquoi”, pas le “quoi” évident.
- Conserver une structure de dossier stable et prévisible.

