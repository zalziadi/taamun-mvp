'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopBar } from '../components/TopBar';

interface VersePageProps {
  verseArabic?: string;
  verseEnglish?: string;
  surahName?: string;
  verseNumber?: string;
  contextTitle?: string;
  contextText?: string;
  onReflect?: () => void;
}

export const VersePage: React.FC<VersePageProps> = ({
  verseArabic = 'أَلَمْ يَعْلَمْ بِأَنَّ اللَّهَ يَرَى',
  verseEnglish = '"Does he not know that Allah sees?"',
  surahName = 'Surah Al-Alaq',
  verseNumber = 'Verse 14',
  contextTitle = 'سياق الآية',
  contextText = 'تذكير بعلم الله المحيط بكل شيء، دعوة للمراقبة الذاتية والخشية في السر والعلن. آية توقظ القلب وتبعث فيه هيبة الخالق.',
  onReflect,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleShare = () => {
    console.log('Share clicked');
  };

  const handleBack = () => {
    console.log('Back clicked');
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="dark bg-[#15130f] min-h-screen flex flex-col overflow-x-hidden selection:bg-primary/30"
    >
      <TopBar
        title="ٱلْقُرْآن"
        showShare={true}
        showBack={true}
        onShareClick={handleShare}
        onBackClick={handleBack}
        backHref="/"
      />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center relative px-8 pt-16 pb-32">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 radial-glow pointer-events-none"></div>

        {/* Focused Verse Section */}
        <div className="max-w-4xl w-full text-center space-y-12 z-10">
          {/* Verse Ornament (Top) */}
          <div className="flex justify-center opacity-20">
            <svg
              className="w-10 h-10 text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>

          {/* The Verse */}
          <div className="relative py-8">
            <p
              className="quran-text font-serif text-6xl md:text-8xl leading-relaxed md:leading-[1.4] text-on-surface font-medium"
              dir="rtl"
            >
              {verseArabic}
            </p>
          </div>

          {/* Annotation / Translation */}
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="h-[1px] w-12 bg-outline-variant/30 mx-auto"></div>
            <p className="font-body text-on-surface-variant/80 text-lg md:text-xl leading-relaxed italic font-light">
              {verseEnglish}
            </p>
            <p className="font-body text-primary-fixed-dim text-sm tracking-[0.2em] uppercase">
              {surahName} — {verseNumber}
            </p>
          </div>

          {/* Context / Insight Card */}
          <div className="mt-16 bg-surface-container-low/40 backdrop-blur-sm border border-outline-variant/10 p-8 rounded-xl text-right max-w-xl mx-auto">
            <div className="flex items-center justify-end gap-3 mb-4 text-primary">
              <span className="font-serif italic text-lg">{contextTitle}</span>
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h6v2H9V4zm12 16H3V4c0-.55.45-1 1-1h14v17z" />
              </svg>
            </div>
            <p className="font-body text-on-surface-variant leading-relaxed text-sm md:text-base">
              {contextText}
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Action Area */}
      <div className="fixed bottom-0 w-full p-8 flex justify-center z-50">
        <button
          onClick={onReflect}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="group relative flex items-center gap-4 bg-primary text-on-primary px-10 py-4 rounded-lg font-body font-bold text-lg transition-all duration-500 overflow-hidden"
          style={{
            transform: isHovering ? 'scale(1.02)' : 'scale(1)',
            boxShadow: isHovering
              ? '0 12px 40px -12px rgba(230,212,164,0.3)'
              : '0 12px 40px -12px rgba(230,212,164,0.3)',
          }}
        >
          {/* Subtle Reflection Shine Effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000"
            style={{
              transform: isHovering ? 'translateX(100%)' : 'translateX(-100%)',
            }}
          ></div>
          <svg
            className="w-6 h-6 relative z-10"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
          <span className="relative z-10">تأمل في الآية</span>
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-1/4 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-1/4 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Styles for custom classes */}
      <style jsx>{`
        .quran-text {
          text-shadow: 0 0 40px rgba(230, 212, 164, 0.15);
        }
        .radial-glow {
          background: radial-gradient(
            circle at center,
            rgba(58, 47, 13, 0.3) 0%,
            transparent 70%
          );
        }
      `}</style>
    </div>
  );
};
