"use client";

import { useCallback, useEffect, useState } from "react";
import {
  STATUS_LABEL,
  buildShareText,
  buildWhatsAppHref,
  buildInstagramStoryHref,
  buildCopyText,
  type ReferralStatus,
} from "./ReferralPanelHelpers";

/**
 * ReferralPanel — the /account/referral client component.
 *
 * Mirrors RenewalBanner's fetch-on-mount pattern (Plan 09.04 precedent):
 *   - Zero server-rendered markup for the dynamic section — initial paint is
 *     a static page shell with a loading row; fetch fires in useEffect.
 *   - No modal, no interstitial, no countdown timer.
 *   - Every share is a user tap — no auto-share.
 *
 * Privacy:
 *   - No invitee identity is rendered. Only status labels + created_at dates
 *     + the referrer's own FRIEND-* code.
 *   - The full code appears in the user's OWN view only; analytics gets
 *     prefix-only props (enforced by /api/referral/create, NOT here).
 *   - This component never calls emitEvent directly (ANALYTICS-07).
 *
 * Copy — do not alter without reading 10.05-PLAN §REFER-10. The page's
 * da'wah framing ("ادعُ للتمعّن") is non-negotiable.
 *
 * REQ coverage: REFER-01, REFER-09, REFER-10, REFER-11.
 */

type ReferralRow = {
  id: string;
  code: string;
  status: ReferralStatus;
  created_at: string;
};

type PanelState = {
  loading: boolean;
  code: string | null;
  capHit: boolean;
  currentCount: number;
  list: ReferralRow[];
  error: string | null;
};

const INITIAL_STATE: PanelState = {
  loading: true,
  code: null,
  capHit: false,
  currentCount: 0,
  list: [],
  error: null,
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function ReferralPanel({ appDomain }: { appDomain: string }) {
  const [state, setState] = useState<PanelState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [createRes, listRes] = await Promise.all([
          fetch("/api/referral/create", { method: "POST" }),
          fetch("/api/referral/list", { method: "GET" }),
        ]);
        const createJson = await createRes.json().catch(() => ({}));
        const listJson = await listRes.json().catch(() => ({}));
        if (cancelled) return;

        const rawList: unknown = listJson?.referrals;
        // Narrow to the privacy-minimal projection we actually render. Server
        // fields like invitee_redeemed_at are dropped on purpose.
        const referrals: ReferralRow[] = Array.isArray(rawList)
          ? rawList.map((r: any) => ({
              id: String(r?.id ?? ""),
              code: String(r?.code ?? ""),
              status: r?.status as ReferralStatus,
              created_at: String(r?.created_at ?? ""),
            }))
          : [];

        if (createRes.status === 429) {
          setState({
            loading: false,
            code: null,
            capHit: true,
            currentCount: Number(createJson?.current ?? 3),
            list: referrals,
            error: null,
          });
          return;
        }
        if (!createRes.ok || !createJson?.ok) {
          setState({
            ...INITIAL_STATE,
            loading: false,
            list: referrals,
            error: String(createJson?.error ?? "unknown"),
          });
          return;
        }
        setState({
          loading: false,
          code: String(createJson.code),
          capHit: false,
          currentCount: 0,
          list: referrals,
          error: null,
        });
      } catch {
        if (!cancelled) {
          setState({ ...INITIAL_STATE, loading: false, error: "network" });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onCopy = useCallback(
    async (code: string) => {
      try {
        await navigator.clipboard.writeText(buildCopyText(code, appDomain));
        setCopied(true);
      } catch {
        /* clipboard blocked — silent no-op; button remains tappable */
      }
    },
    [appDomain],
  );

  const shareText = state.code ? buildShareText(state.code, appDomain) : "";
  const waHref = state.code ? buildWhatsAppHref(shareText) : "#";
  const igHref = state.code
    ? buildInstagramStoryHref(state.code, appDomain)
    : "#";

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-xl space-y-6 px-4 py-8 text-[#D6D1C8]"
    >
      <header className="space-y-2 text-center">
        <h1 className="font-[var(--font-amiri)] text-2xl text-[#e8e1d9] sm:text-3xl">
          ادعُ للتمعّن
        </h1>
        <p className="text-sm leading-relaxed text-[#c9b88a]">
          صديقك يبدأ، وأنت تربح شهر تأمّل. بعد مرور ١٤ يومًا من رحلته.
        </p>
      </header>

      {state.loading && (
        <div
          role="status"
          className="rounded-xl border border-[#2A2621] bg-[#14120F] px-4 py-6 text-center text-sm text-[#807A72]"
        >
          جارٍ التحميل…
        </div>
      )}

      {!state.loading && state.error && !state.capHit && (
        <div className="rounded-xl border border-[#2A2621] bg-[#14120F] px-4 py-6 text-center text-sm text-[#807A72]">
          تعذّر تحميل بياناتك الآن. حاول لاحقًا.
        </div>
      )}

      {!state.loading && state.capHit && (
        <div className="rounded-xl border border-[#2A2621] bg-[#14120F] px-4 py-6 text-center text-sm leading-relaxed text-[#D6D1C8]">
          بلغت ٣ دعوات هذا العام — شكرًا لدعوتك.
        </div>
      )}

      {!state.loading && !state.capHit && state.code && (
        <section className="space-y-4">
          <div className="rounded-xl border border-[#2A2621] bg-[#14120F] p-5 text-center">
            <p className="mb-2 text-xs uppercase tracking-wider text-[#807A72]">
              رمزك
            </p>
            <code
              dir="ltr"
              className="block font-mono text-lg text-[#C9A84C]"
            >
              {state.code}
            </code>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl border border-[#C9A84C] bg-[#C9A84C] px-4 py-3 text-center text-sm font-semibold text-[#0A0908] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/45"
            >
              شارك عبر واتساب
            </a>
            <a
              href={igHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl border border-[#2A2621] bg-[#14120F] px-4 py-3 text-center text-sm text-[#D6D1C8] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/45"
            >
              انستغرام
            </a>
            <button
              type="button"
              onClick={() => state.code && onCopy(state.code)}
              className="flex-1 rounded-xl border border-[#2A2621] bg-[#14120F] px-4 py-3 text-center text-sm text-[#D6D1C8] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/45"
            >
              {copied ? "تم النسخ" : "انسخ الرابط"}
            </button>
          </div>

          <p className="text-center text-xs leading-relaxed text-[#807A72]">
            انستغرام لا يدعم نصًا مسبقًا في القصص من الويب. افتح انستغرام ثم
            ألصق الرابط من الحافظة.
          </p>
        </section>
      )}

      {!state.loading && state.list.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-[var(--font-amiri)] text-lg text-[#e8e1d9]">
            دعواتك
          </h2>
          <ul className="space-y-2">
            {state.list.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between rounded-xl border border-[#2A2621] bg-[#14120F] px-4 py-3 text-sm"
              >
                <span className="text-[#807A72]">
                  {formatDate(row.created_at)}
                </span>
                <span className="text-[#C9A84C]">
                  {STATUS_LABEL[row.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
