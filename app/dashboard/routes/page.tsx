import Link from "next/link";
import { prisma } from "@/lib/db";

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

function getStatusClasses(status: string) {
  switch (status) {
    case "Live":
      return "bg-green-100 text-green-700";
    case "Gepland":
      return "bg-blue-100 text-blue-700";
    case "Verlopen":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default async function RoutesPage() {
  const routes = await prisma.route.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      files: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      manifestEntries: {
        include: {
          file: true,
        },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Routes</h2>
            <p className="mt-2 text-slate-600">
              Beheer hier de routes, uploads en publicaties.
            </p>
          </div>

          <Link
            href="/dashboard/routes/new"
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Nieuwe route
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        {routes.length === 0 ? (
          <p className="text-slate-600">Nog geen routes aangemaakt.</p>
        ) : (
          <div className="space-y-4">
            {routes.map((route) => {
              const latestFile = route.files[0] ?? null;
              const latestPublication = route.manifestEntries[0] ?? null;
              const publicationState = latestPublication
                ? getPublicationState(latestPublication)
                : "Geen publicatie";

              return (
                <div
                  key={route.id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">{route.title}</p>
                    <p className="text-sm text-slate-500">{route.routeCode}</p>

                    <p className="text-xs text-slate-400">
                      {latestFile
                        ? `Laatste versie: ${latestFile.version}`
                        : "Nog geen bestand geüpload"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          latestPublication
                            ? getStatusClasses(publicationState)
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {publicationState}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {route.status}
                      </span>

                      {latestPublication?.activeFrom ? (
                        <span className="text-xs text-slate-500">
                          Vanaf:{" "}
                          {new Date(latestPublication.activeFrom).toLocaleString(
                            "nl-NL"
                          )}
                        </span>
                      ) : null}

                      {latestPublication?.activeUntil ? (
                        <span className="text-xs text-slate-500">
                          Tot:{" "}
                          {new Date(
                            latestPublication.activeUntil
                          ).toLocaleString("nl-NL")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/routes/${route.id}/publish`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Publiceren
                    </Link>

                    <Link
                      href={`/dashboard/routes/${route.id}/upload`}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Upload GPX
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
