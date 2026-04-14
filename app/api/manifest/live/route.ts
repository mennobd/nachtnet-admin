import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const entries = await prisma.manifestEntry.findMany({
      where: {
        active: true,
      },
      include: {
        route: true,
        file: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const appBaseUrl = process.env.APP_BASE_URL;

    if (!appBaseUrl) {
      return NextResponse.json(
        { error: "APP_BASE_URL ontbreekt in de environment variables." },
        { status: 500 }
      );
    }

    const manifest = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      routes: entries
        .filter((entry) => entry.file && entry.file.storageKey)
        .map((entry) => ({
          routeId: entry.route.routeCode,
          lineNumber: entry.route.lineNumber,
          title: entry.route.title,
          packageName: entry.packageName,
          type: entry.type,
          version: entry.version,
          active: entry.active,
          fileName: entry.file.fileName,
          fileUrl: `${appBaseUrl}/routes/acties/${encodeURIComponent(entry.file.fileName)}`,
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
