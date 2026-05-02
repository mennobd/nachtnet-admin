import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import HandleUserRequestButtons from "@/components/HandleUserRequestButtons";
import UserRequestList from "@/components/UserRequestList";
import HandleAccountChangeRequestButtons from "@/components/HandleAccountChangeRequestButtons";

const typeLabel: Record<string, string> = {
  EMAIL: "E-mailadres",
  ROLE: "Rol",
};

export default async function AdminUserRequestsPage() {
  await requireAdmin();

  const [requests, pendingChangeRequests] = await Promise.all([
    prisma.userApprovalRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { name: true } },
      },
    }),
    prisma.accountChangeRequest.findMany({
      where: {
        status: "PENDING",
        user: { role: "ORG_ADMIN" },
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
          Beoordeel en verwerk aanvragen van ORG_ADMIN gebruikers.
        </p>
      </section>

      {pendingChangeRequests.length > 0 && (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Wijzigingsverzoeken van afdelingsadmins
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Accountwijzigingen ingediend door ORG_ADMIN gebruikers.
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
        <UserRequestList requests={requests} />
      </section>
    </div>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "APPROVED":
      return "bg-green-100 text-green-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-200 text-slate-700";
  }
}
