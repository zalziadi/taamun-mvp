import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { submitToIndexNow } from "@/lib/indexnow";
import { APP_DOMAIN } from "@/lib/appConfig";

export const dynamic = "force-dynamic";

/**
 * POST /api/indexnow/submit
 *
 * Admin endpoint to batch-submit URLs to IndexNow (Bing + Yandex +
 * derivatives). Without `urls` in the body, submits the full public
 * canon.
 *
 * Body: { urls?: string[] }
 */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body = (await req.json().catch(() => ({}))) as { urls?: string[] };

  const defaultUrls = [
    `${APP_DOMAIN}/`,
    `${APP_DOMAIN}/pricing`,
    `${APP_DOMAIN}/discover`,
    `${APP_DOMAIN}/threads`,
    `${APP_DOMAIN}/faq`,
    `${APP_DOMAIN}/creator/leaderboard`,
    `${APP_DOMAIN}/creator/guide`,
    `${APP_DOMAIN}/en`,
    `${APP_DOMAIN}/en/faq`,
  ];

  const urls =
    Array.isArray(body.urls) && body.urls.length > 0 ? body.urls : defaultUrls;

  await submitToIndexNow(urls);

  return NextResponse.json({ ok: true, submitted: urls.length });
}
