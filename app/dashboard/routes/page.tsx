import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function RoutesPage() {
  const routes = await prisma.route.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      files: {
        orderBy: { createdAt: "desc" },
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
              Beheer hier de routes en upload GPX-bestanden.
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
            {routes.map((route) => (
              <div
                key={route.id}
                className="flex items-center justify-between rounded-xl border p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{route.title}</p>
                  <p className="text-sm text-slate-500">{route.routeCode}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {route.files.length > 0
                      ? `Laatste versie: ${route.files[0].version}`
                      : "Nog geen bestand geüpload"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      route.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : route.status === "ARCHIVED"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {route.status}
                  </span>

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
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
