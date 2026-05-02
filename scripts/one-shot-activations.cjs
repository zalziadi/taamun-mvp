/**
 * One-shot activation script — runs as postbuild on Vercel.
 *
 * Activates a hardcoded list of paying customers whose accounts couldn't be
 * activated via the normal admin UI flow. Idempotent: skips users already
 * active with the requested tier.
 *
 * Safe to run on every deploy:
 *   - Exits 0 silently if env vars missing (no build break)
 *   - Skips users already correctly activated
 *   - Logs each step for Vercel build logs
 *
 * Remove entries from PENDING after confirming activation in admin dashboard.
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TIER_DAYS = {
  trial: 7,
  quarterly: 90,
  half_yearly: 180,
  yearly: 365,
  vip: 1095,
  monthly: 30,
  eid: 30,
};

const PENDING = [
  {
    email: "moody_831@hotmail.com",
    full_name: "موضي محمد البوعينين",
    tier: "half_yearly",
    note: "WhatsApp transfer 2026-04-30",
  },
];

async function activateOne(supabase, entry) {
  const { email, full_name, tier } = entry;
  const days = TIER_DAYS[tier];
  if (!days) {
    console.log(`[one-shot] skip ${email}: unknown tier "${tier}"`);
    return;
  }

  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    console.log(`[one-shot] skip ${email}: listUsers error — ${listErr.message}`);
    return;
  }

  const user = list.users.find(
    (u) => (u.email || "").toLowerCase() === email.toLowerCase()
  );
  if (!user) {
    console.log(`[one-shot] skip ${email}: auth user not found`);
    return;
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_tier, expires_at")
    .eq("id", user.id)
    .maybeSingle();

  const stillValid =
    existing &&
    existing.subscription_status === "active" &&
    existing.subscription_tier === tier &&
    existing.expires_at &&
    new Date(existing.expires_at).getTime() > Date.now();

  if (stillValid) {
    console.log(`[one-shot] skip ${email}: already active (${tier}) until ${existing.expires_at}`);
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error: upsertErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: full_name || existing?.full_name || null,
        subscription_status: "active",
        subscription_tier: tier,
        activated_at: now.toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "id" }
    );

  if (upsertErr) {
    console.log(`[one-shot] error ${email}: ${upsertErr.message}`);
    return;
  }

  console.log(`[one-shot] activated ${email} → ${tier} until ${expiresAt}`);
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.log("[one-shot] skipped: SUPABASE env not configured");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const entry of PENDING) {
    try {
      await activateOne(supabase, entry);
    } catch (e) {
      console.log(`[one-shot] error ${entry.email}: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.log(`[one-shot] fatal: ${e.message}`);
  process.exit(0);
});
