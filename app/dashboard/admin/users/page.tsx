import { prisma } from "@/lib/db";
import { requireAdminOrOrgAdmin } from "@/lib/auth";
import CreateUserForm from "@/components/CreateUserForm";
import EditUserForm from "@/components/EditUserForm";
import ChangeUserPasswordForm from "@/components/ChangeUserPasswordForm";
import UserActivationButton from "@/components/UserActivationButton";
import DeleteUserButton from "@/components/DeleteUserButton";
import UserAccordion from "@/components/UserAccordion";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusBadge, { roleBadgeVariant } from "@/components/StatusBadge";

const PAGE_SIZE = 20;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const currentUser = await requireAdminOrOrgAdmin();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const q = (params.q ?? "").trim();

  const roleWhere =
    currentUser.role === "ADMIN"
      ? {}
      : { organizationId: { in: currentUser.organizationAccessIds } };

  const searchWhere = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const userWhere = { AND: [roleWhere, searchWhere] };

  const [users, totalUserCount, organizations] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        organizationId: true,
        organization: { select: { id: true, name: true } },
        organizationAccesses: {
          select: { organization: { select: { id: true, name: true } } },
        },
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.user.count({ where: userWhere }),
    currentUser.role === "ADMIN"
      ? prisma.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : prisma.organization.findMany({
          where: { id: { in: currentUser.organizationAccessIds } },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
  ]);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/dashboard/admin/users${qs ? `?${qs}` : ""}`;
  }

  const totalPages = Math.max(1, Math.ceil(totalUserCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gebruikersbeheer"
        subtitle="Beheer hier gebruikersaccounts. Details en beheeracties staan per gebruiker onder Aanpassen."
      />

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <form className="flex gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Zoek op naam of e-mailadres"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-ret-red"
          />
          <button
            type="submit"
            className="rounded-xl bg-ret-red px-4 py-3 text-sm font-medium text-white hover:bg-ret-red-dark"
          >
            Zoeken
          </button>
          {q && (
            <a
              href="/dashboard/admin/users"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Wissen
            </a>
          )}
        </form>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Bestaande gebruikers</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {totalUserCount} gebruiker(s){q ? ` voor "${q}"` : ""}
          </span>
        </div>

        {users.length === 0 ? (
          <EmptyState
            title={q ? `Geen gebruikers gevonden voor "${q}"` : "Er zijn nog geen gebruikers aangemaakt"}
          />
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
                    <p className="mt-1 text-xs text-slate-500">
                      Extra beheer:{" "}
                      {user.organizationAccesses.length === 0
                        ? "Geen"
                        : user.organizationAccesses.length > 3
                        ? `${user.organizationAccesses.length} afdelingen`
                        : user.organizationAccesses.map((a) => a.organization.name).join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Aangemaakt: {new Date(user.createdAt).toLocaleString("nl-NL")}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Laatste login:{" "}
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString("nl-NL")
                        : "Nooit"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge label={user.role} variant={roleBadgeVariant(user.role)} />
                    <StatusBadge
                      label={user.isActive ? "Actief" : "Gedeactiveerd"}
                      variant={user.isActive ? "green" : "red"}
                    />
                  </div>
                </div>

                <UserAccordion>
                  <div className="px-4 pt-4 pb-2 flex flex-wrap gap-3">
                    <UserActivationButton
                      userId={user.id}
                      userName={user.name}
                      isActive={user.isActive}
                    />
                    {currentUser.role === "ADMIN" ? (
                      <DeleteUserButton userId={user.id} userName={user.name} />
                    ) : null}
                  </div>
                  <div className="border-t border-slate-200 p-4">
                    <EditUserForm
                      userId={user.id}
                      initialName={user.name}
                      initialEmail={user.email}
                      initialRole={user.role}
                      initialOrganizationId={user.organizationId}
                      organizations={organizations}
                      canEditRole={currentUser.role === "ADMIN"}
                      canEditOrganization={currentUser.role === "ADMIN"}
                    />
                    <div className="mt-4">
                      <ChangeUserPasswordForm userId={user.id} userName={user.name} />
                    </div>
                  </div>
                </UserAccordion>
              </div>
            ))}
          </div>
        )}

        {totalUserCount > PAGE_SIZE && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
            <span className="text-slate-500">
              {totalUserCount} gebruikers · pagina {safePage} van {totalPages}
            </span>
            <div className="flex gap-2">
              {safePage > 1 && (
                <a
                  href={pageUrl(safePage - 1)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
                >
                  Vorige
                </a>
              )}
              {safePage < totalPages && (
                <a
                  href={pageUrl(safePage + 1)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
                >
                  Volgende
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {currentUser.role === "ADMIN" ? (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Nieuwe gebruiker aanmaken</h3>
          <CreateUserForm organizations={organizations} />
        </section>
      ) : null}
    </div>
  );
}
