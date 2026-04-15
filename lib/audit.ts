import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function writeAuditLog({
  action,
  entity,
  entityId,
  metadata,
}: {
  action: string;
  entity: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    const user = await getCurrentUser();

    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        metadata,
        userId: user?.id ?? null,
      },
    });
  } catch (error) {
    console.error("AUDIT LOG ERROR:", error);
  }
}
