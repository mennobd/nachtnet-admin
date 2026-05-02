import Link from "next/link";
import { prisma } from "@/lib/db";
import RollbackReleaseButton from "@/components/RollbackReleaseButton";
import PublishReleaseButton from "@/components/PublishReleaseButton";
import ReleasesBulkActions from "@/components/ReleasesBulkActions";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusBadge, { publicationBadgeVariant } from "@/components/StatusBadge";

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

export default async function ReleasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const statusFilter = params.status ?? "alles";

  const entries = await prisma.manifestEntry.findMany({
    include: { route: true, file: true },
    orderBy: [{ createdAt: "desc" }],
  });

  const enrichedEntries = entries.map((entry) => ({
    ...entry,
    publicationState: getPublicationState(entry),
  }));

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
    Record<string, { routeId: string; routeTitle: string; routeCode: string; items: typeof filteredEntries }>
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
  const liveCount = enrichedEntries.filter((e) => e.publicationState === "Live").length;
  const plannedCount = enrichedEntries.filter((e) => e.publicationState === "Gepland").length;
  const conceptCount = enrichedEntries.filter((e) => e.publicationState === "Concept").length;

  const hasFilters = q !== "" || statusFilter !== "alles";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Releases"
        subtitle="Centraal overzicht van alle versies, publicaties en rollbackmogelijkheden."
        action={
          <a
            href="/api/manifest/live"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Open actueel manifest
          </a>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Totaal releases</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totalReleases}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Live</p>
          <p className="mt-2 text-3xl font-semibold text-green-600">{liveCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Gepland</p>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{plannedCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Concept</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{conceptCount}</p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <form className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-medium text-slate-700">Zoeken</label>
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Zoek op route, routecode, bestand of versie"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-ret-red"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-ret-red"
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
              className="rounded-xl bg-ret-red px-4 py-2.5 text-sm font-medium text-white hover:bg-ret-red-dark transition-colors"
            >
              Filter toepassen
            </button>
            <Link
              href="/dashboard/releases"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Filters wissen
            </Link>
          </div>
        </form>
      </section>

      <ReleasesBulkActions
        releases={filteredEntries.map((entry) => ({
          id: entry.id,
          routeTitle: entry.route.title,
          version: entry.version,
          publicationState: entry.publicationState,
        }))}
      />

      <section className="space-y-4">
        {groups.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm">
            <EmptyState
              title={hasFilters ? "Geen releases gevonden voor deze filters" : "Nog geen releases aangemaakt"}
              description={hasFilters ? "Pas de filters aan of verwijder ze om alle releases te zien." : "Publiceer een route om de eerste release aan te maken."}
            />
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.routeId} className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900">{group.routeTitle}</h3>
                  <p className="text-sm text-slate-500">{group.routeCode}</p>
                </div>
                <Link
                  href={`/dashboard/routes/${group.routeId}/publish`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Beheren
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {group.items.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between gap-4 px-8 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="font-medium text-slate-900 truncate">
                        {entry.file?.fileName ?? "Onbekend bestand"}
                      </p>
                      <p className="text-sm text-slate-500">Versie: {entry.version}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge
                          label={entry.publicationState}
                          variant={publicationBadgeVariant(entry.publicationState)}
                        />
                        <StatusBadge label={`Prioriteit ${entry.priority}`} variant="muted" />
                        {entry.activeFrom && (
                          <span className="text-xs text-slate-400">
                            {new Date(entry.activeFrom).toLocaleDateString("nl-NL")}
                            {entry.activeUntil
                              ? ` – ${new Date(entry.activeUntil).toLocaleDateString("nl-NL")}`
                              : ""}
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-slate-500">Notitie: {entry.notes}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {entry.publicationState === "Concept" && (
                        <PublishReleaseButton
                          entryId={entry.id}
                          routeTitle={group.routeTitle}
                          version={entry.version}
                        />
                      )}
                      <RollbackReleaseButton
                        entryId={entry.id}
                        routeTitle={group.routeTitle}
                        version={entry.version}
                      />
                      <Link
                        href={`/dashboard/routes/${group.routeId}/publish`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
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
