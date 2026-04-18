"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function BirthDataForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);
  const [birthPlace, setBirthPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any[] | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!day || !month || !year || !birthPlace.trim()) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    const birthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const birthTime = unknownTime ? "12:00" : `${(hour || "12").padStart(2, "0")}:${(minute || "0").padStart(2, "0")}`;

    setLoading(true);

    try {
      const res = await fetch("/api/gene-keys/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth_date: birthDate,
          birth_time: birthTime,
          birth_place: birthPlace.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error_ar || data.error || "حدث خطأ — حاول مرة أخرى");
        setLoading(false);
        return;
      }

      if (user) {
        router.push("/guide");
      } else {
        setResult(data.profile);
        setLoading(false);
      }
    } catch {
      setError("خطأ في الاتصال — حاول مرة أخرى");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#2c2a24] bg-[#1e1b16] px-4 py-3 text-[#e8e1d9] placeholder-[#969083] focus:border-[#c9a96e] focus:outline-none focus:ring-1 focus:ring-[#c9a96e] font-body text-base";
  const labelClass = "block text-sm text-[#cdc6b7] mb-2 font-body";

  if (checkingAuth) {
    return (
      <div className="text-center py-12">
        <p className="text-[#969083]">جاري التحقق...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Auth hint — not blocking */}
      {!user && !result && (
        <p className="text-xs text-[#969083] text-center mb-4">
          يمكنك الاكتشاف بدون تسجيل دخول — سجّل لاحقاً لحفظ خريطتك
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* تاريخ الميلاد */}
        <div>
          <label className={labelClass}>تاريخ الميلاد</label>
          <div className="grid grid-cols-3 gap-3">
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">اليوم</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </select>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">الشهر</option>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">السنة</option>
              {Array.from({ length: 80 }, (_, i) => {
                const y = new Date().getFullYear() - 16 - i;
                return (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* وقت الميلاد */}
        <div>
          <label className={labelClass}>وقت الميلاد</label>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className={inputClass}
              disabled={unknownTime}
            >
              <option value="">الساعة</option>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={String(i)}>
                  {String(i).padStart(2, "0")}
                </option>
              ))}
            </select>

            <select
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className={inputClass}
              disabled={unknownTime}
            >
              <option value="">الدقيقة</option>
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                <option key={m} value={String(m)}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={unknownTime}
              onChange={(e) => setUnknownTime(e.target.checked)}
              className="rounded border-[#2c2a24] bg-[#1e1b16] text-[#c9a96e] focus:ring-[#c9a96e]"
            />
            <span className="text-sm text-[#969083]">لا أعرف الوقت بدقة</span>
          </label>
        </div>

        {/* مكان الميلاد */}
        <div>
          <label className={labelClass}>مكان الميلاد</label>
          <input
            type="text"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            placeholder="مثال: جدة، السعودية"
            className={inputClass}
            required
            dir="rtl"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-[#ffb4ab] text-center">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#c9a96e] py-4 text-[#0A0908] font-bold text-lg transition-all hover:bg-[#e6d4a4] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "جاري رسم خريطتك..." : "اكشف خريطتك الجينية"}
        </button>
      </form>

      {/* Results display */}
      {result && (
        <div className="mt-8 space-y-3">
          <h2
            className="text-xl font-bold text-center mb-4"
            style={{ color: "#c9a96e", fontFamily: "Amiri, serif" }}
          >
            خريطتك الجينية
          </h2>
          {result.map((s: any) => (
            <div
              key={s.sphere}
              className="rounded-lg border border-[#2c2a24] bg-[#1e1b16] p-4"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-[#c9a96e]">
                  {SPHERE_LABELS[s.sphere] ?? s.sphere}
                </span>
                <span className="text-xs text-[#969083]">
                  المفتاح {s.gene_key}.{s.line}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-[#cdc6b7]">
                <span>المسموم: <span className="text-[#ffb4ab]">{s.wm ?? s.shadow}</span></span>
                <span>الفائق: <span className="text-[#c9a96e]">{s.wf ?? s.gift}</span></span>
                <span>السامي: <span className="text-[#e6d4a4]">{s.ws ?? s.siddhi}</span></span>
              </div>
              {s.ayah && (
                <p className="text-xs text-[#969083] mt-2 leading-relaxed" style={{ fontFamily: "Amiri, serif" }}>
                  {s.ayah} <span className="text-[#c9a96e]">— {s.ayah_ref ?? s.ref}</span>
                </p>
              )}
            </div>
          ))}

          {!user && (
            <div className="text-center mt-6">
              <p className="text-sm text-[#cdc6b7] mb-3">سجّل دخولك لحفظ خريطتك والبدء مع المرشد</p>
              <button
                onClick={() => router.push("/login?next=/profile/setup")}
                className="rounded-lg bg-[#c9a96e] px-8 py-3 text-[#0A0908] font-bold transition-all hover:bg-[#e6d4a4]"
              >
                تسجيل الدخول
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const SPHERE_LABELS: Record<string, string> = {
  lifes_work: "عمل الحياة",
  evolution: "التطور",
  radiance: "الإشراق",
  purpose: "الغاية",
  attraction: "الجاذبية",
  iq: "الذكاء العقلي",
  eq: "الذكاء العاطفي",
  sq: "الذكاء الروحي",
  vocation: "الدعوة",
  culture: "الثقافة",
  pearl: "اللؤلؤة",
};
