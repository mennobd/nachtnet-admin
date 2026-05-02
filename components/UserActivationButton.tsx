"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function UserActivationButton({
  userId,
  userName,
  isActive,
}: {
  userId: string;
  userName: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const action = isActive ? "deactiveren" : "activeren";
    const confirmed = window.confirm(
      `Weet je zeker dat je ${userName} wilt ${action}?`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const endpoint = isActive
        ? `/api/admin/users/${userId}/deactivate`
        : `/api/admin/users/${userId}/activate`;
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Actie mislukt.", "error");
      } else {
        toast(`${userName} is ${isActive ? "gedeactiveerd" : "geactiveerd"}.`);
        router.refresh();
      }
    } catch {
      toast("Er is een fout opgetreden.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
    >
      {loading ? "Bezig..." : isActive ? "Deactiveren" : "Activeren"}
    </button>
  );
}
