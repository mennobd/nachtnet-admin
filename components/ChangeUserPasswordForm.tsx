"use client";

import { useState } from "react";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

export default function ChangeUserPasswordForm({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Wachtwoord wijzigen mislukt.");
        setLoading(false);
        return;
      }

      setStatus(`Wachtwoord bijgewerkt voor ${userName}.`);
      setPassword("");
      setLoading(false);
    } catch {
      setError("Er is een fout opgetreden.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Nieuw wachtwoord
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimaal 8 tekens"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
          required
        />
        <PasswordStrengthIndicator password={password} />
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
        {loading ? "Bezig..." : "Wachtwoord wijzigen"}
      </button>
    </form>
  );
}
