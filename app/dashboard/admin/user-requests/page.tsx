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
                <p className="text-xs text-slate-400 mt-1">
                  Status: {req.status}
                </p>
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
