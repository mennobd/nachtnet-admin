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
    case "Concept":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getCategoryBadge(category: string) {
  switch (category) {
    case "REGULIER":
      return "bg-green-100 text-green-700";
    case "OMLEIDING":
      return "bg-orange-100 text-orange-700";
    case "CALAMITEIT":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    publication?: string;
    upload?: string;
  }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const publicationFilter = params.publication ?? "alles";
  const uploadFilter = params.upload ?? "alles";

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

  const enrichedRoutes = routes.map((route) => {
    const latestFile = route.files[0] ?? null;
    const latestPublication = route.manifestEntries[0] ?? null;
    const publicationState = latestPublication
      ? getPublicationState(latestPublication)
      : "Geen publicatie";

    return {
      ...route,
      latestFile,
      latestPublication,
      publicationState,
    };
  });

  const filteredRoutes = enrichedRoutes.filter((route) => {
    const matchesQuery =
      q === "" ||
      route.title.toLowerCase().includes(q) ||
      route.routeCode.toLowerCase().includes(q);

    const matchesPublication =
      publicationFilter === "alles" ||
      route.publicationState.toLowerCase() === publicationFilter.toLowerCase();

    const matchesUpload =
      uploadFilter === "alles" ||
      (uploadFilter === "met-upload" && !!route.latestFile) ||
      (uploadFilter === "zonder-upload" && !route.latestFile);

    return matchesQuery && matchesPublication && matchesUpload;
  });

  const totalRoutes = enrichedRoutes.length;
  const routesWithoutUpload = enrichedRoutes.filter((route) => !route.latestFile).length;
  const liveCount = enrichedRoutes.filter((route) => route.publicationState === "Live").length;
  const plannedCount = enrichedRoutes.filter((route) => route.publicationState === "Gepland").length;

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

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Totaal routes</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {totalRoutes}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Live publicaties</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {liveCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Geplande publicaties</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {plannedCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Zonder upload</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {routesWithoutUpload}
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <form className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Zoeken
            </label>
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Zoek op routecode of titel"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Publicatiestatus
            </label>
            <select
              name="publication"
              defaultValue={publicationFilter}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="alles">Alles</option>
              <option value="live">Live</option>
              <option value="gepland">Gepland</option>
              <option value="concept">Concept</option>
              <option value="verlopen">Verlopen</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Uploadstatus
            </label>
            <select
              name="upload"
              defaultValue={uploadFilter}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="alles">Alles</option>
              <option value="met-upload">Met upload</option>
              <option value="zonder-upload">Zonder upload</option>
            </select>
          </div>

          <div className="md:col-span-4 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Filter toepassen
            </button>

            <Link
              href="/dashboard/routes"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Filters wissen
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        {filteredRoutes.length === 0 ? (
          <p className="text-slate-600">Geen routes gevonden voor deze filters.</p>
        ) : (
          <div className="space-y-4">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="flex items-center justify-between rounded-xl border p-4"
              >
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{route.title}</p>
                  <p className="text-sm text-slate-500">{route.routeCode}</p>

                  <p className="text-xs text-slate-400">
                    {route.latestFile
                      ? `Laatste versie: ${route.latestFile.version}`
                      : "Nog geen bestand geüpload"}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        route.latestPublication
                          ? getStatusClasses(route.publicationState)
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {route.publicationState}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getCategoryBadge(
                        route.category
                      )}`}
                    >
                      {route.category}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {route.status}
                    </span>

                    {route.latestPublication?.activeFrom ? (
                      <span className="text-xs text-slate-500">
                        Vanaf:{" "}
                        {new Date(route.latestPublication.activeFrom).toLocaleString(
                          "nl-NL"
                        )}
                      </span>
                    ) : null}

                    {route.latestPublication?.activeUntil ? (
                      <span className="text-xs text-slate-500">
                        Tot:{" "}
                        {new Date(route.latestPublication.activeUntil).toLocaleString(
                          "nl-NL"
                        )}
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
