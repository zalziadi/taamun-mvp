"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Input } from "@/components/ui";
import { track } from "@/lib/analytics";

type ValidationError = "not_found" | "expired" | "used" | "invalid_format";

function renderError(error: ValidationError): string {
  switch (error) {
    case "not_found":
      return "الكود غير موجود.";
    case "expired":
      return "انتهت صلاحية هذا الكود.";
    case "used":
      return "تم استخدام هذا الكود مسبقًا.";
    case "invalid_format":
      return "صيغة الكود غير صحيحة.";
  }
}

export default function ActivatePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ValidationError | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    setError(null);

    if (!code.trim()) {
      track("activate_submit", { outcome: "fail", reason: "invalid_format" });
      setError("invalid_format");
      return;
    }

    track("activate_submit", { outcome: "attempt" });
    setLoading(true);

    try {
      const res = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!data.ok) {
        track("activate_submit", {
          outcome: "fail",
          reason: data.error ?? "unknown",
        });
        setError(data.error ?? "not_found");
        return;
      }

      localStorage.setItem("TAAMUN_ENTITLED", "true");
      track("activate_submit", { outcome: "success" });
      router.push("/day/1");
    } catch {
      track("activate_submit", { outcome: "fail", reason: "network_error" });
      setError("not_found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <Card className="space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="h1">تفعيل الاشتراك</h1>
          <p className="p-muted">
            أدخل كود التفعيل الخاص بك للمتابعة إلى تجربة تمَعُّن.
          </p>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="مثال: TAAMUN-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={loading}
            aria-label="كود التفعيل"
          />

          {error && (
            <Alert variant="danger" title="خطأ في التفعيل">
              {renderError(error)}
            </Alert>
          )}
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "جارٍ التحقق..." : "تفعيل الآن"}
        </Button>
      </Card>
    </div>
  );
}
