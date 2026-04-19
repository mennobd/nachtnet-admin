  import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const admin = await requireAdmin();

  try {
    const { organizationId } = await params;
    const body = await request.json();
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Afdelingsnaam is verplicht." },
        { status: 400 }
      );
    }

    const existing = await prisma.organization.findFirst({
      where: {
        name,
        NOT: { id: organizationId },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Er bestaat al een andere afdeling met deze naam." },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: { name },
      select: {
        id: true,
        name: true,
      },
    });

    await writeAuditLog({
      action: "ORGANIZATION_UPDATED",
      entity: "organization",
      entityId: organization.id,
      metadata: {
        name: organization.name,
        performedBy: admin.email,
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("UPDATE ORGANIZATION ERROR:", error);

    return NextResponse.json(
      { error: "Afdeling bijwerken mislukt." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const admin = await requireAdmin();

  try {
    const { organizationId } = await params;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Afdeling niet gevonden." },
        { status: 404 }
      );
    }

    if (organization._count.users > 0) {
      return NextResponse.json(
        { error: "Afdeling kan niet worden verwijderd zolang er gebruikers aan gekoppeld zijn." },
        { status: 400 }
      );
    }

    await prisma.organization.delete({
      where: { id: organizationId },
    });

    await writeAuditLog({
      action: "ORGANIZATION_DELETED",
      entity: "organization",
      entityId: organizationId,
      metadata: {
        name: organization.name,
        performedBy: admin.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE ORGANIZATION ERROR:", error);

    return NextResponse.json(
      { error: "Afdeling verwijderen mislukt." },
      { status: 500 }
    );
  }
}
