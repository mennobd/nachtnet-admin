import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiMutationUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nonEmpty = lines.filter((l) => l.trim() !== "");
  if (nonEmpty.length < 2) return [];

  const headers = splitCSVLine(nonEmpty[0]).map((h) => h.trim().toLowerCase());
  return nonEmpty.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    return row;
  });
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

const VALID_DEPOTS = ["Zuid", "Kleiweg", "Krimpen", "NACHTNET"];
const VALID_CATEGORIES = ["REGULIER", "OMLEIDING", "CALAMITEIT"];
const REQUIRED = ["routecode", "title", "linenumber", "direction", "depot"];

export async function POST(request: Request) {
  const auth = await apiMutationUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Geen bestand ontvangen." }, { status: 400 });
    }
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Alleen CSV-bestanden zijn toegestaan." }, { status: 400 });
    }
    if (file.size > 512 * 1024) {
      return NextResponse.json({ error: "Bestand is te groot (max 512 KB)." }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV is leeg of bevat geen dataregels." }, { status: 400 });
    }
    if (rows.length > 500) {
      return NextResponse.json({ error: "Maximaal 500 regels per import." }, { status: 400 });
    }

    const errors: string[] = [];
    const valid: {
      routeCode: string; title: string; lineNumber: string;
      direction: string; depot: string; category: string; notes: string | null;
    }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const line = i + 2;

      const missing = REQUIRED.filter((k) => !row[k]);
      if (missing.length > 0) {
        errors.push(`Regel ${line}: ontbrekende velden: ${missing.join(", ")}`);
        continue;
      }

      const routeCode = row["routecode"];
      const title = row["title"];
      const lineNumber = row["linenumber"];
      const direction = row["direction"];
      const depot = row["depot"];
      const rawCat = (row["category"] ?? "REGULIER").toUpperCase();
      const category = VALID_CATEGORIES.includes(rawCat) ? rawCat : "REGULIER";
      const notes = row["notes"] || null;

      if (routeCode.length > 20) { errors.push(`Regel ${line}: routeCode te lang (max 20)`); continue; }
      if (title.length > 200) { errors.push(`Regel ${line}: title te lang (max 200)`); continue; }
      if (lineNumber.length > 10) { errors.push(`Regel ${line}: lineNumber te lang (max 10)`); continue; }
      if (direction.length > 100) { errors.push(`Regel ${line}: direction te lang (max 100)`); continue; }
      if (!VALID_DEPOTS.includes(depot)) {
        errors.push(`Regel ${line}: ongeldige depot "${depot}" (kies uit: ${VALID_DEPOTS.join(", ")})`);
        continue;
      }
      if (notes && notes.length > 500) { errors.push(`Regel ${line}: notes te lang (max 500)`); continue; }

      valid.push({ routeCode, title, lineNumber, direction, depot, category, notes });
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validatiefouten gevonden.", errors }, { status: 422 });
    }

    const existingCodes = await prisma.route.findMany({
      where: { routeCode: { in: valid.map((r) => r.routeCode) } },
      select: { routeCode: true },
    });
    const taken = new Set(existingCodes.map((r) => r.routeCode));
    const duplicates = valid.filter((r) => taken.has(r.routeCode));

    if (duplicates.length > 0) {
      return NextResponse.json({
        error: "Sommige routecodes bestaan al.",
        errors: duplicates.map((r) => `RouteCode "${r.routeCode}" bestaat al`),
      }, { status: 422 });
    }

    const created = await prisma.route.createMany({
      data: valid.map((r) => ({
        routeCode: r.routeCode,
        title: r.title,
        lineNumber: r.lineNumber,
        direction: r.direction,
        depot: r.depot,
        category: r.category as "REGULIER" | "OMLEIDING" | "CALAMITEIT",
        notes: r.notes,
      })),
    });

    await writeAuditLog({
      action: "ROUTES_IMPORTED_CSV",
      entity: "route",
      entityId: "bulk",
      metadata: {
        count: created.count,
        routeCodes: valid.map((r) => r.routeCode),
        performedBy: auth.email,
      },
    });

    return NextResponse.json({ success: true, created: created.count });
  } catch (error) {
    console.error("CSV IMPORT ERROR:", error);
    return NextResponse.json({ error: "Import mislukt." }, { status: 500 });
  }
}
