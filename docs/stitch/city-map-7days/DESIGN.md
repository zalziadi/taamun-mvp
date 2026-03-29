# Design System Specification: Taamun (تمعّن)

## 1. Overview & Creative North Star
### The Creative North Star: "The Living Sanctuary"
This design system rejects the cold, clinical nature of standard modern apps in favor of a "Living Sanctuary." The interface is not a tool; it is a digital space for contemplation. We achieve this by moving away from rigid grids and hard borders, instead utilizing **Organic Flow** and **Luminous Depth**.

**Editorial Direction:**
The layout must feel like a curated spiritual map. We break the "template" look through:
*   **Intentional Asymmetry:** Using the `Spacing Scale` to create rhythmic, breathing gaps rather than perfectly centered blocks.
*   **Sacred Geometry:** Elements should feel like they are floating in a void, held together by gravitational pull (light) rather than structural boxes.
*   **The "Alive" Factor:** Using `Primary` and `Primary Container` tokens to create soft, pulsing glows that guide the eye to the most sacred content (the Ayah).

---

## 2. Colors & Surface Philosophy
The palette is rooted in the earth (`Surface: #15130f`) and illuminated by the divine (`Primary: #fff0ce`).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Sectioning must be achieved through:
1.  **Tonal Shifts:** Placing a `surface-container-low` card on a `surface` background.
2.  **Negative Space:** Using `spacing-8` or `spacing-10` to create a mental boundary.
3.  **Radial Light:** Using a soft gradient of `primary_container` (at 5-10% opacity) to "spotlight" a section.

### Surface Hierarchy & Nesting
Treat the UI as layered sheets of smoked glass. 
*   **Background:** `surface` (#15130f)
*   **Inactive/Distant Elements:** `surface-container-lowest`
*   **Content Cards:** `surface-container` or `surface-container-high`
*   **Floating Navigation:** `surface-bright` with a `backdrop-blur` of 20px.

### Signature Textures
Main CTAs and "Hero" Ayah cards should never be flat. Apply a radial gradient transitioning from `primary` (#fff0ce) at the center to `primary_container` (#e6d4a4) at the edges to give the element a "soul" and a sense of physical volume.

---

## 3. Typography
The typography is a bridge between the traditional (Amiri/Newsreader) and the contemporary (Manrope).

*   **Display & Headlines (Amiri / Newsreader):** Used for Quranic text and Surah titles. These should be oversized (using `display-lg` to `headline-sm`) to command reverence. 
*   **UI & Body (Manrope):** Used for translations, labels, and navigation. It must remain humble and clean to ensure the Arabic calligraphy remains the focal point.
*   **Editorial Contrast:** Pair a `display-md` Arabic headline with a `label-sm` (uppercase/spaced) translation to create a high-end, editorial feel.

---

## 4. Elevation & Depth
We eschew "drop shadows" in favor of **Tonal Layering** and **Ambient Glows**.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-highest` element placed on a `surface-dim` background creates a natural lift.
*   **Ambient Shadows:** If an element must float (e.g., a Bottom Sheet), use a shadow color derived from `on-surface` at 4% opacity with a blur of `3rem`. It should feel like a soft mist, not a shadow.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use the `outline-variant` token at 15% opacity. Never use 100% opaque lines.
*   **Glassmorphism:** Navigation bars and player controls must use `surface_container` at 80% opacity with a `blur-xl` effect, allowing the "spiritual map" background to bleed through softly.

---

## 5. Components

### Buttons (The "Pulse" Style)
*   **Primary:** Background: `primary_container`. Text: `on_primary_container`. Shape: `full` (rounded). Add a soft outer glow using a 4px blur of the `primary` color.
*   **Secondary:** Background: `secondary_container`. Text: `on_secondary_container`. No border.
*   **Tertiary:** Text: `primary`. No background. Use for low-emphasis actions like "Cancel."

### Cards & Lists (The "Aura" Container)
*   **Rule:** Forbid divider lines.
*   **Separation:** Use `spacing-4` vertical gaps.
*   **Interaction:** On tap, a card should transition its background from `surface-container` to `surface-container-high`.

### Input Fields
*   **Style:** Minimalist underline using `outline_variant` at 20% opacity. 
*   **Active State:** The underline glows into `primary` (#fff0ce). 
*   **Typography:** Labels use `label-md` in `on_surface_variant`.

### Special Component: The "Dhikr" Pulse (Unique to this system)
A large, circular interactive area (`rounded-full`) using a slow-animating radial gradient of `primary` to `surface`. This is used for contemplative breathing or counting.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace RTL Flow:** Ensure all animations (glows, slides) originate from the right or center.
*   **Use Organic Roundedness:** Stick to `rounded-lg` (2rem) and `rounded-xl` (3rem). Hard edges are strictly forbidden as they interrupt the "spiritual flow."
*   **Prioritize Breathing Room:** If a screen feels crowded, increase spacing using the `12` or `16` tokens.

### Don’t:
*   **No Pure White:** Never use #FFFFFF. Use `primary` (#fff0ce) for highlights and `on_surface` (#e8e1da) for text.
*   **No Structural Dividers:** Do not use lines to separate list items. Use whitespace or subtle shifts in surface tone.
*   **No Snappy Animations:** All transitions must have a duration of at least 400ms with a "Quart Out" easing to mimic the natural movement of light.

### Accessibility Note:
While we use soft glows and low-contrast boundaries, ensure that all `on-surface` text meets a 4.5:1 contrast ratio against its respective `surface-container`. The `primary` gold on `background` is our primary high-contrast anchor.