import Link from "next/link";
import { AppShell } from "../../components/AppShell";

export default function PrivacyPage() {
  return (
    <AppShell title="الخصوصية">
      <div className="prose prose-invert max-w-none space-y-4">
        <p className="text-white/80">
          سياسة الخصوصية قيد الإعداد.
        </p>
        <Link href="/" className="inline-block text-white/70 underline hover:text-white">
          العودة للرئيسية
        </Link>
      </div>
    </AppShell>
  );
}
