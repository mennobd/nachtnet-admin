import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLogTx } from "@/lib/audit";
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const auth = await apiMutationUser();
  if (auth instanceof NextResponse) return auth;
  const mutationUser = auth;

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

    const notes =
      body.notes && String(body.notes).trim() !== ""
        ? String(body.notes).trim()
        : null;

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
      const validation = await validateManifestEntryForPublish(entryId);

      if (!validation.valid) {
        return NextResponse.json(
          {
            error: "Deze release kan niet live worden gezet.",
            validationErrors: validation.errors,
          },
          { status: 400 }
        );
      }
    }

    const category = existingEntry.file?.category ?? "REGULIER";
    const priority = getPriorityForCategory(category);

    const updated = await prisma.$transaction(async (tx) => {
      const entry = await tx.manifestEntry.update({
        where: { id: entryId },
        data: {
          isPublished,
          activeFrom,
          activeUntil,
          priority,
          type: category,
          notes,
        },
        include: {
          route: true,
          file: true,
        },
      });

      await writeAuditLogTx(tx, mutationUser.id, {
        action: "PUBLICATION_UPDATED",
        entity: "manifestEntry",
        entityId: entry.id,
        metadata: {
          routeId: entry.routeId,
          routeCode: entry.route?.routeCode ?? null,
          fileName: entry.file?.fileName ?? null,
          fileCategory: entry.file?.category ?? null,
          version: entry.version,
          isPublished: entry.isPublished,
          activeFrom: entry.activeFrom,
          activeUntil: entry.activeUntil,
          priority: entry.priority,
          type: entry.type,
          notes: entry.notes,
          performedBy: mutationUser.email,
        },
      });

      return entry;
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
