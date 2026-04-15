"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PublishManifestEntryForm({
  entryId,
  initialIsPublished,
  initialActiveFrom,
  initialActiveUntil,
  initialPriority,
  initialNotes,
}: {
  entryId: string;
  initialIsPublished: boolean;
  initialActiveFrom: string;
  initialActiveUntil: string;
  initialPriority: number;
  initialNotes: string;
}) {
  const router = useRouter();

  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [activeFrom, setActiveFrom] = useState(initialActiveFrom);
  const [activeUntil, setActiveUntil] = useState(initialActiveUntil);
  const [priority, setPriority] = useState(String(initialPriority));
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch(`/api/manifest-entry/${entryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPublished,
          activeFrom,
          activeUntil,
          priority: Number(priority),
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Opslaan mislukt.");
        setLoading(false);
        return;
      }

      setStatus("Publicatie opgeslagen.");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4"
          />
          Publicatie inschakelen
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Alleen ingeschakelde publicaties kunnen in het live manifest
          verschijnen.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor={`activeFrom-${entryId}`}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Begindatum en tijd
          </label>
          <input
            id={`activeFrom-${entryId}`}
            type="datetime-local"
            value={activeFrom}
            onChange={(e) => setActiveFrom(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            placeholder="Bijv. 2026-04-20T06:00"
          />
          <p className="mt-1 text-xs text-slate-500">
            Laat leeg als de publicatie direct geldig mag zijn zodra deze live
            staat.
          </p>
        </div>

        <div>
          <label
            htmlFor={`activeUntil-${entryId}`}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Einddatum en tijd
          </label>
          <input
            id={`activeUntil-${entryId}`}
            type="datetime-local"
            value={activeUntil}
            onChange={(e) => setActiveUntil(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            placeholder="Bijv. 2026-04-20T18:00"
          />
          <p className="mt-1 text-xs text-slate-500">
            Gebruik dit voor tijdelijke omleidingen of tijdgebonden releases.
          </p>
        </div>

        <div>
          <label
            htmlFor={`priority-${entryId}`}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Prioriteit
          </label>
          <input
            id={`priority-${entryId}`}
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            placeholder="Bijv. 1"
          />
          <p className="mt-1 text-xs text-slate-500">
            Lager getal = hogere prioriteit. Gebruik bijvoorbeeld{" "}
            <span className="font-medium">1</span> voor een tijdelijke omleiding
            die de standaardroute moet overrulen.
          </p>
        </div>

        <div>
          <label
            htmlFor={`notes-${entryId}`}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Notities
          </label>
          <input
            id={`notes-${entryId}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            placeholder="Bijv. Omleiding i.v.m. werkzaamheden Schiedam"
          />
          <p className="mt-1 text-xs text-slate-500">
            Gebruik dit veld om de reden of context van de publicatie vast te
            leggen.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p className="font-medium text-slate-700">Aanbevolen werkwijze</p>
        <p className="mt-1">
          Voor standaardroutes laat je einddatum leeg en gebruik je een normale
          prioriteit. Voor omleidingen vul je begin- en einddatum in en geef je
          een hogere prioriteit.
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

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Opslaan..." : "Publicatie opslaan"}
        </button>
      </div>
    </form>
  );
}
