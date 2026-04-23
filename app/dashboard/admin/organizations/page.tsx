import { prisma } from "@/lib/db";
import { requireAdminOrOrgAdmin } from "@/lib/auth";
import CreateOrganizationForm from "@/components/CreateOrganizationForm";
import EditOrganizationForm from "@/components/EditOrganizationForm";
import DeleteOrganizationButton from "@/components/DeleteOrganizationButton";

export default async function OrganizationsPage() {
  const currentUser = await requireAdminOrOrgAdmin();

  const organizations = await prisma.organization.findMany({
    where:
      currentUser.role === "ADMIN"
        ? {}
        : {
            id: {
              in: currentUser.organizationAccessIds,
            },
          },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          users: true,
          accesses: true,
        },
      },
      accesses: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
                    <p className="mt-1 text-xs text-slate-500">
                      {organization._count.accesses} ORG_ADMIN(s)
                    </p>
                  
                    <div className="mt-3 flex flex-wrap gap-2">
                      {organization.accesses.length === 0 ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                          Geen ORG_ADMIN gekoppeld
                        </span>
                      ) : (
                        organization.accesses.map((access) => (
                          <span
                            key={access.user.id}
                            className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
                          >
                            {access.user.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {currentUser.role === "ADMIN" ? (
                    <DeleteOrganizationButton
                      organizationId={organization.id}
                      organizationName={organization.name}
                    />
                  ) : null}
                </div>

                {currentUser.role === "ADMIN" ? (
                  <EditOrganizationForm
                    organizationId={organization.id}
                    initialName={organization.name}
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {currentUser.role === "ADMIN" ? (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Nieuwe afdeling aanmaken
          </h3>
      
          <CreateOrganizationForm />
        </section>
      ) : null}
    </div>
  );
}
