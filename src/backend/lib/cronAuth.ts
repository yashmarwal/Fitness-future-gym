import "server-only";
import { NextResponse } from "next/server";

// Every cron route (src/app/api/cron/*) checks the same bearer token before
// doing anything — this was previously copy-pasted verbatim into all 11 of
// them. Returns the 401 response to return as-is when unauthorized, or null
// when the request is authorized to proceed.
export function verifyCronRequest(request: Request): NextResponse | null {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }
  return null;
}
