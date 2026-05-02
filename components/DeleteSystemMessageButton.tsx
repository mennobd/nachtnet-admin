"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeleteSystemMessageButton({
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
      const response = await fetch(`/api/admin/system-messages/${id}/hard-delete`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Verwijderen mislukt.");
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
        className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50"
      >
        Definitief verwijderen
      </button>
      <ConfirmDialog
        open={open}
        title="Bericht definitief verwijderen"
        description={`Weet je zeker dat je "${title}" definitief wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt.`}
        confirmLabel="Definitief verwijderen"
        destructive
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
