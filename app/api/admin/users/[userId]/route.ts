import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await requireAdmin();

  try {
    const { userId } = await params;
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const role =
      body.role === "ADMIN"
        ? "ADMIN"
        : body.role === "EDITOR"
        ? "EDITOR"
        : "VIEWER";

    if (!name || !email) {
      return NextResponse.json(
        { error: "Naam en e-mailadres zijn verplicht." },
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
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
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
        performedBy: admin.email,
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
  const admin = await requireAdmin();

  try {
    const { userId } = await params;

    if (admin.id === userId) {
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
        performedBy: admin.email,
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
