import { NextRequest, NextResponse } from "next/server";

// All routes are public — no auth or entitlement required.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
