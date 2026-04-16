import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { getRequiredMutationUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const user = await getRequiredMutationUser();

  if (!user) {
    return NextResponse.json(
      { error: "Geen rechten voor deze actie." },
      { status: 403 }
    );
  }

  try {
    const { routeId } = await params;

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: {
        id: true,
        routeCode: true,
        title: true,
      },
    });

    if (!route) {
      return NextResponse.json(
        { error: "Route niet gevonden." },
        { status: 404 }
      );
    }

    await prisma.manifestEntry.deleteMany({
      where: { routeId },
    });

    await prisma.routeFile.deleteMany({
      where: { routeId },
    });

    await prisma.route.delete({
      where: { id: routeId },
    });

    await writeAuditLog({
      action: "ROUTE_DELETED",
      entity: "route",
      entityId: routeId,
      metadata: {
        routeCode: route.routeCode,
        title: route.title,
        performedBy: user.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Verwijderen van route mislukt." },
      { status: 500 }
    );
  }
}
