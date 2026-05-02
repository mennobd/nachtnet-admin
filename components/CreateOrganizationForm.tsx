"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateOrganizationForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Afdeling aanmaken mislukt.");
        setLoading(false);
        return;
      }

      setStatus("Afdeling aangemaakt.");
      setName("");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Afdelingsnaam
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bijv. NACOBus"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-ret-red"
          required
        />
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
        {loading ? "Bezig..." : "Afdeling aanmaken"}
      </button>
    </form>
  );
}
