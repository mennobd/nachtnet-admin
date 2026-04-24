import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();

  const body = await request.json();
  const { action } = body;

  const req = await prisma.userApprovalRequest.findUnique({
    where: { id: params.id },
  });

  if (!req) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  if (action === "approve") {
    // user aanmaken
    await prisma.user.create({
      data: {
        name: req.name,
        email: req.email,
        role: req.requestedRole,
        organizationId: req.organizationId,
        isActive: true,
      },
    });

    await prisma.userApprovalRequest.update({
      where: { id: req.id },
      data: { status: "APPROVED" },
    });
  }

  if (action === "reject") {
    await prisma.userApprovalRequest.update({
      where: { id: req.id },
      data: { status: "REJECTED" },
    });
  }

  return NextResponse.json({ success: true });
}
