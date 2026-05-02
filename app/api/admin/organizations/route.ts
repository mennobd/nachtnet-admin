import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const auth = await apiAdmin();
  if (auth instanceof NextResponse) return auth;

  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  return NextResponse.json(organizations);
}

export async function POST(request: Request) {
  const auth = await apiAdmin();
  if (auth instanceof NextResponse) return auth;
  const admin = auth;

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Afdelingsnaam is verplicht." },
        { status: 400 }
      );
    }

    const existing = await prisma.organization.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Deze afdeling bestaat al." },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.create({
      data: { name },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    await writeAuditLog({
      action: "ORGANIZATION_CREATED",
      entity: "organization",
      entityId: organization.id,
      metadata: {
        name: organization.name,
        performedBy: admin.email,
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("CREATE ORGANIZATION ERROR:", error);

    return NextResponse.json(
      { error: "Afdeling aanmaken mislukt." },
      { status: 500 }
    );
  }
}
