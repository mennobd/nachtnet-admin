"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateRouteForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    routeCode: "",
    title: "",
    lineNumber: "",
    direction: "",
    depot: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Aanmaken route mislukt.");
        setLoading(false);
        return;
      }

      setStatus("Route succesvol aangemaakt.");
      setLoading(false);
      router.push("/dashboard/routes");
      router.refresh();
    } catch {
      setStatus("Er is een fout opgetreden.");
      setLoading(false);
    }
  }

  function updateField(name: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Routecode
        </label>
        <input
          value={form.routeCode}
          onChange={(e) => updateField("routeCode", e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Titel
        </label>
        <input
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Lijnnummer
        </label>
        <input
          value={form.lineNumber}
          onChange={(e) => updateField("lineNumber", e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Richting
        </label>
        <input
          value={form.direction}
          onChange={(e) => updateField("direction", e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Vestiging
        </label>
        <input
          value={form.depot}
          onChange={(e) => updateField("depot", e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Notities
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
          rows={4}
        />
      </div>

      <div className="md:col-span-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Bezig..." : "Route aanmaken"}
        </button>

        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
      </div>
    </form>
  );
}
