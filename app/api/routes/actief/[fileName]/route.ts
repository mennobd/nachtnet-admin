import { prisma } from "@/lib/db";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;

    const file = await prisma.routeFile.findFirst({
      where: { fileName },
      orderBy: { createdAt: "desc" },
    });

    if (!file || !file.storageKey) {
      return new NextResponse("Niet gevonden", { status: 404 });
    }

    const object = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: file.storageKey,
      })
    );

    if (!object.Body) {
      return new NextResponse("Leeg bestand", { status: 404 });
    }

    const bytes = await object.Body.transformToByteArray();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/gpx+xml",
        "Content-Disposition": `inline; filename="${file.fileName}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Fout", { status: 500 });
  }
}
