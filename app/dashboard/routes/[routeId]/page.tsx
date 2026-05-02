import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import DeleteRouteButton from "@/components/DeleteRouteButton";

function getEntryStatus(entry: {
  isPublished: boolean;
  activeFrom: Date | null;
  activeUntil: Date | null;
}): { label: string; classes: string; dot: string } {
  const now = new Date();
  if (!entry.isPublished) return { label: "Concept", classes: "bg-amber-100 text-amber-700", dot: "bg-amber-400" };
  if (entry.activeFrom && entry.activeFrom > now) return { label: "Gepland", classes: "bg-blue-100 text-blue-700", dot: "bg-blue-400" };
  if (entry.activeUntil && entry.activeUntil < now) return { label: "Verlopen", classes: "bg-slate-200 text-slate-600", dot: "bg-slate-400" };
  return { label: "Live", classes: "bg-green-100 text-green-700", dot: "bg-green-500" };
}

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;

  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      files: {
        orderBy: { createdAt: "desc" },
      },
      manifestEntries: {
        include: {
          file: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!route) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          {route.title}
        </h2>
        <p className="mt-2 text-slate-600">{route.routeCode}</p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="space-y-2 text-sm text-slate-600">
          <p>Lijnnummer: {route.lineNumber}</p>
          <p>Richting: {route.direction}</p>
          <p>Vestiging: {route.depot}</p>
          <p>Status: {route.status}</p>
        </div>

        <div className="mt-6 flex items-center gap-3">
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

          <DeleteRouteButton routeId={route.id} routeTitle={route.title} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Bestanden</h3>

        {route.files.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Nog geen bestanden geüpload.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {route.files.map((file) => (
              <div
                key={file.id}
                className="rounded-xl border p-4 text-sm text-slate-600"
              >
                <p className="font-medium text-slate-900">{file.fileName}</p>
                <p>Versie: {file.version}</p>
                <p>Checksum: {file.checksum}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Publicatiehistorie</h3>
        <p className="mt-1 text-sm text-slate-500">
          Alle releases voor deze route, meest recent bovenaan.
        </p>

        {route.manifestEntries.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Nog geen publicaties aanwezig.
          </p>
        ) : (
          <div className="relative mt-6">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
            <div className="space-y-6">
              {route.manifestEntries.map((entry) => {
                const status = getEntryStatus(entry);
                return (
                  <div key={entry.id} className="relative flex gap-4">
                    <div className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ring-2 ring-white ${status.dot}`} />
                    <div className="flex-1 rounded-xl border border-slate-200 p-4 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-900">
                            {entry.file?.fileName ?? "Onbekend bestand"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Versie {entry.version} · Prioriteit {entry.priority}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                        <span>
                          <span className="font-medium text-slate-600">Vanaf:</span>{" "}
                          {entry.activeFrom
                            ? new Date(entry.activeFrom).toLocaleString("nl-NL")
                            : "Niet ingesteld"}
                        </span>
                        <span>
                          <span className="font-medium text-slate-600">Tot:</span>{" "}
                          {entry.activeUntil
                            ? new Date(entry.activeUntil).toLocaleString("nl-NL")
                            : "Niet ingesteld"}
                        </span>
                        <span>
                          <span className="font-medium text-slate-600">Aangemaakt:</span>{" "}
                          {new Date(entry.createdAt).toLocaleString("nl-NL")}
                        </span>
                        {entry.file?.category && (
                          <span>
                            <span className="font-medium text-slate-600">Categorie:</span>{" "}
                            {entry.file.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
