import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r border-slate-200 bg-white p-6">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-slate-900">
              Nachtnet Admin
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {user.name} · {user.role}
            </p>
          </div>

          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/routes"
              className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Routes
            </Link>

            <Link
              href="/dashboard/releases"
              className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Releases
            </Link>

            <Link
              href="/dashboard/auditlog"
              className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Auditlog
            </Link>

            {user.role === "ADMIN" ? (
              <Link
                href="/dashboard/admin/users"
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Gebruikers
              </Link>
            ) : null}
          </nav>

          <form action="/api/auth/logout" method="POST" className="mt-8">
            <button
              type="submit"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Uitloggen
            </button>
          </form>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
