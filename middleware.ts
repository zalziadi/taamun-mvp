import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const adminKey = request.nextUrl.searchParams.get("admin");
  if (!adminKey) return NextResponse.next();

  const nextPath = request.nextUrl.pathname.startsWith("/admin")
    ? request.nextUrl.pathname
    : "/admin";

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/api/admin/login";
  loginUrl.searchParams.set("password", adminKey);
  loginUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
