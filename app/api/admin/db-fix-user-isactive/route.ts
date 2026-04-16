import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
    `);

    return NextResponse.json({
      success: true,
      message: 'Kolom "isActive" is toegevoegd aan de User-tabel.',
    });
  } catch (error) {
    console.error("DB FIX USER ISACTIVE ERROR:", error);

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
