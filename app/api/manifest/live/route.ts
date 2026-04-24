import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();

    const entries = await prisma.manifestEntry.findMany({
      where: {
        isPublished: true,
        OR: [{ activeFrom: null }, { activeFrom: { lte: now } }],
        AND: [
          {
            OR: [{ activeUntil: null }, { activeUntil: { gte: now } }],
          },
        ],
      },
      include: {
        route: true,
        file: true,
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    const uniqueRoutes = new Map<string, (typeof entries)[number]>();

    for (const entry of entries) {
      if (!entry.route || !entry.file) {
        continue;
      }

      const visibleRouteId = entry.route.routeCode;

      if (!uniqueRoutes.has(visibleRouteId)) {
        uniqueRoutes.set(visibleRouteId, entry);
      }
    }

    const routes = Array.from(uniqueRoutes.values()).map((entry) => {
      const category = entry.file?.category ?? entry.type ?? "REGULIER";

      const fileUrl = `${process.env.APP_BASE_URL}/routes/acties/${encodeURIComponent(
        entry.file!.fileName
      )}`;

      return {
        routeId: entry.route!.routeCode,
        lineNumber: entry.route!.lineNumber,
        title: entry.route!.title,
        depot: entry.route!.depot,
        packageName: entry.packageName,
        type: category,
        category,
        version: entry.version,
        active: true,
        fileName: entry.file!.fileName,
        fileUrl,
        checksum: entry.file!.checksum,
        priority: entry.priority,
        activeFrom: entry.activeFrom,
        activeUntil: entry.activeUntil,
      };
    });

    return NextResponse.json({
      version: "1.1.0",
      generatedAt: new Date().toISOString(),
      routeCount: routes.length,
      routes,
    });
  } catch (error) {
    console.error("MANIFEST LIVE ERROR:", error);

    return NextResponse.json(
      { error: "Fout bij genereren manifest" },
      { status: 500 }
    );
  }
}
