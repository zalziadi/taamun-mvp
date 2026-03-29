"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface GiftCode {
  id: string;
  code: string;
  tier: string;
  used_by: string | null;
  used_at: string | null;
  used_email: string | null;
  created_at: string;
}

/** رسالة وردة الجاهزة لواتساب — يُدرج الكود والاسم تلقائياً */
function buildWardaMessage(code: string, recipientName: string): string {
  return `السلام عليكم ورحمة الله 🌸

أتمنى تكونون بخير وعافية.

أنا وردة، من فريق تمعّن — وأتواصل معكم اليوم برسالة خاصة جداً.

قبل كل شيء، أحب أقول لكم شكراً من القلب. وجودكم معنا في تمعّن مو مجرد اشتراك — هو ثقة حقيقية، وهذا شيء نقدّره عميقاً.

ولأنكم من الناس اللي آمنوا بالرحلة من البداية، حبّينا نقدّم لكم هدية بسيطة تعبّر عن امتناننا:

✨ اشتراك سنة كاملة في تمعّن — هديتنا لكم

هذا كود التفعيل الخاص فيكم:

🔑 ${code}

طريقة التفعيل:
١. ادخلوا على taamun.com
٢. أدخلوا الكود في صفحة التفعيل
٣. استمتعوا بسنة كاملة من التمعّن

---

وبالمناسبة، أحب أشارككم إن بيانات حسابنا البنكي تحدّثت. لأي تعامل مستقبلي:

🏦 STC Bank
👤 زياد ابراهيم سعيد الزيادي
🔢 رقم الحساب: 1289471738
🔢 الآيبان: SA8278000000001289471738

---

إذا عندكم أي سؤال أو تحتاجون أي مساعدة، أنا هنا دائماً.

تمعّن رحلة، وأنتم جزء أصيل منها 🌷

بكل ودّ،
وردة 🌸
فريق تمعّن`;
}

export default function VipGiftsPage() {
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [count, setCount] = useState(1);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // أسماء المستلمين — تُحفظ محلياً في الصفحة
  const [recipientNames, setRecipientNames] = useState<Record<string, string>>({});

  async function fetchCodes() {
    try {
      const res = await fetch("/api/admin/vip-gifts", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setCodes(data.codes ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCodes();
    // تحميل الأسماء المحفوظة
    try {
      const saved = localStorage.getItem("taamun.vip-gift-names");
      if (saved) setRecipientNames(JSON.parse(saved));
    } catch {
      /* noop */
    }
  }, []);

  // حفظ الأسماء عند التغيير
  function updateName(codeId: string, name: string) {
    setRecipientNames((prev) => {
      const next = { ...prev, [codeId]: name };
      try {
        localStorage.setItem("taamun.vip-gift-names", JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }

  async function handleCreate() {
    setCreating(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/vip-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMsg({ ok: true, text: `سمرا جهّزت ${data.created} كود سنوي 🎁` });
        void fetchCodes();
      } else {
        setMsg({ ok: false, text: data.error || "فشل الإنشاء" });
      }
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setCreating(false);
    }
  }

  function copyMessage(code: GiftCode) {
    const name = recipientNames[code.id] || "";
    const message = buildWardaMessage(code.code, name);
    navigator.clipboard.writeText(message).then(() => {
      setCopiedId(code.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id + "-code");
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const available = codes.filter((c) => !c.used_by);
  const used = codes.filter((c) => c.used_by);

  return (
    <div dir="rtl" className="min-h-screen bg-[#15130f] px-4 pb-16 pt-6 text-[#e8e1d9]">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        {/* العنوان */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-xs text-[#c9b88a] hover:underline">
              ← لوحة الأدمن
            </Link>
            <h1 className="mt-2 font-[var(--font-amiri)] text-3xl text-[#e6d4a4]">
              هدايا VIP
            </h1>
            <p className="mt-1 text-sm text-white/40">
              سمرا تجهّز الأكواد — وردة ترسل الرسالة
            </p>
          </div>
          <div className="text-left">
            <p className="text-xs text-white/40">أكواد الهدايا</p>
            <p className="text-2xl font-bold text-[#c9b88a]">{codes.length}</p>
            <p className="text-[10px] text-white/30">
              {available.length} جاهز · {used.length} مُفعّل
            </p>
          </div>
        </div>

        {/* سمرا — إنشاء أكواد */}
        <section className="rounded-3xl border border-emerald-500/20 bg-[#2b2824] p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm">
              🔧
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#e8e1d9]">سمرا — تجهيز الأكواد</h2>
              <p className="text-xs text-white/40">أكواد سنوية (365 يوم) لعملاء VIP</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-white/50">عدد الأكواد</label>
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#1c1a15] px-4 py-3 text-sm text-[#e8e1d9] focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating}
                className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {creating ? "سمرا تجهّز..." : "جهّزي الأكواد يا سمرا"}
              </button>
            </div>
          </div>
          {msg && (
            <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-400" : "text-amber-400"}`}>
              {msg.text}
            </p>
          )}
        </section>

        {/* وردة — الأكواد الجاهزة للإرسال */}
        <section className="rounded-3xl border border-pink-500/20 bg-[#2b2824] p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/20 text-sm">
              🌸
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#e8e1d9]">
                وردة — الرسائل الجاهزة
                <span className="mr-2 text-sm font-normal text-pink-400">({available.length})</span>
              </h2>
              <p className="text-xs text-white/40">انسخي الرسالة وأرسليها على واتساب</p>
            </div>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-white/40">جاري التحميل...</p>
          ) : available.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">لا توجد أكواد جاهزة. اطلبي من سمرا تجهّز أكواد جديدة ↑</p>
          ) : (
            <div className="mt-4 space-y-4">
              {available.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-white/10 bg-[#1c1a15] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p dir="ltr" className="font-mono text-lg font-semibold text-[#e6d4a4]">
                        {c.code}
                      </p>
                      <div className="flex gap-2 text-[11px] text-white/40">
                        <span>سنوي (365 يوم)</span>
                        <span>·</span>
                        <span>هدية VIP</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => copyCode(c.code, c.id)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-[#c9b88a]/30 hover:text-[#c9b88a]"
                      >
                        {copiedId === c.id + "-code" ? "✓ تم" : "نسخ الكود"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyMessage(c)}
                        className="rounded-lg border border-pink-500/20 bg-pink-500/10 px-4 py-1.5 text-xs text-pink-400 transition-colors hover:bg-pink-500/20"
                      >
                        {copiedId === c.id ? "✓ تم نسخ الرسالة" : "🌸 نسخ رسالة وردة"}
                      </button>
                    </div>
                  </div>
                  {/* حقل اسم المستلم */}
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="اسم العميل (اختياري — للتنظيم)"
                      value={recipientNames[c.id] || ""}
                      onChange={(e) => updateName(c.id, e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#15130f] px-3 py-2 text-xs text-[#e8e1d9] placeholder:text-white/20 focus:border-pink-500/30 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* الأكواد المُفعّلة */}
        {used.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-[#2b2824] p-6">
            <h2 className="text-lg font-bold text-[#e8e1d9]">
              تم التفعيل <span className="text-sm font-normal text-white/40">({used.length})</span>
            </h2>
            <div className="mt-4 space-y-3">
              {used.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#1c1a15]/60 p-4 opacity-70"
                >
                  <div className="space-y-1">
                    <p dir="ltr" className="font-mono text-base text-white/50 line-through">
                      {c.code}
                    </p>
                    <p className="text-[11px] text-white/30">
                      {recipientNames[c.id] || "بدون اسم"}
                    </p>
                  </div>
                  <div className="text-left text-[11px] text-white/40">
                    <p>{c.used_email}</p>
                    <p>{c.used_at ? new Date(c.used_at).toLocaleDateString("ar-SA") : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
