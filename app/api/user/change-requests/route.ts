import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const VALID_ROLES = ["ORG_ADMIN", "EDITOR", "VIEWER"] as const;

export async function GET() {
  const auth = await apiUser();
  if (auth instanceof NextResponse) return auth;

  const requests = await prisma.accountChangeRequest.findMany({
    where: { userId: auth.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const auth = await apiUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const type = String(body.type ?? "").trim();
    const requestedValue = String(body.requestedValue ?? "").trim();
    const reason = String(body.reason ?? "").trim() || null;

    if (type !== "EMAIL" && type !== "ROLE") {
      return NextResponse.json(
        { error: "Ongeldig type verzoek." },
        { status: 400 }
      );
    }

    if (type === "EMAIL") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedValue)) {
        return NextResponse.json(
          { error: "Ongeldig e-mailadres." },
          { status: 400 }
        );
      }
      if (requestedValue.toLowerCase() === auth.email.toLowerCase()) {
        return NextResponse.json(
          { error: "Nieuw e-mailadres is gelijk aan het huidige." },
          { status: 400 }
        );
      }
      if (requestedValue.length > 255) {
        return NextResponse.json(
          { error: "E-mailadres mag maximaal 255 tekens bevatten." },
          { status: 400 }
        );
      }
    }

    if (type === "ROLE") {
      if (!(VALID_ROLES as readonly string[]).includes(requestedValue)) {
        return NextResponse.json(
          { error: "Ongeldige rol. Kies uit: Afdelingsadmin, Editor of Viewer." },
          { status: 400 }
        );
      }
      if (requestedValue === auth.role) {
        return NextResponse.json(
          { error: "Gevraagde rol is gelijk aan de huidige." },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.accountChangeRequest.findFirst({
      where: { userId: auth.id, type: type as "EMAIL" | "ROLE", status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Er is al een openstaand verzoek van dit type." },
        { status: 409 }
      );
    }

    const changeRequest = await prisma.accountChangeRequest.create({
      data: {
        userId: auth.id,
        type: type as "EMAIL" | "ROLE",
        requestedValue,
        reason,
      },
    });

    await writeAuditLog({
      action: "ACCOUNT_CHANGE_REQUESTED",
      entity: "account_change_request",
      entityId: changeRequest.id,
      metadata: { type, requestedValue, userId: auth.id },
    });

    return NextResponse.json({ success: true, id: changeRequest.id });
  } catch (error) {
    console.error("CHANGE REQUEST ERROR:", error);
    return NextResponse.json(
      { error: "Verzoek indienen mislukt." },
      { status: 500 }
    );
  }
}
