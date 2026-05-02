import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await apiUser();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action")?.trim() || undefined;
  const entity = searchParams.get("entity")?.trim() || undefined;
  const from = searchParams.get("from")?.trim() || undefined;
  const to = searchParams.get("to")?.trim() || undefined;
  const format = searchParams.get("format");

  const where = {
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
    ...(entity ? { entity: { equals: entity } } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
          },
        }
      : {}),
  };

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  if (format === "csv") {
    const header = "Tijdstip,Actie,Entiteit,Entiteit ID,Gebruiker,E-mail\n";
    const rows = logs
      .map((log) => {
        const ts = new Date(log.createdAt).toLocaleString("nl-NL");
        const user = log.user?.name ?? "Onbekend";
        const email = log.user?.email ?? "";
        return [ts, log.action, log.entity, log.entityId, user, email]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",");
      })
      .join("\n");

    return new Response(header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="auditlog-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(logs);
}
