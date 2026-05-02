"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function RouteImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number } | null>(null);
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
        setResult({ created: data.created });
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
      <div className="flex items-center gap-3">
        <a
          href="/routes-import-template.csv"
          download
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Download voorbeeldbestand
        </a>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          CSV-bestand selecteren
        </label>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          required
          className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <p className="mt-1 text-xs text-slate-500">
          Verplichte kolommen: routeCode, title, lineNumber, direction, depot.
          Optioneel: category (REGULIER / OMLEIDING / CALAMITEIT), notes. Max 500 regels.
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
          {result.created} route(s) succesvol geïmporteerd.
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
