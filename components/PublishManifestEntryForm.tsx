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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

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
        setStatus(data.error || "Opslaan mislukt.");
        setLoading(false);
        return;
      }

      setStatus("Publicatie opgeslagen.");
      setLoading(false);
      router.refresh();
    } catch {
      setStatus("Er is een fout opgetreden.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="mb-2 flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Publiceren
        </label>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Begindatum en tijd
        </label>
        <input
          type="datetime-local"
          value={activeFrom}
          onChange={(e) => setActiveFrom(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Einddatum en tijd
        </label>
        <input
          type="datetime-local"
          value={activeUntil}
          onChange={(e) => setActiveUntil(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Prioriteit
        </label>
        <input
          type="number"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Notities
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div className="md:col-span-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Opslaan..." : "Publicatie opslaan"}
        </button>

        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
      </div>
    </form>
  );
}
