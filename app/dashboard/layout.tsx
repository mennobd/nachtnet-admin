import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Nachtnet Admin Portal
            </h1>
            <p className="text-sm text-slate-500">
              Beheeromgeving voor routes en publicaties
            </p>
          </div>

          <form action="/api/auth/logout" method="POST">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>
                  Aangemeld als{" "}
                 <span className="font-medium">{session.email}</span>
               </span>

               <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
                >
                  Uitloggen
                </button>
              </div>
           </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-12 rounded-2xl bg-white p-4 shadow-sm lg:col-span-3">
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="block rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/routes"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Routes
            </Link>

            <Link
              href="/dashboard/releases"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Releases
            </Link>

            <Link
              href="/dashboard/audit"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Auditlog
            </Link>
          </nav>
        </aside>

        <main className="col-span-12 lg:col-span-9">{children}</main>
      </div>
    </div>
  );
}