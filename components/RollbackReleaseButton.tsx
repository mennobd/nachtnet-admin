"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RollbackReleaseButtonProps = {
  entryId: string;
  routeTitle: string;
  version: string;
};

export default function RollbackReleaseButton({
  entryId,
  routeTitle,
  version,
}: RollbackReleaseButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRollback() {
    const confirmed = window.confirm(
      `Weet je zeker dat je release ${version} van "${routeTitle}" live wilt zetten als rollback?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/manifest-entry/${entryId}/rollback`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Rollback mislukt.");
        setLoading(false);
        return;
      }

      router.refresh();
      setLoading(false);
    } catch {
      alert("Er is een fout opgetreden tijdens rollback.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRollback}
      disabled={loading}
      className="rounded-lg border border-amber-300 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-60"
    >
      {loading ? "Rollback..." : "Rollback"}
    </button>
  );
}
