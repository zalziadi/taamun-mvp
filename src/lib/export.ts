export function exportTaamunData() {
  const TOTAL_DAYS = 28;
  const data: Record<string, unknown> = {};
  let exportedDays = 0;

  for (let i = 1; i <= TOTAL_DAYS; i++) {
    const key = `TAAMUN_DAY_${i}`;
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
  a.download = "taamun-export.json";
  a.click();
  URL.revokeObjectURL(url);

  return { exportedDays };
}
