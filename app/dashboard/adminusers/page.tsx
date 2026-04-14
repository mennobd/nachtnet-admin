import { prisma } from "@/lib/db";
import CreateUserForm from "@/components/CreateUserForm";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          Gebruikersbeheer
        </h2>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex justify-between border-b pb-2 text-sm"
            >
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-slate-500">{user.email}</p>
              </div>
              <p className="text-slate-600">{user.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <CreateUserForm />
      </section>
    </div>
  );
}
