export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  SystemMessageSeverity,
  SystemMessageTargetDepot,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getRequiredMutationUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

function normalizeSeverity(value: unknown): SystemMessageSeverity {
  if (value === "CRITICAL") return "CRITICAL";
  if (value === "WARNING") return "WARNING";
  return "INFO";
}

function normalizeTargetDepot(value: unknown): SystemMessageTargetDepot {
  if (value === "ZUID") return "ZUID";
  if (value === "KLEIWEG") return "KLEIWEG";
  if (value === "NACHTNET") return "NACHTNET";
  return "ALL";
}

function parseDateOrNow(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return new Date();

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function parseOptionalDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

export async function GET() {
  const user = await getRequiredMutationUser();

  if (!user) {
    return NextResponse.json(
      { error: "Geen rechten voor deze actie." },
      { status: 403 }
    );
  }

  const messages = await prisma.systemMessage.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const user = await getRequiredMutationUser();

  if (!user) {
    return NextResponse.json(
      { error: "Geen rechten voor deze actie." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const message = String(body.message ?? "").trim();
    const severity = normalizeSeverity(body.severity);
    const targetDepot = normalizeTargetDepot(body.targetDepot);
    const active = Boolean(body.active ?? true);
    const activeFrom = parseDateOrNow(body.activeFrom);
    const activeUntil = parseOptionalDate(body.activeUntil);

    if (!title || !message) {
      return NextResponse.json(
        { error: "Titel en bericht zijn verplicht." },
        { status: 400 }
      );
    }

    if (!activeFrom) {
      return NextResponse.json(
        { error: "Actief vanaf is ongeldig." },
        { status: 400 }
      );
    }

    if (activeUntil && activeUntil < activeFrom) {
      return NextResponse.json(
        { error: "Actief tot mag niet vóór actief vanaf liggen." },
        { status: 400 }
      );
    }

    const created = await prisma.systemMessage.create({
      data: {
        title,
        message,
        severity,
        targetDepot,
        active,
        activeFrom,
        activeUntil,
        createdBy: user.email,
      },
    });

    await writeAuditLog({
      action: "SYSTEM_MESSAGE_CREATED",
      entity: "systemMessage",
      entityId: created.id,
      metadata: {
        title: created.title,
        severity: created.severity,
        targetDepot: created.targetDepot,
        active: created.active,
        activeFrom: created.activeFrom,
        activeUntil: created.activeUntil,
        performedBy: user.email,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("CREATE SYSTEM MESSAGE ERROR:", error);

    return NextResponse.json(
      { error: "SystemMessage aanmaken mislukt." },
      { status: 500 }
    );
  }
}
