export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await requireAdmin();

  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "SystemMessageSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "SystemMessageTargetDepot" AS ENUM ('ALL', 'ZUID', 'KLEIWEG', 'NACHTNET');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SystemMessage"
      ALTER COLUMN "severity" DROP DEFAULT;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SystemMessage"
      ALTER COLUMN "targetDepot" DROP DEFAULT;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SystemMessage"
      ALTER COLUMN "severity"
      TYPE "SystemMessageSeverity"
      USING "severity"::text::"SystemMessageSeverity";
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SystemMessage"
      ALTER COLUMN "targetDepot"
      TYPE "SystemMessageTargetDepot"
      USING "targetDepot"::text::"SystemMessageTargetDepot";
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SystemMessage"
      ALTER COLUMN "severity"
      SET DEFAULT 'INFO'::"SystemMessageSeverity";
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SystemMessage"
      ALTER COLUMN "targetDepot"
      SET DEFAULT 'ALL'::"SystemMessageTargetDepot";
    `);

    return NextResponse.json({
      success: true,
      message: "SystemMessage enums hersteld.",
    });
  } catch (error) {
    console.error("FIX SYSTEM MESSAGE ENUMS ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Enum herstel mislukt.",
      },
      { status: 500 }
    );
  }
}      TYPE "public"."SystemMessageTargetDepot"
      USING "targetDepot"::"public"."SystemMessageTargetDepot";
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SystemMessage"
      ALTER COLUMN "severity"
      SET DEFAULT 'INFO'::"public"."SystemMessageSeverity";
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SystemMessage"
      ALTER COLUMN "targetDepot"
      SET DEFAULT 'ALL'::"public"."SystemMessageTargetDepot";
    `);

    return NextResponse.json({
      success: true,
      message: "SystemMessage enums hersteld.",
    });
  } catch (error) {
    console.error("FIX SYSTEM MESSAGE ENUMS ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Enum herstel mislukt.",
      },
      { status: 500 }
    );
  }
}
