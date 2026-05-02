import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { apiAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await apiAdmin();
  if (auth instanceof NextResponse) return auth;
  const admin = auth;

  const steps: string[] = [];

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId")`
    );
    steps.push('Created index AuditLog_userId_idx');

    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`
    );
    steps.push('Created index AuditLog_createdAt_idx');

    await writeAuditLog({
      action: "DB_MIGRATION_AUDIT_INDEXES",
      entity: "AuditLog",
      entityId: "migration",
      metadata: { steps, performedBy: admin.email },
    });

    return NextResponse.json({ success: true, steps });
  } catch (error) {
    console.error("MIGRATE AUDIT INDEXES ERROR:", error);

    return NextResponse.json(
      { error: "Migratie mislukt.", completedSteps: steps },
      { status: 500 }
    );
  }
}
