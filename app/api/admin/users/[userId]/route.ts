import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrOrgAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUser = await requireAdminOrOrgAdmin();

  try {
    const { userId } = await params;
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const organizationId = String(body.organizationId ?? "").trim();

    const role =
      body.role === "ADMIN"
        ? "ADMIN"
        : body.role === "ORG_ADMIN"
        ? "ORG_ADMIN"
        : body.role === "EDITOR"
        ? "EDITOR"
        : "VIEWER";

    if (!name || !email || !organizationId) {
      return NextResponse.json(
        { error: "Naam, e-mailadres en afdeling zijn verplicht." },
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
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden." },
        { status: 404 }
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

      if (organizationId !== targetUser.organizationId) {
        return NextResponse.json(
          { error: "Een afdelingsadmin mag de primaire afdeling niet wijzigen." },
          { status: 403 }
        );
      }

      if (role !== targetUser.role) {
        return NextResponse.json(
          { error: "Een afdelingsadmin mag de rol niet wijzigen." },
          { status: 403 }
        );
      }
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Ongeldige afdeling geselecteerd." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: userId,
        },
      },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Er bestaat al een andere gebruiker met dit e-mailadres." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    await writeAuditLog({
      action: "USER_UPDATED",
      entity: "user",
      entityId: updatedUser.id,
      metadata: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        organizationId: updatedUser.organizationId,
        organizationName: updatedUser.organization?.name ?? null,
        performedBy: currentUser.email,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

    return NextResponse.json(
      { error: "Gebruiker bijwerken mislukt." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUser = await requireAdminOrOrgAdmin();

  try {
    const { userId } = await params;

    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: "Je kunt je eigen account niet verwijderen." },
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
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden." },
        { status: 404 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Alleen ADMIN mag gebruikers verwijderen." },
        { status: 403 }
      );
    }

    await prisma.auditLog.updateMany({
      where: { userId },
      data: { userId: null },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    await writeAuditLog({
      action: "USER_DELETED",
      entity: "user",
      entityId: userId,
      metadata: {
        deletedName: targetUser.name,
        deletedEmail: targetUser.email,
        deletedRole: targetUser.role,
        organizationId: targetUser.organizationId,
        organizationName: targetUser.organization?.name ?? null,
        performedBy: currentUser.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    return NextResponse.json(
      { error: "Gebruiker verwijderen mislukt." },
      { status: 500 }
    );
  }
}
