import { RAMADAN_ENDS_AT_ISO, RAMADAN_PROGRAM_ACTIVE } from "@/lib/appConfig";

export function isRamadanProgramClosed(now = new Date()): boolean {
  if (!RAMADAN_PROGRAM_ACTIVE) return true;
  const end = new Date(RAMADAN_ENDS_AT_ISO);
  if (Number.isNaN(end.getTime())) return false;
  return now.getTime() > end.getTime();
}
