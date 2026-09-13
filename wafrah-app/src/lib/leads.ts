"use client";

// التقاط بريد الرحلة — يخزّن محلياً (علم عدم التكرار) ويُرسل للخادم (Supabase إن توفّر).
const LEAD_KEY = "wafrah.lead.v1";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function hasLead(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LEAD_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLead(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEAD_KEY, "1");
  } catch {
    // private mode / quota — تجاهل بأمان
  }
}

export async function submitLead(
  name: string,
  email: string
): Promise<{ ok: boolean; mode?: string }> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    return (await res.json()) as { ok: boolean; mode?: string };
  } catch {
    // الشبكة سقطت — لا نكسر الرحلة
    return { ok: false };
  }
}
