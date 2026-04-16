import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'UserRole' AND e.enumlabel = 'VIEWER'
        ) THEN
          ALTER TYPE "UserRole" ADD VALUE 'VIEWER';
        END IF;
      END
      $$;
    `);

    return NextResponse.json({
      success: true,
      message: "VIEWER toegevoegd aan UserRole enum.",
    });
  } catch (error) {
    console.error("DB FIX VIEWER ROLE ERROR:", error);

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
