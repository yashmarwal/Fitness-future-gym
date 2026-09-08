import "server-only";
import { cookies } from "next/headers";
import { signSession, verifySession, type MemberSession, type AdminSession } from "@/server/auth/jwt";

const MEMBER_COOKIE = "ff_member_session";
const ADMIN_COOKIE = "ff_admin_session";
const MEMBER_SESSION_SECONDS = 60 * 60 * 24 * 365; // 1 year — members should stay signed in
const ADMIN_SESSION_SECONDS = 60 * 60 * 12; // 12 hours — admin sessions stay short-lived

export async function createMemberSession(memberId: string, membershipNumber: string) {
  const token = await signSession({ role: "member", memberId, membershipNumber }, MEMBER_SESSION_SECONDS);
  const store = await cookies();
  store.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MEMBER_SESSION_SECONDS,
    path: "/",
  });
}

export async function getMemberSession(): Promise<MemberSession | null> {
  const store = await cookies();
  const token = store.get(MEMBER_COOKIE)?.value;
  if (!token) return null;
  return verifySession<MemberSession>(token);
}

export async function clearMemberSession() {
  const store = await cookies();
  store.delete(MEMBER_COOKIE);
}

export async function createAdminSession(adminId: string, username: string) {
  const token = await signSession({ role: "admin", adminId, username }, ADMIN_SESSION_SECONDS);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_SECONDS,
    path: "/",
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifySession<AdminSession>(token);
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
