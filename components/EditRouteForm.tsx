"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RouteCategory = "REGULIER" | "OMLEIDING" | "CALAMITEIT";
type RouteStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type FormState = {
  title: string;
  lineNumber: string;
  direction: string;
  depot: string;
  notes: string;
  category: RouteCategory;
  status: RouteStatus;
};

export default function EditRouteForm({
  routeId,
  initialTitle,
  initialLineNumber,
  initialDirection,
  initialDepot,
  initialNotes,
  initialCategory,
  initialStatus,
}: {
  routeId: string;
  initialTitle: string;
  initialLineNumber: string;
  initialDirection: string;
  initialDepot: string;
  initialNotes: string | null;
  initialCategory: RouteCategory;
  initialStatus: RouteStatus;
}) {
  const router = useRouter();

  const initial: FormState = {
    title: initialTitle,
    lineNumber: initialLineNumber,
    direction: initialDirection,
    depot: initialDepot,
    notes: initialNotes ?? "",
    category: initialCategory,
    status: initialStatus,
  };

  const [form, setForm] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(initial);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/routes/${routeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Bijwerken mislukt.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Titel</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-slate-500"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Lijnnummer</label>
          <input
            type="text"
            value={form.lineNumber}
            onChange={(e) => update("lineNumber", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-slate-500"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Richting</label>
          <input
            type="text"
            value={form.direction}
            onChange={(e) => update("direction", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-slate-500"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Vestiging</label>
          <select
            value={form.depot}
            onChange={(e) => update("depot", e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-slate-500"
            required
          >
            <option value="Zuid">Zuid</option>
            <option value="Kleiweg">Kleiweg</option>
            <option value="Krimpen">Krimpen</option>
            <option value="NACHTNET">NACHTNET</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Categorie</label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value as RouteCategory)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-slate-500"
          >
            <option value="REGULIER">Regulier</option>
            <option value="OMLEIDING">Omleiding</option>
            <option value="CALAMITEIT">Calamiteit</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as RouteStatus)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-slate-500"
          >
            <option value="DRAFT">Concept</option>
            <option value="PUBLISHED">Gepubliceerd</option>
            <option value="ARCHIVED">Gearchiveerd</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Notities</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-slate-500"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Route succesvol bijgewerkt.</div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !isDirty}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Bezig met opslaan…" : "Wijzigingen opslaan"}
        </button>
      </div>
    </form>
  );
}
