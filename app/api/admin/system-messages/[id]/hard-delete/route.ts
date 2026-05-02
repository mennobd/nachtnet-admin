export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSystemMessageUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { logEvent } from "@/lib/logger";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await apiSystemMessageUser();
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await context.params;

    const existing = await prisma.systemMessage.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "SystemMessage niet gevonden." },
        { status: 404 }
      );
    }

    if (existing.active) {
      return NextResponse.json(
        {
          error:
            "Actieve berichten kunnen niet direct worden verwijderd. Deactiveer het bericht eerst.",
        },
        { status: 400 }
      );
    }

    await writeAuditLog({
      action: "SYSTEM_MESSAGE_DELETED",
      entity: "systemMessage",
      entityId: existing.id,
      metadata: {
        title: existing.title,
        message: existing.message,
        severity: existing.severity,
        targetDepot: existing.targetDepot,
        active: existing.active,
        activeFrom: existing.activeFrom,
        activeUntil: existing.activeUntil,
        createdBy: existing.createdBy,
        createdAt: existing.createdAt,
        deletedBy: user.email,
      },
    });

    await prisma.systemMessage.delete({
      where: { id },
    });

    logEvent("SYSTEM_MESSAGE_DELETED", {
      id: existing.id,
      title: existing.title,
      severity: existing.severity,
      targetDepot: existing.targetDepot,
      deletedBy: user.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logEvent(
      "SYSTEM_MESSAGE_DELETE_FAILED",
      {
        error: error instanceof Error ? error.message : "Onbekende fout",
        performedBy: user.email,
      },
      "ERROR"
    );

    return NextResponse.json(
      { error: "SystemMessage verwijderen mislukt." },
      { status: 500 }
    );
  }
}
