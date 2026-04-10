import Link from "next/link";

export default function RoutesPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Routes</h2>
            <p className="mt-2 text-slate-600">
              Beheer hier de routes en upload GPX-bestanden.
            </p>
          </div>

          <Link
            href="/dashboard/routes/new"
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Nieuwe route
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-slate-600">Routes overzicht werkt.</p>
      </section>
    </div>
  );
}
