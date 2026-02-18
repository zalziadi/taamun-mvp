import Link from "next/link";
import { getAppOriginServer } from "@/lib/appOrigin";

interface DashboardResponse {
  ok: boolean;
  metrics?: {
    users_active: number;
    answers_total: number;
    users_completed_28: number;
    weekly_insights_total: number;
    final_insights_total: number;
  };
}

export default async function AdminPage() {
  const origin = await getAppOriginServer();
  const dashboardRes = await fetch(`${origin}/api/admin/dashboard`, {
    cache: "no-store",
  });

  const data = (await dashboardRes.json().catch(() => ({ ok: false }))) as DashboardResponse;
  const allowed = dashboardRes.ok && data.ok;

  if (!allowed) {
    return (
      <div className="min-h-screen bg-[#0B0F14] p-6">
        <nav className="mb-8">
          <Link href="/" className="text-white/70 hover:text-white">
            الرئيسية
          </Link>
        </nav>
        <h1 className="mb-8 text-2xl font-bold text-white">لوحة الأدمن</h1>
        <div className="max-w-md rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
          <p className="font-medium text-amber-400">غير مسموح</p>
          <p className="mt-1 text-sm text-white/80">حسابك لا يملك صلاحية الأدمن.</p>
        </div>
      </div>
    );
  }

  const metrics = data.metrics ?? {
    users_active: 0,
    answers_total: 0,
    users_completed_28: 0,
    weekly_insights_total: 0,
    final_insights_total: 0,
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <nav className="mb-8">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
      </nav>
      <h1 className="mb-8 text-2xl font-bold text-white">لوحة الأدمن</h1>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="المستخدمون النشطون" value={metrics.users_active} />
        <MetricCard label="إجمالي الإجابات" value={metrics.answers_total} />
        <MetricCard label="أكملوا 28 يوم" value={metrics.users_completed_28} />
        <MetricCard label="رؤى أسبوعية" value={metrics.weekly_insights_total} />
        <MetricCard label="رؤى نهائية" value={metrics.final_insights_total} />
      </div>

      <div className="max-w-xl space-y-4">
        <Link
          href="/admin/activations"
          className="block rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-white transition-colors hover:bg-white/10"
        >
          التفعيلات
        </Link>
        <a
          href="/api/admin/export"
          className="block rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-white transition-colors hover:bg-white/10"
        >
          تصدير CSV (الإجابات)
        </a>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-4">
      <div className="text-sm text-white/60">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
