import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-3xl font-semibold text-slate-900">Dashboard</h2>
        <p className="mt-2 text-slate-600">
          Welkom in het beheerportaal. Vanuit hier beheren we straks routes,
          bestanden, releases en manifestpublicaties.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Live release</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">Nog leeg</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Actieve routes</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">0</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Laatste publicatie
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            Nog geen
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Status</h3>
        <p className="mt-2 text-slate-600">
          De basis van het adminportaal staat. De volgende functionele bouwslag
          is het toevoegen van routebeheer met databasekoppeling.
        </p>
      </section>
    </div>
  );
}
