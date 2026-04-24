import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
      { error: "Geen rechten om wachtwoorden te wijzigen." },
      { status: 403 }
    );
  }

  try {
    const { userId } = await params;
    const body = await request.json();

    const password = String(body.password ?? "");

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Wachtwoord moet minimaal 8 tekens bevatten." },
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

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    await writeAuditLog({
      action: "USER_PASSWORD_CHANGED",
      entity: "user",
      entityId: user.id,
      metadata: {
        changedFor: user.email,
        targetName: targetUser.name,
        targetRole: targetUser.role,
        targetOrganizationId: targetUser.organizationId,
        performedBy: currentUser.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wachtwoord wijzigen mislukt.",
      },
      { status: 500 }
    );
  }
}
