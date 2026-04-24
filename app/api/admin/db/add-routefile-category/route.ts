import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST() {
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

    return Response.json({
      success: true,
      message: "Kolom 'category' toegevoegd aan RouteFile (indien nog niet aanwezig).",
    });
  } catch (error) {
    console.error("ADD ROUTEFILE CATEGORY ERROR:", error);

    return new Response(
      JSON.stringify({
        error: "Kolom toevoegen mislukt",
        details: error instanceof Error ? error.message : "Onbekende fout",
      }),
      { status: 500 }
    );
  }
}
