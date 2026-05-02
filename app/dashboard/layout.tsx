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

  async function getNavItems() {
    const pendingRequestCount =
      user.role === "ADMIN"
        ? await prisma.userApprovalRequest.count({
            where: {
              status: "PENDING",
            },
          })
        : 0;
  
    const baseItems = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/routes", label: "Routes" },
      { href: "/dashboard/releases", label: "Releases" },
      { href: "/dashboard/auditlog", label: "Auditlog" },
    ];
    if (user.role !== "VIEWER") {
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
        label: "Gebruiker aanvragen",
      });
    }
  
    if (user.role === "ADMIN") {
      baseItems.push(
        {
          href: "/dashboard/admin/user-requests",
          label:
            pendingRequestCount > 0
              ? `Aanvragen (${pendingRequestCount})`
              : "Aanvragen",
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

  const navItems = await getNavItems();

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
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {user.name}
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
