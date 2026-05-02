import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SidebarSearch from "@/components/SidebarSearch";
import SessionTimeout from "@/components/SessionTimeout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const [pendingRequestCount, pendingChangeRequestCount, unreadNotificationCount, userOrgName] = await Promise.all([
    user.role === "ADMIN"
      ? prisma.userApprovalRequest.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
    user.role === "ORG_ADMIN"
      ? prisma.accountChangeRequest.count({
          where: {
            status: "PENDING",
            user: {
              organizationId: { in: user.organizationAccessIds },
              role: { in: ["EDITOR", "VIEWER"] },
            },
          },
        })
      : user.role === "ADMIN"
      ? prisma.accountChangeRequest.count({
          where: { status: "PENDING", user: { role: "ORG_ADMIN" } },
        })
      : Promise.resolve(0),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    user.organizationId
      ? prisma.organization.findUnique({
          where: { id: user.organizationId },
          select: { name: true },
        }).then((o) => o?.name ?? null)
      : Promise.resolve(null),
  ]);

  function getNavItems() {

    const baseItems = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/routes", label: "Routes" },
      { href: "/dashboard/releases", label: "Releases" },
      { href: "/dashboard/auditlog", label: "Auditlog" },
    ];
    if (user.role !== "VIEWER" || userOrgName === "AFD-NaCo") {
      baseItems.push({
        href: "/dashboard/admin/system-messages",
        label: "Push berichten",
      });
    }
    if (user.role === "ADMIN" || user.role === "ORG_ADMIN") {
      baseItems.push({
        href: "/dashboard/admin/users",
        label: "Gebruikers",
      });
    }

    if (user.role === "ORG_ADMIN") {
      baseItems.push({
        href: "/dashboard/org-admin/requests",
        label:
          pendingChangeRequestCount > 0
            ? `Aanvragen (${pendingChangeRequestCount})`
            : "Aanvragen",
      });
    }

    if (user.role === "ADMIN") {
      baseItems.push(
        {
          href: "/dashboard/admin/user-requests",
          label: (() => {
            const total = pendingRequestCount + pendingChangeRequestCount;
            return total > 0 ? `Aanvragen (${total})` : "Aanvragen";
          })(),
        },
        {
          href: "/dashboard/admin/organizations",
          label: "Afdelingen",
        },
        {
          href: "/dashboard/admin/access",
          label: "Beheerrechten",
        }
      );
    }

    return baseItems;
  }

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-6">
            <div className="mb-4">
              <Image
                src="/bannerlogo.png"
                alt="RET"
                width={220}
                height={70}
                priority
                className="h-auto w-auto max-w-full"
              />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                RET Routebeheer
              </h1>
            </div>
          </div>

          <nav className="px-4 py-6">
            <SidebarSearch />
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="px-4 pb-6 space-y-2">
            <Link
              href="/dashboard/account"
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <span>{user.name}</span>
              {unreadNotificationCount > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              )}
            </Link>
            <form action="/logout" method="POST">
              <button
                type="submit"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Uitloggen
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-8">
          <SessionTimeout />
          {children}
        </main>
      </div>
    </div>
  );
}
