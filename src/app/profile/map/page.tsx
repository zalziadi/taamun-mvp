"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type GeneKeyRow = {
  sphere: string;
  gene_key: number;
  line: number;
  shadow: string | null;
  gift: string | null;
  siddhi: string | null;
  wm: string | null;
  wf: string | null;
  ws: string | null;
  ayah: string | null;
  ayah_ref: string | null;
};

const SPHERE_LABELS: Record<string, { ar: string; desc: string }> = {
  lifes_work: { ar: "عمل الحياة", desc: "ما تفعله بشكل طبيعي حين تكون في أفضل حالاتك" },
  evolution: { ar: "التطور", desc: "التحدي الذي يدفعك للنمو المستمر" },
  radiance: { ar: "الإشراق", desc: "كيف يراك العالم حين تكون صادقاً" },
  purpose: { ar: "الغاية", desc: "المعنى الأعمق الذي تعيش من أجله" },
  attraction: { ar: "الجاذبية", desc: "ما يجذبه إليك حين تكون حاضراً" },
  iq: { ar: "الذكاء العقلي", desc: "طريقتك الفريدة في التفكير والتحليل" },
  eq: { ar: "الذكاء العاطفي", desc: "كيف تتواصل مع مشاعرك ومشاعر الآخرين" },
  sq: { ar: "الذكاء الروحي", desc: "علاقتك العميقة بالمعنى والغيب" },
  core: { ar: "المركز", desc: "جوهر هويتك — كيف تتخذ قراراتك الحقيقية" },
  culture: { ar: "الثقافة", desc: "البيئة التي تزدهر فيها" },
  pearl: { ar: "اللؤلؤة", desc: "علاقتك بالوفرة والمال والعطاء" },
};

const SPHERE_ORDER = [
  "core", "lifes_work", "evolution", "radiance", "purpose",
  "attraction", "iq", "eq", "sq", "culture", "pearl",
];

export default function GeneKeysMapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [geneKeys, setGeneKeys] = useState<GeneKeyRow[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth?next=/profile/map");
        return;
      }

      const [profileRes, gkRes] = await Promise.all([
        supabase.from("profiles").select("full_name, subscription_tier").eq("id", user.id).single(),
        supabase.from("user_gene_keys_profile").select("*").eq("user_id", user.id),
      ]);

      const profile = profileRes.data;
      setUserName(profile?.full_name ?? null);

      if (!gkRes.data || gkRes.data.length === 0) {
        setLoading(false);
        return;
      }

      // Sort by SPHERE_ORDER
      const sorted = [...gkRes.data].sort((a, b) => {
        const ia = SPHERE_ORDER.indexOf(a.sphere);
        const ib = SPHERE_ORDER.indexOf(b.sphere);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

      setGeneKeys(sorted);
      setLoading(false);
    }
    void load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15130f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9b88a] border-t-transparent" />
      </div>
    );
  }

  if (geneKeys.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#15130f] p-6 text-center">
        <h1 className="font-[var(--font-amiri)] text-2xl text-[#e8e1d9]">خريطتك الجينية</h1>
        <p className="mt-4 text-sm text-white/50">لم يتم حساب خريطتك بعد.</p>
        <Link href="/profile/setup" className="mt-6 rounded-xl bg-[#c9b88a] px-6 py-3 text-sm font-bold text-[#15130f]">
          احسب خريطتك الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15130f] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <span className="rounded-full border border-[#c9b88a]/40 bg-[#c9b88a]/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#c9b88a]">
              VIP
            </span>
          </div>
          <h1 className="font-[var(--font-amiri)] text-2xl sm:text-3xl text-[#e8e1d9]">
            {userName ? `خريطة ${userName} الجينية` : "خريطتك الجينية"}
          </h1>
          <p className="text-xs text-[#c9b88a]/60">
            خريطة الوعي — من الوعي المسموم إلى الوعي السامي
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-white/30">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-white/20" />
            الوعي المسموم
          </span>
          <span className="text-[#c9b88a]/30">→</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[#c9b88a]/60" />
            الوعي الفائق
          </span>
          <span className="text-[#c9b88a]/30">→</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[#c9b88a]" />
            الوعي السامي
          </span>
        </div>

        {/* Spheres */}
        <div className="space-y-3">
          {geneKeys.map((gk) => {
            const info = SPHERE_LABELS[gk.sphere] ?? { ar: gk.sphere, desc: "" };
            const shadow = gk.wm ?? gk.shadow ?? "—";
            const gift = gk.wf ?? gk.gift ?? "—";
            const siddhi = gk.ws ?? gk.siddhi ?? "—";

            return (
              <div
                key={gk.sphere}
                className="rounded-2xl border border-[#c9b88a]/15 bg-[#1d1b17] p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-[#e8e1d9]">{info.ar}</h3>
                    <p className="text-xs text-white/30 mt-0.5">{info.desc}</p>
                  </div>
                  <span className="rounded-lg border border-[#c9b88a]/20 bg-[#c9b88a]/10 px-2.5 py-1 text-xs font-bold text-[#c9b88a]">
                    {gk.gene_key}.{gk.line}
                  </span>
                </div>

                {/* Shadow → Gift → Siddhi */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-center">
                    <p className="text-[10px] text-white/25 mb-0.5">المسموم</p>
                    <p className="text-white/50">{shadow}</p>
                  </div>
                  <span className="text-[#c9b88a]/30 text-xs">→</span>
                  <div className="flex-1 rounded-lg border border-[#c9b88a]/15 bg-[#c9b88a]/5 px-3 py-2 text-center">
                    <p className="text-[10px] text-[#c9b88a]/50 mb-0.5">الفائق</p>
                    <p className="text-[#c9b88a]/80">{gift}</p>
                  </div>
                  <span className="text-[#c9b88a]/30 text-xs">→</span>
                  <div className="flex-1 rounded-lg border border-[#c9b88a]/25 bg-[#c9b88a]/10 px-3 py-2 text-center">
                    <p className="text-[10px] text-[#c9b88a]/70 mb-0.5">السامي</p>
                    <p className="text-[#c9b88a] font-medium">{siddhi}</p>
                  </div>
                </div>

                {/* Quranic verse */}
                {gk.ayah && (
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-3 py-2">
                    <p className="text-xs text-amber-400/50 mb-0.5">الآية المرتبطة</p>
                    <p className="text-sm leading-loose text-amber-100/80">﴿ {gk.ayah} ﴾</p>
                    {gk.ayah_ref && (
                      <p className="text-[10px] text-amber-400/40 mt-1">{gk.ayah_ref}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Link
            href="/guide"
            className="rounded-xl bg-[#c9b88a] px-5 py-3 text-sm font-bold text-[#15130f]"
          >
            تحدّث مع تمعّن عن خريطتك
          </Link>
          <Link
            href="/account"
            className="rounded-xl border border-[#c9b88a]/15 bg-[#1d1b17] px-5 py-3 text-sm text-[#e8e1d9]"
          >
            كهفي
          </Link>
        </div>
      </div>
    </div>
  );
}
