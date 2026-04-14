import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const appBaseUrl = process.env.APP_BASE_URL;

    if (!appBaseUrl) {
      return NextResponse.json(
        { error: "APP_BASE_URL ontbreekt in de environment variables." },
        { status: 500 }
      );
    }

    const now = new Date();

    const entries = await prisma.manifestEntry.findMany({
      where: {
        isPublished: true,
        OR: [
          { activeFrom: null },
          { activeFrom: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { activeUntil: null },
              { activeUntil: { gte: now } },
            ],
          },
        ],
      },
      include: {
        route: true,
        file: true,
      },
      orderBy: [
        { priority: "asc" },
        { createdAt: "desc" },
      ],
    });

    const bestPerRoute = new Map<string, (typeof entries)[number]>();

    for (const entry of entries) {
      if (!bestPerRoute.has(entry.routeId)) {
        bestPerRoute.set(entry.routeId, entry);
      }
    }

    const manifest = {
      version: "1.0.0",
      generatedAt: now.toISOString(),
      routes: Array.from(bestPerRoute.values())
        .filter((entry) => entry.file?.storageKey)
        .map((entry) => ({
          routeId: entry.route.routeCode,
          lineNumber: entry.route.lineNumber,
          title: entry.route.title,
          packageName: entry.packageName,
          type: entry.type,
          version: entry.version,
          active: true,
          fileName: entry.file.fileName,
          fileUrl: `${appBaseUrl}/routes/acties/${encodeURIComponent(
            entry.file.fileName
          )}`,
          checksum: entry.file.checksum,
        })),
    };

    return NextResponse.json(manifest);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Fout bij genereren manifest" },
      { status: 500 }
    );
  }
}
