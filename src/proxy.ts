import { NextResponse, type NextRequest } from "next/server";
import { verifySession, type MemberSession, type AdminSession } from "@/backend/auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("ff_member_session")?.value;
    const session = token ? await verifySession<MemberSession>(token) : null;
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
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
