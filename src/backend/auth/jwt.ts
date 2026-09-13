import "server-only";
import { SignJWT, jwtVerify } from "jose";

export type MemberSession = { role: "member"; memberId: string; membershipNumber: string };
export type AdminSession = { role: "admin"; adminId: string; username: string };

// 5 years, and slid forward on every dashboard visit (see proxy.ts) — as
// long as a member returns at least once every 5 years, they're never
// logged out. That's "permanent" in practice without issuing a literal
// non-expiring token (which JWTs/`jose` don't support cleanly anyway).
// Lives here (not session.ts) because this file has no `next/headers`
// dependency, so it's safe to import from Middleware (`proxy.ts`), unlike
// session.ts which uses the Server-Component-only `cookies()` API.
export const MEMBER_SESSION_SECONDS = 60 * 60 * 24 * 365 * 5;

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.warn(
      "SESSION_SECRET is not set — using an insecure development fallback. Set it before deploying."
    );
  }
  return new TextEncoder().encode(secret ?? "dev-only-insecure-fitness-future-secret");
}

export async function signSession(
  payload: MemberSession | AdminSession,
  expiresInSeconds: number
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(getSecretKey());
}

export async function verifySession<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as T;
  } catch {
    return null;
  }
}
