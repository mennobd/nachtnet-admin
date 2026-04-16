import { prisma } from "@/lib/db";

export default async function ReleaseValidationPanel({
  entryId,
}: {
  entryId: string;
}) {
  const entry = await prisma.manifestEntry.findUnique({
    where: { id: entryId },
    include: {
      route: true,
      file: true,
    },
  });

  if (!entry) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Release niet gevonden.
      </div>
    );
  }

  const errors: string[] = [];

  if (!entry.route) errors.push("Geen route gekoppeld.");
  if (!entry.file) errors.push("Geen bestand gekoppeld.");

  if (entry.route) {
    if (!entry.route.routeCode?.trim()) errors.push("Routecode ontbreekt.");
    if (!entry.route.title?.trim()) errors.push("Titel ontbreekt.");
    if (!entry.route.lineNumber?.trim()) errors.push("Lijnnummer ontbreekt.");
    if (!entry.route.direction?.trim()) errors.push("Richting ontbreekt.");
    if (!entry.route.depot?.trim()) errors.push("Vestiging/depot ontbreekt.");
  }

  if (entry.file) {
    if (!entry.file.fileName?.trim()) errors.push("Bestandsnaam ontbreekt.");
    if (!entry.file.checksum?.trim()) errors.push("Checksum ontbreekt.");
  }

  if (
    entry.activeFrom &&
    entry.activeUntil &&
    entry.activeUntil.getTime() < entry.activeFrom.getTime()
  ) {
    errors.push("Einddatum ligt vóór de begindatum.");
  }

  if (errors.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        Deze release voldoet aan alle validaties voor livegang.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p className="font-medium">Deze release is nog niet klaar voor livegang.</p>
      <ul className="mt-2 list-disc pl-5">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
