import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;

  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      files: {
        orderBy: { createdAt: "desc" },
      },
      manifestEntries: {
        include: {
          file: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!route) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          {route.title}
        </h2>
        <p className="mt-2 text-slate-600">{route.routeCode}</p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="space-y-2 text-sm text-slate-600">
          <p>Lijnnummer: {route.lineNumber}</p>
          <p>Richting: {route.direction}</p>
          <p>Vestiging: {route.depot}</p>
          <p>Status: {route.status}</p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Link
            href={`/dashboard/routes/${route.id}/publish`}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Publiceren
          </Link>

          <Link
            href={`/dashboard/routes/${route.id}/upload`}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          >
            Upload GPX
          </Link>
        </div>
      </section>
    </div>
  );
}
