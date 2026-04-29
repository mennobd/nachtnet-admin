import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemMessage" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "severity" TEXT DEFAULT 'INFO',
        "targetDepot" TEXT DEFAULT 'ALL',
        "active" BOOLEAN DEFAULT true,
        "activeFrom" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "activeUntil" TIMESTAMP,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
