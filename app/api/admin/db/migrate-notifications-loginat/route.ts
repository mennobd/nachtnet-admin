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
      label: "Add lastLoginAt column to User",
      sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3)`,
    },
    {
      label: "Create table Notification",
      sql: `
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id"        TEXT NOT NULL,
          "userId"    TEXT NOT NULL,
          "message"   TEXT NOT NULL,
          "link"      TEXT,
          "read"      BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
        )
      `,
    },
    {
      label: "Add FK Notification_userId_fkey",
      sql: `DO $$ BEGIN ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    },
    {
      label: "Create index Notification_userId_read_idx",
      sql: `CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read")`,
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
