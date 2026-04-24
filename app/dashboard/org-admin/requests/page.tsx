import { requireAdminOrOrgAdmin } from "@/lib/auth";
import CreateUserRequestForm from "@/components/CreateUserRequestForm";
import { prisma } from "@/lib/db";

export default async function UserRequestsPage() {
  const currentUser = await requireAdminOrOrgAdmin();

  if (currentUser.role !== "ORG_ADMIN") {
    return null;
  }

  const organizations = await prisma.organization.findMany({
    where: {
      id: {
        in: currentUser.organizationAccessIds,
      },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

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

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <CreateUserRequestForm organizations={organizations} />
      </section>
    </div>
  );
}
