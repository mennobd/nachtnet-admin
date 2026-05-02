"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@prisma/client";
import { useToast } from "@/components/Toast";

type OrganizationOption = {
  id: string;
  name: string;
};

export default function EditUserForm({
  userId,
  initialName,
  initialEmail,
  initialRole,
  initialOrganizationId,
  organizations,
  canEditRole,
  canEditOrganization,
}: {
  userId: string;
  initialName: string;
  initialEmail: string;
  initialRole: UserRole;
  initialOrganizationId: string | null;
  organizations: OrganizationOption[];
  canEditRole: boolean;
  canEditOrganization: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [organizationId, setOrganizationId] = useState(
    initialOrganizationId ?? organizations[0]?.id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          role,
          organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Gebruiker bijwerken mislukt.");
        setLoading(false);
        return;
      }

      toast("Gebruiker bijgewerkt.");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden tijdens het opslaan.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Naam
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-ret-red"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            E-mailadres
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-ret-red"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Rol
          </label>
          {canEditRole ? (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-ret-red"
            >
              <option value="VIEWER">VIEWER</option>
              <option value="EDITOR">EDITOR</option>
              <option value="ORG_ADMIN">ORG_ADMIN</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          ) : (
            <input
              type="text"
              value={role}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600"
            />
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Afdeling
          </label>
          {canEditOrganization ? (
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-ret-red"
              required
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={
                organizations.find((o) => o.id === organizationId)?.name ??
                "Geen afdeling"
              }
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600"
            />
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-ret-red px-4 py-3 text-sm font-medium text-white hover:bg-ret-red-dark disabled:opacity-60"
      >
        {loading ? "Opslaan..." : "Wijzigingen opslaan"}
      </button>
    </form>
  );
}
