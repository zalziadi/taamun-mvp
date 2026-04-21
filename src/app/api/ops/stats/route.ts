import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/stats
 *
 * Admin-only. Counts every entity that v1.x–v2.0 phases introduced.
 * Purpose: answer "is anything actually happening?" before scoping more
 * product surface. Pure read, no side effects, no new tables.
 */

type Count = { label: string; value: number; href?: string; metricKey?: string };

async function headCount(
  admin: ReturnType<typeof import("@/lib/supabaseAdmin").getSupabaseAdmin>,
  table: string,
  selectCol: string = "id",
  filter?: { column: string; value: string | boolean }
): Promise<number> {
  let q = admin.from(table).select(selectCol, { count: "exact", head: true });
  if (filter) {
    if (typeof filter.value === "boolean") {
      q = q.eq(filter.column, filter.value);
    } else {
      q = q.eq(filter.column, filter.value);
    }
  }
  const { count } = await q;
  return count ?? 0;
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const admin = gate.admin;

  const [
    profiles,
    pushSubs,
    threads,
    threadsFlagged,
    replies,
    repliesFlagged,
    journeys,
    journeysPublished,
    journeysDraft,
    journeysFlagged,
    subscriptions,
    follows,
    invitesTotal,
    invitesRewarded,
    insights,
    insightsFlagged,
  ] = await Promise.all([
    headCount(admin, "profiles"),
    headCount(admin, "push_subscriptions"),
    headCount(admin, "threads"),
    headCount(admin, "threads", "id", { column: "status", value: "flagged" }),
    headCount(admin, "thread_replies"),
    headCount(admin, "thread_replies", "id", { column: "status", value: "flagged" }),
    headCount(admin, "creator_journeys", "slug"),
    headCount(admin, "creator_journeys", "slug", { column: "status", value: "published" }),
    headCount(admin, "creator_journeys", "slug", { column: "status", value: "draft" }),
    headCount(admin, "creator_journeys", "slug", { column: "status", value: "flagged" }),
    headCount(admin, "creator_journey_subscriptions"),
    headCount(admin, "creator_follows"),
    headCount(admin, "invite_redemptions"),
    headCount(admin, "invite_redemptions", "id", { column: "rewarded", value: true }),
    headCount(admin, "shared_insights", "slug"),
    headCount(admin, "shared_insights", "slug", { column: "status", value: "flagged" }),
  ]);

  // Recent signal — last 24h new registrations + new payments
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: newProfiles24h } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", yesterday);

  const summary: { section: string; items: Count[] }[] = [
    {
      section: "المستخدمون",
      items: [
        { label: "إجمالي البروفايلات", value: profiles, metricKey: "profiles_total" },
        { label: "تسجيل جديد (٢٤س)", value: newProfiles24h ?? 0 },
        { label: "اشتراكات Push", value: pushSubs, metricKey: "push_subscriptions" },
      ],
    },
    {
      section: "النقاشات (v1.4)",
      items: [
        { label: "خيوط (إجمالي)", value: threads, href: "/threads", metricKey: "threads_total" },
        { label: "خيوط معلّمة", value: threadsFlagged, href: "/admin/moderation", metricKey: "threads_flagged" },
        { label: "ردود (إجمالي)", value: replies, metricKey: "thread_replies_total" },
        { label: "ردود معلّمة", value: repliesFlagged, href: "/admin/moderation", metricKey: "thread_replies_flagged" },
      ],
    },
    {
      section: "وضع المبدع (v1.4 + v1.6 + v1.7)",
      items: [
        { label: "رحلات (إجمالي)", value: journeys, metricKey: "journeys_total" },
        { label: "رحلات منشورة", value: journeysPublished, href: "/discover", metricKey: "journeys_published" },
        { label: "رحلات مسوّدة", value: journeysDraft, metricKey: "journeys_draft" },
        { label: "رحلات معلّمة", value: journeysFlagged, href: "/admin/moderation", metricKey: "journeys_flagged" },
        { label: "اشتراكات رحلات", value: subscriptions, metricKey: "journey_subscriptions" },
        { label: "متابعات مبدعين", value: follows, metricKey: "creator_follows" },
      ],
    },
    {
      section: "الدعوات (v1.3 + v1.4)",
      items: [
        { label: "استخدامات (إجمالي)", value: invitesTotal, metricKey: "invites_total" },
        { label: "مكافآت مطبّقة", value: invitesRewarded, metricKey: "invites_rewarded" },
      ],
    },
    {
      section: "الرؤى المشاركة (v1.3)",
      items: [
        { label: "رؤى (إجمالي)", value: insights, href: "/discover", metricKey: "insights_total" },
        { label: "رؤى معلّمة", value: insightsFlagged, href: "/admin/moderation", metricKey: "insights_flagged" },
      ],
    },
  ];

  // Env configuration health — shows which integrations are live.
  const env = {
    VAPID: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    RESEND: Boolean(process.env.RESEND_API_KEY),
    ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
    STRIPE: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    ANTHROPIC: Boolean(process.env.ANTHROPIC_API_KEY),
    OPENAI: Boolean(process.env.OPENAI_API_KEY),
    SUPABASE_SERVICE_ROLE: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    ENTITLEMENT_SECRET: Boolean(process.env.ENTITLEMENT_SECRET),
  };

  return NextResponse.json({
    ok: true,
    generated_at: new Date().toISOString(),
    summary,
    env,
  });
}
