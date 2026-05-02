import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import { apiMutationUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const s3 = new S3Client({
  region: process.env.BUCKET_REGION || "auto",
  endpoint: process.env.BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nonEmpty = lines.filter((l) => l.trim() !== "");
  if (nonEmpty.length < 2) return [];
  const headers = splitCSVLine(nonEmpty[0]).map((h) => h.trim().toLowerCase());
  return nonEmpty.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? "").trim(); });
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
      result.push(current); current = "";
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

function getPriority(category: string) {
  if (category === "CALAMITEIT") return 10;
  if (category === "OMLEIDING") return 50;
  return 100;
}

export async function POST(request: Request) {
  const auth = await apiMutationUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Geen bestand ontvangen." }, { status: 400 });

    const isZip = file.name.endsWith(".zip");
    const isCsv = file.name.endsWith(".csv");
    if (!isZip && !isCsv) {
      return NextResponse.json({ error: "Alleen .csv of .zip bestanden zijn toegestaan." }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Bestand is te groot (max 50 MB)." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let csvText = "";
    const gpxFiles = new Map<string, Buffer>(); // filename → buffer

    if (isZip) {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      const csvEntry = entries.find((e) => e.entryName.endsWith(".csv") && !e.isDirectory);
      if (!csvEntry) {
        return NextResponse.json({ error: "Geen .csv bestand gevonden in het ZIP-archief." }, { status: 400 });
      }
      csvText = csvEntry.getData().toString("utf8");

      for (const entry of entries) {
        if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith(".gpx")) {
          const name = entry.entryName.split("/").pop()!;
          gpxFiles.set(name, entry.getData());
        }
      }
    } else {
      csvText = buffer.toString("utf8");
    }

    const rows = parseCSV(csvText);
    if (rows.length === 0) return NextResponse.json({ error: "CSV is leeg of bevat geen dataregels." }, { status: 400 });
    if (rows.length > 500) return NextResponse.json({ error: "Maximaal 500 regels per import." }, { status: 400 });

    const errors: string[] = [];
    type ValidRow = {
      routeCode: string; title: string; lineNumber: string;
      direction: string; depot: string; category: string; notes: string | null;
      gpxFile: string | null; gpxBuffer: Buffer | null;
    };
    const valid: ValidRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const line = i + 2;

      const missing = REQUIRED.filter((k) => !row[k]);
      if (missing.length > 0) { errors.push(`Regel ${line}: ontbrekende velden: ${missing.join(", ")}`); continue; }

      const routeCode = row["routecode"];
      const title = row["title"];
      const lineNumber = row["linenumber"];
      const direction = row["direction"];
      const depot = row["depot"];
      const rawCat = (row["category"] ?? "REGULIER").toUpperCase();
      const category = VALID_CATEGORIES.includes(rawCat) ? rawCat : "REGULIER";
      const notes = row["notes"] || null;
      const gpxFileName = row["gpxfile"] || null;

      if (routeCode.length > 20) { errors.push(`Regel ${line}: routeCode te lang (max 20)`); continue; }
      if (title.length > 200) { errors.push(`Regel ${line}: title te lang (max 200)`); continue; }
      if (lineNumber.length > 10) { errors.push(`Regel ${line}: lineNumber te lang (max 10)`); continue; }
      if (direction.length > 100) { errors.push(`Regel ${line}: direction te lang (max 100)`); continue; }
      if (!VALID_DEPOTS.includes(depot)) { errors.push(`Regel ${line}: ongeldige depot "${depot}"`); continue; }
      if (notes && notes.length > 500) { errors.push(`Regel ${line}: notes te lang (max 500)`); continue; }

      let gpxBuffer: Buffer | null = null;
      if (gpxFileName) {
        gpxBuffer = gpxFiles.get(gpxFileName) ?? null;
        if (!gpxBuffer) {
          errors.push(`Regel ${line}: GPX-bestand "${gpxFileName}" niet gevonden in het ZIP-archief`);
          continue;
        }
      }

      valid.push({ routeCode, title, lineNumber, direction, depot, category, notes, gpxFile: gpxFileName, gpxBuffer });
    }

    if (errors.length > 0) return NextResponse.json({ error: "Validatiefouten gevonden.", errors }, { status: 422 });

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

    let createdCount = 0;
    let filesUploaded = 0;

    for (const row of valid) {
      const route = await prisma.route.create({
        data: {
          routeCode: row.routeCode,
          title: row.title,
          lineNumber: row.lineNumber,
          direction: row.direction,
          depot: row.depot,
          category: row.category as "REGULIER" | "OMLEIDING" | "CALAMITEIT",
          notes: row.notes,
        },
      });
      createdCount++;

      if (row.gpxBuffer && row.gpxFile) {
        const checksum = crypto.createHash("sha256").update(row.gpxBuffer).digest("hex");
        const sanitized = row.gpxFile.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
        const version = `1.0.${checksum.slice(0, 8)}`;
        const storageKey = `routes/${route.id}/${checksum.slice(0, 16)}-${sanitized}`;

        await s3.send(new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: storageKey,
          Body: row.gpxBuffer,
          ContentType: "application/gpx+xml",
        }));

        await prisma.routeFile.create({
          data: {
            routeId: route.id,
            fileName: sanitized,
            storageKey,
            checksum,
            version,
            category: row.category as "REGULIER" | "OMLEIDING" | "CALAMITEIT",
          },
        });

        filesUploaded++;
      }
    }

    await writeAuditLog({
      action: "ROUTES_IMPORTED_CSV",
      entity: "route",
      entityId: "bulk",
      metadata: {
        count: createdCount,
        filesUploaded,
        routeCodes: valid.map((r) => r.routeCode),
        performedBy: auth.email,
      },
    });

    return NextResponse.json({ success: true, created: createdCount, filesUploaded });
  } catch (error) {
    console.error("CSV IMPORT ERROR:", error);
    return NextResponse.json({ error: "Import mislukt." }, { status: 500 });
  }
}
