import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ManifestEntry"
      ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "activeFrom" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "activeUntil" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 100,
      ADD COLUMN IF NOT EXISTS "notes" TEXT,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    return NextResponse.json({ status: "Database updated ✅" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "DB fix failed" }, { status: 500 });
  }
}
