import type { Metadata } from "next";
import { COURSES } from "@/lib/courses";

export const metadata: Metadata = {
  title: "المكتبة — كورسات مجانية",
  description:
    "كورسات مجانية من أرشيف زياد الزيادي على يوتيوب — شاهد ثم طبّق. مساحة تعلّم مفتوحة بجانب رحلة الوعي المالي.",
};

export default function LibraryPage() {
  const course = COURSES[0];

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <p className="text-xs font-medium text-wafrah-700">المكتبة · كورس مجاني</p>
        <h1 className="text-3xl font-semibold text-ink-900 leading-snug">{course.title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-600">{course.promise}</p>
        <p className="text-xs text-ink-400">
          {course.modules.length} وحدات · {course.lessonCount} درساً · شاهد ثم طبّق
        </p>
      </header>

      <div className="space-y-10">
        {course.modules.map((mod, mi) => (
          <section key={mi} className="space-y-5">
            <div className="border-r-2 border-wafrah-500 pr-3">
              <h2 className="text-lg font-semibold text-ink-900">
                <span className="text-wafrah-700">الوحدة {mi + 1}</span> · {mod.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{mod.framing}</p>
            </div>

            <div className="space-y-4">
              {mod.lessons.map((les, li) => (
                <article
                  key={les.id}
                  className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-semibold text-ink-900 leading-snug">
                      {mi + 1}.{li + 1} {les.title}
                    </h3>
                    <a
                      href={les.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-ink-800"
                    >
                      شاهد ←
                    </a>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-ink-700">{les.thesis}</p>

                  {les.lessons.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {les.lessons.slice(0, 3).map((point, pi) => (
                        <li key={pi} className="flex gap-2 text-sm text-ink-600">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-wafrah-500" />
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {les.quote && (
                    <p className="mt-3 border-r-2 border-sand-300 pr-3 text-sm italic leading-relaxed text-ink-500">
                      «{les.quote}»
                    </p>
                  )}

                  <div className="mt-4 rounded-lg bg-wafrah-50 px-4 py-3">
                    <p className="text-xs font-medium text-wafrah-700">تطبيق اليوم</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-700">{les.exercise}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
