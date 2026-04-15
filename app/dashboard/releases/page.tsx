// Release overview page

import Link from "next/link";
import { prisma } from "@/lib/db";
import RollbackReleaseButton from "@/components/RollbackReleaseButton";

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

export default async function ReleasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const statusFilter = params.status ?? "alles";

  const entries = await prisma.manifestEntry.findMany({
    include: {
      route: true,
      file: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const enrichedEntries = entries.map((entry) => {
    const publicationState = getPublicationState(entry);

    return {
      ...entry,
      publicationState,
    };
  });

  const filteredEntries = enrichedEntries.filter((entry) => {
    const matchesQuery =
      q === "" ||
      entry.route.title.toLowerCase().includes(q) ||
      entry.route.routeCode.toLowerCase().includes(q) ||
      (entry.file?.fileName ?? "").toLowerCase().includes(q) ||
      entry.version.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "alles" ||
      entry.publicationState.toLowerCase() === statusFilter.toLowerCase();

    return matchesQuery && matchesStatus;
  });

  const grouped = filteredEntries.reduce<
    Record<
      string,
      {
        routeId: string;
        routeTitle: string;
        routeCode: string;
        items: typeof filteredEntries;
      }
    >
  >((acc, entry) => {
    if (!acc[entry.routeId]) {
      acc[entry.routeId] = {
        routeId: entry.routeId,
        routeTitle: entry.route.title,
        routeCode: entry.route.routeCode,
        items: [],
      };
    }

    acc[entry.routeId].items.push(entry);
    return acc;
  }, {});

  const groups = Object.values(grouped);

  const totalReleases = enrichedEntries.length;
  const liveCount = enrichedEntries.filter(
    (entry) => entry.publicationState === "Live"
  ).length;
  const plannedCount = enrichedEntries.filter(
    (entry) => entry.publicationState === "Gepland"
  ).length;
  const conceptCount = enrichedEntries.filter(
    (entry) => entry.publicationState === "Concept"
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Releases</h2>
        <p className="mt-2 text-slate-600">
          Centraal overzicht van alle versies, publicaties en rollback-mogelijkheden.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Totaal releases</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {totalReleases}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Live</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {liveCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Gepland</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {plannedCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Concept</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {conceptCount}
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <form className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Zoeken
            </label>
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Zoek op route, routecode, bestand of versie"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-slate-500"
            >
              <option value="alles">Alles</option>
              <option value="live">Live</option>
              <option value="gepland">Gepland</option>
              <option value="concept">Concept</option>
              <option value="verlopen">Verlopen</option>
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
              href="/dashboard/releases"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Filters wissen
            </Link>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {groups.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-600">Geen releases gevonden.</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.routeId} className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {group.routeTitle}
                  </h3>
                  <p className="text-sm text-slate-500">{group.routeCode}</p>
                </div>

                <Link
                  href={`/dashboard/routes/${group.routeId}/publish`}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Beheren
                </Link>
              </div>

              <div className="space-y-3">
                {group.items.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-xl border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">
                        {entry.file?.fileName ?? "Onbekend bestand"}
                      </p>

                      <p className="text-sm text-slate-500">
                        Versie: {entry.version}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                            entry.publicationState
                          )}`}
                        >
                          {entry.publicationState}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          Prioriteit {entry.priority}
                        </span>

                        {entry.activeFrom ? (
                          <span className="text-xs text-slate-500">
                            Vanaf: {new Date(entry.activeFrom).toLocaleString("nl-NL")}
                          </span>
                        ) : null}

                        {entry.activeUntil ? (
                          <span className="text-xs text-slate-500">
                            Tot: {new Date(entry.activeUntil).toLocaleString("nl-NL")}
                          </span>
                        ) : null}
                      </div>

                      {entry.notes ? (
                        <p className="text-xs text-slate-500">
                          Notitie: {entry.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <RollbackReleaseButton
                        entryId={entry.id}
                        routeTitle={group.routeTitle}
                        version={entry.version}
                      />

                      <Link
                        href={`/dashboard/routes/${group.routeId}/publish`}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        Openen
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
