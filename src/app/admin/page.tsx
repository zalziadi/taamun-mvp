import Link from "next/link";
import { AdminRagIngestCard } from "@/components/admin/AdminRagIngestCard";
import { requireAdmin } from "@/lib/authz";
import { listAllProgressRows } from "@/lib/progressStore";

export const dynamic = "force-dynamic";

async function getDashboardMetrics() {
  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return null;

  const supabase = adminAuth.admin;
  const [answersRes, progressRes, awarenessRes] = await Promise.all([
    supabase.from("user_answers").select("user_id, day"),
    listAllProgressRows(supabase),
    supabase.from("awareness_insights").select("user_id, insight_type"),
  ]);

  if (answersRes.error || !progressRes.ok || awarenessRes.error) return null;

  const answerRows = (answersRes.data ?? []) as Array<{ user_id: string }>;
  const progressRows = (progressRes.data ?? []) as Array<{ user_id: string; completed_days?: string[] | null }>;
  const awarenessRows = (awarenessRes.data ?? []) as Array<{ insight_type: string }>;

  const uniqueUsers = new Set<string>();
  for (const row of answerRows) uniqueUsers.add(row.user_id);
  for (const row of progressRows) uniqueUsers.add(row.user_id);

  return {
    users_active: uniqueUsers.size,
    answers_total: answerRows.length,
    users_completed_28: progressRows.filter((r) => (r.completed_days ?? []).length >= 28).length,
    weekly_insights_total: awarenessRows.filter((r) => r.insight_type === "weekly").length,
    final_insights_total: awarenessRows.filter((r) => r.insight_type === "final").length,
  };
}

export default async function AdminPage() {
  const metrics = await getDashboardMetrics();
  const allowed = metrics !== null;

  if (!allowed) {
    return (
      <div className="min-h-screen bg-[#15130f] p-6">
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

  const m = metrics ?? {
    users_active: 0,
    answers_total: 0,
    users_completed_28: 0,
    weekly_insights_total: 0,
    final_insights_total: 0,
  };

  return (
    <div className="min-h-screen bg-[#15130f] p-6">
      <nav className="mb-8">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
      </nav>
      <h1 className="mb-8 text-2xl font-bold text-white">لوحة الأدمن</h1>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="المستخدمون النشطون" value={m.users_active} />
        <MetricCard label="إجمالي الإجابات" value={m.answers_total} />
        <MetricCard label="أكملوا 28 يوم" value={m.users_completed_28} />
        <MetricCard label="رؤى أسبوعية" value={m.weekly_insights_total} />
        <MetricCard label="رؤى نهائية" value={m.final_insights_total} />
      </div>

      <div className="max-w-xl space-y-4">
        <Link
          href="/admin/activations"
          className="block rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-white transition-colors hover:bg-white/10"
        >
          التفعيلات
        </Link>
        <Link
          href="/admin/vip-gifts"
          className="block rounded-xl border border-pink-500/20 bg-pink-500/5 px-6 py-4 text-white transition-colors hover:bg-pink-500/10"
        >
          🌸 هدايا VIP — سمرا + وردة
        </Link>
        <a
          href="/api/admin/export"
          className="block rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-white transition-colors hover:bg-white/10"
        >
          تصدير CSV (الإجابات)
        </a>
        <AdminRagIngestCard />
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
