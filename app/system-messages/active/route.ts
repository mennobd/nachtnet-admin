import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const severityRank: Record<string, number> = {
  CRITICAL: 1,
  WARNING: 2,
  INFO: 3,
};

function normalizeDepot(value: string | null) {
  const depot = String(value ?? "").toUpperCase();

  if (depot === "ZUID") return "ZUID";
  if (depot === "KLEIWEG") return "KLEIWEG";
  if (depot === "NACHTNET") return "NACHTNET";

  return null;
}

export async function GET(request: Request) {
  try {
    const now = new Date();
    const url = new URL(request.url);
    const depot = normalizeDepot(url.searchParams.get("depot"));

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
                in: ["ALL", depot],
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const sortedMessages = messages.sort((a, b) => {
      const severityDiff = severityRank[a.severity] - severityRank[b.severity];

      if (severityDiff !== 0) return severityDiff;

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
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
    });
  } catch (error) {
    console.error("ACTIVE SYSTEM MESSAGES ERROR:", error);

    return NextResponse.json(
      { error: "SystemMessages konden niet worden geladen." },
      { status: 500 }
    );
  }
}
