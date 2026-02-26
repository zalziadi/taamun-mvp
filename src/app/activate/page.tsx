"use client";

import { useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Alert, Button, Card, Input } from "@/components/ui";
import { supabase } from "@/lib/supabaseClient";
import { APP_NAME } from "@/lib/appConfig";
import { DAY1_ROUTE } from "@/lib/routes";
import { formatPlanEndDate, getPlanLabel } from "@/lib/plans";

function ActivateContent() {
  const searchParams = useSearchParams();
  const queryCode = searchParams.get("code") ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    endsAt: string;
    plan: string;
    redirectTo?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCode((prev) => (prev ? prev : queryCode.toUpperCase()));
  }, [queryCode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session));
      setCheckingSession(false);
    });
  }, []);

  const authNext = useMemo(() => {
    const safeCode = code.trim().toUpperCase();
    const target = safeCode ? `/activate?code=${encodeURIComponent(safeCode)}` : "/activate";
    return `/auth?next=${encodeURIComponent(target)}`;
  }, [code]);

  async function handleActivate() {
    setError(null);
    setSuccess(null);

    const trimmed = code.trim().toUpperCase();

    if (!trimmed) {
      setError("أدخل كود التفعيل.");
      return;
    }

    if (!authenticated) {
      router.push(authNext);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json();
      if (res.status === 401) {
        router.push(authNext);
        return;
      }

      if (data.ok) {
        setSuccess({ endsAt: data.endsAt, plan: data.plan, redirectTo: data.redirectTo });
      } else {
        if (data.error === "ramadan_ended") {
          setError("انتهت فترة تفعيل باقة رمضان.");
        } else if (data.error === "not_found" || data.error === "invalid_format") {
          setError("الكود غير صالح.");
        } else {
          setError("تعذر التفعيل الآن. حاول مرة أخرى.");
        }
      }
    } catch {
      setError("حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <AppShell title="تفعيل الاشتراك">
        <Card className="p-6 text-muted">جارٍ التحقق من تسجيل الدخول...</Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="تفعيل الاشتراك">
      <div className="mx-auto max-w-xl space-y-5">
        <Card className="space-y-4 p-6">
          <h1 className="text-2xl font-bold text-text">تفعيل الاشتراك</h1>
          <p className="text-sm text-muted">
            {`فعّل اشتراك ${APP_NAME} بالكود الذي وصلك، ثم ابدأ اليوم الأول مباشرة.`}
          </p>

          <div className="space-y-2">
            <label htmlFor="activation-code" className="text-sm text-text">
              كود التفعيل
            </label>
            <Input
              id="activation-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="TAAMUN-XXXX"
              dir="ltr"
              autoCapitalize="characters"
              error={Boolean(error)}
            />
          </div>

          {!authenticated ? (
            <Alert variant="muted">
              يلزم إنشاء حساب أو تسجيل الدخول قبل التفعيل حتى يتم ربط الاشتراك ببياناتك وحفظ كتاباتك على حسابك.
            </Alert>
          ) : null}

          {error ? <Alert variant="danger">{error}</Alert> : null}
          {success ? (
            <Alert variant="success" title="تم تفعيل اشتراكك بنجاح">
              {`صالح حتى: ${formatPlanEndDate(success.plan, success.endsAt)} — الباقة: ${getPlanLabel(success.plan)}`}
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {!authenticated ? (
              <Button size="lg" onClick={() => router.push(authNext)}>
                إنشاء حساب / تسجيل دخول للتفعيل
              </Button>
            ) : (
              <Button size="lg" onClick={handleActivate} disabled={loading}>
                {loading ? "جارٍ التفعيل..." : "تفعيل الآن"}
              </Button>
            )}

            {success ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.push(success.redirectTo || DAY1_ROUTE)}
              >
                ابدأ اليوم الأول
              </Button>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-text">كيف يعمل التفعيل؟</h2>
          <ol className="space-y-2 text-sm leading-7 text-muted">
            <li>١) سجّل الدخول إلى حسابك.</li>
            <li>٢) أدخل كود التفعيل كما وصلك.</li>
            <li>٣) اضغط تفعيل الآن.</li>
            <li>٤) عند نجاح التحقق، تُفعّل الباقة مباشرة على حسابك.</li>
          </ol>

          <div className="rounded-xl border border-border bg-panel2 p-4">
            <p className="mb-2 text-sm font-medium text-text">لو ظهر خطأ في الكود:</p>
            <ul className="space-y-1 text-sm text-muted">
              <li>• الكود غير صحيح</li>
              <li>• الكود منتهي</li>
              <li>• الكود تم استخدامه مسبقاً</li>
            </ul>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <AppShell title="تفعيل الاشتراك">
          <Card className="p-6 text-muted">جارٍ التحميل...</Card>
        </AppShell>
      }
    >
      <ActivateContent />
    </Suspense>
  );
}
