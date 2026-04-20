import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUser = await requireUser();

  if (currentUser.role !== "ADMIN" && currentUser.role !== "ORG_ADMIN") {
    return NextResponse.json(
      { error: "Geen rechten om gebruikers te activeren of deactiveren." },
      { status: 403 }
    );
  }

  try {
    const { userId } = await params;
    const body = await request.json();
    const isActive = Boolean(body.isActive);

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        organizationId: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden." },
        { status: 404 }
      );
    }

    if (currentUser.role === "ORG_ADMIN") {
      if (!currentUser.organizationId) {
        return NextResponse.json(
          { error: "Afdelingsadmin heeft geen gekoppelde afdeling." },
          { status: 403 }
        );
      }

      if (targetUser.organizationId !== currentUser.organizationId) {
        return NextResponse.json(
          { error: "Geen rechten om deze gebruiker te wijzigen." },
          { status: 403 }
        );
      }

      if (targetUser.role === "ADMIN") {
        return NextResponse.json(
          { error: "Een afdelingsadmin mag geen systeembeheerder wijzigen." },
          { status: 403 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await writeAuditLog({
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entity: "user",
      entityId: user.id,
      metadata: {
        name: user.name,
        email: user.email,
        role: user.role,
        previousIsActive: targetUser.isActive,
        newIsActive: user.isActive,
        performedBy: currentUser.email,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("ACTIVATE/DEACTIVATE USER ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gebruikerstatus wijzigen mislukt.",
      },
      { status: 500 }
    );
  }
}
