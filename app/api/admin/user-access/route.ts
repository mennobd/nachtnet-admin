import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const admin = await requireAdmin();

  try {
    const body = await request.json();

    const userId = String(body.userId ?? "").trim();
    const organizationId = String(body.organizationId ?? "").trim();

    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: "userId en organizationId zijn verplicht." },
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

    if (user.role !== "ORG_ADMIN") {
      return NextResponse.json(
        { error: "Alleen ORG_ADMIN kan extra beheerrechten krijgen." },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Afdeling niet gevonden." },
        { status: 404 }
      );
    }

    const existingAccess = await prisma.userOrganizationAccess.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingAccess) {
      return NextResponse.json({ success: true });
    }

    const access = await prisma.userOrganizationAccess.create({
      data: {
        userId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    await writeAuditLog({
      action: "ORG_ADMIN_ACCESS_GRANTED",
      entity: "userOrganizationAccess",
      entityId: access.id,
      metadata: {
        targetUserId: user.id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        organizationId: organization.id,
        organizationName: organization.name,
        performedBy: admin.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("GRANT USER ACCESS ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Beheerrecht toekennen mislukt.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();

  try {
    const body = await request.json();

    const userId = String(body.userId ?? "").trim();
    const organizationId = String(body.organizationId ?? "").trim();

    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: "userId en organizationId zijn verplicht." },
        { status: 400 }
      );
    }

    const access = await prisma.userOrganizationAccess.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!access) {
      return NextResponse.json({ success: true });
    }

    await prisma.userOrganizationAccess.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    await writeAuditLog({
      action: "ORG_ADMIN_ACCESS_REVOKED",
      entity: "userOrganizationAccess",
      entityId: access.id,
      metadata: {
        targetUserId: access.user.id,
        targetUserName: access.user.name,
        targetUserEmail: access.user.email,
        organizationId: access.organization.id,
        organizationName: access.organization.name,
        performedBy: admin.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("REVOKE USER ACCESS ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Beheerrecht verwijderen mislukt.",
      },
      { status: 500 }
    );
  }
}
