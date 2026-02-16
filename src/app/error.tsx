"use client";

import { useEffect } from "react";
import { Alert, Button, Card } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  const digest = error?.digest;

  return (
    <div className="mx-auto max-w-[760px]">
      <Card className="space-y-5 p-6">
        <h1 className="h1">حدث خطأ غير متوقع</h1>

        <Alert variant="danger" title="تعطّل مؤقت">
          جرّب إعادة المحاولة. إذا تكرر الخطأ، أرسل رقم البلاغ.
        </Alert>

        {digest ? (
          <div className="text-xs text-muted">
            Crash ID: <span className="font-medium text-text">{digest}</span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => reset()}>
            إعادة المحاولة
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => window.location.reload()}
          >
            تحديث الصفحة
          </Button>
        </div>
      </Card>
    </div>
  );
}
