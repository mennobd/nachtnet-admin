"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeleteOrganizationButton({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Afdeling verwijderen mislukt.");
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
        Verwijderen
      </button>
      <ConfirmDialog
        open={open}
        title={`Afdeling verwijderen`}
        description={`Weet je zeker dat je afdeling "${organizationName}" wilt verwijderen?\n\nDit kan alleen als er geen gebruikers meer aan gekoppeld zijn.`}
        confirmLabel="Verwijderen"
        destructive
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
