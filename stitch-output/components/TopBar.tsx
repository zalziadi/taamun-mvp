'use client';

import React from 'react';
import Link from 'next/link';

interface TopBarProps {
  title?: string;
  showMenu?: boolean;
  showShare?: boolean;
  showBack?: boolean;
  onMenuClick?: () => void;
  onShareClick?: () => void;
  onBackClick?: () => void;
  backHref?: string;
  avatarSrc?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  title = 'ٱلْقُرْآن',
  showMenu = false,
  showShare = false,
  showBack = false,
  onMenuClick,
  onShareClick,
  onBackClick,
  backHref = '/',
  avatarSrc,
}) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#15130f]/80 backdrop-blur-md border-b border-[#c9b88a]/10 flex flex-row-reverse justify-between items-center px-6 h-16">
      <div className="flex items-center gap-4">
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="text-[#e6d4a4] cursor-pointer hover:scale-110 transition-transform"
            aria-label="فتح القائمة"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>
        )}
        {showShare && (
          <button
            onClick={onShareClick}
            className="flex items-center justify-center w-10 h-10 transition-colors duration-500 hover:text-[#e6d4a4]"
            aria-label="مشاركة"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.15c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
            </svg>
          </button>
        )}
      </div>

      <h1 className="font-serif text-3xl tracking-wide font-medium text-[#e6d4a4] arabic-serif">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {showBack && (
          <Link href={backHref}>
            <button
              onClick={onBackClick}
              className="flex items-center justify-center w-10 h-10 transition-colors duration-500 hover:text-[#e6d4a4]"
              aria-label="العودة"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
          </Link>
        )}
        {avatarSrc && (
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden">
            <img
              className="w-full h-full object-cover"
              alt="صورة ملف المستخدم"
              src={avatarSrc}
            />
          </div>
        )}
      </div>
    </header>
  );
};
