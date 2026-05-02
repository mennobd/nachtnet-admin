"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeactivateSystemMessageButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/system-messages/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        alert("Deactiveren mislukt.");
        setLoading(false);
        setOpen(false);
        return;
      }
      router.refresh();
      setOpen(false);
      setLoading(false);
    } catch {
      alert("Er is een fout opgetreden.");
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
      >
        Deactiveren
      </button>
      <ConfirmDialog
        open={open}
        title="Bericht deactiveren"
        description={`Weet je zeker dat je "${title}" wilt deactiveren?\n\nHet bericht wordt niet meer getoond in de app.`}
        confirmLabel="Deactiveren"
        destructive
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
