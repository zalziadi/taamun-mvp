import { NextRequest, NextResponse } from "next/server";
import { isRamadanProgramClosed } from "@/lib/season";

const RAMADAN_PROGRAM_PREFIXES = ["/program", "/day", "/ramadan", "/progress"];

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Admin query-key auto-login flow: /admin?admin=<KEY>
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const adminKey = req.nextUrl.searchParams.get("admin");
    if (adminKey) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/api/admin/login";
      loginUrl.searchParams.set("password", adminKey);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isRamadanProgramClosed()) {
    const isRamadanProgramRoute = RAMADAN_PROGRAM_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (isRamadanProgramRoute) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("ramadan", "closed");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/program/:path*", "/day/:path*", "/ramadan/:path*", "/progress/:path*"],
};
