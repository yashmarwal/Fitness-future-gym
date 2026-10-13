import "server-only";

// Server-side counterpart to frontend/lib/csv.ts — that one triggers a
// browser download (Blob/URL.createObjectURL), which doesn't exist here;
// this returns the CSV as a string instead, for attaching to an email. The
// only thing that has to actually match between the two is the escaping
// rule, so it's duplicated rather than shared across the frontend/backend
// boundary.
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const header = columns.map((c) => csvCell(c.label)).join(",");
  const body = rows.map((row) => columns.map((c) => csvCell(row[c.key])).join(",")).join("\n");
  // UTF-8 BOM so Excel renders ₹ correctly instead of mangling it — same
  // reasoning as the client-side export.
  return "﻿" + header + "\n" + body;
}
