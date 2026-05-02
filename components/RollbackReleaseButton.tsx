"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function RollbackReleaseButton({
  entryId,
  routeTitle,
  version,
}: {
  entryId: string;
  routeTitle: string;
  version: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleRollback() {
    const confirmed = window.confirm(
      `Weet je zeker dat je release ${version} van "${routeTitle}" live wilt zetten als rollback?`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/manifest-entry/${entryId}/rollback`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Rollback mislukt.", "error");
      } else {
        toast(`Rollback naar ${version} geslaagd.`);
        router.refresh();
      }
    } catch {
      toast("Er is een fout opgetreden tijdens rollback.", "error");
    } finally {
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
