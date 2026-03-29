import { NextRequest, NextResponse } from "next/server";

const ADMIN_BYPASS_COOKIE = "taamun_admin";

export function middleware(request: NextRequest) {
  const adminKey = request.nextUrl.searchParams.get("admin");
  const expectedAdminKey = process.env.ADMIN_KEY;

  if (!adminKey || !expectedAdminKey || adminKey !== expectedAdminKey) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.searchParams.delete("admin");

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(ADMIN_BYPASS_COOKIE, adminKey, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
