import type { NextFunction, Request, Response } from 'express';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : 'Erreur interne du serveur.';

  if (message.includes('File too large')) {
    res.status(413).json({ message: 'Fichier trop volumineux (max 25MB).' });
    return;
  }

  if (message.includes('Type de fichier non supporté')) {
    res.status(415).json({ message });
    return;
  }

  res.status(500).json({ message });
}

