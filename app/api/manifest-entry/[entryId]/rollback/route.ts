import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { getRequiredMutationUser } from "@/lib/auth";
import { validateManifestEntryForPublish } from "@/lib/release-validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const user = await getRequiredMutationUser();

  if (!user) {
    return NextResponse.json(
      { error: "Geen rechten voor deze actie." },
      { status: 403 }
    );
  }

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
        priority: 1,
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
        version: rolledBackEntry.version,
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
