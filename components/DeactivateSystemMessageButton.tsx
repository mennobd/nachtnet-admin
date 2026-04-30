"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeactivateSystemMessageButton({
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
      `Weet je zeker dat je "${title}" wilt deactiveren?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/system-messages/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Deactiveren mislukt.");
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
      className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? "Bezig..." : "Deactiveren"}
    </button>
  );
}
