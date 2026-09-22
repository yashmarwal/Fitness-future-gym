import { NextResponse, type NextRequest } from "next/server";
import {
  verifySession,
  signSession,
  MEMBER_SESSION_SECONDS,
  ADMIN_SESSION_SECONDS,
  type MemberSession,
  type AdminSession,
} from "@/backend/auth/jwt";

const MEMBER_COOKIE = "ff_member_session";
const ADMIN_COOKIE = "ff_admin_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Logged-in members always land on their dashboard, never the marketing
  // homepage (see project spec: "persistent login / auto dashboard"). Doing
  // this check here — rather than reading cookies inside the Home page
  // component — matters for performance: a Server Component that reads
  // cookies() is forced dynamic on every single request, so it previously
  // made the ENTIRE marketing homepage (heavy hero content, most-visited
  // page on the site) skip Next's static rendering for every visitor, not
  // just logged-in ones. Middleware can redirect before the page even
  // renders, without that cost — the page itself now has no dynamic APIs.
  if (pathname === "/") {
    const token = request.cookies.get(MEMBER_COOKIE)?.value;
    const session = token ? await verifySession<MemberSession>(token) : null;
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(MEMBER_COOKIE)?.value;
    const session = token ? await verifySession<MemberSession>(token) : null;
    if (!session) {
      // Signup, not login: the only ways to land on /dashboard with no
      // session are a first-ever visit (tapping the tab bar's Dashboard
      // icon) or a session that's expired/been cleared — either way, most
      // people hitting this have never created an account, so a login form
      // asking for credentials they don't have is the wrong default. Signup
      // itself links back to /login for the real "I already have an
      // account" case (see SignupForm.tsx).
      return NextResponse.redirect(new URL("/signup", request.url));
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
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const session = token ? await verifySession<AdminSession>(token) : null;
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Sliding session, same as the member block above — previously admin
    // tokens were never renewed and expired after a fixed 12 hours, which
    // logged staff out overnight (most noticeable checking the panel on a
    // phone across a day, regardless of browser).
    const response = NextResponse.next();
    const renewed = await signSession(session, ADMIN_SESSION_SECONDS);
    response.cookies.set(ADMIN_COOKIE, renewed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_SESSION_SECONDS,
      path: "/",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin/:path*"],
};
