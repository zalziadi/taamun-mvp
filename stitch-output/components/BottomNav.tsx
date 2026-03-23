'use client';

import React from 'react';
import Link from 'next/link';

interface BottomNavProps {
  active?: 'journey' | 'progress' | 'journal' | 'profile';
}

export const BottomNav: React.FC<BottomNavProps> = ({ active = 'journey' }) => {
  const isActive = (tab: string) => active === tab;

  return (
    <nav className="fixed bottom-0 w-full z-50 rounded-t-2xl bg-[#080705]/80 backdrop-blur-2xl border-t border-[#c9b88a]/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] h-20 pb-safe flex flex-row-reverse justify-around items-center">
      {/* Journey */}
      <Link href="/journey">
        <button
          className={`flex flex-col items-center justify-center transition-all duration-700 ease-out ${
            isActive('journey')
              ? 'text-[#e6d4a4] font-bold scale-110'
              : 'text-[#e8e1d9]/40 hover:text-[#e6d4a4]/80'
          }`}
          aria-label="رحلتي"
        >
          <svg
            className="w-6 h-6"
            fill={isActive('journey') ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isActive('journey') ? 0 : 2}
              d="M12 6.253v13m0-13C6.5 6.253 2 10.753 2 16.5S6.5 26.747 12 26.747s10-4.5 10-10.247S17.5 6.253 12 6.253z"
            />
          </svg>
          <span className="font-sans text-[10px] uppercase tracking-[0.05rem] mt-1">
            Journey
          </span>
        </button>
      </Link>

      {/* Progress */}
      <Link href="/progress">
        <button
          className={`flex flex-col items-center justify-center transition-all duration-700 ease-out ${
            isActive('progress')
              ? 'text-[#e6d4a4] font-bold scale-110'
              : 'text-[#e8e1d9]/40 hover:text-[#e6d4a4]/80'
          }`}
          aria-label="التقدم"
        >
          <svg
            className="w-6 h-6"
            fill={isActive('progress') ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isActive('progress') ? 0 : 2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="font-sans text-[10px] uppercase tracking-[0.05rem] mt-1">
            Progress
          </span>
        </button>
      </Link>

      {/* Journal */}
      <Link href="/journal">
        <button
          className={`flex flex-col items-center justify-center transition-all duration-700 ease-out ${
            isActive('journal')
              ? 'text-[#e6d4a4] font-bold scale-110'
              : 'text-[#e8e1d9]/40 hover:text-[#e6d4a4]/80'
          }`}
          aria-label="دفتري"
        >
          <svg
            className="w-6 h-6"
            fill={isActive('journal') ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isActive('journal') ? 0 : 2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="font-sans text-[10px] uppercase tracking-[0.05rem] mt-1">
            Journal
          </span>
        </button>
      </Link>

      {/* Profile */}
      <Link href="/profile">
        <button
          className={`flex flex-col items-center justify-center transition-all duration-700 ease-out ${
            isActive('profile')
              ? 'text-[#e6d4a4] font-bold scale-110'
              : 'text-[#e8e1d9]/40 hover:text-[#e6d4a4]/80'
          }`}
          aria-label="ملفي"
        >
          <svg
            className="w-6 h-6"
            fill={isActive('profile') ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isActive('profile') ? 0 : 2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="font-sans text-[10px] uppercase tracking-[0.05rem] mt-1">
            Profile
          </span>
        </button>
      </Link>
    </nav>
  );
};
