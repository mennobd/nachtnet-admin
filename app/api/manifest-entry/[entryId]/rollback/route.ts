import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { apiMutationUser } from "@/lib/auth";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const auth = await apiMutationUser();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  try {
    const { entryId } = await params;

    const validation = await validateManifestEntryForPublish(entryId);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Rollback niet mogelijk: release voldoet niet aan de validatie.",
          validationErrors: validation.errors,
        },
        { status: 400 }
      );
    }

    const targetEntry = await prisma.manifestEntry.findUnique({
      where: { id: entryId },
      include: {
        route: true,
        file: true,
      },
    });

    if (!targetEntry) {
      return NextResponse.json(
        { error: "Release niet gevonden." },
        { status: 404 }
      );
    }

    const category = targetEntry.file?.category ?? "REGULIER";
    const priority = getPriorityForCategory(category);

    await prisma.manifestEntry.updateMany({
      where: {
        routeId: targetEntry.routeId,
      },
      data: {
        isPublished: false,
      },
    });

    const rolledBackEntry = await prisma.manifestEntry.update({
      where: { id: entryId },
      data: {
        isPublished: true,
        activeFrom: new Date(),
        activeUntil: null,
        priority,
      },
      include: {
        route: true,
        file: true,
      },
    });

    await writeAuditLog({
      action: "RELEASE_ROLLBACK",
      entity: "manifestEntry",
      entityId: rolledBackEntry.id,
      metadata: {
        routeId: rolledBackEntry.routeId,
        routeCode: rolledBackEntry.route?.routeCode ?? null,
        fileName: rolledBackEntry.file?.fileName ?? null,
        fileCategory: category,
        version: rolledBackEntry.version,
        priority,
        performedBy: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Rollback uitgevoerd.",
      entry: rolledBackEntry,
    });
  } catch (error) {
    console.error("ROLLBACK ERROR:", error);

    return NextResponse.json(
      { error: "Rollback mislukt." },
      { status: 500 }
    );
  }
}
