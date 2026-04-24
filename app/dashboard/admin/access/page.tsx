import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import ManageOrgAccessForm from "@/components/ManageOrgAccessForm";

export default async function AccessPage() {
  await requireAdmin();

  const [orgAdmins, organizations] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "ORG_ADMIN",
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        organizationAccesses: {
          select: {
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          Beheerrechten
        </h2>
        <p className="mt-2 text-slate-600">
          Koppel hier extra afdelingen aan ORG_ADMIN gebruikers.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          ORG_ADMIN overzicht
        </h3>

        {orgAdmins.length === 0 ? (
          <p className="text-sm text-slate-600">
            Er zijn nog geen ORG_ADMIN gebruikers.
          </p>
        ) : (
          <div className="space-y-4">
            {orgAdmins.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Primaire afdeling: {user.organization?.name ?? "Geen"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                      ORG_ADMIN
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {user.organizationAccesses.length} beheerrecht(en)
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Huidige beheerrechten
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {user.organizationAccesses.length === 0 ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-600">
                        Geen extra afdelingen gekoppeld
                      </span>
                    ) : (
                      user.organizationAccesses.map((access) => (
                        <span
                          key={access.organization.id}
                          className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700"
                        >
                          {access.organization.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <details className="mt-4 rounded-xl border border-slate-200 bg-white">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-700 [&::-webkit-details-marker]:hidden">
                    Beheer rechten…
                  </summary>

                  <div className="border-t border-slate-200 p-4">
                    <ManageOrgAccessForm
                      userId={user.id}
                      organizations={organizations}
                      currentAccesses={user.organizationAccesses.map(
                        (access) => ({
                          organizationId: access.organizationId,
                        })
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
