import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PublishManifestEntryForm from "@/components/PublishManifestEntryForm";
import ReleaseValidationPanel from "@/components/ReleaseValidationPanel";

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

export default async function PublishRoutePage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;

  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
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
          Publicaties beheren
        </h2>
        <p className="mt-2 text-slate-600">
          Route <strong>{route.title}</strong> ({route.routeCode})
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Vestiging: {route.depot}
        </p>
      </section>

      {route.manifestEntries.length === 0 ? (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">
            Er zijn nog geen publicaties voor deze route. Upload eerst een GPX-bestand.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {route.manifestEntries.map((entry) => {
            const status = getPublicationState(entry);

            return (
              <section
                key={entry.id}
                className="rounded-2xl bg-white p-8 shadow-sm"
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {entry.file?.fileName ?? "Onbekend bestand"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Versie: {entry.version}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                          status
                        )}`}
                      >
                        {status}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        Prioriteit {entry.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <ReleaseValidationPanel entryId={entry.id} />
                </div>

                <PublishManifestEntryForm
                  entryId={entry.id}
                  initialIsPublished={entry.isPublished}
                  initialActiveFrom={
                    entry.activeFrom
                      ? new Date(entry.activeFrom).toISOString().slice(0, 16)
                      : ""
                  }
                  initialActiveUntil={
                    entry.activeUntil
                      ? new Date(entry.activeUntil).toISOString().slice(0, 16)
                      : ""
                  }
                  initialPriority={entry.priority}
                  initialNotes={entry.notes ?? ""}
                />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
