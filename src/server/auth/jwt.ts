import "server-only";
import { SignJWT, jwtVerify } from "jose";

export type MemberSession = { role: "member"; memberId: string; membershipNumber: string };
export type AdminSession = { role: "admin"; adminId: string; username: string };

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
