import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { APP_DOMAIN } from "@/lib/appConfig";
import { ReferralPanel } from "@/components/ReferralPanel";

/**
 * /account/referral — Server Component shell.
 *
 * Plan 10.05 (REFER-01). Gates on auth. The existing `/account` page pattern
 * redirects unauthenticated visitors to `/auth?next=...` rather than returning
 * a JSON 401 (requireUser's JSON-401 response shape is meant for Route
 * Handlers, not Server Components).
 *
 * `force-dynamic` — this page reads the session cookie and must not be
 * statically rendered.
 */

export const dynamic = "force-dynamic";

export default async function ReferralAccountPage() {
  const auth = await requireUser();
  if (!auth.ok) {
    redirect("/auth?next=/account/referral");
  }
  return <ReferralPanel appDomain={APP_DOMAIN} />;
}
