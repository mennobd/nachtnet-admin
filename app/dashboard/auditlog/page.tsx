export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import AuditlogFilters from "./AuditlogFilters";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

type SearchParams = {
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
};

export default async function AuditlogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();

  const params = await searchParams;
  const action = params.action?.trim() || undefined;
  const entity = params.entity?.trim() || undefined;
  const from = params.from?.trim() || undefined;
  const to = params.to?.trim() || undefined;

  const where = {
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
    ...(entity ? { entity: { equals: entity } } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
          },
        }
      : {}),
  };

  const distinctEntities = await prisma.auditLog.findMany({
    select: { entity: true },
    distinct: ["entity"],
    orderBy: { entity: "asc" },
  });

  try {
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    });

    const csvParams = new URLSearchParams();
    if (action) csvParams.set("action", action);
    if (entity) csvParams.set("entity", entity);
    if (from) csvParams.set("from", from);
    if (to) csvParams.set("to", to);
    csvParams.set("format", "csv");

    return (
      <div className="space-y-6">
        <PageHeader
          title="Auditlog"
          subtitle="Overzicht van mutaties binnen routes, publicaties en gebruikersbeheer."
          action={
            <a
              href={`/api/auditlog?${csvParams.toString()}`}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Exporteer CSV
            </a>
          }
        />

        <AuditlogFilters
          entities={distinctEntities.map((e) => e.entity)}
          defaultAction={params.action ?? ""}
          defaultEntity={params.entity ?? ""}
          defaultFrom={params.from ?? ""}
          defaultTo={params.to ?? ""}
        />

        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="mb-4 text-sm text-slate-500">
            {logs.length} {logs.length === 250 ? "(limiet bereikt — gebruik filters voor meer)" : "resultaten"}
          </p>

          {logs.length === 0 ? (
            <EmptyState title="Geen auditlog-items gevonden voor deze filters" />
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
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {log.entity}
                        </span>
                        <span className="break-all text-xs text-slate-400">
                          {log.entityId}
                        </span>
                      </div>
                      <p className="text-slate-500">
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
          <p className="mt-2 text-red-600">Auditlog kon niet worden geladen.</p>
          <pre className="mt-4 max-w-full whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
            {error instanceof Error ? error.message : "Onbekende fout"}
          </pre>
        </section>
      </div>
    );
  }
}
