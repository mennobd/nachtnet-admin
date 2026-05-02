import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiMutationUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const auth = await apiMutationUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const { routeId } = await params;

    const source = await prisma.route.findUnique({
      where: { id: routeId },
      select: {
        routeCode: true,
        title: true,
        lineNumber: true,
        direction: true,
        depot: true,
        category: true,
        notes: true,
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Route niet gevonden." },
        { status: 404 }
      );
    }

    // Find a unique routeCode by appending -copy, -copy-2, -copy-3, ...
    let newCode = `${source.routeCode}-copy`;
    let attempt = 1;
    while (await prisma.route.findUnique({ where: { routeCode: newCode }, select: { id: true } })) {
      attempt += 1;
      newCode = `${source.routeCode}-copy-${attempt}`;
    }

    const newRoute = await prisma.route.create({
      data: {
        routeCode: newCode,
        title: `${source.title} (kopie)`,
        lineNumber: source.lineNumber,
        direction: source.direction,
        depot: source.depot,
        category: source.category,
        notes: source.notes,
        status: "DRAFT",
      },
    });

    await writeAuditLog({
      action: "ROUTE_DUPLICATED",
      entity: "route",
      entityId: newRoute.id,
      metadata: { sourceRouteId: routeId, sourceRouteCode: source.routeCode, newRouteCode: newCode },
    });

    return NextResponse.json({ success: true, id: newRoute.id });
  } catch (error) {
    console.error("ROUTE DUPLICATE ERROR:", error);
    return NextResponse.json(
      { error: "Route dupliceren mislukt." },
      { status: 500 }
    );
  }
}
