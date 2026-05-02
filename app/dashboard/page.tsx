import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getInvalidConceptReleases } from "@/lib/dashboard-health";
import { getRoleMeta } from "@/lib/roles";

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

  const invalidConceptReleases = await getInvalidConceptReleases();

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
  const planned = enriched.filter((r) => r.state === "Gepland");

  const expiringSoon = enriched.filter((r) => {
    if (!r.latest?.activeUntil || !r.latest.isPublished) return false;
    const diff = new Date(r.latest.activeUntil).getTime() - now.getTime();
    return diff > 0 && diff < 72 * 60 * 60 * 1000;
  });

  const upcoming = enriched.filter((r) => {
    if (!r.latest?.activeFrom) return false;
    const diff = new Date(r.latest.activeFrom).getTime() - now.getTime();
    return diff > 0 && diff < 72 * 60 * 60 * 1000;
  });

  const manifestHealthy = live.length > 0;

  return (
    <div className="space-y-6">
      {/* ALERTS */}
      {(!manifestHealthy || expiringSoon.length > 0) && (
        <div className="space-y-3">
          {!manifestHealthy && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-800">
              <span className="font-semibold">Waarschuwing:</span> Er zijn momenteel geen live routes in het manifest. Publiceer een route om de app te voorzien van actuele data.
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-6 py-4 text-sm text-orange-800">
              <span className="font-semibold">Let op:</span> {expiringSoon.length} route{expiringSoon.length !== 1 ? "s verlopen" : " verloopt"} binnen 72 uur.{" "}
              <Link href="/dashboard/routes?publication=live" className="underline font-medium">
                Bekijk live routes →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* HEADER */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Dashboard
            </h1>
            <p className="mt-2 text-slate-600">
              Overzicht van routes, publicaties en operationele aandachtspunten.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Ingelogd als {user.name} · {getRoleMeta(user.role).label}
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/api/manifest/live"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Open manifest
            </a>

            <a
              href="/api/manifest/live"
              download
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Download manifest
            </a>
          </div>
        </div>
      </section>

      {/* KPI BLOKKEN */}
      <section className="grid gap-4 md:grid-cols-6">
        <div className={`rounded-2xl p-6 shadow-sm ${manifestHealthy ? "bg-white" : "border border-red-200 bg-red-50"}`}>
          <p className="text-sm text-slate-500">Manifest status</p>
          <p className={`mt-2 text-2xl font-semibold ${manifestHealthy ? "text-slate-900" : "text-red-700"}`}>
            {manifestHealthy ? "Gezond" : "Waarschuwing"}
          </p>
        </div>

        <Link href="/dashboard/routes?publication=live" className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-slate-500">Live</p>
          <p className="mt-2 text-3xl font-semibold text-green-600">{live.length}</p>
        </Link>

        <Link href="/dashboard/routes?publication=gepland" className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-slate-500">Gepland</p>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{planned.length}</p>
        </Link>

        <Link href="/dashboard/routes?publication=concept" className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-slate-500">Concept</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{concepts.length}</p>
        </Link>

        <Link href="/dashboard/routes?publication=verlopen" className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-slate-500">Verlopen</p>
          <p className="mt-2 text-3xl font-semibold text-slate-700">{expired.length}</p>
        </Link>

        <Link href="/dashboard/routes?upload=zonder-upload" className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-slate-500">Zonder upload</p>
          <p className="mt-2 text-3xl font-semibold text-slate-700">{withoutUpload.length}</p>
        </Link>
      </section>

      {/* ONGELDIGE CONCEPT RELEASES */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold">
          Ongeldige concept-releases
        </h2>

        <div className="mt-4 space-y-4">
          {invalidConceptReleases.length === 0 ? (
            <p className="text-sm text-slate-500">
              Alles is valid — geen issues.
            </p>
          ) : (
            invalidConceptReleases.map((r) => (
              <div
                key={r.entryId}
                className="rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <p className="font-medium">{r.routeTitle}</p>
                <p className="text-sm text-slate-600">
                  {r.routeCode} · Versie {r.version}
                </p>

                <ul className="mt-2 list-disc pl-5 text-sm text-amber-800">
                  {r.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>

                <Link
                  href={`/dashboard/routes/${r.routeId}/publish`}
                  className="mt-3 inline-block text-sm text-blue-600"
                >
                  Open →
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ACTIES */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold">Actie vereist</h2>

        <div className="mt-4 space-y-3">
          {[...withoutUpload, ...expired].map((r) => (
            <div key={r.id} className="flex justify-between border-b pb-2">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-slate-500">
                  {r.routeCode} · {r.depot}
                  {r.state === "Verlopen" && (
                    <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Verlopen</span>
                  )}
                  {r.files.length === 0 && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Geen upload</span>
                  )}
                </p>
              </div>

              <Link
                href={`/dashboard/routes/${r.id}`}
                className="text-sm text-blue-600"
              >
                Open
              </Link>
            </div>
          ))}

          {withoutUpload.length === 0 && expired.length === 0 && (
            <p className="text-sm text-slate-500">
              Geen actiepunten.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
