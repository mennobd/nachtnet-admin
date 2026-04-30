export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { getRequiredMutationUser } from "@/lib/auth";
import SystemMessageForm from "@/components/SystemMessageForm";
import DeactivateSystemMessageButton from "@/components/DeactivateSystemMessageButton";

const severityRank: Record<string, number> = {
  CRITICAL: 1,
  WARNING: 2,
  INFO: 3,
};

function getSeverityClasses(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
    case "WARNING":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

function getCardClasses(severity: string, active: boolean) {
  if (!active) return "border-slate-200 bg-white opacity-75";

  switch (severity) {
    case "CRITICAL":
      return "border-red-200 bg-red-50";
    case "WARNING":
      return "border-orange-200 bg-orange-50";
    default:
      return "border-slate-200 bg-white";
  }
}

function formatDateForInput(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}

function formatDate(date: Date | null) {
  if (!date) return "Geen eindtijd";
  return new Date(date).toLocaleString("nl-NL");
}

export default async function SystemMessagesPage() {
  await getRequiredMutationUser();

  const messages = await prisma.systemMessage.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  const sortedMessages = messages.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;

    const severityDiff = severityRank[a.severity] - severityRank[b.severity];
    if (severityDiff !== 0) return severityDiff;

    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const activeCount = messages.filter((message) => message.active).length;
  const criticalCount = messages.filter(
    (message) => message.active && message.severity === "CRITICAL"
  ).length;
  const warningCount = messages.filter(
    (message) => message.active && message.severity === "WARNING"
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              SystemMessages
            </h2>
            <p className="mt-2 text-slate-600">
              Beheer operationele berichten voor de RET Navigator app.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Actief: {activeCount}
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              Critical: {criticalCount}
            </span>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
              Warning: {warningCount}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-red-900">
          Snel calamiteitenbericht
        </h3>
        <p className="mt-2 text-sm text-red-700">
          Gebruik dit voor urgente operationele verstoringen. Het bericht staat
          standaard op CRITICAL, actief en gericht op alle vestigingen.
        </p>

        <div className="mt-6">
          <SystemMessageForm
            mode="create"
            variant="critical"
            initialSeverity="CRITICAL"
            initialTargetDepot="ALL"
            initialActive={true}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Normaal bericht aanmaken
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Gebruik dit voor informatieberichten of geplande operationele
          waarschuwingen.
        </p>

        <div className="mt-6">
          <SystemMessageForm mode="create" />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Bestaande berichten
        </h3>

        {sortedMessages.length === 0 ? (
          <p className="text-sm text-slate-600">
            Er zijn nog geen SystemMessages aangemaakt.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedMessages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl border p-4 ${getCardClasses(
                  message.severity,
                  message.active
                )}`}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {message.title}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                      {message.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getSeverityClasses(
                          message.severity
                        )}`}
                      >
                        {message.severity}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {message.targetDepot}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          message.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {message.active ? "Actief" : "Inactief"}
                      </span>

                      <span className="text-xs text-slate-500">
                        Vanaf: {formatDate(message.activeFrom)}
                      </span>

                      <span className="text-xs text-slate-500">
                        Tot: {formatDate(message.activeUntil)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Aangemaakt door: {message.createdBy ?? "Onbekend"} ·
                      Aangemaakt op: {formatDate(message.createdAt)}
                    </p>
                  </div>

                  {message.active ? (
                    <DeactivateSystemMessageButton
                      id={message.id}
                      title={message.title}
                    />
                  ) : null}
                </div>

                <details className="rounded-xl border border-slate-200 bg-white/70">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-700 [&::-webkit-details-marker]:hidden">
                    Aanpassen…
                  </summary>

                  <div className="border-t border-slate-200 p-4">
                    <SystemMessageForm
                      mode="edit"
                      id={message.id}
                      initialTitle={message.title}
                      initialMessage={message.message}
                      initialSeverity={message.severity}
                      initialTargetDepot={message.targetDepot}
                      initialActive={message.active}
                      initialActiveFrom={formatDateForInput(message.activeFrom)}
                      initialActiveUntil={formatDateForInput(
                        message.activeUntil
                      )}
                    />
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
