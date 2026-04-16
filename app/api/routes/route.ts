import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { getRequiredMutationUser } from "@/lib/auth";

// GET → alle routes ophalen
export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(routes);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Fout bij ophalen routes" },
      { status: 500 }
    );
  }
}

// POST → nieuwe route aanmaken
export async function POST(request: Request) {
  try {
    const user = await getRequiredMutationUser();

if (!user) {
  return NextResponse.json(
    { error: "Geen rechten voor deze actie." },
    { status: 403 }
  );
}
    const body = await request.json();

    const {
      routeCode,
      title,
      lineNumber,
      direction,
      depot,
      notes,
    } = body;

    // simpele validatie
    if (!routeCode || !title || !lineNumber || !direction || !depot) {
      return NextResponse.json(
        { error: "Verplichte velden ontbreken" },
        { status: 400 }
      );
    }

    const route = await prisma.route.create({
      data: {
        routeCode,
        title,
        lineNumber,
        direction,
        depot,
        notes,
      },
    });

    await writeAuditLog({
        action: "ROUTE_CREATED",
        entity: "route",
        entityId: route.id,
        metadata: {
          routeCode: route.routeCode,
          title: route.title,
          lineNumber: route.lineNumber,
          depot: route.depot,
        },
      });

    return NextResponse.json(route);
  } catch (error: any) {
    console.error(error);

    // duplicate routeCode
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "RouteCode bestaat al" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Fout bij aanmaken route" },
      { status: 500 }
    );
  }
}
