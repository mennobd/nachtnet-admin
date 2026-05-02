import Link from "next/link";
import { prisma } from "@/lib/db";
import BulkRouteActions from "@/components/BulkRouteActions";
import RouteImportForm from "@/components/RouteImportForm";

type RouteEntry = {
  isPublished: boolean;
  activeFrom: Date | null;
  activeUntil: Date | null;
  priority: number;
  createdAt: Date;
  type: string;
  file: {
    category: string;
    fileName: string;
    version: string;
  } | null;
};

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

function getActiveEntry(entries: RouteEntry[]) {
  const now = new Date();

  return (
    entries
      .filter((entry) => {
        if (!entry.isPublished) return false;
        if (entry.activeFrom && entry.activeFrom > now) return false;
        if (entry.activeUntil && entry.activeUntil < now) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })[0] ?? null
  );
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

const PAGE_SIZE = 25;

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    publication?: string;
    upload?: string;
    depot?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const publicationFilter = params.publication ?? "alles";
  const uploadFilter = params.upload ?? "alles";
  const depotFilter = params.depot ?? "alles";
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);

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
      },
    },
  });

  const enrichedRoutes = routes.map((route) => {
    const latestFile = route.files[0] ?? null;
    const activeEntry = getActiveEntry(route.manifestEntries);
    const latestPublication = activeEntry ?? route.manifestEntries[0] ?? null;

    const publicationState = latestPublication
      ? getPublicationState(latestPublication)
      : "Geen publicatie";

    const activeCategory =
      activeEntry?.file?.category ?? activeEntry?.type ?? "Geen actieve route";

    return {
      ...route,
      latestFile,
      latestPublication,
      activeEntry,
      activeCategory,
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

    const matchesDepot =
      depotFilter === "alles" ||
      route.depot.toLowerCase() === depotFilter.toLowerCase();

    return matchesQuery && matchesPublication && matchesUpload && matchesDepot;
  });

  const totalRoutes = enrichedRoutes.length;
  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRoutes = filteredRoutes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (publicationFilter !== "alles") sp.set("publication", publicationFilter);
    if (uploadFilter !== "alles") sp.set("upload", uploadFilter);
    if (depotFilter !== "alles") sp.set("depot", depotFilter);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/dashboard/routes${qs ? `?${qs}` : ""}`;
  }
  const routesWithoutUpload = enrichedRoutes.filter(
    (route) => !route.latestFile
  ).length;
  const liveCount = enrichedRoutes.filter(
    (route) => route.publicationState === "Live"
  ).length;
  const plannedCount = enrichedRoutes.filter(
    (route) => route.publicationState === "Gepland"
  ).length;

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
        <form className="grid gap-4 md:grid-cols-5">
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

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Vestiging
            </label>
            <select
              name="depot"
              defaultValue={depotFilter}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="alles">Alles</option>
              <option value="Zuid">Zuid</option>
              <option value="Kleiweg">Kleiweg</option>
              <option value="Krimpen">Krimpen</option>
              <option value="NACHTNET">NACHTNET</option>
            </select>
          </div>

          <div className="md:col-span-5 flex items-center gap-3">
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
          <p className="text-slate-600">
            Geen routes gevonden voor deze filters.
          </p>
        ) : (
          <div className="space-y-4">
            {pagedRoutes.map((route) => (
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

                    {route.activeEntry ? (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getCategoryBadge(
                          route.activeCategory
                        )}`}
                      >
                        {route.activeCategory} actief
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                        Geen actieve route
                      </span>
                    )}

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {route.status}
                    </span>

                    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {route.depot}
                    </span>

                    {route.activeEntry?.activeFrom ? (
                      <span className="text-xs text-slate-500">
                        Vanaf:{" "}
                        {new Date(route.activeEntry.activeFrom).toLocaleString(
                          "nl-NL"
                        )}
                      </span>
                    ) : null}

                    {route.activeEntry?.activeUntil ? (
                      <span className="text-xs text-slate-500">
                        Tot:{" "}
                        {new Date(route.activeEntry.activeUntil).toLocaleString(
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
                <span className="text-slate-500">
                  {filteredRoutes.length} resultaten · pagina {safePage} van {totalPages}
                </span>
                <div className="flex gap-2">
                  {safePage > 1 ? (
                    <a
                      href={pageUrl(safePage - 1)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
                    >
                      Vorige
                    </a>
                  ) : null}
                  {safePage < totalPages ? (
                    <a
                      href={pageUrl(safePage + 1)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
                    >
                      Volgende
                    </a>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="mb-1 text-lg font-semibold text-slate-900">Bulkacties</h3>
        <p className="mb-4 text-sm text-slate-500">
          Selecteer routes om hun status of vestiging in één keer te wijzigen.
        </p>
        <BulkRouteActions
          routes={enrichedRoutes.map((r) => ({
            id: r.id,
            title: r.title,
            routeCode: r.routeCode,
            depot: r.depot,
            status: r.status,
          }))}
        />
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="mb-1 text-lg font-semibold text-slate-900">Routes importeren via CSV</h3>
        <p className="mb-4 text-sm text-slate-500">
          Upload een CSV-bestand om meerdere routes tegelijk aan te maken. Download het voorbeeldbestand voor het juiste formaat.
        </p>
        <RouteImportForm />
      </section>
    </div>
  );
}
