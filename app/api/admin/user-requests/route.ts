import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiAdminOrOrgAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const auth = await apiAdminOrOrgAdmin();
  if (auth instanceof NextResponse) return auth;
  const currentUser = auth;

  const where =
    currentUser.role === "ADMIN"
      ? {}
      : {
          organizationId: {
            in: currentUser.organizationAccessIds,
          },
        };

  const requests = await prisma.userApprovalRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      organization: {
        select: { id: true, name: true },
      },
      requestedBy: {
        select: { id: true, name: true, email: true },
      },
      reviewedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const auth = await apiAdminOrOrgAdmin();
  if (auth instanceof NextResponse) return auth;
  const currentUser = auth;

  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const organizationId = String(body.organizationId ?? "").trim();

    const requestedRole =
      body.requestedRole === "EDITOR" ? "EDITOR" : "VIEWER";

    if (!name || !email || !organizationId) {
      return NextResponse.json(
        { error: "Naam, e-mailadres en afdeling zijn verplicht." },
        { status: 400 }
      );
    }

    if (
      currentUser.role === "ORG_ADMIN" &&
      !currentUser.organizationAccessIds.includes(organizationId)
    ) {
      return NextResponse.json(
        { error: "Geen rechten om voor deze afdeling een gebruiker aan te vragen." },
        { status: 403 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Afdeling niet gevonden." },
        { status: 404 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Er bestaat al een gebruiker met dit e-mailadres." },
        { status: 400 }
      );
    }

    const existingPendingRequest = await prisma.userApprovalRequest.findFirst({
      where: {
        email,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (existingPendingRequest) {
      return NextResponse.json(
        { error: "Er staat al een open aanvraag voor dit e-mailadres." },
        { status: 400 }
      );
    }

    const approvalRequest = await prisma.userApprovalRequest.create({
      data: {
        name,
        email,
        requestedRole,
        organizationId,
        requestedById: currentUser.id,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    await writeAuditLog({
      action: "USER_APPROVAL_REQUEST_CREATED",
      entity: "userApprovalRequest",
      entityId: approvalRequest.id,
      metadata: {
        name: approvalRequest.name,
        email: approvalRequest.email,
        requestedRole: approvalRequest.requestedRole,
        organizationId: approvalRequest.organization.id,
        organizationName: approvalRequest.organization.name,
        requestedBy: currentUser.email,
      },
    });

    return NextResponse.json(approvalRequest, { status: 201 });
  } catch (error) {
    console.error("CREATE USER APPROVAL REQUEST ERROR:", error);

    return NextResponse.json(
      { error: "Gebruikersaanvraag aanmaken mislukt." },
      { status: 500 }
    );
  }
}
