import "server-only";

import { prisma } from "@/lib/db";

export type InvalidConceptRelease = {
  entryId: string;
  routeId: string;
  routeTitle: string;
  routeCode: string;
  version: string;
  fileName: string | null;
  errors: string[];
};

export async function getInvalidConceptReleases(): Promise<InvalidConceptRelease[]> {
  const entries = await prisma.manifestEntry.findMany({
    where: {
      isPublished: false,
    },
    include: {
      route: true,
      file: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const result: InvalidConceptRelease[] = [];

  for (const entry of entries) {
    const errors: string[] = [];

    if (!entry.route) {
      errors.push("Geen route gekoppeld.");
    }

    if (!entry.file) {
      errors.push("Geen bestand gekoppeld.");
    }

    if (entry.route) {
      if (!entry.route.routeCode?.trim()) {
        errors.push("Routecode ontbreekt.");
      }

      if (!entry.route.title?.trim()) {
        errors.push("Titel ontbreekt.");
      }

      if (!entry.route.lineNumber?.trim()) {
        errors.push("Lijnnummer ontbreekt.");
      }

      if (!entry.route.direction?.trim()) {
        errors.push("Richting ontbreekt.");
      }

      if (!entry.route.depot?.trim()) {
        errors.push("Vestiging/depot ontbreekt.");
      }
    }

    if (entry.file) {
      if (!entry.file.fileName?.trim()) {
        errors.push("Bestandsnaam ontbreekt.");
      }

      if (!entry.file.checksum?.trim()) {
        errors.push("Checksum ontbreekt.");
      }
    }

    if (
      entry.activeFrom &&
      entry.activeUntil &&
      entry.activeUntil.getTime() < entry.activeFrom.getTime()
    ) {
      errors.push("Einddatum ligt vóór de begindatum.");
    }

    if (errors.length > 0) {
      result.push({
        entryId: entry.id,
        routeId: entry.routeId,
        routeTitle: entry.route?.title ?? "Onbekende route",
        routeCode: entry.route?.routeCode ?? "Onbekende routecode",
        version: entry.version,
        fileName: entry.file?.fileName ?? null,
        errors,
      });
    }
  }

  return result;
}
