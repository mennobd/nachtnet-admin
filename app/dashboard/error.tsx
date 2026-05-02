"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">
        Er ging iets mis in het dashboard
      </h2>
      <p className="mt-2 text-slate-600">
        Digest: {error.digest ?? "onbekend"}
      </p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-xl bg-ret-red px-4 py-3 text-sm font-medium text-white hover:bg-ret-red-dark"
      >
        Probeer opnieuw
      </button>
    </div>
  );
}
