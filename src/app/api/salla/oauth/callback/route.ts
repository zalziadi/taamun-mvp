import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSallaOAuthConfig, verifySallaOAuthState } from "@/lib/salla";

export const dynamic = "force-dynamic";

type SallaTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  merchant?: { id?: number | string; domain?: string; name?: string };
  error?: string;
  error_description?: string;
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ ok: false, error: "missing_code_or_state" }, { status: 400 });
  }

  let statePayload: { userId: string };
  try {
    statePayload = verifySallaOAuthState(state);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_state",
        details: error instanceof Error ? error.message : "state verification failed",
      },
      { status: 400 }
    );
  }

  const { clientId, clientSecret, redirectUri, tokenUrl } = getSallaOAuthConfig();
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }).toString(),
  });

  const tokenJson = (await tokenRes.json()) as SallaTokenResponse;
  if (!tokenRes.ok || !tokenJson.access_token) {
    return NextResponse.json(
      {
        ok: false,
        error: tokenJson.error ?? "token_exchange_failed",
        details: tokenJson.error_description ?? "failed to exchange authorization code",
      },
      { status: 400 }
    );
  }

  // Persist integration token when table exists (safe no-op if migration not applied yet).
  try {
    const admin = getSupabaseAdmin();
    const nowIso = new Date().toISOString();
    const expiresAt = tokenJson.expires_in
      ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
      : null;

    await admin.from("salla_connections").upsert(
      {
        user_id: statePayload.userId,
        merchant_id: tokenJson.merchant?.id ? String(tokenJson.merchant.id) : null,
        merchant_domain: tokenJson.merchant?.domain ?? null,
        access_token: tokenJson.access_token,
        refresh_token: tokenJson.refresh_token ?? null,
        token_type: tokenJson.token_type ?? null,
        scope: tokenJson.scope ?? null,
        expires_at: expiresAt,
        updated_at: nowIso,
      },
      { onConflict: "user_id" }
    );
  } catch {
    // keep callback successful even if optional table doesn't exist yet
  }

  const redirectTo = new URL("/admin?salla=connected", request.url);
  return NextResponse.redirect(redirectTo, { status: 302 });
}
