"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Severity = "INFO" | "WARNING" | "CRITICAL";
type TargetDepot = "ALL" | "ZUID" | "KLEIWEG" | "NACHTNET";

type Props = {
  mode: "create" | "edit";
  variant?: "default" | "critical";
  id?: string;
  initialTitle?: string;
  initialMessage?: string;
  initialSeverity?: Severity;
  initialTargetDepot?: TargetDepot;
  initialActive?: boolean;
  initialActiveFrom?: string;
  initialActiveUntil?: string;
};

function getFormClasses(variant: "default" | "critical") {
  if (variant === "critical") {
    return "space-y-4 rounded-xl border border-red-200 bg-white p-4";
  }

  return "space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4";
}

export default function SystemMessageForm({
  mode,
  variant = "default",
  id,
  initialTitle = "",
  initialMessage = "",
  initialSeverity = "INFO",
  initialTargetDepot = "ALL",
  initialActive = true,
  initialActiveFrom = "",
  initialActiveUntil = "",
}: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [message, setMessage] = useState(initialMessage);
  const [severity, setSeverity] = useState<Severity>(initialSeverity);
  const [targetDepot, setTargetDepot] =
    useState<TargetDepot>(initialTargetDepot);
  const [active, setActive] = useState(initialActive);
  const [activeFrom, setActiveFrom] = useState(initialActiveFrom);
  const [activeUntil, setActiveUntil] = useState(initialActiveUntil);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setStatus("");
    setError("");

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/system-messages"
          : `/api/admin/system-messages/${id}`;

      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          severity,
          targetDepot,
          active,
          activeFrom,
          activeUntil,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Opslaan mislukt.");
        setLoading(false);
        return;
      }

      setStatus(
        mode === "create"
          ? "SystemMessage aangemaakt."
          : "SystemMessage bijgewerkt."
      );

      if (mode === "create") {
        setTitle("");
        setMessage("");
        setSeverity(variant === "critical" ? "CRITICAL" : "INFO");
        setTargetDepot(variant === "critical" ? "ALL" : "ALL");
        setActive(true);
        setActiveFrom("");
        setActiveUntil("");
      }

      setLoading(false);
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={getFormClasses(variant)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Titel
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-ret-red"
            placeholder={
              variant === "critical"
                ? "Bijv. Calamiteit Erasmusbrug"
                : "Bijv. Werkzaamheden nachtnet N02"
            }
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Bericht
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black outline-none focus:border-ret-red"
            placeholder={
              variant === "critical"
                ? "Omschrijf kort en duidelijk wat chauffeurs direct moeten weten."
                : "Schrijf hier het bericht dat in de app zichtbaar moet worden."
            }
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Ernst
          </label>
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value as Severity)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black"
          >
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            CRITICAL komt altijd bovenaan in de app.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Doelvestiging
          </label>
          <select
            value={targetDepot}
            onChange={(event) =>
              setTargetDepot(event.target.value as TargetDepot)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black"
          >
            <option value="ALL">ALL</option>
            <option value="ZUID">ZUID</option>
            <option value="KLEIWEG">KLEIWEG</option>
            <option value="NACHTNET">NACHTNET</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            ALL is zichtbaar voor alle vestigingen.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Actief vanaf
          </label>
          <input
            type="datetime-local"
            value={activeFrom || ""}
            onChange={(event) => setActiveFrom(event.target.value)}
            className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-ret-red ${
              activeFrom ? "text-black" : "text-slate-400"
            }`}
          />
          <p className="mt-1 text-xs text-slate-500">
            Leeg laten betekent direct actief.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Actief tot
          </label>
          <input
            type="datetime-local"
            value={activeUntil || ""}
            onChange={(event) => setActiveUntil(event.target.value)}
            className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-ret-red ${
              activeUntil ? "text-black" : "text-slate-400"
            }`}
          />
          <p className="mt-1 text-xs text-slate-500">
            Leeg laten betekent geen eindtijd.
          </p>
        </div>

        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="h-4 w-4"
            />
            Bericht actief
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Alleen actieve berichten kunnen door de app worden opgehaald.
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
        className={`rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-60 ${
          variant === "critical"
            ? "bg-red-700 hover:bg-red-800"
            : "bg-ret-red hover:bg-ret-red-dark"
        }`}
      >
        {loading
          ? "Opslaan..."
          : mode === "create" && variant === "critical"
          ? "CRITICAL bericht direct aanmaken"
          : mode === "create"
          ? "Bericht aanmaken"
          : "Wijzigingen opslaan"}
      </button>
    </form>
  );
}
