import CreateRouteForm from "@/components/CreateRouteForm";

export default function NewRoutePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Nieuwe route</h2>
        <p className="mt-2 text-slate-600">
          Maak een nieuwe route aan in het beheerportaal.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <CreateRouteForm />
      </section>
    </div>
  );
}
