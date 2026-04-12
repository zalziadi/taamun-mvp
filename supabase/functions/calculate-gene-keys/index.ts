import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import geneKeysData from "./gene_keys_data.json" with { type: "json" };

// ─── Gate Wheel ───
// The I Ching wheel maps zodiac degrees → gate numbers
// Starting at Gate 41 (≈302° absolute), each gate = 5.625°, each line = 0.9375°
const GATE_WHEEL = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17,
  21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35,
  45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4,
  29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58,
  38, 54, 61, 60,
];

// Zodiac offset: Gate 41 starts at ~58.0° on the wheel (302° ecliptic mapped to wheel start)
const WHEEL_START_DEG = 58.0;

// ─── Sphere → Planet Mapping ───
interface SphereMap {
  sphere: string;
  planet: string;
  moment: "personality" | "design";
}

const SPHERE_PLANET_MAP: SphereMap[] = [
  { sphere: "lifes_work", planet: "sun", moment: "personality" },
  { sphere: "evolution", planet: "earth", moment: "personality" },
  { sphere: "radiance", planet: "sun", moment: "design" },
  { sphere: "purpose", planet: "earth", moment: "design" },
  { sphere: "attraction", planet: "moon", moment: "design" },
  { sphere: "iq", planet: "venus", moment: "personality" },
  { sphere: "eq", planet: "mars", moment: "personality" },
  { sphere: "sq", planet: "venus", moment: "design" },
  { sphere: "vocation", planet: "mars", moment: "design" },
  { sphere: "culture", planet: "jupiter", moment: "design" },
  { sphere: "pearl", planet: "jupiter", moment: "personality" },
];

// ─── Planetary Calculation ───
// Swiss Ephemeris planet IDs
const PLANETS: Record<string, number> = {
  sun: 0,
  moon: 1,
  venus: 3,
  mars: 4,
  jupiter: 5,
};

// Convert ecliptic longitude → gate + line
function degreeToGateLine(longitude: number): { gate: number; line: number } {
  // Normalize to 0-360
  const deg = ((longitude % 360) + 360) % 360;

  // Convert ecliptic degree to wheel position
  // The wheel starts with Gate 41 at 302° ecliptic
  let wheelPos = deg - 302.0;
  if (wheelPos < 0) wheelPos += 360;

  // Each gate = 5.625°
  const gateIndex = Math.floor(wheelPos / 5.625);
  const gateRemainder = wheelPos % 5.625;

  // Each line = 0.9375°
  const line = Math.floor(gateRemainder / 0.9375) + 1;

  const gate = GATE_WHEEL[gateIndex % 64];
  return { gate, line: Math.min(line, 6) };
}

// Earth is always opposite Sun (180°)
function earthLongitude(sunLongitude: number): number {
  return (sunLongitude + 180) % 360;
}

// ─── Simplified Planetary Positions ───
// For production: use pyswisseph via a Python microservice
// This uses a simplified calculation based on mean orbital elements
// Accurate enough for gate-level (5.625° buckets), not for exact degree work

// Julian Day Number from date
function dateToJD(year: number, month: number, day: number, hour: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hour / 24.0 + B - 1524.5;
}

// Mean Sun longitude (simplified, ~1° accuracy)
function meanSunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  let L = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mrad = (M * Math.PI) / 180;
  // Equation of center
  const C = (1.9146 - 0.004817 * T) * Math.sin(Mrad)
    + 0.019993 * Math.sin(2 * Mrad)
    + 0.00029 * Math.sin(3 * Mrad);
  L = L + C;
  return ((L % 360) + 360) % 360;
}

// Mean Moon longitude (simplified)
function meanMoonLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  let L = 218.3165 + 481267.8813 * T;
  // Major perturbation terms
  const D = 297.8502 + 445267.1115 * T;
  const M = 357.5291 + 35999.0503 * T;
  const Mp = 134.9634 + 477198.8676 * T;
  const F = 93.2720 + 483202.0175 * T;
  const Drad = (D * Math.PI) / 180;
  const Mrad = (M * Math.PI) / 180;
  const Mprad = (Mp * Math.PI) / 180;
  const Frad = (F * Math.PI) / 180;
  L += 6.289 * Math.sin(Mprad)
    + 1.274 * Math.sin(2 * Drad - Mprad)
    + 0.658 * Math.sin(2 * Drad)
    - 0.214 * Math.sin(2 * Mprad)
    - 0.186 * Math.sin(Mrad);
  return ((L % 360) + 360) % 360;
}

// Simplified planet longitude using mean elements
function planetLongitude(planet: string, jd: number): number {
  if (planet === "sun") return meanSunLongitude(jd);
  if (planet === "earth") return earthLongitude(meanSunLongitude(jd));
  if (planet === "moon") return meanMoonLongitude(jd);

  const T = (jd - 2451545.0) / 36525.0;

  // Mean orbital elements (J2000.0 epoch)
  const elements: Record<string, { L0: number; Lrate: number }> = {
    venus: { L0: 181.97973, Lrate: 58517.81539 },
    mars: { L0: 355.45332, Lrate: 19140.30268 },
    jupiter: { L0: 34.39644, Lrate: 3034.74612 },
  };

  const el = elements[planet];
  if (!el) return 0;

  let L = el.L0 + el.Lrate * T;
  return ((L % 360) + 360) % 360;
}

// ─── Design Calculation (88° Solar Arc) ───
// The Design moment is when the Sun was 88° before its natal position
// We use Newton-Raphson to find this moment
function findDesignMoment(natalJD: number, natalSunLong: number): number {
  const targetLong = ((natalSunLong - 88 + 360) % 360);

  // Approximate: Sun moves ~1°/day, so ~88 days before
  let jd = natalJD - 88;

  // Newton-Raphson iterations
  for (let i = 0; i < 20; i++) {
    const sunLong = meanSunLongitude(jd);
    let diff = targetLong - sunLong;

    // Handle wrap-around
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (Math.abs(diff) < 0.001) break;

    // Sun moves ~0.9856°/day
    jd += diff / 0.9856;
  }

  return jd;
}

// ─── Geocoding (simplified) ───
async function geocode(place: string): Promise<{ lat: number; lon: number; tz: string }> {
  // Use a free geocoding service
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "taamun-gene-keys/1.0" },
  });
  const data = await res.json();

  if (!data || data.length === 0) {
    // Default to Mecca if geocoding fails
    return { lat: 21.4225, lon: 39.8262, tz: "Asia/Riyadh" };
  }

  const lat = parseFloat(data[0].lat);
  const lon = parseFloat(data[0].lon);

  // Estimate timezone from longitude (rough but functional)
  const tzOffset = Math.round(lon / 15);
  const tz = `Etc/GMT${tzOffset <= 0 ? "+" : "-"}${Math.abs(tzOffset)}`;

  return { lat, lon, tz };
}

// ─── Main Handler ───
serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { birth_date, birth_time, birth_place } = await req.json();

    if (!birth_date || !birth_time || !birth_place) {
      return new Response(
        JSON.stringify({ error: "birth_date, birth_time, birth_place required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse date and time
    const [year, month, day] = birth_date.split("-").map(Number);
    const [hour, minute] = birth_time.split(":").map(Number);
    const hourDecimal = hour + minute / 60.0;

    // Geocode birth place
    const geo = await geocode(birth_place);

    // Calculate Julian Day for birth moment
    const natalJD = dateToJD(year, month, day, hourDecimal);

    // Calculate natal Sun position
    const natalSunLong = meanSunLongitude(natalJD);

    // Find Design moment (88° solar arc before birth)
    const designJD = findDesignMoment(natalJD, natalSunLong);

    // Calculate all 11 spheres
    const spheres = SPHERE_PLANET_MAP.map((s) => {
      const jd = s.moment === "personality" ? natalJD : designJD;
      const longitude = planetLongitude(s.planet, jd);
      const { gate, line } = degreeToGateLine(longitude);
      const keyData = geneKeysData[String(gate) as keyof typeof geneKeysData];

      return {
        sphere: s.sphere,
        gene_key: gate,
        line,
        shadow: keyData?.shadow ?? null,
        gift: keyData?.gift ?? null,
        siddhi: keyData?.siddhi ?? null,
      };
    });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // Save to database if authenticated
    if (userId) {
      // Save birth data
      await supabase.from("user_birth_data").upsert({
        user_id: userId,
        birth_date,
        birth_time,
        birth_place,
        latitude: geo.lat,
        longitude: geo.lon,
        timezone: geo.tz,
      }, { onConflict: "user_id" });

      // Save gene keys profile (upsert each sphere)
      for (const s of spheres) {
        await supabase.from("user_gene_keys_profile").upsert(
          { user_id: userId, ...s },
          { onConflict: "user_id,sphere" }
        );
      }
    }

    return new Response(
      JSON.stringify({
        profile: spheres,
        birth_data: {
          date: birth_date,
          time: birth_time,
          place: birth_place,
          coordinates: { lat: geo.lat, lon: geo.lon },
        },
        meta: {
          calculation: "simplified_mean_elements",
          accuracy: "gate_level",
          note: "For exact line-level accuracy, upgrade to Swiss Ephemeris backend",
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
