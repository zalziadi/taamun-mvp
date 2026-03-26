import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getAppOriginServer } from "@/lib/appOrigin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/salla/oauth/start
 * يبدأ ربط حساب سلة (للأدمن فقط).
 * يعيد التوجيه إلى صفحة تفويض OAuth2 في سلة.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const clientId = process.env.SALLA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { ok: false, error: "salla_not_configured", hint: "SALLA_CLIENT_ID" },
      { status: 503 }
    );
  }

  const origin = await getAppOriginServer();
  const redirectUri =
    process.env.SALLA_REDIRECT_URI ??
    `${origin.replace(/\/$/, "")}/api/salla/oauth/callback`;

  const stateSecret = process.env.SALLA_STATE_SECRET ?? "";
  const statePayload = `${auth.user.id}:${Date.now()}`;
  const hmac = crypto.createHmac("sha256", stateSecret).update(statePayload).digest("hex");
  const state = `${statePayload}:${hmac}`;

  const authUrl =
    process.env.SALLA_OAUTH_AUTH_URL ?? "https://accounts.salla.sa/oauth2/auth";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "offline_access",
    state,
  });

  return NextResponse.redirect(`${authUrl}?${params.toString()}`);
}
