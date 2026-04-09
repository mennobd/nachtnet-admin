import Link from "next/link";

type RouteItem = {
  id: string;
  routeCode: string;
  title: string;
  lineNumber: string;
  direction: string;
  depot: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

async function getRoutes(): Promise<RouteItem[]> {
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

  return response.json();
}

export default async function RoutesPage() {
  const routes = await getRoutes();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Routes</h2>
            <p className="mt-2 text-slate-600">
              Beheer hier de routes en upload per route de actuele GPX-bestanden.
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

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                Routecode
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                Titel
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                Lijn
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                Richting
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                Vestiging
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                Status
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                Acties
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {routes.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  Er zijn nog geen routes aangemaakt.
                </td>
              </tr>
            ) : (
              routes.map((route) => (
                <tr key={route.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {route.routeCode}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {route.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {route.lineNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {route.direction}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {route.depot}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {route.status}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <Link
                      href={`/dashboard/routes/${route.id}/upload`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Upload GPX
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
