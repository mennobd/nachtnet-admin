"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function PublishReleaseButton({
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

  async function handlePublish() {
    const confirmed = window.confirm(
      `Weet je zeker dat je concept-release ${version} van "${routeTitle}" live wilt zetten?`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/manifest-entry/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: true, priority: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Publiceren mislukt.", "error");
      } else {
        toast(`Release ${version} is live gezet.`);
        router.refresh();
      }
    } catch {
      toast("Er is een fout opgetreden tijdens publiceren.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePublish}
      disabled={loading}
      className="rounded-lg border border-green-300 px-3 py-2 text-sm text-green-700 hover:bg-green-50 disabled:opacity-60"
    >
      {loading ? "Live zetten..." : "Zet live"}
    </button>
  );
}
