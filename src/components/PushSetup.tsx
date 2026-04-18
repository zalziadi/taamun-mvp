"use client";

import { useEffect, useState } from "react";

/**
 * PushSetup — UI for enabling/disabling web push notifications.
 * Handles:
 *   - Service worker registration
 *   - PushManager subscription
 *   - VAPID key application
 *   - Morning hour preference (UTC)
 *   - Saving subscription to /api/push/subscribe
 *   - Unsubscribing via /api/push/unsubscribe
 */

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = typeof window !== "undefined" ? window.atob(base64) : "";
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSetup() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [morningHour, setMorningHour] = useState(3); // UTC (3 = 6 AM KSA)
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isSupported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(isSupported);
    if (!isSupported) return;

    setPermission(Notification.permission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    }).catch(() => {});
  }, []);

  async function enable() {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      setMessage("الخدمة غير مهيأة — راجع الإدارة");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // Register SW
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setMessage("لم يتم منح الإذن");
        setLoading(false);
        return;
      }

      // Subscribe
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      });

      const raw = subscription.toJSON();

      // Save to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: raw.endpoint,
          keys: raw.keys,
          morningHour,
          userAgent: navigator.userAgent,
        }),
      });
      if (res.ok) {
        setSubscribed(true);
        setMessage("✓ تم تفعيل الإشعارات");
      } else {
        setMessage("تعذّر الحفظ — حاول مجدداً");
      }
    } catch (err) {
      setMessage("حدث خطأ — " + ((err as Error).message || "غير معروف"));
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMessage("تم إيقاف الإشعارات");
    } catch {
      setMessage("تعذّر الإيقاف");
    } finally {
      setLoading(false);
    }
  }

  async function updateHour(newHour: number) {
    setMorningHour(newHour);
    if (!subscribed) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await fetch("/api/push/subscribe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          morningHour: newHour,
        }),
      });
      setMessage("✓ تم التحديث");
      setTimeout(() => setMessage(null), 2000);
    } catch {
      // Silent
    }
  }

  if (!supported) {
    return (
      <div className="border-t border-[#c9b88a]/15 p-5 space-y-2">
        <h3 className="text-sm font-semibold text-[#e8e1d9]">الإشعارات الصباحية</h3>
        <p className="text-xs text-white/40">متصفحك لا يدعم الإشعارات.</p>
      </div>
    );
  }

  // Convert UTC hour to KSA (UTC+3) for display
  const ksaHour = (morningHour + 3) % 24;
  const displayHour = ksaHour === 0 ? 12 : ksaHour > 12 ? ksaHour - 12 : ksaHour;
  const ampm = ksaHour < 12 ? "صباحاً" : "مساءً";

  return (
    <div className="border-t border-[#c9b88a]/15 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#e8e1d9]">الإشعارات الصباحية</h3>
        <p className="mt-1 text-xs text-white/40">
          تذكير يومي بآية اليوم — خذ ٥ دقائق مع قلبك
        </p>
      </div>

      {subscribed ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#c9b88a]">وقت التذكير</p>
              <p className="mt-0.5 text-sm text-[#e8e1d9]">
                {displayHour}:00 {ampm}
              </p>
            </div>
            <input
              type="range"
              min={0}
              max={23}
              value={morningHour}
              onChange={(e) => updateHour(parseInt(e.target.value, 10))}
              className="w-32 accent-[#c9b88a]"
              aria-label="ساعة التذكير الصباحي"
            />
          </div>

          <button
            type="button"
            onClick={disable}
            disabled={loading}
            className="w-full border border-white/10 py-2.5 text-xs text-white/60 hover:text-white/90 disabled:opacity-40"
          >
            {loading ? "..." : "إيقاف الإشعارات"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={loading || permission === "denied"}
          className="w-full border border-[#c9b88a]/40 py-2.5 text-xs font-semibold text-[#c9b88a] hover:bg-[#c9b88a]/10 disabled:opacity-40"
        >
          {loading
            ? "..."
            : permission === "denied"
              ? "الإشعارات محظورة في المتصفح"
              : "فعّل التذكير الصباحي"}
        </button>
      )}

      {message && (
        <p className="text-[11px] text-white/50 italic">{message}</p>
      )}
    </div>
  );
}
