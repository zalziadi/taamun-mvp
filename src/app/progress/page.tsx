"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { exportTaamunData } from "@/lib/export";

const TOTAL_DAYS = 28;

export default function ProgressPage() {
  const router = useRouter();
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    let count = 0;
    for (let i = 1; i <= TOTAL_DAYS; i++) {
      if (localStorage.getItem(`TAAMUN_DAY_${i}`)) {
        count++;
      }
    }
    setCompletedCount(count);
  }, [router]);

  const percentage = (completedCount / TOTAL_DAYS) * 100;

  return (
    <div className="mx-auto max-w-[760px] space-y-6">
      <Card className="space-y-5 p-6">
        <h1 className="h1">تقدمك في تمَعُّن</h1>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted">الأيام المكتملة</div>
          <div className="text-sm font-medium">
            {completedCount} / {TOTAL_DAYS}
          </div>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-panel2">
          <div
            className="h-full bg-gold transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          <Button
            size="lg"
            onClick={() => router.push(`/day/${completedCount + 1 || 1}`)}
          >
            متابعة اليوم الحالي
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => exportTaamunData()}
          >
            تحميل ملف التمعّن
          </Button>
        </div>
      </Card>
    </div>
  );
}
