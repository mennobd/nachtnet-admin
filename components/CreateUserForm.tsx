"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

type OrganizationOption = {
  id: string;
  name: string;
};

export default function CreateUserForm({
  organizations,
}: {
  organizations: OrganizationOption[];
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [organizationId, setOrganizationId] = useState(
    organizations[0]?.id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Gebruiker aanmaken mislukt.");
        setLoading(false);
        return;
      }

      setStatus("Gebruiker aangemaakt.");
      setName("");
      setEmail("");
      setPassword("");
      setRole("VIEWER");
      setOrganizationId(organizations[0]?.id ?? "");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Naam
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bijv. Jan Jansen"
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
            placeholder="naam@ret.nl"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-ret-red"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Wachtwoord
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimaal 8 tekens"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-ret-red"
            required
          />
          <PasswordStrengthIndicator password={password} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Rol
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-ret-red"
          >
            <option value="VIEWER">VIEWER</option>
            <option value="EDITOR">EDITOR</option>
            <option value="ORG_ADMIN">ORG_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Afdeling
          </label>
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
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {status ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {status}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-ret-red px-4 py-3 text-sm font-medium text-white hover:bg-ret-red-dark disabled:opacity-60"
      >
        {loading ? "Bezig..." : "Gebruiker aanmaken"}
      </button>
    </form>
  );
}
