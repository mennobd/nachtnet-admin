import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import HandleUserRequestButtons from "@/components/HandleUserRequestButtons";
import UserRequestList from "@/components/UserRequestList";

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
