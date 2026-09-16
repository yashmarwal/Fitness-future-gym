// One-time import of the old gym software's member data into
// legacy_fee_imports — see src/backend/services/legacyFeeImport.ts for how
// each row gets matched to a real member the moment they sign up.
//
// Usage:
//   node scripts/import-legacy-fees.mjs <file.xlsx|file.csv> [phoneCol] [startDateCol] [dueDateCol]
//
// Column names are optional — the script tries to auto-detect them from the
// sheet's headers (phone/mobile/contact, start/join date, due/end/expiry
// date). Run once WITHOUT --confirm first: it only prints what it found and
// a sample of parsed rows, so a wrong column guess or bad date format shows
// up before anything is written. Re-run with --confirm once the preview
// looks right.
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY — read from .env.local
// automatically, no need to export them yourself.

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

function loadEnvLocal() {
  const env = {};
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    // fall through to process.env below
  }
  return env;
}

const args = process.argv.slice(2).filter((a) => a !== "--confirm");
const confirm = process.argv.includes("--confirm");
const [filePath, phoneColArg, startColArg, dueColArg] = args;

if (!filePath) {
  console.error("Usage: node scripts/import-legacy-fees.mjs <file.xlsx|file.csv> [phoneCol] [startDateCol] [dueDateCol] [--confirm]");
  process.exit(1);
}

const envFile = loadEnvLocal();
const supabaseUrl = process.env.SUPABASE_URL || envFile.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (checked .env.local and the environment).");
  process.exit(1);
}

// Same normalization as src/backend/lib/phone.ts (that file is TS + "server
// only", so it's replicated here rather than imported).
function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  const trimmed = String(raw ?? "").trim();
  return trimmed.startsWith("+") ? `+${digits}` : `+91${digits}`;
}

// Deliberately does NOT use SheetJS's cellDates/native Date parsing — both
// proved actively dangerous on a test run: a plain "01/03/2026" (meant as 1
// March, DD/MM/YYYY) got silently read as MM/DD (3 Jan) AND then shifted a
// further day backward by .toISOString() converting a local-midnight Date
// through UTC (any UTC+ timezone, IST included, rolls the date back). Every
// date here is parsed explicitly and only two formats are ever accepted —
// anything else is reported as skipped for manual review rather than
// silently guessed at.
function toIsoDate(value) {
  if (value == null || value === "") return null;

  // A genuine Excel date-serial number (only possible from a true .xlsx
  // date-typed cell, never from CSV text) — Excel's epoch is 1899-12-30,
  // with its well-known leap-year bug already baked into the serial itself.
  if (typeof value === "number") {
    const utcMs = Date.UTC(1899, 11, 30) + value * 86400000;
    const date = new Date(utcMs);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }

  // Strip ALL whitespace (not just leading/trailing) and any stray trailing
  // separator — this file has real typos like "2026- 5-01" (space after a
  // dash) and "2026-09-10-" (trailing dash). Neither DD/MM/YYYY nor
  // YYYY-MM-DD ever legitimately contains a space or ends in a separator,
  // so removing both is safe and doesn't introduce any new ambiguity.
  const str = String(value).trim().replace(/\s+/g, "").replace(/[-/]+$/, "");

  // DD/MM/YYYY or DD-MM-YYYY — the Indian convention this old export uses.
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    if (Number(m) > 12) return null; // clearly not DD/MM after all — don't guess
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }

  // Already-ISO YYYY-MM-DD, unambiguous as-is. Month/day capture is widened
  // to 1-3 digits — this file also has typos like "2026-010-15" (an extra
  // leading zero before an otherwise-valid two-digit month); Number("010")
  // is just 10, so this recovers those for free, guarded by the range check
  // below rather than assuming every 3-digit group is a stray zero.
  const iso = str.match(/^(\d{4})-(\d{1,3})-(\d{1,3})$/);
  if (iso) {
    const [, y, mRaw, dRaw] = iso;
    const m = Number(mRaw);
    const d = Number(dRaw);
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const date = new Date(Date.UTC(Number(y), m - 1, d));
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }

  return null;
}

function findColumn(headers, explicit, candidates) {
  if (explicit) return explicit;
  const lower = headers.map((h) => h.toLowerCase());
  for (const candidate of candidates) {
    const idx = lower.findIndex((h) => h.includes(candidate));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

// A minimal RFC4180-ish CSV parser (quoted fields, escaped "" quotes,
// commas/newlines inside quotes) used instead of SheetJS for .csv files.
// This is deliberate, not a shortcut: SheetJS's CSV reader silently
// type-sniffs date-like text into Excel serial numbers as part of parsing
// itself — proven on a test run to have misread "01/03/2026" (meant 1
// March, DD/MM/YYYY) as MM/DD (3 Jan) before toIsoDate ever saw a string to
// apply its own, correct DD/MM/YYYY-first logic to. There's no flag to turn
// that sniffing off for CSV specifically, so every value here is kept as
// exactly the text the file contains, full stop.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((v) => v !== "")) rows.push(row);
  }
  const [header, ...dataRows] = rows;
  return dataRows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? null])));
}

const isCsv = /\.csv$/i.test(filePath);
let rows;
let sheetName;
if (isCsv) {
  rows = parseCsv(readFileSync(filePath, "utf8"));
  sheetName = "(CSV)";
} else {
  // XLSX.readFile() relies on the library's internal `_fs` reference, which
  // the ESM build (unlike the CJS one) never auto-wires to Node's real `fs`
  // module — it silently throws "Cannot access file" instead. Reading the
  // buffer ourselves and handing it to XLSX.read() sidesteps that entirely.
  // cellDates/raw stay off/true so real date-typed cells come through as
  // plain numeric Excel serials (unambiguous — see toIsoDate) rather than
  // locale-guessed Date objects.
  const fileBuffer = readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { cellDates: false, type: "buffer" });
  sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
}

if (rows.length === 0) {
  console.error(`No rows found in sheet "${sheetName}".`);
  process.exit(1);
}

const headers = Object.keys(rows[0]);
console.log(`Sheet: "${sheetName}" — ${rows.length} rows, headers:`, headers);

const phoneCol = findColumn(headers, phoneColArg, ["phone", "mobile", "contact"]);
const startCol = findColumn(headers, startColArg, ["start", "join", "from"]);
const dueCol = findColumn(headers, dueColArg, ["due", "end", "expiry", "expire", "renewal", "to"]);

console.log(`\nDetected columns — phone: ${phoneCol ?? "NOT FOUND"}, start date: ${startCol ?? "NOT FOUND"}, due date: ${dueCol ?? "NOT FOUND"}`);
if (!phoneCol || !startCol || !dueCol) {
  console.error("\nCouldn't confidently detect all 3 columns. Re-run passing them explicitly:");
  console.error("  node scripts/import-legacy-fees.mjs <file> \"<phone header>\" \"<start header>\" \"<due header>\"");
  process.exit(1);
}

const parsed = [];
const skipped = [];
const seenPhones = new Map(); // last occurrence wins, matching legacy_fee_imports' unique phone constraint

for (const row of rows) {
  const phone = normalizePhone(row[phoneCol]);
  const startDate = toIsoDate(row[startCol]);
  const dueDate = toIsoDate(row[dueCol]);

  if (!/^\+\d{10,15}$/.test(phone) || !startDate || !dueDate) {
    skipped.push({ row, phone, startDate, dueDate });
    continue;
  }
  seenPhones.set(phone, { phone, start_date: startDate, fee_due_date: dueDate });
}
parsed.push(...seenPhones.values());

console.log(`\nParsed ${parsed.length} usable rows (${seenPhones.size} unique phones), skipped ${skipped.length} rows (missing/unparseable phone or date).`);
console.log("\nSample of first 5 parsed rows:");
console.table(parsed.slice(0, 5));
if (skipped.length > 0) {
  console.log(`\nSample of first 5 skipped rows (check these manually):`);
  console.table(skipped.slice(0, 5).map((s) => ({ phone: s.phone, startDate: s.startDate, dueDate: s.dueDate, raw: JSON.stringify(s.row).slice(0, 120) })));
}

if (!confirm) {
  console.log("\nDry run only — nothing written. Re-run with --confirm to actually import.");
  process.exit(0);
}

const db = createClient(supabaseUrl, serviceRoleKey);

console.log(`\nWriting ${parsed.length} rows to legacy_fee_imports...`);
const BATCH_SIZE = 500;
for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
  const chunk = parsed.slice(i, i + BATCH_SIZE);
  const { error } = await db.from("legacy_fee_imports").upsert(chunk, { onConflict: "phone" });
  if (error) {
    console.error(`Failed writing batch starting at row ${i}:`, error.message);
    process.exit(1);
  }
  console.log(`  wrote rows ${i + 1}-${i + chunk.length}`);
}

const { error: batchError } = await db.from("legacy_fee_import_batches").insert({ total_rows: parsed.length });
if (batchError) {
  console.error("Rows were imported, but failed to record the import batch (admin status card won't show):", batchError.message);
  process.exit(1);
}

console.log(`\nDone. ${parsed.length} legacy records loaded — they'll be matched automatically as members sign up, and auto-deleted after 6 months if unmatched.`);
