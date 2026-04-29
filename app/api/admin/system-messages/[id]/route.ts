import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredMutationUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getRequiredMutationUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  const updated = await prisma.systemMessage.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getRequiredMutationUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.systemMessage.update({
    where: { id: params.id },
    data: { active: false },
  });

  return NextResponse.json(updated);
}
