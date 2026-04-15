"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FormState = {
  routeCode: string;
  title: string;
  lineNumber: string;
  direction: string;
  depot: string;
  notes: string;
};

const initialState: FormState = {
  routeCode: "",
  title: "",
  lineNumber: "",
  direction: "",
  depot: "",
  notes: "",
};

export default function CreateRouteForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setError("");

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
        setError(data.error || "Route aanmaken mislukt.");
        setLoading(false);
        return;
      }

      setStatus("Route succesvol aangemaakt.");
      setForm(initialState);
      setLoading(false);

      router.push("/dashboard/routes");
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden tijdens het aanmaken van de route.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="routeCode"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Routecode
          </label>
          <input
            id="routeCode"
            type="text"
            value={form.routeCode}
            onChange={(e) => updateField("routeCode", e.target.value)}
            placeholder="Bijv. RET-NN-L12-ZUID"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Gebruik één vaste opbouw, bijvoorbeeld RET-NN-LIJN-VESTIGING.
          </p>
        </div>

        <div>
          <label
            htmlFor="lineNumber"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Lijnnummer
          </label>
          <input
            id="lineNumber"
            type="text"
            value={form.lineNumber}
            onChange={(e) => updateField("lineNumber", e.target.value)}
            placeholder="Bijv. 12"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Gebruik alleen het lijnnummer, zonder extra tekst.
          </p>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Titel
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Bijv. Lijn 12 – Zuid → Centraal"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Beschrijf de route zoals deze herkenbaar moet zijn voor beheerders.
          </p>
        </div>

        <div>
          <label
            htmlFor="direction"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Richting
          </label>
          <input
            id="direction"
            type="text"
            value={form.direction}
            onChange={(e) => updateField("direction", e.target.value)}
            placeholder="Bijv. Zuid → Centraal"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Gebruik een eenduidige schrijfwijze voor vertrek- en eindpunt.
          </p>
        </div>

        <div>
          <label
            htmlFor="depot"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Vestiging
          </label>
          <select
            id="depot"
            value={form.depot}
            onChange={(e) => updateField("depot", e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-slate-500"
            required
          >
            <option value="">Selecteer vestiging</option>
            <option value="Zuid">Zuid</option>
            <option value="Kleiweg">Kleiweg</option>
            <option value="Krimpen">Krimpen</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Kies altijd uit de vaste vestigingen voor consistente filtering.
          </p>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Notities
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Bijv. Tijdelijke nachtroute i.v.m. werkzaamheden"
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Gebruik dit veld voor bijzonderheden, afwijkingen of interne context.
          </p>
        </div>
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
          {loading ? "Bezig met opslaan..." : "Route aanmaken"}
        </button>
      </div>
    </form>
  );
}
