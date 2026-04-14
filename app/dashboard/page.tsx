import Link from "next/link";
import { prisma } from "@/lib/db";

function getPublicationState(entry: any) {
  const now = new Date();

  if (!entry.isPublished) return "Concept";
  if (entry.activeFrom && entry.activeFrom > now) return "Gepland";
  if (entry.activeUntil && entry.activeUntil < now) return "Verlopen";
  return "Live";
}

export default async function DashboardPage() {
  const routes = await prisma.route.findMany({
    include: {
      files: true,
      manifestEntries: {
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        take: 1,
      },
    },
  });

  const now = new Date();

  const enriched = routes.map((r) => {
    const latest = r.manifestEntries[0] ?? null;
    const state = latest ? getPublicationState(latest) : "Geen publicatie";

    return {
      ...r,
      latest,
      state,
    };
  });

  // KPI’s
  const withoutUpload = enriched.filter((r) => r.files.length === 0);
  const expired = enriched.filter((r) => r.state === "Verlopen");
  const concepts = enriched.filter((r) => r.state === "Concept");

  const upcoming = enriched.filter((r) => {
    if (!r.latest?.activeFrom) return false;
    const diff = new Date(r.latest.activeFrom).getTime() - now.getTime();
    return diff > 0 && diff < 72 * 60 * 60 * 1000; // 72 uur
  });

  const live = enriched.filter((r) => r.state === "Live");

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Overzicht van routes, publicaties en aandachtspunten.
        </p>
      </section>

      {/* KPI */}
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Zonder upload</p>
          <p className="text-3xl font-semibold">{withoutUpload.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Verlopen</p>
          <p className="text-3xl font-semibold">{expired.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Concept</p>
          <p className="text-3xl font-semibold">{concepts.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Binnenkort live</p>
          <p className="text-3xl font-semibold">{upcoming.length}</p>
        </div>
      </section>

      {/* Actie vereist */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          ⚠️ Actie vereist
        </h2>

        <div className="mt-4 space-y-3">
          {[...withoutUpload, ...expired].map((r) => (
            <div key={r.id} className="flex justify-between border-b pb-2">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-slate-500">{r.routeCode}</p>
              </div>

              <Link
                href={`/dashboard/routes/${r.id}`}
                className="text-sm text-blue-600"
              >
                Open
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Binnenkort live */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          ⏱ Binnenkort live
        </h2>

        <div className="mt-4 space-y-3">
          {upcoming.map((r) => (
            <div key={r.id} className="flex justify-between border-b pb-2">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-slate-500">
                  {r.latest?.activeFrom
                    ? new Date(r.latest.activeFrom).toLocaleString("nl-NL")
                    : "Geen starttijd ingesteld"}
                </p>
              </div>

              <Link
                href={`/dashboard/routes/${r.id}/publish`}
                className="text-sm text-blue-600"
              >
                Beheren
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Live */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          ✅ Live routes
        </h2>

        <div className="mt-4 space-y-3">
          {live.map((r) => (
            <div key={r.id} className="flex justify-between border-b pb-2">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-slate-500">{r.routeCode}</p>
              </div>

              <Link
                href={`/dashboard/routes/${r.id}`}
                className="text-sm text-blue-600"
              >
                Open
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
