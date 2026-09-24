import type { ReactNode } from "react";

// A small, purpose-built renderer for the admin AI assistant's replies —
// not a general markdown engine (no dependency pulled in for it). It only
// covers what the model actually produces: **bold**, GFM-style pipe
// tables, simple bullet/numbered lists, and `#`/`##`/`###` headings. Plain
// text falls straight through as a single paragraph, so it's a strict
// upgrade over the old raw whitespace-pre-wrap dump, never worse.

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== "");
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-on-surface">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  );
}

function isTableSeparatorRow(line: string): boolean {
  return line.includes("-") && /^\s*\|?[\s:|-]+\|?\s*$/.test(line);
}

function splitTableRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|")) row = row.slice(0, -1);
  return row.split("|").map((cell) => cell.trim());
}

function isListLine(line: string): boolean {
  return /^\s*([-*]|\d+\.)\s+/.test(line);
}

function renderTable(rowLines: string[], key: string): ReactNode {
  const header = splitTableRow(rowLines[0]);
  const rows = rowLines.slice(2).map(splitTableRow);
  return (
    <div key={key} className="overflow-x-auto rounded-xl border border-surface-variant/40">
      <table className="w-full min-w-[420px] text-left border-collapse text-xs">
        <thead>
          <tr className="bg-surface-container-high">
            {header.map((cell, i) => (
              <th
                key={i}
                className="px-3 py-2 font-label text-[10px] uppercase tracking-wide text-primary-container whitespace-nowrap"
              >
                {renderInline(cell, `h${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-variant/30">
          {rows.map((cells, r) => (
            <tr key={r} className={r % 2 === 1 ? "bg-surface-container/40" : ""}>
              {cells.map((cell, c) => (
                <td key={c} className="px-3 py-2 align-top">
                  {renderInline(cell, `r${r}c${c}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function renderChatContent(content: string): ReactNode {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // GFM table — a "| ... |" row immediately followed by a "|---|---|" separator.
    if (line.trim().startsWith("|") && i + 1 < lines.length && isTableSeparatorRow(lines[i + 1])) {
      const rowLines = [line, lines[i + 1]];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        rowLines.push(lines[j]);
        j++;
      }
      blocks.push(renderTable(rowLines, `t${key++}`));
      i = j;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizeClass = level === 1 ? "text-base" : level === 2 ? "text-sm" : "text-xs";
      blocks.push(
        <p key={`h${key++}`} className={`font-label uppercase tracking-wide text-on-surface font-bold ${sizeClass}`}>
          {renderInline(headingMatch[2], `hd${key}`)}
        </p>
      );
      i++;
      continue;
    }

    if (isListLine(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      let j = i;
      while (j < lines.length && isListLine(lines[j])) {
        items.push(lines[j].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        j++;
      }
      blocks.push(
        ordered ? (
          <ol key={`l${key++}`} className="list-decimal pl-5 flex flex-col gap-0.5">
            {items.map((item, idx) => (
              <li key={idx}>{renderInline(item, `li${idx}`)}</li>
            ))}
          </ol>
        ) : (
          <ul key={`l${key++}`} className="list-disc pl-5 flex flex-col gap-0.5">
            {items.map((item, idx) => (
              <li key={idx}>{renderInline(item, `li${idx}`)}</li>
            ))}
          </ul>
        )
      );
      i = j;
      continue;
    }

    // Paragraph — consecutive plain lines, joined with real line breaks,
    // stopping as soon as the next special block (table/heading/list) starts.
    const paraLines: string[] = [];
    let j = i;
    while (
      j < lines.length &&
      lines[j].trim() !== "" &&
      !isListLine(lines[j]) &&
      !/^#{1,3}\s+/.test(lines[j]) &&
      !(lines[j].trim().startsWith("|") && j + 1 < lines.length && isTableSeparatorRow(lines[j + 1]))
    ) {
      paraLines.push(lines[j]);
      j++;
    }
    blocks.push(
      <p key={`p${key++}`}>
        {paraLines.map((l, idx) => (
          <span key={idx}>
            {renderInline(l, `pl${idx}`)}
            {idx < paraLines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
    i = j;
  }

  return <div className="flex flex-col gap-2">{blocks}</div>;
}
