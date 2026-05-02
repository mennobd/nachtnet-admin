import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { apiMutationUser, getRequiredMutationUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const auth = await apiMutationUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const { routeId } = await params;
    const body = await request.json();

    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) {
      return NextResponse.json({ error: "Route niet gevonden." }, { status: 404 });
    }

    const title = String(body.title ?? route.title).trim();
    const lineNumber = String(body.lineNumber ?? route.lineNumber).trim();
    const direction = String(body.direction ?? route.direction).trim();
    const depot = String(body.depot ?? route.depot).trim();
    const notes = body.notes !== undefined ? String(body.notes).trim() || null : route.notes;
    const rawCategory = String(body.category ?? route.category);
    const category =
      rawCategory === "OMLEIDING" ? "OMLEIDING" :
      rawCategory === "CALAMITEIT" ? "CALAMITEIT" : "REGULIER";
    const rawStatus = String(body.status ?? route.status);
    const status =
      rawStatus === "PUBLISHED" ? "PUBLISHED" :
      rawStatus === "ARCHIVED" ? "ARCHIVED" : "DRAFT";

    if (!title || !lineNumber || !direction || !depot) {
      return NextResponse.json({ error: "Verplichte velden ontbreken." }, { status: 400 });
    }
    if (title.length > 200) return NextResponse.json({ error: "Titel mag maximaal 200 tekens bevatten." }, { status: 400 });
    if (lineNumber.length > 10) return NextResponse.json({ error: "Lijnnummer mag maximaal 10 tekens bevatten." }, { status: 400 });
    if (direction.length > 100) return NextResponse.json({ error: "Richting mag maximaal 100 tekens bevatten." }, { status: 400 });
    if (depot.length > 100) return NextResponse.json({ error: "Depot mag maximaal 100 tekens bevatten." }, { status: 400 });
    if (notes && notes.length > 500) return NextResponse.json({ error: "Notities mogen maximaal 500 tekens bevatten." }, { status: 400 });

    const updated = await prisma.route.update({
      where: { id: routeId },
      data: { title, lineNumber, direction, depot, notes, category, status },
    });

    await writeAuditLog({
      action: "ROUTE_UPDATED",
      entity: "route",
      entityId: routeId,
      metadata: {
        routeCode: route.routeCode,
        changes: {
          title: title !== route.title ? { from: route.title, to: title } : undefined,
          lineNumber: lineNumber !== route.lineNumber ? { from: route.lineNumber, to: lineNumber } : undefined,
          direction: direction !== route.direction ? { from: route.direction, to: direction } : undefined,
          depot: depot !== route.depot ? { from: route.depot, to: depot } : undefined,
          category: category !== route.category ? { from: route.category, to: category } : undefined,
          status: status !== route.status ? { from: route.status, to: status } : undefined,
        },
        performedBy: auth.email,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("ROUTE UPDATE ERROR:", error);
    return NextResponse.json({ error: "Route bijwerken mislukt." }, { status: 500 });
  }
}

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
