"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HandleAccountChangeRequestButtons({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState("");
  const [loadingAction, setLoadingAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [error, setError] = useState("");

  async function handle(action: "APPROVE" | "REJECT") {
    if (action === "REJECT" && !rejectionReason.trim()) {
      setError("Vul een reden in voor de afwijzing.");
      return;
    }
    setLoadingAction(action);
    setError("");

    try {
      const res = await fetch(`/api/org-admin/change-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Beoordelen mislukt.");
        setLoadingAction(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden.");
      setLoadingAction(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-600">
          Reden bij afwijzen
        </label>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          rows={2}
          placeholder="Verplicht bij afwijzen"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handle("APPROVE")}
          disabled={loadingAction !== null}
          className="rounded-xl bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
        >
          {loadingAction === "APPROVE" ? "Goedkeuren…" : "Goedkeuren"}
        </button>
        <button
          type="button"
          onClick={() => handle("REJECT")}
          disabled={loadingAction !== null}
          className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {loadingAction === "REJECT" ? "Afwijzen…" : "Afwijzen"}
        </button>
      </div>
    </div>
  );
}
