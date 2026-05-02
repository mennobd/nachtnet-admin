import { requireAdminOrOrgAdmin } from "@/lib/auth";
import CreateUserRequestForm from "@/components/CreateUserRequestForm";
import HandleAccountChangeRequestButtons from "@/components/HandleAccountChangeRequestButtons";
import { prisma } from "@/lib/db";

const statusLabel: Record<string, string> = {
  PENDING: "In behandeling",
  APPROVED: "Goedgekeurd",
  REJECTED: "Afgewezen",
};

const statusClasses: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const typeLabel: Record<string, string> = {
  EMAIL: "E-mailadres",
  ROLE: "Rol",
};

export default async function UserRequestsPage() {
  const currentUser = await requireAdminOrOrgAdmin();

  if (currentUser.role !== "ORG_ADMIN") {
    return null;
  }

  const [organizations, myRequests, pendingChangeRequests] = await Promise.all([
    prisma.organization.findMany({
      where: { id: { in: currentUser.organizationAccessIds } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.userApprovalRequest.findMany({
      where: { requestedById: currentUser.id },
      orderBy: { createdAt: "desc" },
      include: { organization: { select: { name: true } } },
      take: 50,
    }),
    prisma.accountChangeRequest.findMany({
      where: {
        status: "PENDING",
        user: {
          organizationId: { in: currentUser.organizationAccessIds },
          role: { in: ["EDITOR", "VIEWER"] },
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          Gebruiker aanvragen
        </h2>
        <p className="mt-2 text-slate-600">
          Vraag hier een nieuw account aan. Deze wordt eerst beoordeeld door een ADMIN.
        </p>
      </section>

      {pendingChangeRequests.length > 0 && (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Openstaande wijzigingsverzoeken
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Accountwijzigingen van gebruikers in jouw afdeling die wachten op
            jouw beoordeling.
          </p>

          <div className="mt-4 space-y-4">
            {pendingChangeRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">
                      {req.user.name}
                    </p>
                    <p className="text-sm text-slate-500">{req.user.email}</p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">
                        {typeLabel[req.type] ?? req.type}
                      </span>{" "}
                      wijzigen naar{" "}
                      <span className="font-medium">{req.requestedValue}</span>
                    </p>
                    {req.reason && (
                      <p className="text-xs text-slate-500">
                        Reden: {req.reason}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      Ingediend op{" "}
                      {new Date(req.createdAt).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    In behandeling
                  </span>
                </div>

                <HandleAccountChangeRequestButtons requestId={req.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <CreateUserRequestForm organizations={organizations} />
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Mijn aanvragen</h3>
        <p className="mt-1 text-sm text-slate-500">
          Status van jouw ingediende gebruikersaanvragen.
        </p>

        {myRequests.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Je hebt nog geen aanvragen ingediend.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between rounded-xl border border-slate-200 p-4"
              >
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{req.name}</p>
                  <p className="text-sm text-slate-500">{req.email}</p>
                  <p className="text-xs text-slate-400">
                    {req.organization.name} · {req.requestedRole} ·{" "}
                    {new Date(req.createdAt).toLocaleDateString("nl-NL")}
                  </p>
                  {req.rejectionReason && (
                    <p className="text-xs text-red-600">
                      Reden afwijzing: {req.rejectionReason}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium shrink-0 ${
                    statusClasses[req.status] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {statusLabel[req.status] ?? req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
