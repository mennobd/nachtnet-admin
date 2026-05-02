"use client";

import { useState } from "react";

type Organization = {
  id: string;
  name: string;
};

export default function CreateUserRequestForm({
  organizations,
}: {
  organizations: Organization[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const res = await fetch("/api/admin/user-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          requestedRole: role,
          organizationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Aanvraag mislukt.");
        setLoading(false);
        return;
      }

      setStatus("Aanvraag succesvol ingediend.");
      setName("");
      setEmail("");
      setOrganizationId("");
      setRole("VIEWER");
      setLoading(false);
    } catch {
      setError("Er is een fout opgetreden.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Naam"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full rounded-xl border px-4 py-3"
      />

      <input
        type="email"
        placeholder="E-mailadres"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-xl border px-4 py-3"
      />

      <select
        value={organizationId}
        onChange={(e) => setOrganizationId(e.target.value)}
        required
        className="w-full rounded-xl border px-4 py-3"
      >
        <option value="">Selecteer afdeling</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full rounded-xl border px-4 py-3"
      >
        <option value="VIEWER">Viewer</option>
        <option value="EDITOR">Editor</option>
      </select>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {status && (
        <div className="text-green-600 text-sm">{status}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-ret-red px-4 py-3 text-white"
      >
        {loading ? "Bezig..." : "Aanvraag indienen"}
      </button>
    </form>
  );
}
