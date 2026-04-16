import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await requireAdmin();

  try {
    const { userId } = await params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await writeAuditLog({
      action: "USER_ACTIVATED",
      entity: "user",
      entityId: user.id,
      metadata: {
        name: user.name,
        email: user.email,
        role: user.role,
        performedBy: admin.email,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("ACTIVATE USER ERROR:", error);

    return NextResponse.json(
      { error: "Gebruiker activeren mislukt." },
      { status: 500 }
    );
  }
}
