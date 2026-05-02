import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import SessionTimeout from "@/components/SessionTimeout";
import { ToastProvider } from "@/components/Toast";

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
      ? prisma.organization
          .findUnique({ where: { id: user.organizationId }, select: { name: true } })
          .then((o) => o?.name ?? null)
      : Promise.resolve(null),
  ]);

  function getNavItems() {
    const baseItems = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/routes", label: "Routes" },
      { href: "/dashboard/releases", label: "Releases" },
      { href: "/dashboard/auditlog", label: "Auditlog" },
      {
        href: "/dashboard/notifications",
        label:
          unreadNotificationCount > 0
            ? `Meldingen (${unreadNotificationCount})`
            : "Meldingen",
      },
    ];

    if (user.role !== "VIEWER" || userOrgName === "AFD-NaCo") {
      baseItems.push({ href: "/dashboard/admin/system-messages", label: "Push berichten" });
    }

    if (user.role === "ADMIN" || user.role === "ORG_ADMIN") {
      baseItems.push({ href: "/dashboard/admin/users", label: "Gebruikers" });
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
        { href: "/dashboard/admin/organizations", label: "Afdelingen" },
        { href: "/dashboard/admin/access", label: "Beheerrechten" }
      );
    }

    return baseItems;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar
        navItems={getNavItems()}
        userName={user.name}
        unreadCount={unreadNotificationCount}
      />

      {/* pt-14 offsets the fixed top bar on mobile/tablet; removed on lg */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        <ToastProvider>
          <SessionTimeout />
          {children}
        </ToastProvider>
      </main>
    </div>
  );
}
