import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

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

                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                    ORG_ADMIN
                  </span>
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
                    <div className="space-y-3">
                      {organizations.map((organization) => {
                        const hasAccess = user.organizationAccesses.some(
                          (access) =>
                            access.organizationId === organization.id
                        );

                        return (
                          <form
                            key={organization.id}
                            action={`/api/admin/user-access`}
                            method="POST"
                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {organization.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {hasAccess
                                  ? "Extra beheer actief"
                                  : "Nog niet gekoppeld"}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                              />
                              <input
                                type="hidden"
                                name="organizationId"
                                value={organization.id}
                              />

                              {hasAccess ? (
                                <AccessRemoveButton
                                  userId={user.id}
                                  organizationId={organization.id}
                                />
                              ) : (
                                <button
                                  type="submit"
                                  formAction="/api/admin/user-access"
                                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                                >
                                  Koppelen
                                </button>
                              )}
                            </div>
                          </form>
                        );
                      })}
                    </div>
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

function AccessRemoveButton({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) {
  return (
    <form
      action="/api/admin/user-access"
      method="POST"
      onSubmit={(event) => {
        event.preventDefault();

        fetch("/api/admin/user-access", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            organizationId,
          }),
        }).then(() => {
          window.location.reload();
        });
      }}
    >
      <button
        type="submit"
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Ontkoppelen
      </button>
    </form>
  );
}
