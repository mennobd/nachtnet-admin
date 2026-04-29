import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredMutationUser } from "@/lib/auth";

export async function GET() {
  const user = await getRequiredMutationUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await prisma.systemMessage.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const user = await getRequiredMutationUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  const created = await prisma.systemMessage.create({
    data: {
      ...body,
      createdBy: user.email,
    },
  });

  return NextResponse.json(created);
}
