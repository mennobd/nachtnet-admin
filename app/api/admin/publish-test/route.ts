import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const latestEntry = await prisma.manifestEntry.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latestEntry) {
      return NextResponse.json(
        { error: "Geen manifest entry gevonden." },
        { status: 404 }
      );
    }

    await prisma.manifestEntry.update({
      where: { id: latestEntry.id },
      data: {
        isPublished: true,
        activeFrom: new Date(),
        activeUntil: null,
        priority: 1,
      },
    });

    return NextResponse.json({
      status: "Manifest entry gepubliceerd",
      id: latestEntry.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Publiceren mislukt." },
      { status: 500 }
    );
  }
}
