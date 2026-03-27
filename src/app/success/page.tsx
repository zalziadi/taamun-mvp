import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "مبروك! — تمعّن",
  description: "تم تفعيل اشتراكك بنجاح",
};

export default function SuccessPage() {
  return (
    <div
      className="min-h-screen bg-[#15130f] text-[#e8e1d9] flex flex-col items-center justify-center px-4"
      dir="rtl"
    >
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-[#6D8BFF]/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <span className="text-4xl">🌿</span>
        </div>

        <h1 className="text-4xl font-bold mb-4">مبروك!</h1>
        <p className="text-zinc-400 text-lg mb-12">
          رحلتك مع تمعّن بدأت الآن — كل يوم خطوة نحو الأفضل
        </p>

        <div className="space-y-4 mb-12">
          <a
            href="/book.pdf"
            download="مدينة_المعنى.pdf"
            className="flex items-center gap-4 bg-[#131820] border border-white/10 rounded-2xl p-5 hover:border-[#6D8BFF]/50 transition-all group"
          >
            <div className="w-12 h-12 bg-[#6D8BFF]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📖</span>
            </div>
            <div className="text-right flex-1">
              <p className="font-bold text-white group-hover:text-[#6D8BFF] transition-colors">
                تحميل كتاب مدينة المعنى
              </p>
              <p className="text-zinc-400 text-sm mt-0.5">PDF — جاهز للتحميل الآن</p>
            </div>
            <span className="text-zinc-600 group-hover:text-[#6D8BFF] transition-colors text-xl">↙</span>
          </a>

          <a
            href="https://taamun.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-[#131820] border border-white/10 rounded-2xl p-5 hover:border-[#6D8BFF]/50 transition-all group"
          >
            <div className="w-12 h-12 bg-[#6D8BFF]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📱</span>
            </div>
            <div className="text-right flex-1">
              <p className="font-bold text-white group-hover:text-[#6D8BFF] transition-colors">
                فعّل تطبيق تمعّن
              </p>
              <p className="text-zinc-400 text-sm mt-0.5">ابدأ رحلتك اليومية</p>
            </div>
            <span className="text-zinc-600 group-hover:text-[#6D8BFF] transition-colors text-xl">←</span>
          </a>

          <a
            href="https://wa.me/966553930885?text=السلام عليكم، أكملت الاشتراك وأبغى أبدأ رحلتي مع تمعّن"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-[#131820] border border-white/10 rounded-2xl p-5 hover:border-[#6D8BFF]/50 transition-all group"
          >
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💬</span>
            </div>
            <div className="text-right flex-1">
              <p className="font-bold text-white group-hover:text-[#6D8BFF] transition-colors">
                تواصل معنا على واتساب
              </p>
              <p className="text-zinc-400 text-sm mt-0.5">فريقنا جاهز لمساعدتك</p>
            </div>
            <span className="text-zinc-600 group-hover:text-[#6D8BFF] transition-colors text-xl">←</span>
          </a>
        </div>

        <div className="bg-[#6D8BFF]/10 border border-[#6D8BFF]/20 rounded-2xl p-6 text-right mb-8">
          <h3 className="font-bold text-[#6D8BFF] mb-3">🌙 رسالة البداية</h3>
          <p className="text-zinc-300 text-sm leading-7">
            أهلاً بك في رحلة تمعّن.
            <br />
            ابدأ بقراءة أول فصل من الكتاب اليوم — لا تؤجل.
            <br />
            كل يوم فيه خطوة واحدة صغيرة = تحول حقيقي بعد ٩٠ يوماً.
            <br />
            <span className="text-[#6D8BFF] font-medium">نحن معك في كل خطوة. 🌿</span>
          </p>
        </div>

        <Link href="/pricing" className="text-zinc-600 text-sm hover:text-zinc-400 transition-colors">
          ← العودة لصفحة الباقات
        </Link>
      </div>
    </div>
  );
}
