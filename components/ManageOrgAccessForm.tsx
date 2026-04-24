"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type OrganizationOption = {
  id: string;
  name: string;
};

type AccessItem = {
  organizationId: string;
};

export default function ManageOrgAccessForm({
  userId,
  organizations,
  currentAccesses,
}: {
  userId: string;
  organizations: OrganizationOption[];
  currentAccesses: AccessItem[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggleAccess(organizationId: string, hasAccess: boolean) {
    setLoadingId(organizationId);
    setError("");

    try {
      const response = await fetch("/api/admin/user-access", {
        method: hasAccess ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Beheerrecht wijzigen mislukt.");
        setLoadingId(null);
        return;
      }

      setLoadingId(null);
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden.");
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {organizations.map((organization) => {
        const hasAccess = currentAccesses.some(
          (access) => access.organizationId === organization.id
        );

        return (
          <div
            key={organization.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {organization.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {hasAccess ? "Gekoppeld aan deze ORG_ADMIN" : "Niet gekoppeld"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleAccess(organization.id, hasAccess)}
              disabled={loadingId === organization.id}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                hasAccess
                  ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              } disabled:opacity-60`}
            >
              {loadingId === organization.id
                ? "Bezig..."
                : hasAccess
                ? "Ontkoppelen"
                : "Koppelen"}
            </button>
          </div>
        );
      })}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
