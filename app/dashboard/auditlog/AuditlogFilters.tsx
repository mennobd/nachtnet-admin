"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuditlogFilters({
  entities,
  defaultAction,
  defaultEntity,
  defaultFrom,
  defaultTo,
}: {
  entities: string[];
  defaultAction: string;
  defaultEntity: string;
  defaultFrom: string;
  defaultTo: string;
}) {
  const router = useRouter();
  const [action, setAction] = useState(defaultAction);
  const [entity, setEntity] = useState(defaultEntity);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (entity) params.set("entity", entity);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/dashboard/auditlog?${params.toString()}`);
  }

  function handleReset() {
    setAction("");
    setEntity("");
    setFrom("");
    setTo("");
    router.push("/dashboard/auditlog");
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Actie (bevat)
          </label>
          <input
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="bijv. PUBLISH"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Entiteit
          </label>
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          >
            <option value="">Alle entiteiten</option>
            {entities.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Vanaf datum
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Tot datum
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </div>

        <div className="md:col-span-4 flex gap-3">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Filter toepassen
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Filters wissen
          </button>
        </div>
      </form>
    </section>
  );
}
