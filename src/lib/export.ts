import { APP_SLUG } from "@/lib/appConfig";

export function exportTaamunData() {
  const TOTAL_DAYS = 28;
  const dayStoragePrefix = `${APP_SLUG.toUpperCase()}_DAY_`;
  const data: Record<string, unknown> = {};
  let exportedDays = 0;

  for (let i = 1; i <= TOTAL_DAYS; i++) {
    const key = `${dayStoragePrefix}${i}`;
    const value = localStorage.getItem(key);
    if (value) {
      try {
        data[`day_${i}`] = JSON.parse(value);
      } catch {
        data[`day_${i}`] = value;
      }
      exportedDays++;
    }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${APP_SLUG}-export.json`;
  a.click();
  URL.revokeObjectURL(url);

  return { exportedDays };
}
