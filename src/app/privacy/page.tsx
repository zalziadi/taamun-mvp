import Link from "next/link";
import { AppShell } from "../../components/AppShell";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "966553930885";

export default function PrivacyPage() {
  return (
    <AppShell title="الخصوصية">
      <div className="max-w-xl space-y-6">
        <h1 className="text-xl font-bold text-white">الخصوصية</h1>

        <ul className="space-y-3 text-white/80 text-sm list-disc list-inside">
          <li>
            <strong className="text-white">البيانات المخزنة:</strong> البريد الإلكتروني، تقدمك في الرحلة، وحالة التفعيل (اشتراك).
          </li>
          <li>
            <strong className="text-white">الغرض:</strong> تشغيل البرنامج، حفظ تقدمك، والتحقق من صلاحية اشتراكك.
          </li>
          <li>
            <strong className="text-white">الاحتفاظ:</strong> نحمي بياناتك طوال فترة استخدامك وما بعدها حسب الحاجة للدعم.
          </li>
          <li>
            <strong className="text-white">التواصل:</strong> واتساب{" "}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline hover:no-underline"
            >
              {WHATSAPP_NUMBER}
            </a>
          </li>
        </ul>

        <Link href="/" className="inline-block text-white/70 underline hover:text-white text-sm">
          العودة للرئيسية
        </Link>
      </div>
    </AppShell>
  );
}
