import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { createSallaOAuthState, getSallaOAuthConfig } from "@/lib/salla";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  const { authUrl, clientId, redirectUri } = getSallaOAuthConfig();
  const scope = process.env.SALLA_OAUTH_SCOPE ?? "offline_access";
  const state = createSallaOAuthState(adminAuth.user.id);

  const url = new URL(authUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);

  // Preserve optional hint to return the admin to a specific page.
  const next = request.nextUrl.searchParams.get("next");
  if (next) url.searchParams.set("next", next);

  return NextResponse.redirect(url.toString(), { status: 302 });
}
