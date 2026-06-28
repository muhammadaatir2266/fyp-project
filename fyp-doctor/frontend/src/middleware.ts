import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("doctor_session")?.value;

  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/profile") ||
    pathname.startsWith("/appointments") || pathname.startsWith("/patients") ||
    pathname.startsWith("/calls") || pathname.startsWith("/availability") ||
    pathname.startsWith("/settings") || pathname.startsWith("/schedule");

  if (isDashboardRoute && !sessionCookie) {
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect already-authenticated users away from login/signup
  if ((pathname === "/login" || pathname === "/signup") && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/appointments/:path*", "/patients/:path*",
    "/calls/:path*", "/availability/:path*", "/settings/:path*", "/schedule/:path*", "/login", "/signup"],
};
