import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await apiAdmin();
  if (auth instanceof NextResponse) return auth;

  const steps: string[] = [];
  const errors: string[] = [];

  const migrations: { label: string; sql: string }[] = [
    {
      label: "Create enum AccountChangeRequestType",
      sql: `DO $$ BEGIN CREATE TYPE "AccountChangeRequestType" AS ENUM ('EMAIL', 'ROLE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    },
    {
      label: "Create enum AccountChangeRequestStatus",
      sql: `DO $$ BEGIN CREATE TYPE "AccountChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    },
    {
      label: "Create table AccountChangeRequest",
      sql: `
        CREATE TABLE IF NOT EXISTS "AccountChangeRequest" (
          "id"             TEXT NOT NULL,
          "userId"         TEXT NOT NULL,
          "type"           "AccountChangeRequestType" NOT NULL,
          "requestedValue" TEXT NOT NULL,
          "reason"         TEXT,
          "status"         "AccountChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
          "rejectionReason" TEXT,
          "reviewedById"   TEXT,
          "reviewedAt"     TIMESTAMP(3),
          "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AccountChangeRequest_pkey" PRIMARY KEY ("id")
        )
      `,
    },
    {
      label: "Add FK AccountChangeRequest_userId_fkey",
      sql: `DO $$ BEGIN ALTER TABLE "AccountChangeRequest" ADD CONSTRAINT "AccountChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    },
    {
      label: "Add FK AccountChangeRequest_reviewedById_fkey",
      sql: `DO $$ BEGIN ALTER TABLE "AccountChangeRequest" ADD CONSTRAINT "AccountChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    },
    {
      label: "Create index AccountChangeRequest_userId_idx",
      sql: `CREATE INDEX IF NOT EXISTS "AccountChangeRequest_userId_idx" ON "AccountChangeRequest"("userId")`,
    },
    {
      label: "Create index AccountChangeRequest_status_idx",
      sql: `CREATE INDEX IF NOT EXISTS "AccountChangeRequest_status_idx" ON "AccountChangeRequest"("status")`,
    },
  ];

  for (const { label, sql } of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      steps.push(label);
    } catch (err) {
      errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ success: errors.length === 0, steps, errors });
}
