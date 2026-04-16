import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredMutationUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getRequiredMutationUser();

  if (!user) {
    return NextResponse.json(
      { error: "Geen rechten voor deze actie." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const entryIds = Array.isArray(body.entryIds) ? body.entryIds : [];

    if (entryIds.length === 0) {
      return NextResponse.json(
        { error: "Er zijn geen releases geselecteerd." },
        { status: 400 }
      );
    }

    const entries = await prisma.manifestEntry.findMany({
      where: {
        id: {
          in: entryIds,
        },
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

    const invalidEntries = entries.filter((entry) => {
      if (entry.isPublished) return true;
      if (!entry.file) return true;
      if (!entry.route) return true;

      return !(
        entry.route.routeCode &&
        entry.route.title &&
        entry.route.lineNumber &&
        entry.route.direction &&
        entry.route.depot
      );
    });

    if (invalidEntries.length > 0) {
      return NextResponse.json(
        {
          error:
            "Eén of meer geselecteerde releases zijn ongeldig of niet volledig ingevuld.",
          invalidEntryIds: invalidEntries.map((e) => e.id),
        },
        { status: 400 }
      );
    }

    const groupedByRoute = new Map<string, typeof entries>();

    for (const entry of entries) {
      const routeEntries = groupedByRoute.get(entry.routeId) ?? [];
      routeEntries.push(entry);
      groupedByRoute.set(entry.routeId, routeEntries);
    }

    const publishedIds: string[] = [];

    for (const [routeId, routeEntries] of groupedByRoute.entries()) {
      await prisma.manifestEntry.updateMany({
        where: {
          routeId,
        },
        data: {
          isPublished: false,
        },
      });

      for (const entry of routeEntries) {
        await prisma.manifestEntry.update({
          where: { id: entry.id },
          data: {
            isPublished: true,
            activeFrom: entry.activeFrom ?? new Date(),
            activeUntil: entry.activeUntil ?? null,
            priority: entry.priority ?? 1,
          },
        });

        publishedIds.push(entry.id);
      }
    }

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
