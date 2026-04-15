import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import CreateUserForm from "@/components/CreateUserForm";
import EditUserForm from "@/components/EditUserForm";

export default async function UsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          Gebruikersbeheer
        </h2>
        <p className="mt-2 text-slate-600">
          Beheer hier de accounts die routes en publicaties mogen beheren.
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
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <p className="mt-1 text-xs text-slate-400">
                Aangemaakt op {new Date(user.createdAt).toLocaleString("nl-NL")}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {user.role}
            </span>
          </div>

          <EditUserForm
            userId={user.id}
            initialName={user.name}
            initialEmail={user.email}
            initialRole={user.role}
          />
        </div>
      ))}
    </div>
  )}
</section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Nieuwe gebruiker aanmaken
        </h3>
        <CreateUserForm />
      </section>
    </div>
  );
}
