import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const depot = url.searchParams.get("depot");

    const now = new Date();

    const messages = await prisma.systemMessage.findMany({
      where: {
        active: true,
        AND: [
          {
            OR: [
              { activeFrom: null },
              { activeFrom: { lte: now } },
            ],
          },
          {
            OR: [
              { activeUntil: null },
              { activeUntil: { gte: now } },
            ],
          },
        ],
        ...(depot
          ? {
              OR: [
                { targetDepot: "ALL" },
                { targetDepot: depot as any },
              ],
            }
          : {}),
      },
      orderBy: [
        { severity: "desc" }, // CRITICAL bovenaan
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      count: messages.length,
      messages,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Fout bij ophalen SystemMessages" },
      { status: 500 }
    );
  }
}
