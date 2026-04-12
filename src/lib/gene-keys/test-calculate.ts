/**
 * Test: Ziad's Gene Keys profile
 * Run: npx tsx src/lib/gene-keys/test-calculate.ts
 */

import { calculateGeneKeysProfile } from "./calculate";
import geneKeysData from "../../app/api/gene-keys/calculate/gene_keys_data.json";

const REFERENCE: Record<string, string> = {
  lifes_work: "20.5",
  evolution: "34.5",
  radiance: "37.1",
  purpose: "40.1",
  attraction: "3.4",
  iq: "51.5",
  eq: "45.3",
  sq: "51.3",
  core: "51.2",
  culture: "41.3",
  pearl: "13.4",
};

// Ziad: 25 May 1985, 08:30, Al-Qunfudhah (UTC+3)
const profile = calculateGeneKeysProfile("1985-05-25", "08:30", 3, geneKeysData);

console.log("\n╔════════════════════════════════════════════════════════╗");
console.log("║     Gene Keys Profile — Ziad Al-Ziyadi               ║");
console.log("║     25 May 1985, 08:30, Al-Qunfudhah (UTC+3)         ║");
console.log("╠════════════════════════════════════════════════════════╣");

let matches = 0;

for (const sphere of profile) {
  const calc = `${sphere.gene_key}.${sphere.line}`;
  const exp = REFERENCE[sphere.sphere] ?? "?";
  const ok = calc === exp;
  if (ok) matches++;

  const icon = ok ? "✅" : "❌";
  console.log(`║  ${icon} ${sphere.sphere.padEnd(12)} calc: ${calc.padEnd(6)} ref: ${exp.padEnd(6)} ║`);
}

console.log("╠════════════════════════════════════════════════════════╣");
console.log(`║  Result: ${matches}/${profile.length} match                                 ║`);
console.log("╚════════════════════════════════════════════════════════╝\n");
