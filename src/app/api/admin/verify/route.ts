import { NextRequest } from "next/server";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

export async function GET(request: NextRequest) {
  const adminKey = process.env.ADMIN_KEY;
  const key =
    request.nextUrl.searchParams.get("key") ?? request.headers.get("x-admin-key") ?? "";
  const ok = !!adminKey && key === adminKey;

  return new Response(JSON.stringify({ ok }), {
    status: ok ? 200 : 401,
    headers: {
      "Content-Type": "application/json",
      ...NO_CACHE,
    },
  });
}
