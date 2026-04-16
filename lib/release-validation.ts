import "server-only";

import { prisma } from "@/lib/db";

export type ReleaseValidationResult = {
  valid: boolean;
  errors: string[];
};

export async function validateManifestEntryForPublish(
  entryId: string
): Promise<ReleaseValidationResult> {
  const entry = await prisma.manifestEntry.findUnique({
    where: { id: entryId },
    include: {
      route: true,
      file: true,
    },
  });

  const errors: string[] = [];

  if (!entry) {
    return {
      valid: false,
      errors: ["De geselecteerde release bestaat niet."],
    };
  }

  if (!entry.route) {
    errors.push("Er is geen route gekoppeld aan deze release.");
  }

  if (!entry.file) {
    errors.push("Er is geen bestand gekoppeld aan deze release.");
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

  return {
    valid: errors.length === 0,
    errors,
  };
}
