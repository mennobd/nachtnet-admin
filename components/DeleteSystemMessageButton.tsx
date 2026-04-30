"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteSystemMessageButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      `Weet je zeker dat je "${title}" definitief wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/system-messages/${id}/hard-delete`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Verwijderen mislukt.");
        setLoading(false);
        return;
      }

      setLoading(false);
      router.refresh();
    } catch {
      alert("Er is een fout opgetreden.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? "Verwijderen..." : "Definitief verwijderen"}
    </button>
  );
}
