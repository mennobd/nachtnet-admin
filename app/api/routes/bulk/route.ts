import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiMutationUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const auth = await apiMutationUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const action = String(body.action ?? "");
    const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "Geen routes geselecteerd." }, { status: 400 });
    }
    if (ids.length > 100) {
      return NextResponse.json({ error: "Maximaal 100 routes per keer." }, { status: 400 });
    }

    if (action === "ARCHIVE") {
      await prisma.route.updateMany({
        where: { id: { in: ids } },
        data: { status: "ARCHIVED" },
      });
      await writeAuditLog({
        action: "ROUTES_BULK_ARCHIVED",
        entity: "route",
        entityId: "bulk",
        metadata: { ids, count: ids.length, performedBy: auth.email },
      });
      return NextResponse.json({ success: true, updated: ids.length });
    }

    if (action === "SET_STATUS") {
      const rawStatus = String(body.status ?? "");
      const status =
        rawStatus === "PUBLISHED" ? "PUBLISHED" :
        rawStatus === "ARCHIVED" ? "ARCHIVED" : "DRAFT";
      await prisma.route.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });
      await writeAuditLog({
        action: "ROUTES_BULK_STATUS_CHANGED",
        entity: "route",
        entityId: "bulk",
        metadata: { ids, count: ids.length, status, performedBy: auth.email },
      });
      return NextResponse.json({ success: true, updated: ids.length });
    }

    if (action === "SET_DEPOT") {
      const depot = String(body.depot ?? "").trim();
      const validDepots = ["Zuid", "Kleiweg", "Krimpen", "NACHTNET"];
      if (!validDepots.includes(depot)) {
        return NextResponse.json({ error: "Ongeldige vestiging." }, { status: 400 });
      }
      await prisma.route.updateMany({
        where: { id: { in: ids } },
        data: { depot },
      });
      await writeAuditLog({
        action: "ROUTES_BULK_DEPOT_CHANGED",
        entity: "route",
        entityId: "bulk",
        metadata: { ids, count: ids.length, depot, performedBy: auth.email },
      });
      return NextResponse.json({ success: true, updated: ids.length });
    }

    return NextResponse.json({ error: "Onbekende actie." }, { status: 400 });
  } catch (error) {
    console.error("BULK ROUTE ERROR:", error);
    return NextResponse.json({ error: "Bulk actie mislukt." }, { status: 500 });
  }
}
