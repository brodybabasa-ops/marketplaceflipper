import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, decryptSession, homeForRole } from "@/lib/session-token";

const PROTECTED = ["/home", "/vehicles", "/jobs", "/messages", "/history", "/account", "/request", "/mechanic", "/admin", "/estimates", "/appointments", "/saved", "/reviews"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await decryptSession(token) : null;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }
  if (pathname.startsWith("/mechanic") && session.role !== "MECHANIC" && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/vehicles/:path*", "/jobs/:path*", "/messages/:path*", "/history/:path*", "/account/:path*", "/request/:path*", "/mechanic/:path*", "/admin/:path*", "/estimates/:path*", "/appointments/:path*", "/saved/:path*", "/reviews/:path*"],
};
