import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentUser, getRequiredMutationUser } from "@/lib/auth";
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
  const mutationUser = await getRequiredMutationUser();

  if (!mutationUser) {
    return NextResponse.json(
      { error: "Geen rechten voor deze actie." },
      { status: 403 }
    );
  }

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

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Niet ingelogd." },
        { status: 401 }
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

    const updated = await prisma.manifestEntry.update({
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

    await writeAuditLog({
      action: "PUBLICATION_UPDATED",
      entity: "manifestEntry",
      entityId: updated.id,
      metadata: {
        routeId: updated.routeId,
        routeCode: updated.route?.routeCode ?? null,
        fileName: updated.file?.fileName ?? null,
        fileCategory: updated.file?.category ?? null,
        version: updated.version,
        isPublished: updated.isPublished,
        activeFrom: updated.activeFrom,
        activeUntil: updated.activeUntil,
        priority: updated.priority,
        type: updated.type,
        notes: updated.notes,
        performedBy: currentUser.email,
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
