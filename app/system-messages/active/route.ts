export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { SystemMessageTargetDepot } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/logger";

const severityRank: Record<string, number> = {
  CRITICAL: 1,
  WARNING: 2,
  INFO: 3,
};

function normalizeDepot(value: string | null): SystemMessageTargetDepot | null {
  const depot = String(value ?? "").toUpperCase();

  if (depot === "ZUID") return SystemMessageTargetDepot.ZUID;
  if (depot === "KLEIWEG") return SystemMessageTargetDepot.KLEIWEG;
  if (depot === "NACHTNET") return SystemMessageTargetDepot.NACHTNET;

  return null;
}

function emptyFallbackResponse(depot: SystemMessageTargetDepot | null) {
  return NextResponse.json(
    {
      status: "fallback",
      generatedAt: new Date().toISOString(),
      depot: depot ?? SystemMessageTargetDepot.ALL,
      count: 0,
      messages: [],
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const depot = normalizeDepot(url.searchParams.get("depot"));

  try {
    const now = new Date();

    const messages = await prisma.systemMessage.findMany({
      where: {
        active: true,
        activeFrom: {
          lte: now,
        },
        OR: [
          { activeUntil: { equals: null } },
          { activeUntil: { gte: now } },
        ],
        ...(depot
          ? {
              targetDepot: {
                in: [SystemMessageTargetDepot.ALL, depot],
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        message: true,
        severity: true,
        targetDepot: true,
        activeFrom: true,
        activeUntil: true,
        createdAt: true,
      },
    });

    const sortedMessages = messages.sort((a, b) => {
      const severityDiff = severityRank[a.severity] - severityRank[b.severity];

      if (severityDiff !== 0) return severityDiff;

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json(
      {
        status: "ok",
        generatedAt: new Date().toISOString(),
        depot: depot ?? SystemMessageTargetDepot.ALL,
        count: sortedMessages.length,
        messages: sortedMessages.map((message) => ({
          id: message.id,
          title: message.title,
          message: message.message,
          severity: message.severity,
          targetDepot: message.targetDepot,
          activeFrom: message.activeFrom,
          activeUntil: message.activeUntil,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Onbekende fout";

    console.error("ACTIVE SYSTEM MESSAGES ERROR:", error);

    logEvent(
      "SYSTEM_MESSAGES_ACTIVE_FETCH_FAILED",
      {
        depot: depot ?? "ALL",
        error: errorMessage,
      },
      "ERROR"
    );

    return emptyFallbackResponse(depot);
  }
}
