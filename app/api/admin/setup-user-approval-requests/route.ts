import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST() {
  await requireAdmin();

  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "UserApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserApprovalRequest" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "requestedRole" "UserRole" NOT NULL DEFAULT 'VIEWER',
        "organizationId" TEXT NOT NULL,
        "requestedById" TEXT NOT NULL,
        "status" "UserApprovalStatus" NOT NULL DEFAULT 'PENDING',
        "reviewedById" TEXT,
        "reviewedAt" TIMESTAMP(3),
        "rejectionReason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "UserApprovalRequest_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserApprovalRequest"
      ADD CONSTRAINT IF NOT EXISTS "UserApprovalRequest_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserApprovalRequest"
      ADD CONSTRAINT IF NOT EXISTS "UserApprovalRequest_requestedById_fkey"
      FOREIGN KEY ("requestedById") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserApprovalRequest"
      ADD CONSTRAINT IF NOT EXISTS "UserApprovalRequest_reviewedById_fkey"
      FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "UserApprovalRequest_status_idx"
      ON "UserApprovalRequest"("status");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "UserApprovalRequest_organizationId_idx"
      ON "UserApprovalRequest"("organizationId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "UserApprovalRequest_requestedById_idx"
      ON "UserApprovalRequest"("requestedById");
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SETUP USER APPROVAL REQUESTS ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Setup gebruikersaanvragen mislukt.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
