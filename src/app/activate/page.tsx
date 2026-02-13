"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { setEntitlement, isAdminEnabled } from "../../lib/storage";
import { markCodeUsed } from "../../lib/storage";
import {
  validateCode,
  isValidCode,
  getAllCodes,
  getDynamicCodes,
  addDynamicCode,
  clearDynamicCodes,
  generateNewCode,
} from "../../lib/activation";
import {
  normalizeCode,
  isCodeUsed,
  clearUsedCodes,
  getUsedCodes,
} from "../../lib/storage";
import { StatusCard } from "../../components/StatusCard";

function ActivateContent() {
  const searchParams = useSearchParams();
  const paramCode = searchParams.get("code");

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error" | "used">("idle");
  const [autoChecked, setAutoChecked] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = isAdminEnabled();
  const allCodes = getAllCodes();
  const usedCodes = getUsedCodes();
  const availableCodes = allCodes.filter((c) => !usedCodes.includes(c));
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const doActivate = useCallback((normalized: string) => {
    if (validateCode(normalized)) {
      markCodeUsed(normalized);
      setEntitlement("active");
      setStatus("success");
    } else if (isValidCode(normalized) && isCodeUsed(normalized)) {
      setStatus("used");
    } else {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (autoChecked) return;
    const raw = paramCode ?? "";
    const normalized = raw.trim().toUpperCase();
    if (!normalized) {
      const id = setTimeout(() => setAutoChecked(true), 0);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setAutoChecked(true);
      doActivate(normalized);
    }, 0);
    return () => clearTimeout(id);
  }, [paramCode, autoChecked, doActivate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const normalized = normalizeCode(code);
    doActivate(normalized);
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
  };

  const handleGenerateNew = () => {
    const gen = generateNewCode();
    addDynamicCode(gen);
    setNewCode(gen);
    setRefreshKey((k) => k + 1);
  };

  const handleClearUsed = () => {
    if (confirm("هل تريد مسح قائمة الأكواد المستخدمة؟")) {
      clearUsedCodes();
      setRefreshKey((k) => k + 1);
    }
  };

  const handleClearDynamic = () => {
    if (confirm("هل تريد مسح الأكواد المولدة؟")) {
      clearDynamicCodes();
      setNewCode(null);
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <nav className="mb-8 flex gap-4">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
        <Link href="/subscribe" className="text-white/70 hover:text-white">
          الاشتراك
        </Link>
      </nav>

      <h1 className="mb-8 text-2xl font-bold text-white">تفعيل الاشتراك</h1>

      <div className="max-w-md space-y-6">
        {status === "success" ? (
          <>
            <StatusCard
              title="تم التفعيل بنجاح ✅"
              message="يمكنك الآن استخدام تمعّن كاملاً."
              variant="success"
            />
            <Link
              href="/day"
              className="inline-block rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] transition-colors hover:bg-white/90"
            >
              اذهب لصفحة اليوم
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="code" className="block text-white/90">
              كود التفعيل
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setStatus("idle");
              }}
              className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white placeholder:text-white/40"
              placeholder="أدخل الكود أو استخدم الرابط مع ?code=TAAMUN001"
              dir="ltr"
              autoComplete="off"
            />
            <button
              type="submit"
              className="rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] transition-colors hover:bg-white/90"
            >
              تفعيل
            </button>
            {status === "error" && (
              <StatusCard
                title="كود غير صحيح"
                message="تحقق من الكود وحاول مرة أخرى."
                variant="warning"
              />
            )}
            {status === "used" && (
              <StatusCard
                title="هذا الكود مستخدم مسبقًا"
                message="كل كود يُستخدم مرة واحدة فقط على هذا الجهاز."
                variant="warning"
              />
            )}
          </form>
        )}
      </div>

      {isAdmin && (
        <div className="mt-12 border-t border-white/10 pt-8">
          <button
            type="button"
            onClick={() => setAdminOpen(!adminOpen)}
            className="mb-4 text-sm text-white/60 hover:text-white"
          >
            {adminOpen ? "إخفاء لوحة الأدمن" : "لوحة الأدمن"}
          </button>
          {adminOpen && (
            <div className="space-y-6" key={refreshKey}>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 font-medium text-white">الأكواد المتاحة</h3>
                {availableCodes.length === 0 ? (
                  <p className="text-sm text-white/60">لا توجد أكواد متاحة</p>
                ) : (
                  <ul className="space-y-2">
                    {availableCodes.map((c: string) => (
                      <li key={c} className="flex items-center justify-between gap-2">
                        <code className="text-sm text-white/90">{c}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`${origin}/activate?code=${c}`)}
                          className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
                        >
                          نسخ رابط التفعيل
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 font-medium text-white">الأكواد المستخدمة</h3>
                {usedCodes.length === 0 ? (
                  <p className="text-sm text-white/60">لا توجد</p>
                ) : (
                  <ul className="space-y-1">
                    {usedCodes.map((c: string) => (
                      <li key={c} className="text-sm text-white/70">
                        <code>{c}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleGenerateNew}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                >
                  توليد كود جديد
                </button>
                {newCode && (
                  <span className="flex items-center gap-2">
                    <code className="text-white/90">{newCode}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${origin}/activate?code=${newCode}`)}
                      className="rounded bg-white/10 px-2 py-1 text-xs text-white"
                    >
                      نسخ
                    </button>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleClearUsed}
                  className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
                >
                  مسح الأكواد المستخدمة
                </button>
                {getDynamicCodes().length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearDynamic}
                    className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/20"
                  >
                    مسح الأكواد المولدة
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F14] p-6 text-white">جاري التحميل...</div>}>
      <ActivateContent />
    </Suspense>
  );
}
