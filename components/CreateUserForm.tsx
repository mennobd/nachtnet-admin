"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateUserForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EDITOR");
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Gebruiker aanmaken mislukt.");
        setLoading(false);
        return;
      }

      setStatus("Gebruiker succesvol aangemaakt.");
      setName("");
      setEmail("");
      setPassword("");
      setRole("EDITOR");
      setLoading(false);

      router.refresh();
    } catch {
      setError("Er is een fout opgetreden tijdens het aanmaken.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="user-name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Naam
          </label>
          <input
            id="user-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bijv. Menno Budding"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="user-email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            E-mailadres
          </label>
          <input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Bijv. naam@ret.nl"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="user-password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Wachtwoord
          </label>
          <input
            id="user-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kies een tijdelijk wachtwoord"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Gebruik voorlopig een tijdelijk wachtwoord dat later kan worden
            vervangen.
          </p>
        </div>

        <div>
          <label
            htmlFor="user-role"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Rol
          </label>
          <select
            id="user-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-slate-500"
          >
            <option value="EDITOR">EDITOR</option>
            <option value="ADMIN">ADMIN</option>
            <option value="VIEWER">VIEWER</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            VIEWER kijkt alleen mee. EDITOR beheert routes en publicaties. ADMIN beheert ook gebruikers.
          </p>
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
        className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Bezig met aanmaken..." : "Gebruiker aanmaken"}
      </button>
    </form>
  );
}
