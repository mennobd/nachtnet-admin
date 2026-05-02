"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HandleUserRequestForm({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loadingAction, setLoadingAction] = useState<"APPROVE" | "REJECT" | null>(
    null
  );
  const [error, setError] = useState("");

  async function handle(action: "APPROVE" | "REJECT") {
    setLoadingAction(action);
    setError("");

    try {
      const response = await fetch(`/api/admin/user-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          password,
          rejectionReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Aanvraag verwerken mislukt.");
        setLoadingAction(null);
        return;
      }

      setPassword("");
      setRejectionReason("");
      setLoadingAction(null);
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden.");
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Tijdelijk wachtwoord bij goedkeuren
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimaal 8 tekens"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-ret-red"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Reden bij afwijzen
        </label>
        <textarea
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          placeholder="Optioneel"
          className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-ret-red"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handle("APPROVE")}
          disabled={loadingAction !== null}
          className="rounded-xl bg-green-700 px-4 py-3 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
        >
          {loadingAction === "APPROVE" ? "Goedkeuren..." : "Goedkeuren"}
        </button>

        <button
          type="button"
          onClick={() => handle("REJECT")}
          disabled={loadingAction !== null}
          className="rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {loadingAction === "REJECT" ? "Afwijzen..." : "Afwijzen"}
        </button>
      </div>
    </div>
  );
}
