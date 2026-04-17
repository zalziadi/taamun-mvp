/**
 * Cycle-aware content selector.
 *
 * The user can be in Cycle 1, 2, or 3. Each cycle has 28 days of unique content.
 * Content is selected based on `currentCycle` which is stored in:
 *   - Server: profiles.current_cycle column (canonical)
 *   - Client: localStorage "taamun.currentCycle" (fallback)
 *
 * If user has completed all 3 cycles, they loop back through them.
 */

import type { DayContent } from "./taamun-content";
import { getDay as getCycle1Day, DAYS as CYCLE1_DAYS } from "./taamun-content";
import { getCycle2Day, CYCLE2_DAYS } from "./taamun-content-cycle2";
import { getCycle3Day, CYCLE3_DAYS } from "./taamun-content-cycle3";

export const TOTAL_CYCLES = 3;
export const DAYS_PER_CYCLE = 28;
export const CYCLE_STORAGE_KEY = "taamun.currentCycle";

/**
 * Get day content for a specific cycle.
 * Cycles are normalized: 1, 2, 3, 4→1, 5→2, etc.
 */
export function getCycleDay(day: number, cycle: number = 1): DayContent | undefined {
  const normalizedCycle = ((cycle - 1) % TOTAL_CYCLES) + 1;
  switch (normalizedCycle) {
    case 1: return getCycle1Day(day);
    case 2: return getCycle2Day(day);
    case 3: return getCycle3Day(day);
    default: return getCycle1Day(day);
  }
}

/**
 * Get cycle title for UI display
 */
export function getCycleTitle(cycle: number): string {
  const normalized = ((cycle - 1) % TOTAL_CYCLES) + 1;
  const loop = Math.floor((cycle - 1) / TOTAL_CYCLES);
  const suffix = loop > 0 ? ` (${toArabicNumeral(loop + 1)})` : "";
  switch (normalized) {
    case 1: return `الدورة الأولى: الظل والهدية${suffix}`;
    case 2: return `الدورة الثانية: النفس والعلاقات${suffix}`;
    case 3: return `الدورة الثالثة: السور الكاملة${suffix}`;
    default: return `الدورة ${toArabicNumeral(cycle)}`;
  }
}

export function getCycleShortName(cycle: number): string {
  const normalized = ((cycle - 1) % TOTAL_CYCLES) + 1;
  switch (normalized) {
    case 1: return "الأولى";
    case 2: return "الثانية";
    case 3: return "الثالثة";
    default: return toArabicNumeral(cycle);
  }
}

function toArabicNumeral(n: number): string {
  const map = "٠١٢٣٤٥٦٧٨٩";
  return String(n).split("").map((d) => map[parseInt(d, 10)] ?? d).join("");
}

/**
 * Read cycle from localStorage (client-side).
 * Defaults to 1 if not set or invalid.
 */
export function getClientCycle(): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = localStorage.getItem(CYCLE_STORAGE_KEY);
    if (!raw) return 1;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  } catch {
    return 1;
  }
}

export function setClientCycle(cycle: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CYCLE_STORAGE_KEY, String(Math.max(1, cycle)));
}

/**
 * Cycle milestones — special days across the full journey
 */
export interface CycleMilestone {
  totalDay: number; // absolute day across all cycles (1-84+)
  label: string;
  description: string;
}

export const CYCLE_MILESTONES: CycleMilestone[] = [
  { totalDay: 28, label: "أتممت الدورة الأولى", description: "رأيت الظل. رأيت الهدية." },
  { totalDay: 56, label: "أتممت الدورة الثانية", description: "اكتشفت نفسك من خلال العلاقات والرزق." },
  { totalDay: 84, label: "أتممت كل الدورات", description: "عبرت الظل والهدية والسور الكاملة." },
  { totalDay: 60, label: "٦٠ يوم من التمعّن", description: "شهران كاملان مع القرآن." },
  { totalDay: 90, label: "٩٠ يوم — ربع سنة", description: "ربع سنة من الوعي اليومي." },
  { totalDay: 180, label: "١٨٠ يوم — نصف سنة", description: "نصف سنة وأنت تتمعّن. الرحلة صارت جزءاً منك." },
  { totalDay: 365, label: "سنة كاملة", description: "سنة من التمعّن. أنت لست نفس الشخص الذي بدأ." },
];

export function getMilestoneForTotalDay(totalDay: number): CycleMilestone | undefined {
  return CYCLE_MILESTONES.find((m) => m.totalDay === totalDay);
}

export { CYCLE1_DAYS, CYCLE2_DAYS, CYCLE3_DAYS };
