"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Alert, Button, Card } from "@/components/ui";
import { buildWhatsAppSubscribeUrl } from "@/lib/whatsapp";

interface EntitlementGateProps {
  children: React.ReactNode;
}

type EntitlementState = "loading" | "active" | "auth" | "locked" | "error";

export function EntitlementGate({ children }: EntitlementGateProps) {
  const pathname = usePathname();
  const [state, setState] = useState<EntitlementState>("loading");

  useEffect(() => {
    const run = async () => {
      setState("loading");
      try {
        const res = await fetch("/api/entitlement", { cache: "no-store" });
        const data = (await res.json()) as { active?: boolean };
        if (res.status === 401) {
          setState("auth");
          return;
        }
        if (res.ok && data.active) {
          setState("active");
          return;
        }
        setState("locked");
      } catch {
        setState("error");
      }
    };

    run();
  }, []);

  if (state === "active") return <>{children}</>;

  if (state === "loading") {
    return <Card className="mx-auto max-w-2xl p-6 text-muted">جارٍ التحقق من الاشتراك...</Card>;
  }

  if (state === "error") {
    return (
      <Card className="mx-auto max-w-2xl space-y-4 p-6">
        <Alert variant="danger">تعذر التحقق من الاشتراك الآن. حاول مرة أخرى.</Alert>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </Card>
    );
  }

  if (state === "auth") {
    const next = encodeURIComponent(pathname || "/");
    return (
      <Card className="mx-auto max-w-2xl space-y-4 p-6">
        <Alert variant="muted">سجّل الدخول أولاً للمتابعة.</Alert>
        <Link href={`/auth?next=${next}`}>
          <Button size="lg">تسجيل الدخول</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl space-y-4 p-6">
      <Alert variant="danger" title="الاشتراك مطلوب">
        يلزم تفعيل الاشتراك للوصول إلى هذا القسم.
      </Alert>
      <div className="flex flex-wrap gap-3">
        <Link href="/subscribe?reason=locked">
          <Button size="lg">صفحة الاشتراك</Button>
        </Link>
        <a
          href={buildWhatsAppSubscribeUrl("ramadan_28")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-panel2 px-5 py-3 text-base font-medium text-text transition-colors hover:bg-panel"
        >
          الدعم عبر واتساب
        </a>
      </div>
    </Card>
  );
}
