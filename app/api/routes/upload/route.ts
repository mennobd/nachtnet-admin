import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getRequiredMutationUser } from "@/lib/auth";

const s3 = new S3Client({
  region: process.env.BUCKET_REGION || "auto",
  endpoint: process.env.BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

function normalizeRouteCategory(value: string) {
  if (value === "OMLEIDING") return "OMLEIDING";
  if (value === "CALAMITEIT") return "CALAMITEIT";
  return "REGULIER";
}

function getPriorityForCategory(category: string) {
  switch (category) {
    case "CALAMITEIT":
      return 10;
    case "OMLEIDING":
      return 50;
    default:
      return 100;
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequiredMutationUser();

    if (!user) {
      return NextResponse.json(
        { error: "Geen rechten voor deze actie." },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const routeId = String(formData.get("routeId") ?? "");
    const rawCategory = String(formData.get("category") ?? "REGULIER");
    const category = normalizeRouteCategory(rawCategory);

    const publishNow = String(formData.get("publishNow") ?? "false") === "true";
    const activeFromRaw = String(formData.get("activeFrom") ?? "").trim();
    const activeUntilRaw = String(formData.get("activeUntil") ?? "").trim();

    const activeFrom = activeFromRaw ? new Date(activeFromRaw) : null;
    const activeUntil = activeUntilRaw ? new Date(activeUntilRaw) : null;

    if (!file || !routeId) {
      return NextResponse.json(
        { error: "Bestand of routeId ontbreekt." },
        { status: 400 }
      );
    }

    if (activeFrom && Number.isNaN(activeFrom.getTime())) {
      return NextResponse.json(
        { error: "Begindatum is ongeldig." },
        { status: 400 }
      );
    }

    if (activeUntil && Number.isNaN(activeUntil.getTime())) {
      return NextResponse.json(
        { error: "Einddatum is ongeldig." },
        { status: 400 }
      );
    }

    if (activeFrom && activeUntil && activeUntil < activeFrom) {
      return NextResponse.json(
        { error: "Einddatum mag niet vóór de begindatum liggen." },
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

    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    const fileName = file.name;
    const version = `1.0.${checksum.slice(0, 8)}`;
    const storageKey = `routes/${routeId}/${Date.now()}-${fileName}`;
    const priority = getPriorityForCategory(category);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: storageKey,
        Body: buffer,
        ContentType: "application/gpx+xml",
      })
    );

    const result = await prisma.$transaction(async (tx) => {
      const routeFile = await tx.routeFile.create({
        data: {
          routeId,
          fileName,
          storageKey,
          checksum,
          version,
          category,
        },
      });

      const manifestEntry = await tx.manifestEntry.create({
        data: {
          routeId,
          fileId: routeFile.id,
          packageName: "RET_NACHTNET",
          type: category,
          version,
          isPublished: publishNow,
          activeFrom: publishNow ? activeFrom : null,
          activeUntil: publishNow ? activeUntil : null,
          priority,
          notes: null,
        },
      });

      if (publishNow) {
        await tx.manifestEntry.updateMany({
          where: {
            routeId,
            type: category,
            NOT: {
              id: manifestEntry.id,
            },
          },
          data: {
            isPublished: false,
          },
        });
      }

      return { routeFile, manifestEntry };
    });

    return NextResponse.json({
      success: true,
      fileName,
      checksum,
      version,
      storageKey,
      category,
      priority,
      published: result.manifestEntry.isPublished,
      activeFrom: result.manifestEntry.activeFrom,
      activeUntil: result.manifestEntry.activeUntil,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Onbekende uploadfout.",
      },
      { status: 500 }
    );
  }
}
