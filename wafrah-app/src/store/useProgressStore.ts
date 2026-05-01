"use client";

import { create } from "zustand";
import type { DayState, Progress } from "@/lib/types";
import {
  emptyProgress,
  readProgress,
  writeProgress,
  isDayUnlocked,
  completedCount,
  progressPercent,
} from "@/lib/utils";
import { TOTAL_DAYS } from "@/lib/days";

interface ProgressStore {
  progress: Progress;
  hydrated: boolean;
  hydrate: () => void;
  saveAnswer: (dayId: number, answer: string, reflection?: string) => void;
  completeDay: (dayId: number) => void;
  resetJourney: () => void;
  isUnlocked: (dayId: number) => boolean;
  getDayState: (dayId: number) => DayState | undefined;
  completed: () => number;
  percent: () => number;
}

const initial: Progress = emptyProgress();

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progress: initial,
  hydrated: false,

  hydrate: () => {
    const stored = readProgress();
    set({ progress: stored, hydrated: true });
  },

  saveAnswer: (dayId, answer, reflection) => {
    const now = new Date().toISOString();
    const current = get().progress;
    const prev = current.days[dayId];
    const next: Progress = {
      ...current,
      startedAt: current.startedAt ?? now,
      days: {
        ...current.days,
        [dayId]: {
          answer,
          reflection: reflection ?? prev?.reflection ?? "",
          completed: prev?.completed ?? false,
          updatedAt: now,
        },
      },
    };
    set({ progress: next });
    writeProgress(next);
  },

  completeDay: (dayId) => {
    const now = new Date().toISOString();
    const current = get().progress;
    const prev = current.days[dayId] ?? {
      answer: "",
      reflection: "",
      completed: false,
      updatedAt: now,
    };
    const next: Progress = {
      ...current,
      startedAt: current.startedAt ?? now,
      days: {
        ...current.days,
        [dayId]: { ...prev, completed: true, updatedAt: now },
      },
    };
    set({ progress: next });
    writeProgress(next);
  },

  resetJourney: () => {
    const fresh = emptyProgress();
    set({ progress: fresh });
    writeProgress(fresh);
  },

  isUnlocked: (dayId) => isDayUnlocked(get().progress, dayId),
  getDayState: (dayId) => get().progress.days[dayId],
  completed: () => completedCount(get().progress),
  percent: () => progressPercent(get().progress, TOTAL_DAYS),
}));
