import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiMutationUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { validateManifestEntryForPublish } from "@/lib/release-validation";

function getPriorityForCategory(category: string | null | undefined) {
  switch (category) {
    case "CALAMITEIT":
      return 10;
    case "OMLEIDING":
      return 50;
    default:
      return 100;
  }
}

export async function POST(request: Request) {
  const auth = await apiMutationUser();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  try {
    const body = await request.json();
    const entryIds: unknown[] = Array.isArray(body.entryIds) ? body.entryIds : [];

    if (entryIds.length === 0) {
      return NextResponse.json(
        { error: "Er zijn geen releases geselecteerd." },
        { status: 400 }
      );
    }

    const entries = await prisma.manifestEntry.findMany({
      where: {
        id: { in: entryIds.map(String) },
      },
      include: {
        route: true,
        file: true,
      },
    });

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Geen geldige releases gevonden." },
        { status: 404 }
      );
    }

    // Reject already-published entries
    const alreadyPublished = entries.filter((e) => e.isPublished);
    if (alreadyPublished.length > 0) {
      return NextResponse.json(
        {
          error: "Eén of meer geselecteerde releases zijn al gepubliceerd.",
          conflictingEntryIds: alreadyPublished.map((e) => e.id),
        },
        { status: 400 }
      );
    }

    // Reject when multiple entries target the same route
    const routeIdCounts = new Map<string, string[]>();
    for (const entry of entries) {
      const ids = routeIdCounts.get(entry.routeId) ?? [];
      ids.push(entry.id);
      routeIdCounts.set(entry.routeId, ids);
    }
    const conflictingRouteIds = Array.from(routeIdCounts.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([routeId]) => routeId);

    if (conflictingRouteIds.length > 0) {
      return NextResponse.json(
        {
          error:
            "De selectie bevat meerdere releases voor dezelfde route. Selecteer per route maximaal één release.",
          conflictingRouteIds,
        },
        { status: 400 }
      );
    }

    // Validate each entry
    const validationFailures: Array<{ entryId: string; errors: string[] }> = [];
    for (const entry of entries) {
      const result = await validateManifestEntryForPublish(entry.id);
      if (!result.valid) {
        validationFailures.push({ entryId: entry.id, errors: result.errors });
      }
    }

    if (validationFailures.length > 0) {
      return NextResponse.json(
        {
          error: "Eén of meer releases zijn niet klaar voor publicatie.",
          validationFailures,
        },
        { status: 400 }
      );
    }

    const publishedIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const entry of entries) {
        await tx.manifestEntry.updateMany({
          where: { routeId: entry.routeId, isPublished: true },
          data: { isPublished: false },
        });

        const category = entry.file?.category ?? "REGULIER";

        await tx.manifestEntry.update({
          where: { id: entry.id },
          data: {
            isPublished: true,
            activeFrom: entry.activeFrom ?? new Date(),
            activeUntil: entry.activeUntil ?? null,
            priority: getPriorityForCategory(category),
          },
        });

        publishedIds.push(entry.id);
      }
    });

    await writeAuditLog({
      action: "RELEASES_BULK_PUBLISHED",
      entity: "manifestEntry",
      entityId: publishedIds.join(","),
      metadata: {
        entryIds: publishedIds,
        count: publishedIds.length,
        performedBy: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      publishedCount: publishedIds.length,
      entryIds: publishedIds,
    });
  } catch (error) {
    console.error("BULK PUBLISH ERROR:", error);

    return NextResponse.json(
      { error: "Bulk publiceren mislukt." },
      { status: 500 }
    );
  }
}
