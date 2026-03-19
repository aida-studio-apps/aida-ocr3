# Conventions de code — Projet OCR Fullstack

## 1) Principes généraux
- TypeScript strict partout (client + server).
- Lisibilité et simplicité avant abstraction prématurée.
- Aucune utilisation de `any`.
- Fonctions courtes, responsabilité unique.

## 2) Nommage
- **Composants React**: `PascalCase` (ex: `ExtractionResult`).
- **Hooks**: préfixe `use` (ex: `useOcrExtraction`).
- **Fonctions/variables**: `camelCase`.
- **Constantes globales**: `UPPER_SNAKE_CASE`.
- **Fichiers**:
  - Composants: `PascalCase.tsx`
  - Services/Utils/Middleware: `kebab-case` ou suffixés `.service.ts`, `.middleware.ts`, `.validator.ts`

## 3) Exports
- **Composants de page/composants UI**: `export default`.
- **Utils/services/types**: exports nommés.
- Éviter les exports mixtes dans un même fichier.

## 4) Imports (ordre obligatoire)
1. React
2. Librairies tierces
3. Aliases internes (si configurés)
4. Imports relatifs locaux
5. Types (`import type`) séparés quand pertinent
6. Styles en dernier

## 5) React
- Composants sous forme de fonctions fléchées.
- Props typées explicitement.
- Éviter la logique métier dans JSX; la déplacer dans hooks/services.
- UI sobre: Tailwind utilitaire uniquement, pas de CSS custom sauf nécessité claire.

## 6) API & Backend
- Validation d’entrée systématique via `zod`.
- Contrôleurs minces, logique dans `services`.
- Middleware d’erreur centralisé, format d’erreur homogène.
- Ne jamais exposer de stack trace brute au client.

## 7) Gestion d’erreurs
- `try/catch` sur toutes les opérations I/O (upload, OCR, parsing PDF).
- Messages utilisateur clairs côté frontend.
- Logs techniques côté serveur avec contexte minimal (route, fichier, durée).

## 8) Types et modèles
- Types partagés regroupés dans `types/`.
- Toute réponse API doit avoir une interface dédiée.
- Les champs optionnels doivent être justifiés.

## 9) Qualité
- Garder des fonctions pures pour le post-traitement texte quand possible.
- Pas de code mort, pas de commentaires inutiles.
- Une seule responsabilité par fichier autant que possible.

## 10) Sécurité & robustesse
- Limiter taille et types MIME des uploads.
- Supprimer systématiquement les fichiers temporaires.
- Refuser toute extension non supportée.

