export const DAY1_ROUTE = "/day/1" as const;

export function dayRoute(day: number): string {
  const safeDay = Math.min(28, Math.max(1, Math.floor(day)));
  return `/day/${safeDay}`;
}
