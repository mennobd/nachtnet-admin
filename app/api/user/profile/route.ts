import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(request: Request) {
  const auth = await apiUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Naam moet minimaal 2 tekens bevatten." },
        { status: 400 }
      );
    }
    if (name.length > 100) {
      return NextResponse.json(
        { error: "Naam mag maximaal 100 tekens bevatten." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: auth.id },
      data: { name },
    });

    await writeAuditLog({
      action: "USER_PROFILE_UPDATED",
      entity: "user",
      entityId: auth.id,
      metadata: { updatedName: name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);
    return NextResponse.json(
      { error: "Profiel bijwerken mislukt." },
      { status: 500 }
    );
  }
}
