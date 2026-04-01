"use client";

import { useState } from "react";

type Report = {
  id: string;
  hijri_date: string;
  cycle_day: number;
  active_users: number;
  avg_depth_score: number;
  shifts_count: number;
  ai_summary: string;
  district_distribution: Record<string, number>;
  state_distribution: Record<string, number>;
};

type Task = {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  district: number | null;
  created_at: string;
};

const DISTRICT_NAMES: Record<number, string> = {
  1: "الهوية", 2: "العلاقات", 3: "التوسّع", 4: "البناء",
  5: "الجمال", 6: "العائلة", 7: "الروح", 8: "المال", 9: "العطاء",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-red-500/30 bg-red-500/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  low: "border-white/10 bg-white/5",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "بانتظار", color: "text-amber-400" },
  approved: { label: "موافق", color: "text-emerald-400" },
  running: { label: "قيد التنفيذ", color: "text-blue-400" },
  completed: { label: "مكتمل", color: "text-white/40" },
  rejected: { label: "مرفوض", color: "text-red-400" },
};

export function NajmDashboard({ reports, tasks: initialTasks }: { reports: Report[]; tasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [acting, setActing] = useState<string | null>(null);

  async function handleAction(taskId: string, action: "approve" | "reject") {
    setActing(taskId);
    try {
      const res = await fetch("/api/najm/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, action }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: action === "approve" ? "approved" : "rejected" } : t
          )
        );
      }
    } finally {
      setActing(null);
    }
  }

  const latestReport = reports[0];
  const pendingTasks = tasks.filter((t) => t.status === "pending");

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">نجم الجنوب</h1>
        <p className="mt-1 text-xs text-white/40">لوحة مراقبة تمعّن</p>
      </div>

      {/* Latest Report */}
      {latestReport && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-white/40">آخر تقرير</p>
            <p className="text-xs text-white/30">{latestReport.hijri_date} · يوم {latestReport.cycle_day}</p>
          </div>
          <p className="text-sm leading-relaxed text-white/80">{latestReport.ai_summary}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-lg font-bold text-white">{latestReport.active_users}</p>
              <p className="text-[10px] text-white/40">مستخدم نشط</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-lg font-bold text-white">{latestReport.avg_depth_score}</p>
              <p className="text-[10px] text-white/40">متوسط العمق</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-lg font-bold text-white">{latestReport.shifts_count}</p>
              <p className="text-[10px] text-white/40">تحوّلات</p>
            </div>
          </div>
          {/* State distribution */}
          <div className="flex gap-2">
            {Object.entries(latestReport.state_distribution).map(([state, count]) => (
              <span key={state} className="rounded-lg bg-white/5 px-2 py-1 text-xs text-white/50">
                {state === "shadow" ? "ظل" : state === "gift" ? "هدية" : "احتمال"}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-white/40">مهام بانتظار الموافقة</p>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">{pendingTasks.length}</span>
          </div>
          {pendingTasks.map((task) => (
            <div key={task.id} className={`rounded-2xl border p-4 ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.low}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  <p className="text-xs leading-relaxed text-white/60">{task.description}</p>
                  <div className="flex gap-2 mt-2">
                    {task.district && (
                      <span className="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                        {DISTRICT_NAMES[task.district]}
                      </span>
                    )}
                    <span className="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] text-white/40">{task.type}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleAction(task.id, "approve")}
                    disabled={acting === task.id}
                    className="rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    موافق
                  </button>
                  <button
                    onClick={() => handleAction(task.id, "reject")}
                    disabled={acting === task.id}
                    className="rounded-xl bg-red-500/10 px-3 py-1.5 text-xs text-red-400/70 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    رفض
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Tasks */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-white/40">جميع المهام</p>
        {tasks.map((task) => {
          const statusInfo = STATUS_LABELS[task.status] ?? STATUS_LABELS.pending;
          return (
            <div key={task.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">{task.title}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{task.type} · {new Date(task.created_at).toLocaleDateString("ar-SA")}</p>
              </div>
              <span className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
          );
        })}
        {tasks.length === 0 && <p className="text-sm text-white/30 text-center py-8">لا توجد مهام بعد</p>}
      </div>

      {/* Reports History */}
      {reports.length > 1 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-white/40">تقارير سابقة</p>
          {reports.slice(1).map((r) => (
            <div key={r.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/60">{r.hijri_date} · يوم {r.cycle_day}</p>
                <p className="text-xs text-white/30">{r.active_users} مستخدم · عمق {r.avg_depth_score}</p>
              </div>
              <p className="text-xs text-white/40 mt-1">{r.ai_summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
