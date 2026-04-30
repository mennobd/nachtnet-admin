export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  SystemMessageSeverity,
  SystemMessageTargetDepot,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getRequiredMutationUser } from "@/lib/auth";
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getRequiredMutationUser();

  if (!user) {
    return NextResponse.json(
      { error: "Geen rechten voor deze actie." },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const message = String(body.message ?? "").trim();
    const severity = normalizeSeverity(body.severity);
    const targetDepot = normalizeTargetDepot(body.targetDepot);
    const active = Boolean(body.active);
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

    const updated = await prisma.systemMessage.update({
      where: { id },
      data: {
        title,
        message,
        severity,
        targetDepot,
        active,
        activeFrom: activeFrom!,
        activeUntil,
      },
    });

    await writeAuditLog({
      action: "SYSTEM_MESSAGE_UPDATED",
      entity: "systemMessage",
      entityId: updated.id,
      metadata: {
        title: updated.title,
        severity: updated.severity,
        targetDepot: updated.targetDepot,
        active: updated.active,
        activeFrom: updated.activeFrom,
        activeUntil: updated.activeUntil,
        performedBy: user.email,
      },
    });

    logEvent("SYSTEM_MESSAGE_UPDATED", {
      id: updated.id,
      title: updated.title,
      severity: updated.severity,
      targetDepot: updated.targetDepot,
      active: updated.active,
      updatedBy: user.email,
    });

    return NextResponse.json(updated);
  } catch (error) {
    logEvent(
      "SYSTEM_MESSAGE_UPDATE_FAILED",
      {
        error: error instanceof Error ? error.message : "Onbekende fout",
        performedBy: user.email,
      },
      "ERROR"
    );

    return NextResponse.json(
      { error: "SystemMessage bijwerken mislukt." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getRequiredMutationUser();

  if (!user) {
    return NextResponse.json(
      { error: "Geen rechten voor deze actie." },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;

    const updated = await prisma.systemMessage.update({
      where: { id },
      data: {
        active: false,
      },
    });

    await writeAuditLog({
      action: "SYSTEM_MESSAGE_DEACTIVATED",
      entity: "systemMessage",
      entityId: updated.id,
      metadata: {
        title: updated.title,
        severity: updated.severity,
        targetDepot: updated.targetDepot,
        performedBy: user.email,
      },
    });

    logEvent("SYSTEM_MESSAGE_DEACTIVATED", {
      id: updated.id,
      title: updated.title,
      severity: updated.severity,
      targetDepot: updated.targetDepot,
      deactivatedBy: user.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logEvent(
      "SYSTEM_MESSAGE_DEACTIVATE_FAILED",
      {
        error: error instanceof Error ? error.message : "Onbekende fout",
        performedBy: user.email,
      },
      "ERROR"
    );

    return NextResponse.json(
      { error: "SystemMessage deactiveren mislukt." },
      { status: 500 }
    );
  }
}
