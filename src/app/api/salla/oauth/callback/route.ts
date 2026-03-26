import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAppOriginServer } from "@/lib/appOrigin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/salla/oauth/callback
 * يستقبل رد OAuth2 من سلة، يحفظ التوكنات في جدول salla_connections.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const origin = await getAppOriginServer();

  if (errorParam) {
    console.error("Salla OAuth error:", errorParam);
    return NextResponse.redirect(`${origin}/admin?salla_error=${errorParam}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/admin?salla_error=missing_params`);
  }

  // التحقق من state HMAC
  const stateSecret = process.env.SALLA_STATE_SECRET ?? "";
  const parts = state.split(":");
  if (parts.length < 3) {
    return NextResponse.redirect(`${origin}/admin?salla_error=invalid_state`);
  }
  const userId = parts[0]!;
  const timestamp = parts[1]!;
  const receivedHmac = parts.slice(2).join(":");
  const expectedHmac = crypto
    .createHmac("sha256", stateSecret)
    .update(`${userId}:${timestamp}`)
    .digest("hex");

  if (receivedHmac !== expectedHmac) {
    console.warn("Salla OAuth: state HMAC mismatch");
    return NextResponse.redirect(`${origin}/admin?salla_error=state_mismatch`);
  }

  // التحقق من أن الطلب ليس قديمًا (15 دقيقة)
  const age = Date.now() - Number(timestamp);
  if (age > 15 * 60 * 1000) {
    return NextResponse.redirect(`${origin}/admin?salla_error=state_expired`);
  }

  // تبادل الكود بالتوكن
  const clientId = process.env.SALLA_CLIENT_ID ?? "";
  const clientSecret = process.env.SALLA_CLIENT_SECRET ?? "";
  const redirectUri =
    process.env.SALLA_REDIRECT_URI ??
    `${origin.replace(/\/$/, "")}/api/salla/oauth/callback`;
  const tokenUrl =
    process.env.SALLA_OAUTH_TOKEN_URL ?? "https://accounts.salla.sa/oauth2/token";

  let tokenData: Record<string, unknown>;
  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });
    tokenData = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      console.error("Salla token exchange failed", res.status, tokenData);
      return NextResponse.redirect(`${origin}/admin?salla_error=token_exchange_failed`);
    }
  } catch (e) {
    console.error("Salla token fetch error", e);
    return NextResponse.redirect(`${origin}/admin?salla_error=token_fetch_error`);
  }

  const accessToken = String(tokenData.access_token ?? "");
  const refreshToken = String(tokenData.refresh_token ?? "");
  const tokenType = String(tokenData.token_type ?? "bearer");
  const scope = String(tokenData.scope ?? "");
  const expiresIn = Number(tokenData.expires_in ?? 0);

  if (!accessToken) {
    console.error("Salla token response missing access_token", tokenData);
    return NextResponse.redirect(`${origin}/admin?salla_error=no_access_token`);
  }

  // جلب بيانات التاجر
  let merchantId = "";
  let merchantDomain = "";
  try {
    const profileRes = await fetch("https://api.salla.dev/admin/v2/store/info", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (profileRes.ok) {
      const profileData = (await profileRes.json()) as {
        data?: { id?: number; domain?: string };
      };
      merchantId = String(profileData.data?.id ?? "");
      merchantDomain = String(profileData.data?.domain ?? "");
    }
  } catch {
    // غير حرج — نكمل بدون بيانات التاجر
  }

  // حفظ التوكنات في salla_connections
  const admin = getSupabaseAdmin();
  const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

  const { error } = await admin.from("salla_connections").upsert(
    {
      user_id: userId,
      merchant_id: merchantId,
      merchant_domain: merchantDomain,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: tokenType,
      scope,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Salla connection upsert error", error);
    return NextResponse.redirect(`${origin}/admin?salla_error=db_error`);
  }

  return NextResponse.redirect(`${origin}/admin?salla=connected`);
}
