import type { Metadata } from "next";
import Link from "next/link";
import { faqSchema, jsonLdString } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "أسئلة شائعة — تمعّن",
  description:
    "إجابات مختصرة حول تمعّن: الأسعار، الخصوصية، كيف يعمل، وضع المبدع، الاسترجاع.",
  openGraph: {
    title: "أسئلة شائعة — تمعّن",
    description:
      "كل ما تريد معرفته قبل أن تبدأ رحلتك في تمعّن.",
    type: "article",
  },
};

type Pair = { question: string; answer: string };

const FAQ: Pair[] = [
  {
    question: "كيف يعمل برنامج تمعّن؟",
    answer:
      "كل يوم لمدّة ٢٨ يوماً تفتح صفحة اليوم فتجد: آية قصيرة، لحظة صمت، طبقة أعمق للمعنى، اقتباس من كتاب \"مدينة المعنى بلغة القرآن\"، سؤال تمعّن تكتب فيه تأمّلك، ومقياس للوعي. كل ذلك في ٥ دقائق يومياً.",
  },
  {
    question: "ما الباقات المتاحة؟",
    answer:
      "الباقة الربع سنوية (٩٠ يوماً)، السنوية (٣٦٥ يوماً)، وباقة VIP التي تضيف ميزات المبدع والخريطة الجينية وBaZi. كل التفاصيل في /pricing.",
  },
  {
    question: "هل يمكنني تجربة تمعّن مجاناً قبل الاشتراك؟",
    answer:
      "نعم. يبدأ الحساب الجديد بتجربة ٧ أيام كاملة. إذا استمتعت بالرحلة، اختر الباقة المناسبة عند انتهاء التجربة.",
  },
  {
    question: "ما هو وضع المبدع؟",
    answer:
      "إذا كنت من حاملي باقة VIP يمكنك نشر رحلة قرآنية قصيرة خاصة بك (٧ أو ١٤ يوماً)، ومتابعتها عبر تحليلات تعرض لك المشتركين ونسبة الإكمال. شاهد الدليل الكامل في /creator/guide.",
  },
  {
    question: "كيف يعمل نظام الدعوة؟",
    answer:
      "كل مشترك يحصل على كود دعوة فريد. عندما يشترك صديقك عبر كودك، يحصل كلاكما على ٣٠ يوماً إضافية مجانية تُضاف إلى نهاية اشتراككما الحالي.",
  },
  {
    question: "كيف تحمون خصوصية تأمّلاتي؟",
    answer:
      "كل تأملاتك ومقاييس وعيك خاصة بك وحدك. لا يراها أحد إلا إذا اخترت مشاركة رؤية قصيرة على /shared. حتى المرشد الذكي يقرأ ملخّصاً مشفّراً لا النصوص الأصلية.",
  },
  {
    question: "هل أستطيع استرجاع المبلغ؟",
    answer:
      "خلال أوّل ٧ أيام من الاشتراك المدفوع، إذا شعرت أن تمعّن لا يناسبك راسلنا عبر الواتساب وسنرجع المبلغ كاملاً بلا أسئلة.",
  },
  {
    question: "هل يعمل تمعّن دون اتصال بالإنترنت؟",
    answer:
      "جزئياً. التطبيق PWA يعمل دون اتصال للصفحات التي زرتها مؤخراً، لكن الاتصال مطلوب لحفظ التأملات الجديدة ومحادثات المرشد.",
  },
];

export default function FAQPage() {
  const schema = faqSchema(FAQ);
  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-6 py-10 space-y-6" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(schema) }}
      />
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2f2619]">
          أسئلة شائعة
        </h1>
        <p className="text-sm text-[#5a4a35]">
          إجابات مختصرة لما يسأل عنه معظم من يبدؤون رحلتهم في تمعّن.
        </p>
      </header>

      <dl className="space-y-4">
        {FAQ.map((pair) => (
          <div key={pair.question} className="tm-card p-5 sm:p-6 space-y-2">
            <dt className="text-sm font-bold text-[#2f2619]">{pair.question}</dt>
            <dd className="text-xs sm:text-sm text-[#3d342a] leading-relaxed">
              {pair.answer}
            </dd>
          </div>
        ))}
      </dl>

      <div className="text-center pt-2 space-y-3">
        <p className="text-xs text-[#5a4a35]">
          لم تجد جواباً لسؤالك؟
        </p>
        <Link
          href="/guide"
          className="inline-block border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-5 py-2 text-xs font-bold"
        >
          اسأل المرشد
        </Link>
      </div>
    </main>
  );
}
