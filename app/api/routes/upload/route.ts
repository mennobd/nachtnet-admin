import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const routeId = String(formData.get("routeId") ?? "");

    if (!file || !routeId) {
      return NextResponse.json(
        { error: "Bestand of routeId ontbreekt." },
        { status: 400 }
      );
    }

    if (!process.env.BUCKET_NAME) {
      return NextResponse.json(
        { error: "BUCKET_NAME ontbreekt in Railway variables." },
        { status: 500 }
      );
    }

    if (!process.env.BUCKET_REGION) {
      return NextResponse.json(
        { error: "BUCKET_REGION ontbreekt in Railway variables." },
        { status: 500 }
      );
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: "AWS bucket credentials ontbreken in Railway variables." },
        { status: 500 }
      );
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { error: "Route niet gevonden." },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const checksum = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    const fileName = file.name;
    const version = `1.0.${checksum.slice(0, 8)}`;
    const storageKey = `routes/${routeId}/${Date.now()}-${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: storageKey,
        Body: buffer,
        ContentType: "application/gpx+xml",
      })
    );

    const routeFile = await prisma.routeFile.create({
      data: {
        routeId,
        fileName,
        storageKey,
        checksum,
        version,
      },
    });

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
      storageKey,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Onbekende uploadfout.",
      },
      { status: 500 }
    );
  }
}
