"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PublishReleaseButtonProps = {
  entryId: string;
  routeTitle: string;
  version: string;
};

export default function PublishReleaseButton(
  props: PublishReleaseButtonProps
) {
  const { entryId, routeTitle, version } = props;
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    const confirmed = window.confirm(
      `Weet je zeker dat je concept-release ${version} van "${routeTitle}" live wilt zetten?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/manifest-entry/${entryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPublished: true,
          priority: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Publiceren mislukt.");
        setLoading(false);
        return;
      }

      router.refresh();
      setLoading(false);
    } catch {
      alert("Er is een fout opgetreden tijdens publiceren.");
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
