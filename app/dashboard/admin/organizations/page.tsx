import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import CreateOrganizationForm from "@/components/CreateOrganizationForm";
import EditOrganizationForm from "@/components/EditOrganizationForm";
import DeleteOrganizationButton from "@/components/DeleteOrganizationButton";

export default async function OrganizationsPage() {
  await requireAdmin();

  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          Afdelingen
        </h2>
        <p className="mt-2 text-slate-600">
          Beheer hier hoofdaccounts/afdelingen waar gebruikers onder vallen.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Bestaande afdelingen
        </h3>

        {organizations.length === 0 ? (
          <p className="text-sm text-slate-600">
            Er zijn nog geen afdelingen aangemaakt.
          </p>
        ) : (
          <div className="space-y-4">
            {organizations.map((organization) => (
              <div key={organization.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {organization.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {organization._count.users} gebruiker(s)
                    </p>
                  </div>

                  <DeleteOrganizationButton
                    organizationId={organization.id}
                    organizationName={organization.name}
                  />
                </div>

                <EditOrganizationForm
                  organizationId={organization.id}
                  initialName={organization.name}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Nieuwe afdeling aanmaken
        </h3>

        <CreateOrganizationForm />
      </section>
    </div>
  );
}
