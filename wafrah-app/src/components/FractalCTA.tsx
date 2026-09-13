// جسر القمع → فراكتل. الرابط من متغير البيئة NEXT_PUBLIC_FRACTAL_URL (placeholder حتى يعبّئه زياد).
const FRACTAL_URL = process.env.NEXT_PUBLIC_FRACTAL_URL || "#";

// variant=mid: تنبيه وسطي خفيف (يوم 10) · variant=final: دعوة قوية (نهاية يوم 14)
export function FractalCTA({ variant }: { variant: "mid" | "final" }) {
  if (variant === "mid") {
    return (
      <aside className="rounded-xl2 border border-wafrah-200 bg-wafrah-50/50 px-5 py-4">
        <p className="text-sm leading-relaxed text-ink-700">
          ما تشعر به الآن بداية فقط. هناك رحلة أعمق تكمل ما بدأته هنا —{" "}
          <a
            href={FRACTAL_URL}
            className="font-semibold text-wafrah-800 underline underline-offset-2 hover:text-wafrah-900"
          >
            تعرّف على فراكتل
          </a>
          .
        </p>
      </aside>
    );
  }

  return (
    <section className="rounded-2xl border border-wafrah-300 bg-gradient-to-bl from-wafrah-50 to-white p-8 text-center shadow-soft">
      <p className="text-xs font-medium text-wafrah-700">الخطوة التالية</p>
      <h2 className="mt-3 text-2xl font-semibold leading-snug text-ink-900">
        أخيراً وجدت مساحة تفهم علاقتك بالمال.
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-600">
        هذه الأربعة عشر يوماً فتحت الباب. فراكتل رحلة ٩٠ يوماً ترافقك خطوة بخطوة
        لتحوّل هذا الوعي إلى نظام حياة.
      </p>
      <a
        href={FRACTAL_URL}
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-ink-800"
      >
        ادخل باب فراكتل
        <span aria-hidden>←</span>
      </a>
    </section>
  );
}
