import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiAdminOrOrgAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await apiAdminOrOrgAdmin();
  if (auth instanceof NextResponse) return auth;
  const currentUser = auth;

  try {
    const { userId } = await params;

    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: "Je kunt je eigen account niet deactiveren." },
        { status: 400 }
      );
    }

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

    // ORG_ADMIN regels
  if (currentUser.role === "ORG_ADMIN") {
    if (
      !targetUser.organizationId ||
      !currentUser.organizationAccessIds.includes(targetUser.organizationId)
    ) {
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
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await writeAuditLog({
      action: "USER_DEACTIVATED",
      entity: "user",
      entityId: user.id,
      metadata: {
        name: user.name,
        email: user.email,
        role: user.role,
        previousIsActive: targetUser.isActive,
        newIsActive: false,
        performedBy: currentUser.email,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("DEACTIVATE USER ERROR:", error);

    return NextResponse.json(
      { error: "Gebruiker deactiveren mislukt." },
      { status: 500 }
    );
  }
}
