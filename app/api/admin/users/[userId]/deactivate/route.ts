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

    if (admin.id === userId) {
      return NextResponse.json(
        { error: "Je kunt je eigen account niet deactiveren." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await writeAuditLog({
      action: "USER_DEACTIVATED",
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
    console.error("DEACTIVATE USER ERROR:", error);

    return NextResponse.json(
      { error: "Gebruiker deactiveren mislukt." },
      { status: 500 }
    );
  }
}
