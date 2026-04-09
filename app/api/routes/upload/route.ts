import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File;
    const routeId = formData.get("routeId") as string;

    if (!file || !routeId) {
      return NextResponse.json(
        { error: "Bestand of routeId ontbreekt" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // checksum (SHA256)
    const checksum = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    // bestand opslaan
    const fileName = file.name;
    const filePath = path.join(process.cwd(), "public", "routes", fileName);

    await writeFile(filePath, buffer);

    // route ophalen
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { error: "Route niet gevonden" },
        { status: 404 }
      );
    }

    // versie genereren (simpel)
    const version = `1.0.${checksum.slice(0, 8)}`;

    // RouteFile opslaan
    const routeFile = await prisma.routeFile.create({
      data: {
        routeId,
        fileName,
        filePath: `/routes/${fileName}`,
        checksum,
        version,
      },
    });

    // ManifestEntry maken
    await prisma.manifestEntry.create({
      data: {
        routeId,
        fileId: routeFile.id,
        packageName: "RET_NACHTNET",
        type: "Regulier",
        version,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      fileName,
      checksum,
      version,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Upload mislukt" },
      { status: 500 }
    );
  }
}
