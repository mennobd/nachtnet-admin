import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import CreateUserForm from "@/components/CreateUserForm";
import EditUserForm from "@/components/EditUserForm";
import ChangeUserPasswordForm from "@/components/ChangeUserPasswordForm";
import UserActivationButton from "@/components/UserActivationButton";
import DeleteUserButton from "@/components/DeleteUserButton";

export default async function UsersPage() {
  await requireAdmin();

  const [users, organizations] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
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
          Gebruikersbeheer
        </h2>
        <p className="mt-2 text-slate-600">
          Beheer hier accounts, rollen, afdelingen, activatie en wachtwoorden.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Bestaande gebruikers
          </h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {users.length} gebruiker(s)
          </span>
        </div>

        {users.length === 0 ? (
          <p className="text-sm text-slate-600">
            Er zijn nog geen gebruikers aangemaakt.
          </p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Afdeling: {user.organization?.name ?? "Geen afdeling"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Aangemaakt op{" "}
                      {new Date(user.createdAt).toLocaleString("nl-NL")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "EDITOR"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {user.role}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.isActive ? "Actief" : "Gedeactiveerd"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <UserActivationButton
                    userId={user.id}
                    userName={user.name}
                    isActive={user.isActive}
                  />

                  <DeleteUserButton
                    userId={user.id}
                    userName={user.name}
                  />
                </div>

                <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-700 [&::-webkit-details-marker]:hidden">
                    Aanpassen…
                  </summary>
                
                  <div className="border-t border-slate-200 p-4">
                    <EditUserForm
                      userId={user.id}
                      initialName={user.name}
                      initialEmail={user.email}
                      initialRole={user.role}
                      initialOrganizationId={user.organizationId}
                      organizations={organizations}
                    />
                
                    <div className="mt-4">
                      <ChangeUserPasswordForm
                        userId={user.id}
                        userName={user.name}
                      />
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Nieuwe gebruiker aanmaken
        </h3>
        <CreateUserForm organizations={organizations} />
      </section>
    </div>
  );
}
