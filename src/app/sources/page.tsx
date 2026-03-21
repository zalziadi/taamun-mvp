import Link from "next/link";

export default function SourcesPage() {
  return (
    <div className="tm-shell space-y-6">
      <section className="tm-card p-7">
        <p className="text-xs tracking-[0.22em] text-[#8c7851]">SOURCES</p>
        <h1 className="tm-heading mt-2 text-4xl leading-tight">مصادر</h1>
        <p className="mt-3 max-w-[780px] text-sm leading-relaxed text-[#5f5648]/85">
          مرجعان أساسيان في المنصة: القرآن الكريم، وكتاب مدينة المعنى. اختر المصدر الذي تريد البدء منه.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="tm-card p-6">
          <div className="mb-3 inline-flex rounded-full border border-[#cdb98f] bg-[#f1e7d4] px-3 py-1 text-xs text-[#7b694a]">
            المصدر الأول
          </div>
          <h2 className="tm-heading text-3xl text-[#5a4531]">القرآن الكريم</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6f6455]">
            اقرأ الآيات مباشرة من مصدر موثوق للرجوع السريع أثناء التأمل.
          </p>
          <a
            href="https://quran.com/ar"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block rounded-xl bg-[#7b694a] px-5 py-2.5 text-sm font-semibold text-[#fff8f0] transition hover:bg-[#6d5e44]"
          >
            فتح القرآن الكريم
          </a>
        </article>

        <article className="tm-card p-6">
          <div className="mb-3 inline-flex rounded-full border border-[#cdb98f] bg-[#f1e7d4] px-3 py-1 text-xs text-[#7b694a]">
            المصدر الثاني
          </div>
          <h2 className="tm-heading text-3xl text-[#5a4531]">كتاب مدينة المعنى</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6f6455]">
            تصفح فصول الكتاب داخل الموقع أو افتح نسخة PDF للقراءة المركزة.
          </p>
          <div className="mt-5 inline-flex rounded-full border border-[#d8cdb9] bg-[#f8f3ea] px-4 py-2 text-sm font-semibold text-[#7d7362]">
            قريبًا
          </div>
        </article>
      </section>
    </div>
  );
}
