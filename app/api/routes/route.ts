import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { apiUser, apiMutationUser } from "@/lib/auth";

// GET → alle routes ophalen
export async function GET() {
  const auth = await apiUser();
  if (auth instanceof NextResponse) return auth;

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
  const auth = await apiMutationUser();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  try {
    const body = await request.json();

    const {
        routeCode,
        title,
        lineNumber,
        direction,
        depot,
        notes,
        category,
      } = body;
      
      const routeCategory =
        category === "OMLEIDING"
          ? "OMLEIDING"
          : category === "CALAMITEIT"
          ? "CALAMITEIT"
          : "REGULIER";
    
    if (!routeCode || !title || !lineNumber || !direction || !depot) {
      return NextResponse.json(
        { error: "Verplichte velden ontbreken" },
        { status: 400 }
      );
    }

    if (routeCode.length > 20) {
      return NextResponse.json({ error: "RouteCode mag maximaal 20 tekens bevatten." }, { status: 400 });
    }
    if (title.length > 200) {
      return NextResponse.json({ error: "Titel mag maximaal 200 tekens bevatten." }, { status: 400 });
    }
    if (lineNumber.length > 10) {
      return NextResponse.json({ error: "Lijnnummer mag maximaal 10 tekens bevatten." }, { status: 400 });
    }
    if (direction.length > 100) {
      return NextResponse.json({ error: "Richting mag maximaal 100 tekens bevatten." }, { status: 400 });
    }
    if (depot.length > 100) {
      return NextResponse.json({ error: "Depot mag maximaal 100 tekens bevatten." }, { status: 400 });
    }
    if (notes && String(notes).length > 500) {
      return NextResponse.json({ error: "Notities mogen maximaal 500 tekens bevatten." }, { status: 400 });
    }

    const route = await prisma.route.create({
      data: {
        routeCode,
        title,
        lineNumber,
        direction,
        depot,
        notes,
        category: routeCategory,
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
