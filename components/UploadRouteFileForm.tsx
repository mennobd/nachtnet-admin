"use client";

import { useState } from "react";

export default function UploadRouteFileForm({
  routeId,
}: {
  routeId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Kies eerst een GPX-bestand.");
      setStatus("");
      return;
    }

    setLoading(true);
    setStatus("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("routeId", routeId);
      formData.append("file", file);

      const response = await fetch("/api/routes/upload", {
        method: "POST",
        body: formData,
      });

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        setError(
          data?.error
            ? `Upload mislukt: ${data.error}`
            : `Upload mislukt met status ${response.status}`
        );
        setLoading(false);
        return;
      }

      setStatus(
        `Upload gelukt. Bestand: ${data.fileName}, versie: ${data.version}`
      );
      setFile(null);
      setLoading(false);

      const fileInput = document.getElementById(
        "route-upload-file"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch {
      setError("Er is een fout opgetreden tijdens het uploaden.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="route-upload-file"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          GPX-bestand
        </label>

        <input
          id="route-upload-file"
          type="file"
          accept=".gpx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
        />

        <p className="mt-1 text-xs text-slate-500">
          Upload alleen een actueel GPX-bestand voor deze route. Gebruik een
          herkenbare bestandsnaam, bijvoorbeeld:{" "}
          <span className="font-medium">
            Uitrukroute - Nachtnet RET.gpx
          </span>
          .
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p className="font-medium text-slate-700">Aanbevolen werkwijze</p>
        <p className="mt-1">
          Upload per wijziging één duidelijke nieuwe versie. Gebruik geen losse
          tussenbestanden of onduidelijke namen, zodat versiebeheer en
          publicatie controleerbaar blijven.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {status ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {status}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Bezig met uploaden..." : "GPX uploaden"}
        </button>
      </div>
    </form>
  );
}
