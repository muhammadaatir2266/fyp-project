import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("authToken")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  // Define protected routes and their allowed roles
  const protectedRoutes = [
    { path: "/patient", roles: ["PATIENT"] },
  ];

  // Define auth routes (where authenticated users should be redirected from)
  const authRoutes = ["/login", "/signup"];

  // 1. Handle protected routes
  const protectedRoute = protectedRoutes.find((route) =>
    pathname.startsWith(route.path),
  );

  if (protectedRoute) {
    if (!authToken) {
      // Not authenticated, redirect to login
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    if (userRole && !protectedRoute.roles.includes(userRole)) {
      // Authenticated but wrong role (should not happen in patient app, but safe to redirect)
      return NextResponse.redirect(new URL("/patient/dashboard", request.url));
    }
  }

  // 2. Handle auth routes (login/signup)
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (authToken) {
      // Already authenticated, redirect to patient dashboard
      return NextResponse.redirect(new URL("/patient/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/patient/:path*",
    "/login",
    "/signup/:path*",
  ],
};
