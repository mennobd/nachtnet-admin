import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(request: Request) {
  const auth = await apiAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Ongeldig e-mailadres." },
        { status: 400 }
      );
    }
    if (email.length > 255) {
      return NextResponse.json(
        { error: "E-mailadres mag maximaal 255 tekens bevatten." },
        { status: 400 }
      );
    }
    if (email === auth.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Nieuw e-mailadres is gelijk aan het huidige." },
        { status: 400 }
      );
    }

    const taken = await prisma.user.findFirst({
      where: { email, NOT: { id: auth.id } },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: "Dit e-mailadres is al in gebruik." },
        { status: 409 }
      );
    }

    await prisma.user.update({
      where: { id: auth.id },
      data: { email },
    });

    await writeAuditLog({
      action: "USER_EMAIL_CHANGED",
      entity: "user",
      entityId: auth.id,
      metadata: { newEmail: email, previousEmail: auth.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("EMAIL UPDATE ERROR:", error);
    return NextResponse.json(
      { error: "E-mailadres bijwerken mislukt." },
      { status: 500 }
    );
  }
}
