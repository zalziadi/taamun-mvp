"use client";

import { useState } from "react";

interface ShareableVerseProps {
  verse: string;
  verseRef: string;
  day: number;
  question?: string;
}

/**
 * ShareableVerse — a screenshot-friendly card with today's verse.
 * User can screenshot and share, or use native share API.
 */
export function ShareableVerse({ verse, verseRef, day, question }: ShareableVerseProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = `${verse}\n\n— ${verseRef}\n\nمن رحلة تمعّن · يوم ${toArabicNumber(day)}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          text,
          title: `تمعّن — يوم ${day}`,
        });
        return;
      } catch {
        // User cancelled or share failed
      }
    }

    // Fallback to clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="relative">
      {/* Shareable card — styled to look good as screenshot */}
      <div
        id="shareable-verse"
        className="mx-auto max-w-sm rounded-3xl border-2 border-[#c9b88a]/30 bg-gradient-to-b from-[#1d1b17] to-[#0A0908] p-8 text-center shadow-2xl"
      >
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.3em] text-[#c9b88a]/60">تمعّن</p>
          <p className="mt-1 text-[10px] text-[#c9b88a]/40">
            يوم {toArabicNumber(day)}
          </p>
        </div>

        <blockquote className="font-[var(--font-amiri)] text-xl leading-[2.2] text-[#e8e1d9]">
          {verse}
        </blockquote>

        <p className="mt-4 text-xs text-[#c9b88a]/70">{verseRef}</p>

        {question && (
          <>
            <div className="mx-auto my-5 h-px w-12 bg-[#c9b88a]/30" />
            <p className="text-sm italic leading-relaxed text-[#c9b88a]/80">
              {question}
            </p>
          </>
        )}

        <div className="mt-6 text-[10px] tracking-widest text-[#c9b88a]/30">
          TAAMUN.COM
        </div>
      </div>

      {/* Share button */}
      <button
        type="button"
        onClick={handleShare}
        className="mt-4 mx-auto flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0908]"
        aria-label="شارك آية اليوم"
      >
        <span aria-hidden="true">↗</span>
        <span>{copied ? "تم النسخ" : "شارك هذه اللحظة"}</span>
      </button>
    </div>
  );
}

function toArabicNumber(n: number): string {
  const map = "٠١٢٣٤٥٦٧٨٩";
  return String(n).split("").map((d) => map[parseInt(d, 10)] ?? d).join("");
}
