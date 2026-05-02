import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireMutationUser } from "@/lib/auth";
import EditRouteForm from "@/components/EditRouteForm";

export default async function EditRoutePage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  await requireMutationUser();
  const { routeId } = await params;

  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (!route) notFound();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Route bewerken</h2>
            <p className="mt-1 text-sm text-slate-500">{route.routeCode}</p>
          </div>
          <Link
            href={`/dashboard/routes/${routeId}`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Terug
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <EditRouteForm
          routeId={route.id}
          initialTitle={route.title}
          initialLineNumber={route.lineNumber}
          initialDirection={route.direction}
          initialDepot={route.depot}
          initialNotes={route.notes}
          initialCategory={route.category}
          initialStatus={route.status}
        />
      </section>
    </div>
  );
}
