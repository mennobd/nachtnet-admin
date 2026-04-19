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
          WHERE t.typname = 'UserRole'
          AND e.enumlabel = 'ORG_ADMIN'
        ) THEN
          ALTER TYPE "UserRole" ADD VALUE 'ORG_ADMIN';
        END IF;
      END
      $$;
    `);

    return NextResponse.json({
      success: true,
      message: 'Enumwaarde ORG_ADMIN is toegevoegd aan UserRole.',
    });
  } catch (error) {
    console.error("DB FIX USERROLE ORG_ADMIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Onbekende fout",
      },
      { status: 500 }
    );
  }
}
