/**
 * Gene Keys Hologenetic Profile Calculator
 * Uses astronomy-engine for precise planetary positions
 */

import * as Astronomy from "astronomy-engine";

// ─── I Ching Gate Wheel ───
// 64 gates mapped around the ecliptic
// Gate 41 starts at 302° ecliptic longitude
// Each gate = 5.625°, each line = 0.9375°
const GATE_WHEEL: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17,
  21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35,
  45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4,
  29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58,
  38, 54, 61, 60,
];

const GATE_WHEEL_START = 302.0;

function eclipticToGateLine(eclipticLongitude: number): { gate: number; line: number } {
  let pos = eclipticLongitude - GATE_WHEEL_START;
  if (pos < 0) pos += 360;

  const gateIndex = Math.floor(pos / 5.625);
  const remainder = pos % 5.625;
  const line = Math.floor(remainder / 0.9375) + 1;

  return {
    gate: GATE_WHEEL[gateIndex % 64],
    line: Math.min(line, 6),
  };
}

// ─── Sphere → Planet Mapping ───
export interface SphereDefinition {
  sphere: string;
  planet: "sun" | "earth" | "moon" | "venus" | "mars" | "jupiter";
  moment: "personality" | "design";
}

export const SPHERE_MAP: SphereDefinition[] = [
  // Activation Sequence
  { sphere: "lifes_work", planet: "sun", moment: "personality" },
  { sphere: "evolution", planet: "earth", moment: "personality" },
  { sphere: "radiance", planet: "sun", moment: "design" },
  { sphere: "purpose", planet: "earth", moment: "design" },
  // Venus Sequence
  { sphere: "attraction", planet: "moon", moment: "design" },
  { sphere: "iq", planet: "venus", moment: "personality" },
  { sphere: "eq", planet: "mars", moment: "personality" },
  { sphere: "sq", planet: "venus", moment: "design" },
  { sphere: "core", planet: "mars", moment: "design" },
  // Pearl Sequence
  { sphere: "culture", planet: "jupiter", moment: "design" },
  { sphere: "pearl", planet: "jupiter", moment: "personality" },
];

// ─── Planet Position Calculator ───

function getPlanetLongitude(planet: string, date: Date): number {
  if (planet === "sun") {
    return Astronomy.SunPosition(date).elon;
  }
  if (planet === "earth") {
    return (Astronomy.SunPosition(date).elon + 180) % 360;
  }
  if (planet === "moon") {
    return Astronomy.EclipticGeoMoon(date).lon;
  }
  // Venus, Mars, Jupiter
  const bodyMap: Record<string, Astronomy.Body> = {
    venus: Astronomy.Body.Venus,
    mars: Astronomy.Body.Mars,
    jupiter: Astronomy.Body.Jupiter,
  };
  return Astronomy.EclipticLongitude(bodyMap[planet], date);
}

/**
 * Find the Design date — when the Sun was exactly 88° before its natal position
 * Uses Newton-Raphson iteration for sub-arcsecond precision
 */
function findDesignDate(natalDate: Date): Date {
  const natalSunLong = getPlanetLongitude("sun", natalDate);
  const targetLong = ((natalSunLong - 88 + 360) % 360);

  // Initial guess: ~88 days before birth
  let designDate = new Date(natalDate.getTime() - 88 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 50; i++) {
    const currentLong = getPlanetLongitude("sun", designDate);
    let diff = targetLong - currentLong;

    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (Math.abs(diff) < 0.00001) break; // sub-arcsecond

    // Sun moves ~0.9856°/day
    const correctionDays = diff / 0.9856;
    designDate = new Date(designDate.getTime() + correctionDays * 24 * 60 * 60 * 1000);
  }

  return designDate;
}

// ─── Main Calculator ───

export interface GeneKeySphere {
  sphere: string;
  gene_key: number;
  line: number;
  shadow: string | null;
  gift: string | null;
  siddhi: string | null;
  wm: string | null;
  wf: string | null;
  ws: string | null;
  ayah: string | null;
  ayah_ref: string | null;
}

/**
 * Calculate Gene Keys Hologenetic Profile from birth data
 * @param birthDate - YYYY-MM-DD
 * @param birthTime - HH:MM
 * @param utcOffset - timezone offset in hours (e.g. 3 for AST, 0 for UTC)
 * @param geneKeysData - shadow/gift/siddhi data for all 64 keys
 */
export function calculateGeneKeysProfile(
  birthDate: string,
  birthTime: string,
  utcOffset: number,
  geneKeysData: Record<string, { shadow: string; gift: string; siddhi: string }>
): GeneKeySphere[] {
  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute] = birthTime.split(":").map(Number);

  // Convert local time to UTC
  const utcHour = hour - utcOffset;
  const natalDate = new Date(Date.UTC(year, month - 1, day, utcHour, minute, 0));

  // Find Design date
  const designDate = findDesignDate(natalDate);

  // Calculate all spheres
  return SPHERE_MAP.map((s) => {
    const date = s.moment === "personality" ? natalDate : designDate;
    const longitude = getPlanetLongitude(s.planet, date);
    const { gate, line } = eclipticToGateLine(longitude);

    const keyData = geneKeysData[String(gate)] as any;

    return {
      sphere: s.sphere,
      gene_key: gate,
      line,
      shadow: keyData?.shadow ?? null,
      gift: keyData?.gift ?? null,
      siddhi: keyData?.siddhi ?? null,
      wm: keyData?.wm ?? null,
      wf: keyData?.wf ?? null,
      ws: keyData?.ws ?? null,
      ayah: keyData?.ayah ?? null,
      ayah_ref: keyData?.ref ?? null,
    };
  });
}
