import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
    const body = await request.json();

    const password = String(body.password ?? "");

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Wachtwoord moet minimaal 8 tekens bevatten." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    await writeAuditLog({
      action: "USER_PASSWORD_CHANGED",
      entity: "user",
      entityId: user.id,
      metadata: {
        changedFor: user.email,
        performedBy: admin.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return NextResponse.json(
      { error: "Wachtwoord wijzigen mislukt." },
      { status: 500 }
    );
  }
}
