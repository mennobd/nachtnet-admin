import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { apiAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const auth = await apiAdmin();
  if (auth instanceof NextResponse) return auth;
  const admin = auth;

  try {
    const { requestId } = await params;
    const body = await request.json();

    const action = String(body.action ?? "").trim();
    const password = String(body.password ?? "");
    const rejectionReason = String(body.rejectionReason ?? "").trim();

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Ongeldige actie." },
        { status: 400 }
      );
    }

    const approvalRequest = await prisma.userApprovalRequest.findUnique({
      where: { id: requestId },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!approvalRequest) {
      return NextResponse.json(
        { error: "Aanvraag niet gevonden." },
        { status: 404 }
      );
    }

    if (approvalRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Deze aanvraag is al verwerkt." },
        { status: 400 }
      );
    }

    if (action === "REJECT") {
      const rejectedRequest = await prisma.userApprovalRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedById: admin.id,
          reviewedAt: new Date(),
          rejectionReason: rejectionReason || null,
        },
      });

      await writeAuditLog({
        action: "USER_APPROVAL_REQUEST_REJECTED",
        entity: "userApprovalRequest",
        entityId: rejectedRequest.id,
        metadata: {
          name: approvalRequest.name,
          email: approvalRequest.email,
          requestedRole: approvalRequest.requestedRole,
          organizationId: approvalRequest.organizationId,
          organizationName: approvalRequest.organization.name,
          requestedBy: approvalRequest.requestedBy.email,
          reviewedBy: admin.email,
          rejectionReason: rejectionReason || null,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Voor goedkeuren is een wachtwoord van minimaal 8 tekens verplicht." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: approvalRequest.email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Er bestaat inmiddels al een gebruiker met dit e-mailadres." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: approvalRequest.name,
          email: approvalRequest.email,
          passwordHash,
          role: approvalRequest.requestedRole,
          isActive: true,
          organizationId: approvalRequest.organizationId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true,
        },
      });

      const approvedRequest = await tx.userApprovalRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
        },
      });

      return { createdUser, approvedRequest };
    });

    await writeAuditLog({
      action: "USER_APPROVAL_REQUEST_APPROVED",
      entity: "userApprovalRequest",
      entityId: result.approvedRequest.id,
      metadata: {
        createdUserId: result.createdUser.id,
        name: result.createdUser.name,
        email: result.createdUser.email,
        role: result.createdUser.role,
        organizationId: result.createdUser.organizationId,
        organizationName: approvalRequest.organization.name,
        requestedBy: approvalRequest.requestedBy.email,
        reviewedBy: admin.email,
      },
    });

    return NextResponse.json({
      success: true,
      user: result.createdUser,
    });
  } catch (error) {
    console.error("PROCESS USER APPROVAL REQUEST ERROR:", error);

    return NextResponse.json(
      { error: "Gebruikersaanvraag verwerken mislukt." },
      { status: 500 }
    );
  }
}
