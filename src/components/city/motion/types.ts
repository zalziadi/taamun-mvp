import type { ZoneState } from "@/lib/cityEngine";

export interface CityMotionConfig {
  ambient: AmbientConfig;
  zone: ZoneMotionConfig;
  focus: FocusConfig;
  reward: RewardConfig;
}

export interface AmbientConfig {
  intensity: "calm" | "alive" | "deep";
  particleCount: number;
  breathDuration: number; // seconds
}

export interface ZoneMotionConfig {
  state: ZoneState;
  isActive: boolean;
  isFocused: boolean;
}

export interface FocusConfig {
  zoneId: string | null;
  scale: number;
  glowIntensity: number;
}

export interface RewardConfig {
  active: boolean;
  type: "streak" | "breakthrough" | "consistency" | "return" | "depth" | null;
  intensity: "low" | "medium" | "high";
}

// Map emotional state to ambient intensity
export function ambientFromEmotional(
  emotionalState: "engaged" | "resistant" | "lost" | "curious"
): AmbientConfig["intensity"] {
  if (emotionalState === "engaged") return "alive";
  if (emotionalState === "lost" || emotionalState === "resistant") return "calm";
  return "deep";
}
