"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Route = { id: string; title: string; routeCode: string; depot: string; status: string };

export default function BulkRouteActions({ routes }: { routes: Route[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [depotValue, setDepotValue] = useState("Zuid");
  const [statusValue, setStatusValue] = useState("ARCHIVED");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  function toggleAll() {
    if (selected.size === routes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(routes.map((r) => r.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function run(action: string, extra?: Record<string, string>) {
    if (selected.size === 0) return;
    setLoading(true);
    setResult("");
    setError("");
    try {
      const res = await fetch("/api/routes/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selected), ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Actie mislukt.");
      } else {
        setResult(`${data.updated} route(s) bijgewerkt.`);
        setSelected(new Set());
        router.refresh();
      }
    } catch {
      setError("Er is een fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-800">
            {selected.size} geselecteerd
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            >
              <option value="DRAFT">Status → Concept</option>
              <option value="PUBLISHED">Status → Gepubliceerd</option>
              <option value="ARCHIVED">Status → Gearchiveerd</option>
            </select>
            <button
              onClick={() => run("SET_STATUS", { status: statusValue })}
              disabled={loading}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-60"
            >
              Toepassen
            </button>

            <select
              value={depotValue}
              onChange={(e) => setDepotValue(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            >
              <option value="Zuid">Vestiging → Zuid</option>
              <option value="Kleiweg">Vestiging → Kleiweg</option>
              <option value="Krimpen">Vestiging → Krimpen</option>
              <option value="NACHTNET">Vestiging → NACHTNET</option>
            </select>
            <button
              onClick={() => run("SET_DEPOT", { depot: depotValue })}
              disabled={loading}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-60"
            >
              Toepassen
            </button>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-slate-500 hover:text-slate-700"
          >
            Deselecteer alles
          </button>
        </div>
      )}

      {result && (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{result}</p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-2 pb-1 text-xs font-medium text-slate-500">
          <input
            type="checkbox"
            checked={selected.size === routes.length && routes.length > 0}
            onChange={toggleAll}
            className="rounded"
          />
          Alles selecteren
        </label>

        {routes.map((route) => (
          <label
            key={route.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selected.has(route.id)}
              onChange={() => toggle(route.id)}
              className="rounded"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{route.title}</p>
              <p className="text-xs text-slate-500">{route.routeCode} · {route.depot} · {route.status}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
