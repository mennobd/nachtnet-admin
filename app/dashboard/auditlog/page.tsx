import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export default async function AuditlogPage() {
  await requireUser();

  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return (
      <div className="space-y-6">
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Auditlog</h2>
          <p className="mt-2 text-slate-600">
            Overzicht van mutaties binnen routes, publicaties en gebruikersbeheer.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-sm">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-600">
              Er zijn nog geen auditlog-items beschikbaar.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-slate-900">{log.action}</p>

                      <p className="text-slate-500">
                        Entiteit: {log.entity}
                      </p>

                      <p className="break-all text-xs text-slate-400">
                        ID: {log.entityId}
                      </p>

                      <p className="text-slate-500">
                        Gebruiker:{" "}
                        {log.user
                          ? `${log.user.name} (${log.user.email})`
                          : "Onbekend of systeemactie"}
                      </p>
                    </div>

                    <div className="shrink-0 text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString("nl-NL")}
                    </div>
                  </div>

                  {log.metadata ? (
                    <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50">
                      <summary className="cursor-pointer list-none px-4 py-3 text-xs font-medium text-slate-600 [&::-webkit-details-marker]:hidden">
                        Details bekijken…
                      </summary>

                      <pre className="max-w-full whitespace-pre-wrap break-words border-t border-slate-200 p-4 text-xs text-slate-600">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  } catch (error) {
    console.error("AUDITLOG PAGE ERROR:", error);

    return (
      <div className="space-y-6">
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Auditlog</h2>
          <p className="mt-2 text-red-600">
            Auditlog kon niet worden geladen.
          </p>
          <pre className="mt-4 max-w-full whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
            {error instanceof Error ? error.message : "Onbekende fout"}
          </pre>
        </section>
      </div>
    );
  }
}
