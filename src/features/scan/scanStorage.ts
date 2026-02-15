import { isAdminEnabled, isEntitled } from "../../lib/storage";

export const SCAN_AYAH_KEY = "tmn.scan.ayahText.v1";
const PLAN_820_KEY = "taamun.plan820.v1";

export function getScanAyahText(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SCAN_AYAH_KEY) ?? "";
}

export function setScanAyahText(text: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCAN_AYAH_KEY, text);
  } catch {
    // ignore
  }
}

/** Returns true if user has plan 820 (Ayah Scan). Admin always has access. */
export function hasPlan820(): boolean {
  if (isAdminEnabled()) return true;
  if (!isEntitled()) return false;
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PLAN_820_KEY) === "1";
}

/** Grant plan 820 access (e.g. after purchase). */
export function setPlan820(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAN_820_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}
