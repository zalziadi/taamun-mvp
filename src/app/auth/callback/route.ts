import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getSafeNext(nextParam: string | null): string {
  const next = nextParam ?? "/program";
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes(":")) {
    return next;
  }
  return "/program";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  const safeNext = getSafeNext(searchParams.get("next"));

  const successUrl = new URL(safeNext, origin);

  /** Send the user back to /login with a reason we can act on, and log the real cause. */
  function fail(reason: string, detail?: string) {
    console.error("[auth/callback] failed", { reason, detail, hasCode: !!code, hasTokenHash: !!tokenHash, type });
    const url = new URL("/login", origin);
    url.searchParams.set("next", safeNext);
    url.searchParams.set("error", reason);
    return NextResponse.redirect(url);
  }

  // The provider (Supabase/Google) rejected the sign-in before we ever got a code.
  if (providerError) {
    return fail("provider_error", providerError);
  }

  const response = NextResponse.redirect(successUrl);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Email links: works in any browser — no code verifier needed.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "signup" | "invite" | "magiclink" | "recovery",
    });
    if (!error) {
      return response;
    }
    return fail("link_invalid", error.message);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Almost always: the PKCE verifier cookie is missing because the link was
      // opened in a different browser than the one that requested it, or it expired.
      return fail("link_invalid", error.message);
    }
    {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!userError && userData.user) {
        // Check if this is a new user (no subscription)
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier, created_at")
          .eq("id", userData.user.id)
          .single();
        
        // If new user or no subscription, activate trial
        if (profile && !profile.subscription_tier) {
          // Create trial subscription
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 7); // 7-day trial
          
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "trial",
              subscription_start_date: startDate.toISOString(),
              subscription_end_date: endDate.toISOString(),
              subscription_status: "active"
            })
            .eq("id", userData.user.id);
            
          // Log the trial activation
          await supabase
            .from("subscriptions")
            .insert({
              user_id: userData.user.id,
              tier: "trial",
              status: "active",
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              amount: 0,
              currency: "SAR"
            });
        }
        
        return response;
      }
      return fail("session_failed", userError?.message);
    }
  }

  return fail("no_code");
}
