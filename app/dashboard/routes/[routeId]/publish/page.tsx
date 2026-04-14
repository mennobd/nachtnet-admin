import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function PublishRoutePage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;

  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: {
      id: true,
      title: true,
      routeCode: true,
    },
  });

  if (!route) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          Publiceren
        </h2>
        <p className="mt-2 text-slate-600">
          Route <strong>{route.title}</strong> ({route.routeCode})
        </p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-slate-600">Publicatiepagina werkt.</p>
      </section>
    </div>
  );
}
