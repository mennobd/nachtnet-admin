import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const auth = await apiAdmin();
  if (auth instanceof NextResponse) return auth;
  const admin = auth;

  const steps: string[] = [];

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserApprovalRequest"
        DROP CONSTRAINT IF EXISTS "UserApprovalRequest_reviewedById_fkey"
    `);
    steps.push("Dropped UserApprovalRequest_reviewedById_fkey (if existed)");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserApprovalRequest"
        ADD CONSTRAINT "UserApprovalRequest_reviewedById_fkey"
        FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    steps.push("Added UserApprovalRequest_reviewedById_fkey with ON DELETE SET NULL");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserApprovalRequest"
        DROP CONSTRAINT IF EXISTS "UserApprovalRequest_requestedById_fkey"
    `);
    steps.push("Dropped UserApprovalRequest_requestedById_fkey (if existed)");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserApprovalRequest"
        ADD CONSTRAINT "UserApprovalRequest_requestedById_fkey"
        FOREIGN KEY ("requestedById") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    `);
    steps.push("Added UserApprovalRequest_requestedById_fkey with ON DELETE RESTRICT");

    await writeAuditLog({
      action: "DB_MIGRATION_CASCADE_DELETES",
      entity: "database",
      entityId: "UserApprovalRequest",
      metadata: {
        steps,
        performedBy: admin.email,
      },
    });

    return NextResponse.json({ success: true, steps });
  } catch (error) {
    console.error("MIGRATE CASCADE DELETES ERROR:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Migratie mislukt.",
        completedSteps: steps,
      },
      { status: 500 }
    );
  }
}
