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
  const safeNext = getSafeNext(searchParams.get("next"));

  const successUrl = new URL(safeNext, origin);
  const fallbackUrl = new URL("/login", origin);
  fallbackUrl.searchParams.set("next", safeNext);
  fallbackUrl.searchParams.set("error", "oauth_failed");

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

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "signup" | "invite" | "magiclink" | "recovery",
    });
    if (!error) {
      return response;
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
    }
  }

  return NextResponse.redirect(fallbackUrl);
}
