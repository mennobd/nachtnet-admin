import { prisma } from "@/lib/db";
import { getRequiredMutationUser } from "@/lib/auth";
import SystemMessageForm from "@/components/SystemMessageForm";
import DeactivateSystemMessageButton from "@/components/DeactivateSystemMessageButton";

function getSeverityClasses(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-700";
    case "WARNING":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function formatDateForInput(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}

export default async function SystemMessagesPage() {
  await getRequiredMutationUser();

  const messages = await prisma.systemMessage.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  const sortedMessages = messages.sort((a, b) => {
    const severityRank: Record<string, number> = {
      CRITICAL: 1,
      WARNING: 2,
      INFO: 3,
    };

    if (a.active !== b.active) return a.active ? -1 : 1;

    const severityDiff = severityRank[a.severity] - severityRank[b.severity];

    if (severityDiff !== 0) return severityDiff;

    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          SystemMessages
        </h2>
        <p className="mt-2 text-slate-600">
          Beheer operationele berichten voor de RET Navigator app.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Nieuw bericht aanmaken
        </h3>

        <SystemMessageForm mode="create" />
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
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {message.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {message.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getSeverityClasses(
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
                        Vanaf:{" "}
                        {new Date(message.activeFrom).toLocaleString("nl-NL")}
                      </span>

                      {message.activeUntil ? (
                        <span className="text-xs text-slate-500">
                          Tot:{" "}
                          {new Date(message.activeUntil).toLocaleString(
                            "nl-NL"
                          )}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Aangemaakt door: {message.createdBy ?? "Onbekend"}
                    </p>
                  </div>

                  {message.active ? (
                    <DeactivateSystemMessageButton
                      id={message.id}
                      title={message.title}
                    />
                  ) : null}
                </div>

                <details className="rounded-xl border border-slate-200 bg-slate-50">
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
