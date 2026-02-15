"use client";

import Link from "next/link";
import { hasPlan820 } from "./scanStorage";
import { StatusCard } from "../../components/StatusCard";

interface ScanGateProps {
  children: React.ReactNode;
}

/** Enforces plan 820 gating. Renders blocked UI if not entitled. */
export function ScanGate({ children }: ScanGateProps) {
  const entitled = hasPlan820();

  if (!entitled) {
    return (
      <div className="min-h-screen bg-[#0B0F14] p-6">
        <nav className="mb-8">
          <Link href="/" className="text-white/70 hover:text-white">
            الرئيسية
          </Link>
        </nav>
        <h1 className="mb-8 text-2xl font-bold text-white">التقاط آية</h1>
        <StatusCard
          title="خطة 820 مطلوبة"
          message="ميزة مسح الآية متاحة لمشتركي خطة 820. ترقّ للاشتراك للوصول."
          variant="warning"
        />
        <Link
          href="/subscribe"
          className="mt-6 inline-block rounded-lg bg-white/10 px-6 py-3 text-white hover:bg-white/20"
        >
          ترقية الاشتراك
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
