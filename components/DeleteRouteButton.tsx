"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeleteRouteButton({
  routeId,
  routeTitle,
}: {
  routeId: string;
  routeTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Verwijderen mislukt.");
        setLoading(false);
        setOpen(false);
        return;
      }
      router.push("/dashboard/routes");
      router.refresh();
    } catch {
      alert("Er is een fout opgetreden.");
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
      >
        Route verwijderen
      </button>
      <ConfirmDialog
        open={open}
        title={`Route verwijderen`}
        description={`Weet je zeker dat je route "${routeTitle}" wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt.`}
        confirmLabel="Verwijderen"
        destructive
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
