import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { apiMutationUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const s3 = new S3Client({
  region: process.env.BUCKET_REGION || "auto",
  endpoint: process.env.BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ routeId: string; fileId: string }> }
) {
  const auth = await apiMutationUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const { routeId, fileId } = await params;

    const file = await prisma.routeFile.findUnique({
      where: { id: fileId },
      include: {
        manifestEntries: { select: { id: true, isPublished: true } },
      },
    });

    if (!file || file.routeId !== routeId) {
      return NextResponse.json({ error: "Bestand niet gevonden." }, { status: 404 });
    }

    const hasLiveEntry = file.manifestEntries.some((e) => e.isPublished);
    if (hasLiveEntry) {
      return NextResponse.json(
        { error: "Dit bestand is nog gekoppeld aan een actieve publicatie. Deactiveer de publicatie eerst." },
        { status: 409 }
      );
    }

    if (file.storageKey) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME!,
            Key: file.storageKey,
          })
        );
      } catch (s3Error) {
        console.error("S3 DELETE ERROR:", s3Error);
      }
    }

    await prisma.manifestEntry.deleteMany({ where: { fileId } });
    await prisma.routeFile.delete({ where: { id: fileId } });

    await writeAuditLog({
      action: "ROUTE_FILE_DELETED",
      entity: "routeFile",
      entityId: fileId,
      metadata: {
        routeId,
        fileName: file.fileName,
        version: file.version,
        performedBy: auth.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FILE DELETE ERROR:", error);
    return NextResponse.json({ error: "Bestand verwijderen mislukt." }, { status: 500 });
  }
}
