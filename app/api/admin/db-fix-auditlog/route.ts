import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "entity" TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT,
        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'AuditLog_userId_fkey'
        ) THEN
          ALTER TABLE "AuditLog"
          ADD CONSTRAINT "AuditLog_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx"
      ON "AuditLog" ("createdAt");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx"
      ON "AuditLog" ("userId");
    `);

    return NextResponse.json({
      success: true,
      message: "AuditLog tabel en indexen zijn aangemaakt.",
    });
  } catch (error) {
    console.error("DB FIX AUDITLOG ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Onbekende fout bij DB-fix",
      },
      { status: 500 }
    );
  }
}
