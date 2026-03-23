"use client";

import React from "react";
import Link from "next/link";

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
  title = "ٱلْقُرْآن",
  showMenu = false,
  showShare = false,
  showBack = false,
  onMenuClick,
  onShareClick,
  onBackClick,
  backHref = "/",
  avatarSrc,
}) => {
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full flex-row-reverse items-center justify-between border-b border-[#c9b88a]/10 bg-[#15130f]/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {showMenu && (
          <button
            type="button"
            onClick={onMenuClick}
            className="cursor-pointer text-[#e6d4a4] transition-transform hover:scale-110"
            aria-label="فتح القائمة"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>
        )}
        {showShare && (
          <button
            type="button"
            onClick={onShareClick}
            className="flex h-10 w-10 items-center justify-center transition-colors duration-500 hover:text-[#e6d4a4]"
            aria-label="مشاركة"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.15c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
            </svg>
          </button>
        )}
      </div>

      <h1 className="arabic-serif font-serif text-3xl font-medium tracking-wide text-[#e6d4a4]">{title}</h1>

      <div className="flex items-center gap-4">
        {showBack && (
          <Link href={backHref}>
            <button
              type="button"
              onClick={onBackClick}
              className="flex h-10 w-10 items-center justify-center transition-colors duration-500 hover:text-[#e6d4a4]"
              aria-label="العودة"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
          </Link>
        )}
        {avatarSrc ? (
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-high">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="h-full w-full object-cover" alt="صورة ملف المستخدم" src={avatarSrc} />
          </div>
        ) : null}
      </div>
    </header>
  );
};
