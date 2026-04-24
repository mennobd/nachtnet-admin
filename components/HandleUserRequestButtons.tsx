"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HandleUserRequestButtons({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle(action: "approve" | "reject") {
    setLoading(true);

    await fetch(`/api/admin/user-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle("approve")}
        disabled={loading}
        className="px-3 py-2 text-sm rounded-xl bg-green-600 text-white"
      >
        Goedkeuren
      </button>

      <button
        onClick={() => handle("reject")}
        disabled={loading}
        className="px-3 py-2 text-sm rounded-xl bg-red-600 text-white"
      >
        Afwijzen
      </button>
    </div>
  );
}
