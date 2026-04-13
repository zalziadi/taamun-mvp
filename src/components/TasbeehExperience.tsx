"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAMES = [
  "الرحمن","الرحيم","الملك","القدوس","السلام","المؤمن","المهيمن","العزيز","الجبار","المتكبر",
  "الخالق","البارئ","المصور","الغفار","القهار","الوهاب","الرزاق","الفتاح","العليم","القابض",
  "الباسط","الخافض","الرافع","المعز","المذل","السميع","البصير","الحكم","العدل","اللطيف",
  "الخبير","الحليم","العظيم","الغفور","الشكور","العلي","الكبير","الحفيظ","المقيت","الحسيب",
  "الجليل","الكريم","الرقيب","المجيب","الواسع","الحكيم","الودود","المجيد","الباعث","الشهيد",
  "الحق","الوكيل","القوي","المتين","الولي","الحميد","المحصي","المبدئ","المعيد","المحيي",
  "المميت","الحي","القيوم","الواجد","الماجد","الواحد","الأحد","الصمد","القادر","المقتدر",
  "المقدم","المؤخر","الأول","الآخر","الظاهر","الباطن","الوالي","المتعالي","البر","التواب",
  "المنتقم","العفو","الرؤوف","مالك الملك","ذو الجلال والإكرام","المقسط","الجامع","الغني","المغني","المانع",
  "الضار","النافع","النور","الهادي","البديع","الباقي","الوارث","الرشيد","الصبور",
];

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(25);
  }
}

export function TasbeehExperience() {
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const touchRef = useRef<HTMLDivElement>(null);

  const currentName = useMemo(() => NAMES[index % NAMES.length], [index]);
  const nameNumber = useMemo(() => (index % NAMES.length) + 1, [index]);

  const advance = useCallback(() => {
    haptic();
    setCount((c) => c + 1);

    if ((count + 1) % 33 === 0) {
      setRounds((r) => r + 1);
      if (index + 1 >= NAMES.length) {
        setShowReset(true);
      }
      setIndex((i) => (i + 1) % NAMES.length);
    }
  }, [count, index]);

  const nextName = useCallback(() => {
    haptic();
    setIndex((i) => (i + 1) % NAMES.length);
    setCount(0);
  }, []);

  const reset = useCallback(() => {
    setIndex(0);
    setCount(0);
    setRounds(0);
    setShowReset(false);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        advance();
      }
      if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        e.preventDefault();
        nextName();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, nextName]);

  const countIn33 = count % 33;

  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden text-[#e8e1d9]"
      style={{ background: "linear-gradient(180deg, #07070c 0%, #12100a 50%, #0a0908 100%)" }}
    >
      <header className="w-full px-6 pt-8 text-center">
        <p className="text-xs tracking-[0.2em] text-[#c9b88a]">مسبحة تمعّن</p>
        <p className="mt-1 text-xs text-[#e8e1d9]/40">أسماء الله الحسنى</p>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <p className="mb-2 text-sm text-[#c9b88a]/70">{nameNumber} / 99</p>

        <AnimatePresence mode="wait">
          <motion.h1
            key={currentName}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-[var(--font-amiri)] text-6xl leading-relaxed text-[#e6d4a4] sm:text-7xl"
          >
            {currentName}
          </motion.h1>
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-6 text-sm text-[#c9b88a]/60">
          <span>{countIn33} / 33</span>
          <span className="h-3 w-px bg-[#c9b88a]/20" />
          <span>الجولة {rounds + 1}</span>
          <span className="h-3 w-px bg-[#c9b88a]/20" />
          <span>الإجمالي {count}</span>
        </div>

        <div className="mt-4 flex h-1.5 w-48 overflow-hidden rounded-full bg-[#2b2824]">
          <motion.div
            className="h-full rounded-full bg-[#e6d4a4]"
            animate={{ width: `${(countIn33 / 33) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div
          ref={touchRef}
          onClick={advance}
          role="button"
          tabIndex={0}
          aria-label="تسبيح"
          className="mt-10 flex h-28 w-28 cursor-pointer select-none items-center justify-center rounded-full border border-[#e6d4a4]/20 bg-[#1c1a15]/60 shadow-[0_0_40px_rgba(230,212,164,0.08)] backdrop-blur-xl transition-transform active:scale-95"
        >
          <motion.span
            key={count}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="font-[var(--font-amiri)] text-3xl text-[#e6d4a4]"
          >
            {countIn33}
          </motion.span>
        </div>

        <p className="mt-4 text-xs text-[#e8e1d9]/30">اضغط أو مسافة للتسبيح</p>
      </main>

      <footer className="flex w-full items-center justify-center gap-4 px-6 pb-10">
        <button
          type="button"
          onClick={nextName}
          className="rounded-xl border border-[#e6d4a4]/20 bg-[#2b2824]/60 px-5 py-2.5 text-sm text-[#e6d4a4] backdrop-blur-xl transition-opacity hover:opacity-90"
        >
          الاسم التالي ←
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-white/10 bg-[#2b2824]/40 px-5 py-2.5 text-sm text-[#e8e1d9]/60 backdrop-blur-xl transition-opacity hover:opacity-90"
        >
          إعادة
        </button>
      </footer>

      <AnimatePresence>
        {showReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mx-6 w-full max-w-sm rounded-3xl border border-white/10 bg-[#2b2824] p-8 text-center"
            >
              <p className="font-[var(--font-amiri)] text-3xl text-[#e6d4a4]">ما شاء الله</p>
              <p className="mt-3 text-sm text-[#e8e1d9]/80">
                أتممت جولة كاملة على أسماء الله الحسنى
              </p>
              <p className="mt-1 text-xs text-[#c9b88a]">الإجمالي: {count} تسبيحة</p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-[#2b2824] px-4 py-3 text-sm text-[#e8e1d9] transition-opacity hover:opacity-90"
                >
                  أكمل
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 rounded-xl bg-[#e6d4a4] px-4 py-3 text-sm font-bold text-[#15130f] transition-opacity hover:opacity-95"
                >
                  من البداية
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
