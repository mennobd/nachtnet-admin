import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function getPublicationState(entry: {
  isPublished: boolean;
  activeFrom: Date | null;
  activeUntil: Date | null;
}) {
  const now = new Date();

  if (!entry.isPublished) return "Concept";
  if (entry.activeFrom && entry.activeFrom > now) return "Gepland";
  if (entry.activeUntil && entry.activeUntil < now) return "Verlopen";
  return "Live";
}

export default async function DashboardPage() {
  const user = await requireUser();

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

  const enriched = routes.map((route) => {
    const latest = route.manifestEntries[0] ?? null;
    const state = latest ? getPublicationState(latest) : "Geen publicatie";

    return {
      ...route,
      latest,
      state,
    };
  });

  const withoutUpload = enriched.filter((r) => r.files.length === 0);
  const expired = enriched.filter((r) => r.state === "Verlopen");
  const concepts = enriched.filter((r) => r.state === "Concept");
  const live = enriched.filter((r) => r.state === "Live");

  const upcoming = enriched.filter((r) => {
    if (!r.latest?.activeFrom) return false;
    const diff = new Date(r.latest.activeFrom).getTime() - now.getTime();
    return diff > 0 && diff < 72 * 60 * 60 * 1000;
  });

  const pendingApprovals = 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="mt-2 text-slate-600">
              Overzicht van routes, publicaties en aandachtspunten.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Ingelogd als {user.name} · {user.role}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/manifest/live"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Open manifest
            </a>

            <a
              href="/api/manifest/live"
              download
              className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Download manifest.json
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
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

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Wacht op akkoord</p>
          <p className="text-3xl font-semibold">{pendingApprovals}</p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Actie vereist</h2>

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

          {withoutUpload.length === 0 && expired.length === 0 ? (
            <p className="text-sm text-slate-500">Geen directe actiepunten.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Binnenkort live</h2>

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

          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">Geen aankomende livegangen.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Live routes</h2>

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

          {live.length === 0 ? (
            <p className="text-sm text-slate-500">Er staan nog geen routes live.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
