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

    const updated = await prisma.manifestEntry.update({
      where: { id: entryId },
      data: {
        isPublished,
        activeFrom,
        activeUntil,
        priority,
        notes,
      },
    });

    await writeAuditLog({
      action: "PUBLICATION_UPDATED",
      entity: "manifestEntry",
      entityId: updated.id,
      metadata: {
        isPublished: updated.isPublished,
        activeFrom: updated.activeFrom,
        activeUntil: updated.activeUntil,
        priority: updated.priority,
        notes: updated.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Bijwerken van publicatie mislukt." },
      { status: 500 }
    );
  }
}
