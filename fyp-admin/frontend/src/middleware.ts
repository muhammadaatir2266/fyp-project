import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("admin_session")?.value;

  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/doctors") ||
    pathname.startsWith("/patients") ||
    pathname.startsWith("/appointments") ||
    pathname.startsWith("/api-docs") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/tokens");

  if (isDashboardRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/doctors/:path*", "/patients/:path*", "/appointments/:path*",
    "/api-docs/:path*", "/settings/:path*", "/tokens/:path*", "/login",
  ],
};
