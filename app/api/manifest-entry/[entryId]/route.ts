import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await params;
    const body = await request.json();

    const isPublished =
      typeof body.isPublished === "boolean" ? body.isPublished : false;

    const activeFrom =
      body.activeFrom && String(body.activeFrom).trim() !== ""
        ? new Date(body.activeFrom)
        : null;

    const activeUntil =
      body.activeUntil && String(body.activeUntil).trim() !== ""
        ? new Date(body.activeUntil)
        : null;

    const priority =
      body.priority !== undefined && body.priority !== null
        ? Number(body.priority)
        : 100;

    const notes =
      body.notes && String(body.notes).trim() !== ""
        ? String(body.notes).trim()
        : null;

    if (Number.isNaN(priority)) {
      return NextResponse.json(
        { error: "Prioriteit is ongeldig." },
        { status: 400 }
      );
    }

    if (activeFrom && Number.isNaN(activeFrom.getTime())) {
      return NextResponse.json(
        { error: "Begindatum is ongeldig." },
        { status: 400 }
      );
    }

    if (activeUntil && Number.isNaN(activeUntil.getTime())) {
      return NextResponse.json(
        { error: "Einddatum is ongeldig." },
        { status: 400 }
      );
    }

    if (activeFrom && activeUntil && activeUntil < activeFrom) {
      return NextResponse.json(
        { error: "Einddatum mag niet vóór de begindatum liggen." },
        { status: 400 }
      );
    }

    const existingEntry = await prisma.manifestEntry.findUnique({
      where: { id: entryId },
      include: {
        route: true,
        file: true,
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Publicatie niet gevonden." },
        { status: 404 }
      );
    }

    if (isPublished) {
      if (!existingEntry.file) {
        return NextResponse.json(
          { error: "Deze publicatie heeft geen gekoppeld bestand en kan niet live." },
          { status: 400 }
        );
      }

      if (!existingEntry.route) {
        return NextResponse.json(
          { error: "Deze publicatie heeft geen gekoppelde route en kan niet live." },
          { status: 400 }
        );
      }

      if (
        !existingEntry.route.routeCode ||
        !existingEntry.route.title ||
        !existingEntry.route.lineNumber ||
        !existingEntry.route.direction ||
        !existingEntry.route.depot
      ) {
        return NextResponse.json(
          {
            error:
              "De route is niet volledig ingevuld. Controleer routecode, titel, lijnnummer, richting en vestiging.",
          },
          { status: 400 }
        );
      }

      await prisma.manifestEntry.updateMany({
        where: {
          routeId: existingEntry.routeId,
          NOT: {
            id: entryId,
          },
        },
        data: {
          isPublished: false,
        },
      });
    }

    const updated = await prisma.manifestEntry.update({
      where: { id: entryId },
      data: {
        isPublished,
        activeFrom,
        activeUntil,
        priority,
        notes,
      },
      include: {
        route: true,
        file: true,
      },
    });

    await writeAuditLog({
      action: "PUBLICATION_UPDATED",
      entity: "manifestEntry",
      entityId: updated.id,
      metadata: {
        routeId: updated.routeId,
        routeCode: updated.route?.routeCode ?? null,
        fileName: updated.file?.fileName ?? null,
        version: updated.version,
        isPublished: updated.isPublished,
        activeFrom: updated.activeFrom,
        activeUntil: updated.activeUntil,
        priority: updated.priority,
        notes: updated.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUBLICATION PATCH ERROR:", error);

    return NextResponse.json(
      { error: "Bijwerken van publicatie mislukt." },
      { status: 500 }
    );
  }
}
