import { NextResponse, type NextRequest } from "next/server";
import {
  verifySession,
  signSession,
  MEMBER_SESSION_SECONDS,
  type MemberSession,
  type AdminSession,
} from "@/backend/auth/jwt";

const MEMBER_COOKIE = "ff_member_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(MEMBER_COOKIE)?.value;
    const session = token ? await verifySession<MemberSession>(token) : null;
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Sliding session: every dashboard visit re-signs the cookie with a
    // fresh full-length expiry, so an actively-returning member effectively
    // never gets logged out (RSC render can't set cookies — this is the one
    // place in the request lifecycle that can).
    const response = NextResponse.next();
    const renewed = await signSession(session, MEMBER_SESSION_SECONDS);
    response.cookies.set(MEMBER_COOKIE, renewed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MEMBER_SESSION_SECONDS,
      path: "/",
    });
    return response;
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("ff_admin_session")?.value;
    const session = token ? await verifySession<AdminSession>(token) : null;
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
