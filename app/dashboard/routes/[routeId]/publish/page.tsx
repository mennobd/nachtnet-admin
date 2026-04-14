import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PublishManifestEntryForm from "@/components/PublishManifestEntryForm";

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
      </section>

      {route.manifestEntries.length === 0 ? (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">
            Er zijn nog geen publicaties voor deze route. Upload eerst een GPX-bestand.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {route.manifestEntries.map((entry) => (
            <section
              key={entry.id}
              className="rounded-2xl bg-white p-8 shadow-sm"
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {entry.file?.fileName ?? "Onbekend bestand"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Versie: {entry.version}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Status: {getPublicationState(entry)}
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  Prioriteit {entry.priority}
                </span>
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
          ))}
        </div>
      )}
    </div>
  );
}
