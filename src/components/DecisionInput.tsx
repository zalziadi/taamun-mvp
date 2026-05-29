"use client";

import { FormEvent, useState } from "react";
import type { DecisionInput } from "@/lib/decisionEngine";

interface Props {
  onSubmit: (input: DecisionInput) => void;
  loading?: boolean;
}

export default function DecisionInputForm({ onSubmit, loading = false }: Props) {
  const [financial, setFinancial] = useState("");
  const [emotional, setEmotional] = useState("");
  const [practical, setPractical] = useState("");
  const [shortTerm, setShortTerm] = useState("");
  const [longTerm, setLongTerm] = useState("");
  const [money, setMoney] = useState("");
  const [time, setTime] = useState("");
  const [obligations, setObligations] = useState("");
  const [risks, setRisks] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shortTerm.trim()) return;
    onSubmit({
      currentState: {
        financial: financial.trim() || undefined,
        emotional: emotional.trim() || undefined,
        practical: practical.trim() || undefined,
      },
      goal: {
        shortTerm: shortTerm.trim(),
        longTerm: longTerm.trim() || undefined,
      },
      constraints: {
        money: money.trim() || undefined,
        time: time.trim() || undefined,
        obligations: obligations.trim() || undefined,
        risks: risks.trim() || undefined,
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Current State Card */}
      <section className="dbs-card p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="dbs-heading text-2xl">١. الوضع الحالي</h2>
          <p className="dbs-label mt-1">صف ما عندك الآن — بصدق، بلا تجميل</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="dbs-label">المالي</span>
            <input
              value={financial}
              onChange={(e) => setFinancial(e.target.value)}
              placeholder="مثل: محدود، بدون مدخرات"
              className="dbs-input"
            />
          </label>
          <label className="space-y-1.5">
            <span className="dbs-label">العاطفي</span>
            <input
              value={emotional}
              onChange={(e) => setEmotional(e.target.value)}
              placeholder="مثل: قلق، متحمّس، عالق"
              className="dbs-input"
            />
          </label>
          <label className="space-y-1.5">
            <span className="dbs-label">العملي</span>
            <input
              value={practical}
              onChange={(e) => setPractical(e.target.value)}
              placeholder="مثل: وحدي، فريق صغير"
              className="dbs-input"
            />
          </label>
        </div>
      </section>

      {/* Goal Card */}
      <section className="dbs-card p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="dbs-heading text-2xl">٢. الهدف</h2>
          <p className="dbs-label mt-1">جملة واحدة واضحة عن الذي تريد تحقيقه</p>
        </div>
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="dbs-label">الهدف القريب (٣٠ يوم) *</span>
            <input
              value={shortTerm}
              onChange={(e) => setShortTerm(e.target.value)}
              placeholder="مثل: أطلق منتجي الأول"
              required
              className="dbs-input"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="dbs-label">الهدف البعيد (اختياري)</span>
            <input
              value={longTerm}
              onChange={(e) => setLongTerm(e.target.value)}
              placeholder="مثل: مشروع مستقل خلال سنة"
              className="dbs-input"
            />
          </label>
        </div>
      </section>

      {/* Constraints Card */}
      <section className="dbs-card p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="dbs-heading text-2xl">٣. القيود</h2>
          <p className="dbs-label mt-1">ما الحدود الحقيقية التي تتعامل معها؟</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="dbs-label">قيد المال</span>
            <input
              value={money}
              onChange={(e) => setMoney(e.target.value)}
              placeholder="مثل: ميزانية صفر"
              className="dbs-input"
            />
          </label>
          <label className="space-y-1.5">
            <span className="dbs-label">قيد الوقت</span>
            <input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="مثل: ساعة يومياً"
              className="dbs-input"
            />
          </label>
          <label className="space-y-1.5">
            <span className="dbs-label">الالتزامات</span>
            <input
              value={obligations}
              onChange={(e) => setObligations(e.target.value)}
              placeholder="مثل: عمل بدوام كامل"
              className="dbs-input"
            />
          </label>
          <label className="space-y-1.5">
            <span className="dbs-label">المخاطر</span>
            <input
              value={risks}
              onChange={(e) => setRisks(e.target.value)}
              placeholder="مثل: خوف من الفشل"
              className="dbs-input"
            />
          </label>
        </div>
      </section>

      <div className="text-center">
        <button
          type="submit"
          disabled={loading || !shortTerm.trim()}
          className="dbs-btn text-base"
        >
          {loading ? "جارٍ التحليل..." : "📌 حلّل الدبوس"}
        </button>
      </div>
    </form>
  );
}
