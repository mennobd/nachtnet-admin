export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  SystemMessageSeverity,
  SystemMessageTargetDepot,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { apiSystemMessageUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { logEvent } from "@/lib/logger";
import { validateSystemMessage } from "@/lib/system-message-validator";

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
  const user = await apiSystemMessageUser();
  if (user instanceof NextResponse) return user;

  const messages = await prisma.systemMessage.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const user = await apiSystemMessageUser();
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const message = String(body.message ?? "").trim();
    const severity = normalizeSeverity(body.severity);
    const targetDepot = normalizeTargetDepot(body.targetDepot);
    const active = Boolean(body.active ?? true);
    const activeFrom = parseDateOrNow(body.activeFrom);
    const activeUntil = parseOptionalDate(body.activeUntil);

    const validationError = validateSystemMessage({
      title,
      message,
      severity,
      targetDepot,
      activeFrom,
      activeUntil,
    });

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const created = await prisma.systemMessage.create({
      data: {
        title,
        message,
        severity,
        targetDepot,
        active,
        activeFrom: activeFrom!,
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

    logEvent("SYSTEM_MESSAGE_CREATED", {
      id: created.id,
      title: created.title,
      severity: created.severity,
      targetDepot: created.targetDepot,
      active: created.active,
      createdBy: user.email,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    logEvent(
      "SYSTEM_MESSAGE_CREATE_FAILED",
      {
        error: error instanceof Error ? error.message : "Onbekende fout",
        performedBy: user.email,
      },
      "ERROR"
    );

    return NextResponse.json(
      { error: "SystemMessage aanmaken mislukt." },
      { status: 500 }
    );
  }
}
