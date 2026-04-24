import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

async function runSetup() {
  await requireAdmin();

  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'RouteFile'
          AND column_name = 'category'
        ) THEN
          ALTER TABLE "RouteFile"
          ADD COLUMN "category" "RouteCategory" NOT NULL DEFAULT 'REGULIER';
        END IF;
      END
      $$;
    `);

    return NextResponse.json({
      success: true,
      message:
        "Kolom 'category' toegevoegd aan RouteFile, of bestond al.",
    });
  } catch (error) {
    console.error("ADD ROUTEFILE CATEGORY ERROR:", error);

    return NextResponse.json(
      {
        error: "Kolom toevoegen mislukt",
        details: error instanceof Error ? error.message : "Onbekende fout",
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
