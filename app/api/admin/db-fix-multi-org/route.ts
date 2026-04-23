import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserOrganizationAccess" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserOrganizationAccess_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UserOrganizationAccess_userId_organizationId_key"
      ON "UserOrganizationAccess"("userId", "organizationId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "UserOrganizationAccess_userId_idx"
      ON "UserOrganizationAccess"("userId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "UserOrganizationAccess_organizationId_idx"
      ON "UserOrganizationAccess"("organizationId");
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'UserOrganizationAccess_userId_fkey'
        ) THEN
          ALTER TABLE "UserOrganizationAccess"
          ADD CONSTRAINT "UserOrganizationAccess_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'UserOrganizationAccess_organizationId_fkey'
        ) THEN
          ALTER TABLE "UserOrganizationAccess"
          ADD CONSTRAINT "UserOrganizationAccess_organizationId_fkey"
          FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END
      $$;
    `);

    return NextResponse.json({
      success: true,
      message: "Multi-org access tabel en constraints zijn aangemaakt.",
    });
  } catch (error) {
    console.error("DB FIX MULTI ORG ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Onbekende fout",
      },
      { status: 500 }
    );
  }
}
