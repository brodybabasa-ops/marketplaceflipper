import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, decryptSession, homeForRole } from "@/lib/session-token";

const STAFF = new Set(["ADMIN", "INSPECTOR", "SUPPORT", "FINANCE"]);
const PROTECTED = [
  "/home",
  "/vehicles",
  "/jobs",
  "/messages",
  "/history",
  "/account",
  "/request",
  "/intake",
  "/fix",
  "/inspect",
  "/help-now",
  "/fleet",
  "/wallet",
  "/compare",
  "/estimates",
  "/mechanic",
  "/admin",
  "/notifications",
  "/saved",
  "/disputes",
];

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

  if (pathname.startsWith("/admin") && !STAFF.has(session.role)) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }
  if (pathname.startsWith("/mechanic") && session.role !== "MECHANIC" && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home",
    "/home/:path*",
    "/vehicles",
    "/vehicles/:path*",
    "/jobs",
    "/jobs/:path*",
    "/messages",
    "/messages/:path*",
    "/history",
    "/history/:path*",
    "/account",
    "/account/:path*",
    "/request",
    "/request/:path*",
    "/intake",
    "/intake/:path*",
    "/fix",
    "/fix/:path*",
    "/inspect",
    "/inspect/:path*",
    "/help-now",
    "/help-now/:path*",
    "/fleet",
    "/fleet/:path*",
    "/wallet",
    "/wallet/:path*",
    "/compare",
    "/compare/:path*",
    "/estimates",
    "/estimates/:path*",
    "/mechanic",
    "/mechanic/:path*",
    "/admin",
    "/admin/:path*",
    "/notifications",
    "/notifications/:path*",
    "/saved",
    "/saved/:path*",
    "/disputes",
    "/disputes/:path*",
  ],
};
