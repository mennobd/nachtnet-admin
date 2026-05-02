import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { checkRateLimit, consumeRateLimit } from "@/lib/rate-limit";

const PASS_LIMIT = { max: 5, windowMs: 15 * 60_000 };

export async function PATCH(request: Request) {
  const auth = await apiUser();
  if (auth instanceof NextResponse) return auth;

  const limitCheck = checkRateLimit(`password:${auth.id}`, PASS_LIMIT);
  if (!limitCheck.ok) {
    return NextResponse.json(
      { error: "Te veel pogingen. Probeer het later opnieuw." },
      { status: 429, headers: { "Retry-After": String(limitCheck.retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Huidig wachtwoord is vereist." },
        { status: 400 }
      );
    }
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Nieuw wachtwoord moet minimaal 8 tekens bevatten." },
        { status: 400 }
      );
    }
    if (newPassword.length > 128) {
      return NextResponse.json(
        { error: "Nieuw wachtwoord mag maximaal 128 tekens bevatten." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden." },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      consumeRateLimit(`password:${auth.id}`, PASS_LIMIT);
      return NextResponse.json(
        { error: "Huidig wachtwoord klopt niet." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: auth.id },
      data: { passwordHash },
    });

    await writeAuditLog({
      action: "USER_PASSWORD_CHANGED_SELF",
      entity: "user",
      entityId: auth.id,
      metadata: { performedBy: auth.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SELF PASSWORD CHANGE ERROR:", error);
    return NextResponse.json(
      { error: "Wachtwoord wijzigen mislukt." },
      { status: 500 }
    );
  }
}
