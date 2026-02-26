import Link from "next/link";
import { AppShell } from "../../../../../components/AppShell";

interface Props {
  params: Promise<{ surah: string; ayah: string }>;
}

export default async function VersePage({ params }: Props) {
  const { surah, ayah } = await params;
  const ref = `${surah}:${ayah}`;

  return (
    <AppShell title={`آية ${surah}:${ayah}`}>
      <div className="space-y-6">
        <nav className="flex gap-4 text-sm">
          <Link href="/book" className="text-white/70 hover:text-white">
            المكتبة
          </Link>
          <Link href="/day" className="text-white/70 hover:text-white">
            اليوم
          </Link>
        </nav>

        <p className="text-white/80">
          صفحة الآية {ref} — سيُضاف المحتوى لاحقاً (شرح + روابط للفصول/المواضيع).
        </p>
      </div>
    </AppShell>
  );
}
