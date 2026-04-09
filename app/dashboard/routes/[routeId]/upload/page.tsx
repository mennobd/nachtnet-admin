import { notFound } from "next/navigation";
import UploadRouteFileForm from "@/components/UploadRouteFileForm";

type RouteDetail = {
  id: string;
  routeCode: string;
  title: string;
  lineNumber: string;
  direction: string;
  depot: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

async function getRoute(routeId: string): Promise<RouteDetail | null> {
  const appBaseUrl = process.env.APP_BASE_URL;

  if (!appBaseUrl) {
    throw new Error("APP_BASE_URL ontbreekt in de environment variables.");
  }

  const response = await fetch(`${appBaseUrl}/api/routes`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Kon routes niet ophalen.");
  }

  const routes: RouteDetail[] = await response.json();
  return routes.find((route) => route.id === routeId) ?? null;
}

export default async function UploadRoutePage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;
  const route = await getRoute(routeId);

  if (!route) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          Upload GPX-bestand
        </h2>
        <p className="mt-2 text-slate-600">
          Route <strong>{route.title}</strong> ({route.routeCode})
        </p>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <UploadRouteFileForm routeId={route.id} />
      </section>
    </div>
  );
}
