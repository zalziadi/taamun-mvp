# Design System Specification: The Sacred Minimalist

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Manuscript."** 

This system moves away from the clinical, high-frequency "app" aesthetic and toward a slow, editorial, and sacred experience. It is designed to facilitate *Tadabbur* (deep contemplation). We achieve this by breaking the traditional mobile grid through intentional asymmetry, extreme negative space (the "breath" of the page), and a hierarchy that prioritizes the Quranic script as the sole protagonist. 

The interface should feel less like a software tool and more like a rare, light-starved parchment found in a quiet library at midnight.

---

## 2. Colors & Surface Philosophy
The palette is rooted in an "Ultra-Dark" foundation, using the warmth of organic materials rather than the coldness of pure black.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background creates a soft, natural transition that feels architectural rather than "drawn."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of heavy, dark paper.
*   **Base:** `surface` (#15130f)
*   **Secondary Content:** `surface-container-low` (#1d1b17)
*   **Interactive Cards:** `surface-container` (#221f1b)
*   **Elevated Overlays:** `surface-container-highest` (#373430)

### The "Glass & Gold" Rule
To add soul to the dark interface:
*   **Glassmorphism:** Use `surface_variant` at 60% opacity with a `24px` backdrop blur for floating navigation or sticky headers. This allows the calligraphy to bleed through softly as the user scrolls.
*   **Signature Gradients:** For primary CTAs or meaningful highlights, use a subtle radial gradient transitioning from `primary` (#d5c6a7) to `primary_container` (#b8ab8d) to mimic the way light hits real gold leaf.

---

## 3. Typography
Typography is the heartbeat of this system. It must respect the sanctity of the Arabic script while maintaining the modernity of the English translation.

*   **Arabic Script (Amiri):** Use `display-lg` through `headline-sm` for Quranic verses. The serif nature of Amiri provides the "Sacred" weight. Ensure a generous `line-height` (1.8+) to allow the diacritics (Tashkeel) to breathe without crowding.
*   **English Body (Manrope 300):** The choice of "Thin" (300 weight) creates a high-contrast pairing with the rich Arabic Serif. It feels ethereal and secondary, allowing the Arabic text to lead.
*   **Tonal Hierarchy:** Use `on_surface_variant` (#d0c5b8) for translations to ensure they sit visually "behind" the primary `on_surface` (#e8e1da) Arabic text.

---

## 4. Elevation & Depth
In this system, depth is quiet. We do not use "drop shadows" in the traditional sense.

*   **Tonal Layering:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, natural "recessed" look without any artificial styling.
*   **Ambient Shadows:** If a floating element (like a FAB) is required, use a shadow with a `40px` blur and 5% opacity, tinted with `#c4a882` (gold). This mimics the soft glow of a candle against gold leaf rather than a digital shadow.
*   **The "Ghost Border" Fallback:** If a container requires definition against a similar background, use a `1px` stroke of `outline-variant` (#4d463c) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Background of `primary_fixed` (#f0e1c0), text in `on_primary_fixed` (#221b07). Shape: `md` (0.375rem) for a subtle architectural feel.
*   **Tertiary (Contemplation):** No background. `1px` Ghost Border (15% opacity). Text in `secondary` (#e0c29a).

### Cards & Verse Containers
*   **Constraint:** Never use divider lines between verses.
*   **Structure:** Separate content using `spacing-8` (2.75rem) or a subtle shift from `surface` to `surface_container_low`.
*   **Texture:** Apply a very low-opacity (2%) parchment texture overlay to `surface_container` elements to break the digital flatness.

### Input Fields
*   **Style:** Minimalist underline only using `outline_variant`. The label should use `label-sm` in `primary` (#d5c6a7), floating above the input to maintain an editorial look.

### Specialized Components
*   **The Ayah Marker:** Use a `secondary` (#e0c29a) gold accent. Instead of a circle, use an asymmetrical organic shape or a simple vertical line to the right (RTL) of the text.
*   **Progress Indicator:** A thin `1px` line at the top of the screen using the `secondary` gold color, signifying the journey through a Surah.

---

## 6. RTL (Right-to-Left) Logic
Since this is an Arabic-first app, the layout starts from the right.
*   **Negative Space:** Always ensure the right margin is slightly larger than the left to "anchor" the start of the Arabic sentence.
*   **Iconography:** Mirror all directional icons (arrows, chevrons). Use icons that feel "hand-drawn" or "etched" rather than thick, geometric blocks.

---

## 7. Do's and Don'ts

### Do
*   **Do** use extreme vertical white space (`spacing-12` or `16`) between major thematic sections.
*   **Do** use `Manrope 300` for all English text to keep the interface feeling "light" and "spiritual."
*   **Do** allow the background `surface` color to be the dominant visual element (60% of the screen).

### Don't
*   **Don't** use pure white (#FFFFFF) for text. Use `on_surface` (#e8e1da) to prevent eye strain in dark environments.
*   **Don't** use high-contrast dividers. If you feel the need for a line, increase the `spacing` scale instead.
*   **Don't** use "vibrant" colors for errors. Use the muted `error` (#ffb4ab) tone to maintain the somber, respectful mood of the app.