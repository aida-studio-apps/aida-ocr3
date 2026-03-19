import { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { extractOcr } from './services/ocrApi';
import type { OcrExtractResponse, OcrLanguage } from './types';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<OcrLanguage>('fra+eng');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrExtractResponse | null>(null);

  const onExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const data = await extractOcr(file, language);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur pendant l’extraction OCR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto max-w-4xl p-6 md:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Extraction OCR de documents scannés</h1>
          <p className="mt-2 text-slate-600">
            Importez une image ou un PDF scanné pour extraire le texte avec conservation approximative
            des paragraphes et titres.
          </p>
        </header>

        <section className="rounded-xl bg-white shadow-sm border border-slate-200 p-6 space-y-4">
          <label className="block text-sm font-medium">Fichier (PDF, JPG, PNG, WEBP)</label>
          <label className="flex items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-lg p-8 cursor-pointer hover:border-slate-400 transition-colors">
            <Upload className="h-5 w-5" />
            <span>{file ? file.name : 'Choisir un document scanné'}</span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Langue OCR</label>
              <select
                className="border rounded-md px-3 py-2 bg-white"
                value={language}
                onChange={(e) => setLanguage(e.target.value as OcrLanguage)}
              >
                <option value="fra+eng">Français + Anglais</option>
                <option value="fra">Français</option>
                <option value="eng">Anglais</option>
              </select>
            </div>

            <button
              type="button"
              disabled={!file || loading}
              onClick={onExtract}
              className="rounded-md bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
            >
              {loading ? 'Extraction en cours…' : 'Lancer l’extraction'}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </section>

        {result && (
          <section className="mt-8 rounded-xl bg-white shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Texte extrait</h2>
            </div>

            {result.warnings.length > 0 && (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
                {result.warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {result.blocks.map((block, idx) =>
                block.type === 'title' ? (
                  <h3 key={`${block.content}-${idx}`} className="font-semibold text-lg mt-4">
                    {block.content}
                  </h3>
                ) : (
                  <p key={`${block.content}-${idx}`} className="text-slate-700 leading-relaxed">
                    {block.content}
                  </p>
                ),
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

