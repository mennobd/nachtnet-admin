"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DuplicateRouteButton({
  routeId,
  routeTitle,
}: {
  routeId: string;
  routeTitle: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDuplicate() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/routes/${routeId}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Dupliceren mislukt.");
        setLoading(false);
        return;
      }
      router.push(`/dashboard/routes/${data.id}`);
    } catch {
      setError("Er is een fout opgetreden.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={loading}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      >
        {loading ? "Bezig…" : "Dupliceer"}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
