import { isEntitled } from "./storage";
import { hasPlan820 } from "../features/scan";

/** Plan keys: base (280) or plan820 (820) */
export type PlanKey = "base" | "plan820";

/** Single source of truth: user has access to the given plan */
export function hasEntitlement(planKey: PlanKey): boolean {
  if (planKey === "base") return isEntitled();
  if (planKey === "plan820") return hasPlan820();
  return false;
}
