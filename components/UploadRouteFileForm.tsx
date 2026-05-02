"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RouteCategory = "REGULIER" | "OMLEIDING" | "CALAMITEIT";

export default function UploadRouteFileForm({
  routeId,
}: {
  routeId: string;
}) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<RouteCategory>("REGULIER");
  const [publishNow, setPublishNow] = useState(false);
  const [activeFrom, setActiveFrom] = useState("");
  const [activeUntil, setActiveUntil] = useState("");
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
      formData.append("category", category);
      formData.append("publishNow", String(publishNow));
      formData.append("activeFrom", activeFrom);
      formData.append("activeUntil", activeUntil);

      const response = await fetch("/api/routes/upload", {
        method: "POST",
        body: formData,
      });

      type UploadResponse = {
        fileName?: string;
        version?: string;
        error?: string;
      };
      let data: UploadResponse | null = null;

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
        publishNow
          ? `Upload gelukt en live gezet. Bestand: ${data.fileName}, versie: ${data.version}`
          : `Upload gelukt. Bestand: ${data.fileName}, versie: ${data.version}`
      );

      setFile(null);
      setCategory("REGULIER");
      setPublishNow(false);
      setActiveFrom("");
      setActiveUntil("");
      setLoading(false);

      const fileInput = document.getElementById(
        "route-upload-file"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      if (publishNow) {
        router.push(`/dashboard/routes/${routeId}/publish`);
        router.refresh();
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
          htmlFor="route-category"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Routecategorie
        </label>

        <select
          id="route-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as RouteCategory)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-slate-500"
        >
          <option value="REGULIER">Regulier</option>
          <option value="OMLEIDING">Omleiding</option>
          <option value="CALAMITEIT">Calamiteit</option>
        </select>

        <p className="mt-1 text-xs text-slate-500">
          Kies de categorie die hoort bij deze nieuwe versie van de route.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
            className="h-4 w-4"
          />
          Deze upload meteen live zetten
        </label>

        {publishNow ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="upload-active-from"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Actief vanaf
              </label>
              <input
                id="upload-active-from"
                type="datetime-local"
                value={activeFrom || ""}
                onChange={(e) => setActiveFrom(e.target.value)}
                className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 ${
                  activeFrom ? "text-black" : "text-slate-400"
                }`}
              />
              <p className="mt-1 text-xs text-slate-500">
                Leeg laten betekent direct actief.
              </p>
            </div>

            <div>
              <label
                htmlFor="upload-active-until"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Actief tot
              </label>
             <input
                id="upload-active-until"
                type="datetime-local"
                value={activeUntil || ""}
                onChange={(e) => setActiveUntil(e.target.value)}
                className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 ${
                  activeUntil ? "text-black" : "text-slate-400"
                }`}
              />
              <p className="mt-1 text-xs text-slate-500">
                Leeg laten betekent geen einddatum.
              </p>
            </div>
          </div>
        ) : null}
      </div>

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
