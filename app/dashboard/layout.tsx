import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  async function getNavItems() {
    const baseItems = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/routes", label: "Routes" },
      { href: "/dashboard/releases", label: "Releases" },
      { href: "/dashboard/auditlog", label: "Auditlog" },
    ];

    if (user.role === "ADMIN" || user.role === "ORG_ADMIN") {
        baseItems.push(
          {
            href: "/dashboard/admin/users",
            label: "Gebruikers",
          },
          {
            href: "/dashboard/admin/organizations",
            label: "Afdelingen",
          }
        );
      }
      
      if (user.role === "ADMIN") {
        baseItems.push({
          href: "/dashboard/admin/access",
          label: "Beheerrechten",
        });
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

          <div className="px-4 pb-6">
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

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
