import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await params;

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

    if (!targetEntry.file) {
      return NextResponse.json(
        { error: "Rollback niet mogelijk: release heeft geen gekoppeld bestand." },
        { status: 400 }
      );
    }

    if (
      !targetEntry.route ||
      !targetEntry.route.routeCode ||
      !targetEntry.route.title ||
      !targetEntry.route.lineNumber ||
      !targetEntry.route.direction ||
      !targetEntry.route.depot
    ) {
      return NextResponse.json(
        {
          error:
            "Rollback niet mogelijk: de gekoppelde route is niet volledig ingevuld.",
        },
        { status: 400 }
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
