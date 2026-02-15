import { NextRequest } from "next/server";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

function maskKey(k: string): string {
  if (k.length <= 6) return "***";
  return k.slice(0, 3) + "***" + k.slice(-3);
}

export async function GET(request: NextRequest) {
  const rawEnv = process.env.ADMIN_KEY ?? "";
  const adminKey = rawEnv.trim();
  const rawKey =
    request.nextUrl.searchParams.get("key") ?? request.headers.get("x-admin-key") ?? "";
  const provided = rawKey.trim();

  const ok = adminKey.length > 0 && provided.length > 0 && adminKey === provided;
  const rawMatch = rawEnv === rawKey;
  const trimmedMatch = adminKey === provided;

  const debug = {
    hasEnv: rawEnv.length > 0,
    envLen: adminKey.length,
    keyLen: provided.length,
    rawMatch,
    trimmedMatch,
    keyPreview: maskKey(provided),
  };

  console.log("[admin/verify]", JSON.stringify(debug));

  const showDebug =
    request.nextUrl.searchParams.get("debug") === "1" && process.env.NODE_ENV !== "production";
  const body = showDebug ? { ok, ...debug } : { ok };

  return new Response(JSON.stringify(body), {
    status: ok ? 200 : 401,
    headers: {
      "Content-Type": "application/json",
      ...NO_CACHE,
    },
  });
}
