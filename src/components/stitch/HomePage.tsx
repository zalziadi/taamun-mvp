'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TopBar } from '@/components/stitch/TopBar';
import { BottomNav } from '@/components/stitch/BottomNav';
import { programDayRoute } from '@/lib/routes';

interface HomePageProps {
  currentStep?: number;
  totalSteps?: number;
  verseArabic?: string;
  verseSurah?: string;
  breathingDescription?: string;
  onContinue?: () => void;
  userAvatarSrc?: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentStep = 1,
  totalSteps = 5,
  verseArabic = 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
  verseSurah = 'سورة الرعد — الآية ٢٨',
  breathingDescription = 'خذ شهيقاً عميقاً لـ ٤ ثوانٍ، ثم احبسه لـ ٤ ثوانٍ، وأخرجه بهدوء. ركز على حضورك في هذه اللحظة المقدسة.',
  onContinue,
  userAvatarSrc,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleMenuClick = () => {
    console.log('Menu clicked');
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="dark bg-background min-h-screen flex flex-col overflow-x-hidden"
    >
      <TopBar
        title="تَمَأن"
        showMenu={true}
        onMenuClick={handleMenuClick}
        avatarSrc={userAvatarSrc}
      />

      <main className="pt-16 pb-32 flex-1 flex flex-col desert-gradient min-h-screen">
        {/* Hero Illustration & Verse Section */}
        <section className="relative min-h-[75vh] flex flex-col items-center justify-center px-6 overflow-hidden">
          {/* Desert Illustration Placeholder */}
          <div className="absolute inset-0 z-0 opacity-40">
            <Image
              alt="صحراء"
              className="w-full h-full object-cover grayscale brightness-50 contrast-125"
              src="/images/desert-bg.jpg"
              fill
              priority
            />
          </div>

          <div className="relative z-10 w-full max-w-2xl text-center space-y-12">
            <div className="inline-block px-4 py-1 rounded-full border border-primary/20 bg-background/50 backdrop-blur-sm text-primary/80 text-xs uppercase tracking-widest font-body">
              آية اليوم
            </div>

            <div className="space-y-10">
              <div className="relative">
                <span className="absolute -top-12 -right-4 text-9xl text-primary/10 font-serif select-none">
                  {"“"}
                </span>
                <h2 className="font-serif text-5xl md:text-7xl leading-tight text-on-surface font-medium drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                  {verseArabic}
                </h2>
                <span className="absolute -bottom-12 -left-4 text-9xl text-primary/10 font-serif select-none rotate-180">
                  {"”"}
                </span>
              </div>
              <p className="text-on-surface-variant font-body italic text-lg tracking-wide pt-4">
                {verseSurah}
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className="px-6 max-w-2xl mx-auto space-y-12 mt-12">
          {/* Journey Path */}
          <section className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-primary font-serif text-xl">رحلة اليوم</h3>
              <span className="text-on-surface-variant text-xs font-body">
                الخطوة {currentStep} من {totalSteps}
              </span>
            </div>

            <div className="relative py-8">
              {/* Connector Line */}
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant/30 -translate-y-1/2"></div>

              <div className="relative flex justify-between items-center w-full">
                {/* Step 1 (Active) */}
                <div className="flex flex-col items-center gap-3 relative z-10 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_25px_rgba(230,212,164,0.4)] border-2 border-primary transition-all duration-500">
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.1 0-2.3 1.72-5.21 6-8.98 4.28 3.77 6 6.68 6 8.98 0 3.53-2.65 6.1-6 6.1z" />
                    </svg>
                  </div>
                  <span className="text-[#e6d4a4] font-serif text-sm font-bold">
                    تنفس
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center gap-3 relative z-10 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low border border-outline-variant flex items-center justify-center group-hover:border-primary/50 transition-colors">
                    <svg
                      className="w-6 h-6 text-on-surface-variant group-hover:text-primary"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                  </div>
                  <span className="text-on-surface-variant font-serif text-sm">
                    تأمل
                  </span>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center gap-3 relative z-10 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low border border-outline-variant flex items-center justify-center group-hover:border-primary/50 transition-colors">
                    <svg
                      className="w-6 h-6 text-on-surface-variant group-hover:text-primary"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    </svg>
                  </div>
                  <span className="text-on-surface-variant font-serif text-sm">
                    دوّن
                  </span>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center gap-3 relative z-10 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low border border-outline-variant flex items-center justify-center group-hover:border-primary/50 transition-colors">
                    <svg
                      className="w-6 h-6 text-on-surface-variant group-hover:text-primary"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <span className="text-on-surface-variant font-serif text-sm">
                    أدرك
                  </span>
                </div>

                {/* Step 5 */}
                <div className="flex flex-col items-center gap-3 relative z-10 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low border border-outline-variant flex items-center justify-center group-hover:border-primary/50 transition-colors">
                    <svg
                      className="w-6 h-6 text-on-surface-variant group-hover:text-primary"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M10 16.5l6.16-6.15 1.41 1.41-7.57 7.57-4.24-4.24 1.41-1.41L10 16.5zM7 14l1.41-1.41L4 8.17 2.59 9.59 7 14zm13-11h-2V1h-2v2h-6V1h-2v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                    </svg>
                  </div>
                  <span className="text-on-surface-variant font-serif text-sm">
                    أتمم
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Dynamic Card Example */}
          <section className="grid grid-cols-1 gap-6">
            <div className="bg-surface-container-highest/20 border border-outline-variant/10 p-8 rounded-xl space-y-4 glass-effect">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-primary font-serif text-lg">
                    جلسة التنفس الحالية
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-1">
                    المرحلة الأولى: السكون والتركيز
                  </p>
                </div>
                <svg
                  className="w-8 h-8 text-primary-fixed-dim"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2c5.33 4.55 8 8.48 8 11.8 0 4.98-3.8 8.2-8 8.2s-8-3.22-8-8.2c0-3.32 2.67-7.25 8-11.8z" />
                </svg>
              </div>

              <div className="h-1 bg-surface-container-lowest rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-primary shadow-[0_0_15px_rgba(230,212,164,0.4)]"></div>
              </div>

              <p className="text-on-surface/80 text-sm leading-relaxed">
                {breathingDescription}
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* CTA Action Button */}
      <div className="fixed bottom-24 left-0 w-full px-6 pointer-events-none">
        <Link
          href={programDayRoute(1)}
          onClick={onContinue}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-center gap-3 rounded-xl bg-[#e6d4a4] py-5 font-serif text-lg font-bold text-[#3a2f0d] shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-300"
          style={{
            transform: isHovering ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          <span>واصل رحلتك</span>
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </Link>
      </div>

      {/* Styles for animations and custom classes */}
      <style jsx>{`
        .desert-gradient {
          background: radial-gradient(circle at top, #231b00 0%, #080705 80%);
        }
        .glass-effect {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .arabic-serif {
          font-family: 'Amiri', serif;
        }
        body {
          scroll-behavior: smooth;
        }
      `}</style>

      <BottomNav active="journey" />
    </div>
  );
};
