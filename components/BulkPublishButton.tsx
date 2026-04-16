"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BulkPublishButton({
  selectedEntryIds,
}: {
  selectedEntryIds: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleBulkPublish() {
    if (selectedEntryIds.length === 0) {
      alert("Selecteer eerst één of meer concept-releases.");
      return;
    }

    const confirmed = window.confirm(
      `Weet je zeker dat je ${selectedEntryIds.length} geselecteerde concept-release(s) live wilt zetten?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch("/api/releases/bulk-publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryIds: selectedEntryIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Bulk publiceren mislukt.");
        setLoading(false);
        return;
      }

      router.refresh();
      setLoading(false);
    } catch {
      alert("Er is een fout opgetreden tijdens bulk publiceren.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBulkPublish}
      disabled={loading}
      className="rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
    >
      {loading ? "Live zetten..." : "Zet selectie live"}
    </button>
  );
}
