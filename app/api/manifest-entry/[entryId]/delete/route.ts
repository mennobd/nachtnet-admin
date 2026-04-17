import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredMutationUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function DELETE(
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

    const entry = await prisma.manifestEntry.findUnique({
      where: { id: entryId },
      include: {
        route: true,
        file: true,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Release niet gevonden." },
        { status: 404 }
      );
    }

    if (entry.isPublished) {
      return NextResponse.json(
        { error: "Een live release kan niet direct worden verwijderd." },
        { status: 400 }
      );
    }

    const fileId = entry.fileId;
    const fileName = entry.file?.fileName ?? null;

    await prisma.manifestEntry.delete({
      where: { id: entryId },
    });

    if (fileId) {
      const remainingReferences = await prisma.manifestEntry.count({
        where: { fileId },
      });

      if (remainingReferences === 0) {
        await prisma.routeFile.delete({
          where: { id: fileId },
        });
      }
    }

    await writeAuditLog({
      action: "RELEASE_DELETED",
      entity: "manifestEntry",
      entityId: entryId,
      metadata: {
        routeId: entry.routeId,
        routeCode: entry.route?.routeCode ?? null,
        routeTitle: entry.route?.title ?? null,
        version: entry.version,
        fileName,
        fileDeleted: !!fileId,
        performedBy: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Release verwijderd.",
    });
  } catch (error) {
    console.error("DELETE RELEASE ERROR:", error);

    return NextResponse.json(
      { error: "Release verwijderen mislukt." },
      { status: 500 }
    );
  }
}
