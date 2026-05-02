import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function POST() {
  const auth = await apiUser();
  if (auth instanceof NextResponse) return auth;

  await prisma.notification.updateMany({
    where: { userId: auth.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
