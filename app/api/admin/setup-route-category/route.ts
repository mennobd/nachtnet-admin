import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

async function runSetup() {
  await requireAdmin();

  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "RouteCategory" AS ENUM ('REGULIER', 'OMLEIDING', 'CALAMITEIT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Route"
      ADD COLUMN IF NOT EXISTS "category" "RouteCategory" NOT NULL DEFAULT 'REGULIER';
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Route_category_idx"
      ON "Route"("category");
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SETUP ROUTE CATEGORY ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Setup routecategorie mislukt.",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return runSetup();
}

export async function GET() {
  return runSetup();
}
