import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    // Redirect authenticated users away from auth pages
    if (token && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard and projects routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/projects") || pathname.startsWith("/upload")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/upload/:path*",
    "/login",
    "/signup",
  ],
};
