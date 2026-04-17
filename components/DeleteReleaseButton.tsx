"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteReleaseButton({
  entryId,
  routeTitle,
  version,
  fileName,
}: {
  entryId: string;
  routeTitle: string;
  version: string;
  fileName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Weet je zeker dat je release ${version} van "${routeTitle}" wilt verwijderen?\n\nBestand: ${fileName}\n\nDeze actie kan niet ongedaan worden gemaakt.`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/manifest-entry/${entryId}/delete`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Release verwijderen mislukt.");
        setLoading(false);
        return;
      }

      router.refresh();
      setLoading(false);
    } catch {
      alert("Er is een fout opgetreden tijdens verwijderen.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? "Verwijderen..." : "Verwijder release"}
    </button>
  );
}
