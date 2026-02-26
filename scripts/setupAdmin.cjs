const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "zalziadi.ads@gmail.com";
const TRIAL_DAYS = Number(process.env.ADMIN_TRIAL_DAYS || 28);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing env. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureAdminTableRow(email) {
  const { error } = await supabase
    .from("admins")
    .upsert({ email, role: "admin" }, { onConflict: "email" });

  if (error) {
    if (
      error.message.includes("Could not find the table") ||
      error.message.includes("schema cache")
    ) {
      console.warn(
        "Warning: public.admins table not found. Continuing with profiles/entitlements only."
      );
      return;
    }
    throw new Error(`Failed writing admins table: ${error.message}`);
  }
}

async function getUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Failed to list auth users: ${error.message}`);
  const user = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error(`Auth user not found for ${email}. Create the account first via /auth.`);
  }
  return user;
}

async function grantAdminRoleInProfiles(userId) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, role: "admin" }, { onConflict: "id" });
  if (error) {
    if (
      error.message.includes("Could not find the table") ||
      error.message.includes("schema cache")
    ) {
      console.warn("Warning: public.profiles table not found. Skipping profiles role upsert.");
      return;
    }
    throw new Error(`Failed to upsert profiles role=admin: ${error.message}`);
  }
}

async function activateEntitlement(userId, days) {
  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + days);

  const { error } = await supabase.from("entitlements").upsert(
    {
      user_id: userId,
      plan: "ramadan_28",
      status: "active",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    if (
      error.message.includes("Could not find the table") ||
      error.message.includes("schema cache")
    ) {
      console.warn("Warning: public.entitlements table not found. Skipping entitlement upsert.");
      return null;
    }
    throw new Error(`Failed to upsert entitlements: ${error.message}`);
  }
  return endsAt.toISOString();
}

async function main() {
  console.log(`Setting admin + entitlement for ${ADMIN_EMAIL} ...`);

  const user = await getUserByEmail(ADMIN_EMAIL);
  await ensureAdminTableRow(ADMIN_EMAIL);
  await grantAdminRoleInProfiles(user.id);
  const validUntil = await activateEntitlement(user.id, TRIAL_DAYS);

  console.log("Done.");
  console.log(`- admin email: ${ADMIN_EMAIL}`);
  console.log(`- user id: ${user.id}`);
  if (validUntil) {
    console.log(`- entitlement: active until ${validUntil}`);
  } else {
    console.log("- entitlement: skipped (entitlements table missing)");
  }
}

main().catch((err) => {
  console.error("setup:admin failed");
  console.error(err.message || err);
  process.exit(1);
});
