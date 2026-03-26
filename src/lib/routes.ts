export const DAY1_ROUTE = "/day/1" as const;
export const PROGRAM_ROUTE = "/program" as const;
export const PROGRAM_DAY1_ROUTE = "/program/day/1" as const;
export const CITY_ROUTE = "/city" as const;
export const JOURNAL_ROUTE = "/journal" as const;
export const GUIDE_ROUTE = "/guide" as const;
export const JOURNEY_ROUTE = "/journey" as const;
export const REFLECTION_ROUTE = "/reflection" as const;
export const SOURCES_ROUTE = "/sources" as const;
export const PRICING_ROUTE = "/pricing" as const;
export const EID_ROUTE = "/eid" as const;
export const TASBEEH_ROUTE = "/tasbeeh" as const;

export function dayRoute(day: number): string {
  const safeDay = Math.min(28, Math.max(1, Math.floor(day)));
  return `/day/${safeDay}`;
}

export function programDayRoute(day: number): string {
  const safeDay = Math.min(28, Math.max(1, Math.floor(day)));
  return `/program/day/${safeDay}`;
}
