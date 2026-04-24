import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import HandleUserRequestButtons from "@/components/HandleUserRequestButtons";

export default async function AdminUserRequestsPage() {
  await requireAdmin();

  const requests = await prisma.userApprovalRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: {
        select: { name: true },
      },
    },
  });

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

      <section className="rounded-2xl bg-white p-8 shadow-sm space-y-4">
        {requests.length === 0 ? (
          <p className="text-sm text-slate-600">
            Geen aanvragen beschikbaar.
          </p>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border p-4 flex justify-between items-start"
            >
              <div>
                <p className="font-medium text-slate-900">{req.name}</p>
                <p className="text-sm text-slate-500">{req.email}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Afdeling: {req.organization?.name}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Rol: {req.requestedRole}
                </p>
                <div className="mt-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                      req.status
                    )}`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
              {req.status === "PENDING" && (
                <HandleUserRequestButtons requestId={req.id} />
              )}
            </div>
          ))
        )}
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
