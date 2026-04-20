import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUser = await requireUser();

  if (currentUser.role !== "ADMIN" && currentUser.role !== "ORG_ADMIN") {
    return NextResponse.json(
      { error: "Geen rechten om gebruikers te wijzigen." },
      { status: 403 }
    );
  }

  try {
    const { userId } = await params;
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const requestedOrganizationId = String(body.organizationId ?? "").trim();

    const requestedRole: UserRole =
      body.role === "ADMIN"
        ? "ADMIN"
        : body.role === "ORG_ADMIN"
        ? "ORG_ADMIN"
        : body.role === "EDITOR"
        ? "EDITOR"
        : "VIEWER";

    if (!name || !email) {
      return NextResponse.json(
        { error: "Naam en e-mailadres zijn verplicht." },
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

    let roleToUpdate: UserRole = targetUser.role;
    let organizationIdToUpdate: string | null = targetUser.organizationId;

    if (currentUser.role === "ADMIN") {
      if (!requestedOrganizationId) {
        return NextResponse.json(
          { error: "Afdeling is verplicht." },
          { status: 400 }
        );
      }

      const organization = await prisma.organization.findUnique({
        where: { id: requestedOrganizationId },
        select: { id: true, name: true },
      });

      if (!organization) {
        return NextResponse.json(
          { error: "Ongeldige afdeling geselecteerd." },
          { status: 400 }
        );
      }

      roleToUpdate = requestedRole;
      organizationIdToUpdate = requestedOrganizationId;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role: roleToUpdate,
        organizationId: organizationIdToUpdate,
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
        previousName: targetUser.name,
        newName: updatedUser.name,
        previousEmail: targetUser.email,
        newEmail: updatedUser.email,
        previousRole: targetUser.role,
        newRole: updatedUser.role,
        previousIsActive: targetUser.isActive,
        newIsActive: updatedUser.isActive,
        previousOrganizationId: targetUser.organizationId,
        newOrganizationId: updatedUser.organizationId,
        previousOrganizationName: targetUser.organization?.name ?? null,
        newOrganizationName: updatedUser.organization?.name ?? null,
        performedBy: currentUser.email,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gebruiker bijwerken mislukt.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUser = await requireUser();

  if (currentUser.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Alleen een ADMIN mag gebruikers verwijderen." },
      { status: 403 }
    );
  }

  try {
    const { userId } = await params;

    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: "Je kunt je eigen account niet verwijderen." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
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

    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden." },
        { status: 404 }
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
        deletedName: user.name,
        deletedEmail: user.email,
        deletedRole: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization?.name ?? null,
        performedBy: currentUser.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gebruiker verwijderen mislukt.",
      },
      { status: 500 }
    );
  }
}
