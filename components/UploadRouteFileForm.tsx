"use client";

import { useState } from "react";

export default function UploadRouteFileForm({
  routeId,
}: {
  routeId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus("Kies eerst een GPX-bestand.");
      return;
    }

    setLoading(true);
    setStatus("");

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
  setStatus(
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
    } catch {
      setStatus("Er is een fout opgetreden tijdens het uploaden.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          GPX-bestand
        </label>
        <input
          type="file"
          accept=".gpx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Bezig met uploaden..." : "Uploaden"}
      </button>

      {status ? (
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {status}
        </div>
      ) : null}
    </form>
  );
}
