"use client";

import { useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  ORG_ADMIN: "Afdelingsadmin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export default function AccountChangeRequestForm({
  currentEmail,
  currentRole,
}: {
  currentEmail: string;
  currentRole: string;
}) {
  const [type, setType] = useState<"EMAIL" | "ROLE">("EMAIL");
  const [requestedValue, setRequestedValue] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    setError("");

    try {
      const res = await fetch("/api/user/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, requestedValue, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verzoek indienen mislukt.");
      } else {
        setStatus("Verzoek ingediend. Een beheerder zal het beoordelen.");
        setRequestedValue("");
        setReason("");
      }
    } catch {
      setError("Er is een fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Type wijziging
        </label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as "EMAIL" | "ROLE");
            setRequestedValue("");
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
        >
          <option value="EMAIL">E-mailadres</option>
          <option value="ROLE">Rol</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {type === "EMAIL" ? "Nieuw e-mailadres" : "Gevraagde rol"}
        </label>
        {type === "EMAIL" ? (
          <input
            type="email"
            value={requestedValue}
            onChange={(e) => setRequestedValue(e.target.value)}
            placeholder={`Huidig: ${currentEmail}`}
            maxLength={255}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            required
          />
        ) : (
          <select
            value={requestedValue}
            onChange={(e) => setRequestedValue(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
            required
          >
            <option value="">Kies een rol…</option>
            {Object.entries(ROLE_LABELS)
              .filter(([role]) => role !== currentRole)
              .map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
          </select>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Reden{" "}
          <span className="font-normal text-slate-400">(optioneel)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Licht je verzoek toe…"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {status && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {status}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Bezig..." : "Verzoek indienen"}
      </button>
    </form>
  );
}
