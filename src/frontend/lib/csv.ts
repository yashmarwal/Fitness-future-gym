// Client-side CSV export, shared by every admin list that offers a
// "Download CSV" button (Members, Fees, ...). No backend route needed —
// the data's already loaded into the page as props/state, so this just
// turns the CURRENT (filtered/searched) view into a file, which is more
// useful than always exporting the full unfiltered table.

// A value needing quotes: contains a comma, quote, or newline. Embedded
// quotes are doubled per RFC 4180, the rest passed through as-is.
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function downloadCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns: { key: keyof T; label: string }[]
): void {
  const header = columns.map((c) => csvCell(c.label)).join(",");
  const body = rows.map((row) => columns.map((c) => csvCell(row[c.key])).join(",")).join("\n");
  // ﻿: a UTF-8 BOM so Excel (the overwhelmingly likely opener for a
  // gym admin's CSV) renders ₹ and other non-ASCII characters correctly
  // instead of mangling them — plain UTF-8 without it is routinely
  // misread as the system codepage by Excel specifically.
  const csv = "﻿" + header + "\n" + body;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
