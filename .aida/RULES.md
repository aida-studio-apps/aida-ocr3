# Conventions de code — Projet OCR fullstack

## 1) Principes généraux
- TypeScript strict partout (client + server).
- Lisibilité prioritaire, fonctions courtes, responsabilités claires.
- Aucun `any` (utiliser `unknown` + narrowing si nécessaire).
- Pas de logique métier dans les composants UI : la logique va dans hooks/services.

## 2) Nommage
- Composants React : **PascalCase** (`FileDropzone.tsx`).
- Hooks : préfixe `use` en **camelCase** (`useOcrExtraction.ts`).
- Fonctions/variables : **camelCase**.
- Constantes globales : **UPPER_SNAKE_CASE**.
- Fichiers backend service/controller : suffixes explicites (`ocr.service.ts`, `ocr.controller.ts`).

## 3) Exports
- Composants React : `export default`.
- Utilitaires, services, types : **exports nommés**.
- Un fichier `types` n’exporte que des types/interfaces.

## 4) Imports (ordre obligatoire)
1. React / Node built-ins
2. Librairies tierces
3. Imports internes absolus/relatifs (components, hooks, services, utils)
4. Types (`import type ...`)
5. Styles

Séparer chaque groupe par une ligne vide.

## 5) Frontend (React)
- Composants en arrow function.
- Props typées explicitement (interface `...Props`).
- État local via hooks; éviter prop drilling profond (max 2-3 niveaux).
- UI sobre: Tailwind utilitaire uniquement, pas de CSS custom sauf nécessité réelle.
- Gestion erreurs utilisateur via toast (`sonner`) + composant `ErrorAlert`.

## 6) Backend (Express)
- Controllers minces, services riches.
- Validation d’entrée systématique via `zod` avant logique métier.
- `try/catch` au niveau controller/service critique, erreurs métier avec classes dédiées.
- Réponses API JSON homogènes:
  - succès: `{ data, meta? }`
  - erreur: `{ error: { code, message, details? } }`
- Logging structuré via `pino-http`, sans données sensibles.

## 7) OCR & fichiers
- Vérifier MIME type + extension + taille max avant traitement.
- Nettoyer tous les fichiers temporaires en `finally`.
- Si confiance OCR faible, renvoyer un warning explicite.

## 8) Qualité
- ESLint/Prettier du template respectés strictement.
- Fonctions > 40 lignes à refactorer si possible.
- Commentaires seulement pour expliquer un "pourquoi", pas le "quoi" évident.

## 9) Tests manuels minimaux (MVP)
- Upload image lisible → texte fidèle.
- Upload PDF scanné multi-pages → extraction toutes pages.
- Document difficile → résultat partiel + warning, sans crash.

