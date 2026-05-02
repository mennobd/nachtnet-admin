"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function RouteImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; filesUploaded: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);
    setErrors([]);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/routes/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import mislukt.");
        setErrors(data.errors ?? []);
      } else {
        setResult({ created: data.created, filesUploaded: data.filesUploaded });
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      }
    } catch {
      setError("Er is een fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
        <p className="font-medium text-slate-700">Hoe te gebruiken</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Download het voorbeeldbestand en vul de routes in.</li>
          <li>
            Wil je GPX-bestanden meesturen? Zet de CSV en alle <code className="rounded bg-slate-200 px-1">.gpx</code> bestanden samen in één map en comprimeer die als ZIP.
          </li>
          <li>Upload de <code className="rounded bg-slate-200 px-1">.csv</code> of <code className="rounded bg-slate-200 px-1">.zip</code> hier.</li>
        </ol>
        <p className="text-xs text-slate-500">
          Kolom <code className="rounded bg-slate-200 px-1">gpxFile</code> is optioneel — vul de bestandsnaam in (bijv. <code className="rounded bg-slate-200 px-1">lijn12.gpx</code>) als je een GPX meestuurt, anders leeg laten.
        </p>
      </div>

      <a
        href="/routes-import-template.csv"
        download
        className="inline-block rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Download voorbeeldbestand (CSV)
      </a>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Bestand selecteren (.csv of .zip)
        </label>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.zip"
          required
          className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <p className="mt-1 text-xs text-slate-500">
          Max 50 MB · max 500 routes per import.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">{error}</p>
          {errors.length > 0 && (
            <ul className="mt-2 list-disc pl-4 space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <p className="font-medium">{result.created} route(s) succesvol geïmporteerd.</p>
          {result.filesUploaded > 0 && (
            <p className="mt-0.5">{result.filesUploaded} GPX-bestand(en) geüpload.</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Bezig met importeren…" : "Importeren"}
      </button>
    </form>
  );
}
