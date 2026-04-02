# Design System: Taamun VIP Offer

## 1. Visual Theme & Atmosphere

A deeply intimate, premium Arabic coaching experience — like entering a private majlis at night. The atmosphere is **warm darkness** with restrained gold luminance, evoking trust, exclusivity, and spiritual weight. Every element breathes with quiet confidence — no shouting, no neon, no cheap urgency. The scarcity (2 seats only) is communicated through spatial restraint and typographic gravity, not flashing timers.

- **Density:** 3 (Gallery Airy) — generous whitespace, each section owns its vertical space
- **Variance:** 7 (Offset Asymmetric) — right-aligned RTL flow with intentional asymmetry
- **Motion:** 5 (Fluid CSS) — subtle gold shimmer on key elements, spring-physics scroll reveals
- **Direction:** RTL — Arabic-first, `dir="rtl" lang="ar"` on root

## 2. Color Palette & Roles

| Name | Hex | Role |
|------|-----|------|
| **Deep Night** | `hsl(222 47% 7%)` / `#0A0F1A` | Primary background — the canvas |
| **Panel Depth** | `hsl(222 35% 10%)` / `#121829` | Card surfaces, elevated containers |
| **Panel Mid** | `hsl(222 28% 12%)` / `#171E2E` | Secondary surfaces, section dividers |
| **Parchment Light** | `#F5EFE4` | Primary text — warm off-white, high contrast on dark |
| **Muted Sand** | `hsl(215 16% 70%)` / `#A3AEBB` | Secondary text, descriptions, metadata |
| **Ink Warm** | `#7A6048` | Tertiary text, subtle labels |
| **Burnished Gold** | `hsl(42 86% 55%)` / `#E8B730` | **Single accent** — CTAs, price highlights, active states. Saturation ~75% |
| **Gold Deep** | `hsl(42 86% 45%)` / `#BF9520` | Gold pressed/hover state, secondary gold |
| **Whisper Border** | `hsl(222 22% 18%)` / `#232D3F` | Structural borders, 1px lines, table dividers |
| **Danger Ember** | `hsl(0 72% 55%)` | Strikethrough pricing, urgency accents (used sparingly) |
| **Success Calm** | `hsl(142 70% 45%)` | Confirmation states only |

**Banned colors:** Pure black `#000000`, any purple/violet, neon blue, saturated gradients.

## 3. Typography Rules

| Role | Font | Spec |
|------|------|------|
| **Display / Headlines** | `Noto Sans Arabic` weight 700–800 | Track-tight (`letter-spacing: -0.02em`), hierarchy through weight and gold color, not size inflation. Max display: `clamp(2rem, 5vw, 3.5rem)` |
| **Body** | `Noto Sans Arabic` weight 400 | Relaxed leading (`line-height: 1.8`), max 60 characters per line for Arabic readability |
| **Numbers / Pricing** | `Geist Mono` or `JetBrains Mono` | All prices, stats, and countdown numbers in monospace — adds precision and premium feel |
| **Accent Text** | `Noto Sans Arabic` weight 600 | For labels, tags, section headers |

**Banned:** Inter, Times New Roman, Georgia, Garamond, any Latin-first font as primary. Generic system serif.

**Arabic-specific rules:**
- Never justify Arabic body text — use `text-align: right`
- Tashkeel (diacritics) display correctly with adequate line-height
- Numbers display in Western Arabic numerals (1, 2, 3) for pricing

## 4. Hero Section

- **Layout:** Full-viewport RTL split — right side: bold headline stack with the offer name and transformation promise. Left side: atmospheric negative space with a single gold geometric accent (no photos, no stock imagery)
- **Headline treatment:** "تمعّن VIP" in large display weight, "90 يوم مع الكوتش زياد" as a secondary line in muted parchment. The gold accent underlines "VIP" only — restrained, not wrapping the whole title
- **Single CTA:** One gold-filled button — "احجز مقعدك الآن" — with tactile press feedback. No secondary links, no "learn more"
- **Scarcity indicator:** "مقعدان فقط" displayed as a small mono-spaced tag above the headline — not flashing, not animated, just present with quiet authority
- **No filler text:** No "scroll to explore", no bouncing arrows, no "اكتشف المزيد" prompts

## 5. Component Stylings

### Buttons
- **Primary CTA:** `bg-gold text-ink` (`#E8B730` fill, `#2A1D10` text). Rounded corners (`border-radius: 1rem`). On hover: `bg-gold2`. On active: `translateY(1px)` tactile push. No outer glow, no shadow spread
- **Ghost/Secondary:** `border-1 border-gold text-gold` outline style. Hover fills to 10% gold opacity

### Cards (Offer Components)
- Used for the 3 offer pillars (sessions, follow-up, subscription)
- `bg-panel` with `border border-whisper-border`. Rounded corners (`border-radius: 1.5rem`)
- Subtle inner gold left-border (3px) as hierarchy indicator — like a majlis cushion edge
- No drop shadows. Elevation communicated through background tint difference only

### Pricing Table
- Clean horizontal rule dividers, not full card containers
- Strikethrough original price in `danger-ember` with `line-through`
- Final price in `gold` with monospace font, larger scale (`text-3xl`)
- Savings percentage as a small gold-outlined badge

### Testimonial / Trust Block
- No generic "John Doe" names. Use "م. أحمد — الرياض" format if testimonials exist
- Quotation in `parchment-light` italic, attribution in `muted-sand`
- Separated by thin gold horizontal rule, not cards

### FAQ / Objections
- Accordion-style with `+` / `−` toggle in gold
- Question in weight 600, answer in weight 400 muted
- No background color change on expand — just content reveal with spring animation

## 6. Layout Principles

- **RTL Grid:** CSS Grid with `direction: rtl`. No flexbox percentage math
- **Max-width:** Content contained at `max-width: 900px` centered — this is a focused sales page, not a dashboard
- **Section rhythm:** Each section separated by `clamp(4rem, 10vw, 8rem)` vertical space
- **Mobile collapse:** All layouts single-column below 768px. No exceptions
- **No overlapping:** Every element occupies its own clean spatial zone. No absolute-positioned decorative overlays
- **Touch targets:** All interactive elements minimum 48px tap target (Arabic text tends larger)
- **Full-height hero:** `min-h-[100dvh]` — never `h-screen`

## 7. Motion & Interaction

- **Spring physics:** `stiffness: 100, damping: 20` for all interactive transitions — weighty, premium feel
- **Scroll reveal:** Sections fade-in + translateY(20px) on intersection. Staggered 100ms delay for child elements within sections
- **Gold shimmer:** Subtle infinite shimmer on the primary CTA button — a slow left-to-right light sweep every 4 seconds. CSS only, no JS
- **Price reveal:** The final price number counts up from 0 to 3,500 on first viewport entry — monospace font prevents layout shift
- **Accordion:** Spring-based height animation on FAQ expand/collapse. No `max-height` hack
- **Performance:** Animate exclusively via `transform` and `opacity`. No layout-triggering properties

## 8. Responsive Rules

| Viewport | Behavior |
|----------|----------|
| **Desktop (> 1024px)** | Split hero, 2-column offer cards, inline pricing table |
| **Tablet (768–1024px)** | Stacked hero, 2-column cards, full-width pricing |
| **Mobile (< 768px)** | Single column everything. Headlines scale via `clamp()`. CTA becomes sticky bottom bar. Cards stack vertically with 1.5rem gap |

- Typography scaling: `clamp(1.5rem, 4vw, 3rem)` for headlines
- Body text minimum: `1rem` / `16px`
- Section gaps reduce: `clamp(3rem, 8vw, 6rem)`
- Images (if any): `object-fit: cover` with `aspect-ratio` constraints

## 9. Anti-Patterns (Banned)

- No emojis anywhere in the UI
- No `Inter` font
- No generic serif fonts
- No pure black `#000000`
- No neon/outer glow shadows
- No oversaturated gradients or gradient text
- No custom mouse cursors
- No overlapping elements
- No 3-column equal card layouts
- No generic placeholder names ("John Doe", "Acme")
- No fake round numbers (`99.99%`)
- No AI copywriting cliches ("Elevate", "Seamless", "Unleash", "Next-Gen")
- No filler UI text: "Scroll to explore", "Swipe down", scroll arrows, bouncing chevrons
- No flashing countdown timers — urgency through copy weight, not animation
- No stock photography — the page sells through typography and spatial design
- No WhatsApp green buttons — use brand gold for all CTAs
- No centered hero layouts — asymmetric right-aligned for RTL
- No Latin placeholder text (Lorem ipsum)
- No broken image links — use SVG geometric accents only
