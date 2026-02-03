import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "sarpras_session";

// Define which roles can access which paths
const ROUTES_PROTECTION: Record<string, string[]> = {
  "/dashboard/users": ["admin"],
  "/dashboard/activity-log": ["admin"],
  "/dashboard/laporan": ["admin", "petugas"],
  // "/dashboard/sarpras": ["admin", "petugas"],
  "/dashboard/kategori": ["admin", "petugas"],
  "/dashboard/lokasi": ["admin", "petugas"],
  "/dashboard/pengembalian": ["admin", "petugas"],
  // Add other sensitive routes here
};

export function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const path = nextUrl.pathname;
  const authCookie = cookies.get(COOKIE_NAME);

  // If already logged in and trying to access sign-in page
  if (path === "/sign-in" && authCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 1. Check if it's a dashboard route
  if (path.startsWith("/dashboard")) {
    // 2. If no auth cookie, redirect to login
    if (!authCookie) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    try {
      // 3. Parse user data from cookie
      const user = JSON.parse(decodeURIComponent(authCookie.value));
      const userRole = user.role;

      // 4. Check for specific route permissions
      for (const [route, allowedRoles] of Object.entries(ROUTES_PROTECTION)) {
        if (path.startsWith(route)) {
          if (!allowedRoles.includes(userRole)) {
            // If role not allowed, redirect to dashboard main page
            return NextResponse.redirect(new URL("/dashboard", request.url));
          }
        }
      }
    } catch (error) {
      // If cookie is invalid, clear it and redirect to login
      console.error("Middleware auth error:", error);
      const response = NextResponse.redirect(new URL("/sign-in", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sign-in", // We can also handle redirect if already logged in
  ],
};
