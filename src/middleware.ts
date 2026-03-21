import { NextRequest, NextResponse } from "next/server";
import { isRamadanProgramClosed } from "@/lib/season";

const RAMADAN_PROGRAM_PREFIXES = ["/program", "/day", "/ramadan", "/progress"];

export function middleware(req: NextRequest) {
  if (isRamadanProgramClosed()) {
    const path = req.nextUrl.pathname;
    const isRamadanProgramRoute = RAMADAN_PROGRAM_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`)
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
  matcher: ["/program/:path*", "/day/:path*", "/ramadan/:path*", "/progress/:path*"],
};
