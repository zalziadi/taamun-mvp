"use client";

import { useEffect, useState } from "react";

/**
 * InviteShare — compact widget for /account.
 * Loads the user's invite code and offers copy + native share.
 * Rewards: free month for both inviter and invitee on successful subscription.
 */
export function InviteShare() {
  const [code, setCode] = useState<string | null>(null);
  const [uses, setUses] = useState(0);
  const [rewarded, setRewarded] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invite")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.code) {
          setCode(data.code);
          setUses(data.uses ?? 0);
          setRewarded(data.rewarded ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!code) return null;

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/invite/${code}`
    : `/invite/${code}`;

  async function handleShare() {
    const text = `دعوة من صديق لتجربة تمعّن — رحلة تأمل قرآنية ٢٨ يوماً.\n\n${url}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "تمعّن — دعوة",
          text,
          url,
        });
        return;
      } catch {
        // User cancelled — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleCopy() {
    if (!code) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="border-t border-[#c9b88a]/15 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#e8e1d9]">ادعُ صديقاً</h3>
        <p className="mt-1 text-xs text-white/40">
          شهر مجاني لك ولصديقك عند اشتراكه.
        </p>
      </div>

      <div className="flex items-center justify-between border border-white/10 px-3 py-2 bg-white/[0.02]">
        <code className="text-xs font-mono text-[#c9b88a] break-all flex-1 ml-2">
          {url.replace(/^https?:\/\//, "")}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 text-[11px] text-[#c9b88a] hover:text-[#e0c29a]"
          aria-label="انسخ الرابط"
        >
          {copied ? "✓ نُسخ" : "نسخ"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleShare}
        className="w-full border border-[#c9b88a]/40 py-2.5 text-xs font-semibold text-[#c9b88a] hover:bg-[#c9b88a]/10"
      >
        شارك الرابط
      </button>

      {(uses > 0 || rewarded > 0) && (
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-white/50">
            استخدمه {uses} شخص
          </span>
          {rewarded > 0 && (
            <span className="text-emerald-400/80">
              • {rewarded} اشترك
            </span>
          )}
        </div>
      )}
    </div>
  );
}
