import "server-only";

// A missing column surfaces two genuinely different ways depending on the
// operation: a write (.update()/.insert()) is validated against
// PostgREST's schema cache first, giving code PGRST204 ("Could not find
// the 'x' column of 'table' in the schema cache"); a read (.select())
// passes the column straight into the actual SQL query, so it fails at
// the real Postgres layer instead with the raw "column table.x does not
// exist" wording (SQLSTATE 42703). Any service reading/writing a
// migration-gated column that isn't guaranteed to exist yet should check
// both, to fail open (degrade gracefully) rather than 500 the whole page.
export function isMissingColumnError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (error?.code === "PGRST204" || error?.code === "42703") return true;
  const msg = error?.message?.toLowerCase() ?? "";
  return msg.includes("column") && (msg.includes("schema cache") || msg.includes("does not exist"));
}
