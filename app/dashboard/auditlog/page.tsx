import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export default async function AuditlogPage() {
  await requireUser();

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
                className="rounded-xl border p-4 text-sm text-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">
                      {log.action}
                    </p>
                    <p className="text-slate-500">
                      Entiteit: {log.entity} · ID: {log.entityId}
                    </p>
                    <p className="text-slate-500">
                      Gebruiker:{" "}
                      {log.user
                        ? `${log.user.name} (${log.user.email})`
                        : "Onbekend of systeemactie"}
                    </p>
                    {log.metadata ? (
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    ) : null}
                  </div>

                  <div className="whitespace-nowrap text-xs text-slate-400">
                    {new Date(log.createdAt).toLocaleString("nl-NL")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
