/**
 * Generates a 36-second Arabic ambient spiritual audio file (WAV)
 *
 * Maqam Bayati (D quarter-flat) — the most meditative Arabic scale
 * Frequencies based on D3 = 146.83 Hz
 *
 * Layers:
 *   1. Ney (ناي)    — breathy reed flute melody on Maqam Bayati
 *   2. Oud drone    — plucked string resonance, low D
 *   3. Daf (دف)     — soft frame drum pattern
 *   4. Qanun shimmer — high metallic strings
 *   5. Deep drone   — sustained D2 foundation
 *   6. Transition chimes — at scene changes
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SAMPLE_RATE = 44100;
const DURATION = 36;
const TOTAL_SAMPLES = SAMPLE_RATE * DURATION;
const NUM_CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

// ── Maqam Bayati on D ──────────────────────
// D  E♭(quarter-flat)  F  G  A  B♭  C  D
const D3 = 146.83;
const BAYATI = [
  D3,                    // D3   — 1st degree (qarar)
  D3 * 1.06,             // E♭q  — 2nd (quarter-flat, ~155.6)
  D3 * 1.189,            // F3   — 3rd (~174.6)
  D3 * 1.335,            // G3   — 4th (~196)
  D3 * 1.498,            // A3   — 5th (~220)
  D3 * 1.587,            // B♭3  — 6th (~233)
  D3 * 1.782,            // C4   — 7th (~261.6)
  D3 * 2,                // D4   — octave
];

// ── Helpers ──────────────────────────────────

function sin(t, freq) {
  return Math.sin(2 * Math.PI * freq * t);
}

function envelope(t, attack, sustain, release) {
  if (t < attack) return t / attack;
  if (t < sustain) return 1;
  if (t < release) return 1 - (t - sustain) / (release - sustain);
  return 0;
}

/** Ney (ناي) — breathy flute with harmonics + noise */
function ney(t, freq, breathAmount) {
  const fundamental = sin(t, freq);
  const h2 = sin(t, freq * 2.01) * 0.35;
  const h3 = sin(t, freq * 3.005) * 0.15;
  const h4 = sin(t, freq * 4.01) * 0.08;
  // Breath noise simulation (using high-frequency modulation)
  const breath = sin(t, freq * 7.13) * sin(t, 3217) * breathAmount;
  // Vibrato — characteristic of ney
  const vibrato = sin(t, 5.5) * freq * 0.008;
  const vibratoComponent = sin(t, freq + vibrato) * 0.3;
  return (fundamental + h2 + h3 + h4 + breath + vibratoComponent) * 0.4;
}

/** Oud — plucked string with fast attack, harmonic decay */
function oudPluck(t, center, freq) {
  const offset = t - center;
  if (offset < 0 || offset > 4) return 0;
  // Sharp attack, slow decay
  const amp = Math.exp(-offset * 1.2) * (1 - Math.exp(-offset * 80));
  const fundamental = sin(t, freq);
  const h2 = sin(t, freq * 2.0) * 0.5 * Math.exp(-offset * 2);
  const h3 = sin(t, freq * 3.0) * 0.25 * Math.exp(-offset * 3);
  const h4 = sin(t, freq * 4.0) * 0.12 * Math.exp(-offset * 4);
  const h5 = sin(t, freq * 5.0) * 0.06 * Math.exp(-offset * 5);
  return amp * (fundamental + h2 + h3 + h4 + h5) * 0.5;
}

/** Daf/Riq — frame drum hit (low thud + high tap) */
function dafHit(t, center, isDoum) {
  const offset = t - center;
  if (offset < 0 || offset > 0.4) return 0;
  const amp = Math.exp(-offset * (isDoum ? 8 : 15));
  if (isDoum) {
    // Doum — deep hit
    return amp * sin(t, 80) * 0.5 + amp * sin(t, 55) * 0.3;
  } else {
    // Tak — sharp rim hit
    const noise = sin(t, 2100 + offset * 500) * sin(t, 3700) * 0.3;
    return amp * (sin(t, 400) * 0.15 + noise);
  }
}

/** Qanun — metallic plucked zither, high shimmer */
function qanunNote(t, center, freq) {
  const offset = t - center;
  if (offset < 0 || offset > 3) return 0;
  const amp = Math.exp(-offset * 2) * (1 - Math.exp(-offset * 120));
  const f1 = sin(t, freq);
  const f2 = sin(t, freq * 2.001) * 0.6 * Math.exp(-offset * 3);
  const f3 = sin(t, freq * 3.002) * 0.3 * Math.exp(-offset * 4);
  // Metallic beating (slight detuning)
  const beat = sin(t, freq * 1.002) * 0.4;
  return amp * (f1 + f2 + f3 + beat) * 0.12;
}

// ── Ney melody — slow, contemplative Bayati phrases ──

const neyMelody = [
  // phrase 1 (0–6s): opening taqsim
  { start: 0.5, end: 2.5, note: 0 },    // D — long opening
  { start: 2.8, end: 4.5, note: 3 },    // G — rise
  { start: 4.8, end: 6.5, note: 4 },    // A — peak
  { start: 6.8, end: 8.5, note: 3 },    // G — descend
  // phrase 2 (8–14s)
  { start: 9, end: 11, note: 1 },       // E♭q — Bayati color
  { start: 11.3, end: 13, note: 2 },    // F
  { start: 13.3, end: 14.8, note: 0 },  // D — return to qarar
  // phrase 3 (15–21s): emotional peak
  { start: 15.5, end: 17.5, note: 4 },  // A
  { start: 17.8, end: 19.5, note: 7 },  // D4 — upper octave
  { start: 19.8, end: 21.5, note: 5 },  // B♭ — tension
  { start: 21.8, end: 23.5, note: 3 },  // G — resolve down
  // phrase 4 (24–30s): return & closure
  { start: 24.5, end: 26.5, note: 2 },  // F
  { start: 26.8, end: 28.5, note: 1 },  // E♭q — Bayati soul
  { start: 28.8, end: 31, note: 0 },    // D — long qarar
  // phrase 5 (31–35s): final breath
  { start: 31.5, end: 33.5, note: 3 },  // G — gentle rise
  { start: 33.8, end: 35.5, note: 0 },  // D — final rest
];

// ── Oud plucks — sparse, resonant ──

const oudNotes = [
  // Low D drone plucks
  { time: 0.2, freq: D3 / 2 },       // D2
  { time: 3.0, freq: D3 / 2 },
  { time: 7.0, freq: D3 / 2 },
  { time: 9.5, freq: BAYATI[3] / 2 }, // G2
  { time: 12.0, freq: D3 / 2 },
  { time: 15.0, freq: BAYATI[4] / 2 }, // A2
  { time: 18.0, freq: D3 / 2 },
  { time: 21.0, freq: BAYATI[3] / 2 },
  { time: 24.0, freq: D3 / 2 },
  { time: 27.0, freq: BAYATI[2] / 2 }, // F2
  { time: 29.0, freq: D3 / 2 },
  { time: 33.0, freq: D3 / 2 },
];

// ── Daf pattern — Maqsoum-inspired (simplified) ──
// Doum-Tak-_-Tak-Doum-_-Tak-_ (8 beats per bar)

function getDafHits() {
  const hits = [];
  const BPM = 50; // Very slow, meditative
  const beatDur = 60 / BPM;
  // Start drum softly from 5s, fade in
  for (let beat = 0; beat < (DURATION - 4) / beatDur; beat++) {
    const t = 5 + beat * beatDur;
    if (t > DURATION - 3) break;
    const pos = beat % 8;
    if (pos === 0) hits.push({ time: t, isDoum: true });
    if (pos === 1) hits.push({ time: t, isDoum: false });
    if (pos === 3) hits.push({ time: t, isDoum: false });
    if (pos === 4) hits.push({ time: t, isDoum: true });
    if (pos === 6) hits.push({ time: t, isDoum: false });
  }
  return hits;
}

const dafHits = getDafHits();

// ── Qanun — high ornamental notes at transitions ──

const qanunNotes = [
  { time: 3.1, freq: BAYATI[7] },     // D4
  { time: 3.4, freq: BAYATI[6] },     // C4
  { time: 7.1, freq: BAYATI[4] * 2 }, // A4
  { time: 12.1, freq: BAYATI[7] },
  { time: 12.4, freq: BAYATI[5] * 2 },
  { time: 18.1, freq: BAYATI[3] * 2 },
  { time: 24.1, freq: BAYATI[7] },
  { time: 24.5, freq: BAYATI[6] },
  { time: 29.1, freq: BAYATI[4] * 2 },
  { time: 33.1, freq: BAYATI[7] },
  { time: 33.3, freq: BAYATI[6] },
  { time: 33.5, freq: BAYATI[4] * 2 },
];

// ── Generate samples ──────────────────────────

const samples = new Float64Array(TOTAL_SAMPLES);

for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;

  // Master envelope: fade in 3s, sustain, fade out last 4s
  const masterEnv = envelope(t, 3, 32, 36);

  // ── Layer 1: Deep D2 drone ──
  const droneFreq = D3 / 2; // D2 = 73.4 Hz
  const droneMod = 0.7 + 0.3 * sin(t, 0.06); // Slow breathing
  const drone =
    (sin(t, droneFreq) * 0.2 +
      sin(t, droneFreq * 2) * 0.08 +
      sin(t, droneFreq * 3) * 0.03) * droneMod;

  // ── Layer 2: Ney melody ──
  let neySignal = 0;
  for (const phrase of neyMelody) {
    if (t >= phrase.start && t <= phrase.end) {
      const dur = phrase.end - phrase.start;
      const local = t - phrase.start;
      // Per-note envelope: gentle attack/release
      const noteEnv = envelope(local, 0.3, dur - 0.4, dur);
      const freq = BAYATI[phrase.note];
      const breathAmount = 0.08 + 0.05 * sin(t, 0.15);
      neySignal += ney(t, freq, breathAmount) * noteEnv;
      break; // Only one note at a time
    }
  }

  // ── Layer 3: Oud plucks ──
  let oudSignal = 0;
  for (const note of oudNotes) {
    oudSignal += oudPluck(t, note.time, note.freq);
  }

  // ── Layer 4: Daf pattern ──
  let dafSignal = 0;
  const dafEnvelope = envelope(t, 8, 30, 34); // Drums appear gradually
  for (const hit of dafHits) {
    dafSignal += dafHit(t, hit.time, hit.isDoum);
  }
  dafSignal *= dafEnvelope * 0.25; // Keep drums subtle

  // ── Layer 5: Qanun shimmer ──
  let qanunSignal = 0;
  for (const note of qanunNotes) {
    qanunSignal += qanunNote(t, note.time, note.freq);
  }

  // ── Layer 6: High harmonic haze (tambourine-like shimmer) ──
  const hazeEnv = Math.max(0, sin(t, 0.03));
  const haze = sin(t, BAYATI[7] * 2) * 0.015 * hazeEnv +
               sin(t, BAYATI[4] * 4) * 0.008 * hazeEnv;

  // Combine
  const raw = drone + neySignal * 0.6 + oudSignal * 0.35 +
              dafSignal + qanunSignal + haze;

  samples[i] = raw * masterEnv;
}

// ── Normalize ──────────────────────────────

let peak = 0;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const abs = Math.abs(samples[i]);
  if (abs > peak) peak = abs;
}
const normFactor = 0.85 / peak;

// ── Write WAV ──────────────────────────────

const dataSize = TOTAL_SAMPLES * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
const buffer = Buffer.alloc(44 + dataSize);

buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);

buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(NUM_CHANNELS, 22);
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8), 28);
buffer.writeUInt16LE(NUM_CHANNELS * (BITS_PER_SAMPLE / 8), 32);
buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);

buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const val = Math.max(-1, Math.min(1, samples[i] * normFactor));
  const int16 = Math.round(val * 32767);
  buffer.writeInt16LE(int16, 44 + i * 2);
}

const outPath = join(__dirname, "ambient-spiritual.wav");
writeFileSync(outPath, buffer);
console.log(`✅ Generated: ${outPath}`);
console.log(`   Duration: ${DURATION}s | Maqam: Bayati | Sample rate: ${SAMPLE_RATE}Hz | Size: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
