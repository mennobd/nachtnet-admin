"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteRouteButton({
  routeId,
  routeTitle,
}: {
  routeId: string;
  routeTitle: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Weet je zeker dat je route "${routeTitle}" wilt verwijderen?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Verwijderen mislukt.");
        setLoading(false);
        return;
      }

      router.push("/dashboard/routes");
      router.refresh();
    } catch {
      alert("Er is een fout opgetreden.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? "Verwijderen..." : "Route verwijderen"}
    </button>
  );
}
