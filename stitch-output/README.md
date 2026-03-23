# Taamun (تمعّن) — Stitch-to-React Components

Production-ready React/Next.js components converted from Stitch HTML designs. All components use TypeScript, Tailwind CSS, and follow RTL/Arabic best practices.

## Components Overview

### Shared Components

#### **TopBar** (`components/TopBar.tsx`)
Reusable header component with support for menu, back navigation, sharing, and user avatar.

```tsx
import { TopBar } from '@/stitch-output/components';

<TopBar
  title="ٱلْقُرْآن"
  showMenu={true}
  showShare={false}
  showBack={true}
  onMenuClick={() => console.log('menu')}
  backHref="/"
  avatarSrc="/path/to/avatar.jpg"
/>
```

**Props:**
- `title?: string` — Header title (default: 'ٱلْقُرْآن')
- `showMenu?: boolean` — Show menu button
- `showShare?: boolean` — Show share button
- `showBack?: boolean` — Show back arrow
- `onMenuClick?: () => void` — Menu button handler
- `onShareClick?: () => void` — Share button handler
- `onBackClick?: () => void` — Back button handler
- `backHref?: string` — Back link destination
- `avatarSrc?: string` — User avatar image URL

#### **BottomNav** (`components/BottomNav.tsx`)
Fixed bottom navigation bar with 4 tabs: Journey, Progress, Journal, Profile.

```tsx
import { BottomNav } from '@/stitch-output/components';

<BottomNav active="journey" />
```

**Props:**
- `active?: 'journey' | 'progress' | 'journal' | 'profile'` — Active tab (default: 'journey')

---

### Page Components

#### **HomePage** (`pages/HomePage.tsx`)
Landing page with hero verse, journey steps (5-step process), and breathing card.

```tsx
import { HomePage } from '@/stitch-output/pages';

<HomePage
  currentStep={1}
  totalSteps={5}
  verseArabic="أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ"
  verseSurah="سورة الرعد — الآية ٢٨"
  breathingDescription="خذ شهيقاً عميقاً..."
  onContinue={() => navigate('/verse')}
  userAvatarSrc="/path/to/avatar.jpg"
/>
```

**Props:**
- `currentStep?: number` — Current step in journey (default: 1)
- `totalSteps?: number` — Total steps (default: 5)
- `verseArabic?: string` — The Quranic verse in Arabic
- `verseSurah?: string` — Surah and verse reference
- `breathingDescription?: string` — Breathing instructions
- `onContinue?: () => void` — Continue button handler
- `userAvatarSrc?: string` — User avatar URL

**Features:**
- Desert gradient background
- Animated step progress with glassmorphism card
- Breathing instructions card with progress bar
- Large CTA button with hover effects
- Fixed bottom navigation

---

#### **VersePage** (`pages/VersePage.tsx`)
Verse display page with context card and contemplation button.

```tsx
import { VersePage } from '@/stitch-output/pages';

<VersePage
  verseArabic="أَلَمْ يَعْلَمْ بِأَنَّ اللَّهَ يَرَى"
  verseEnglish='"Does he not know that Allah sees?"'
  surahName="Surah Al-Alaq"
  verseNumber="Verse 14"
  contextTitle="سياق الآية"
  contextText="تذكير بعلم الله..."
  onReflect={() => navigate('/breathing')}
/>
```

**Props:**
- `verseArabic?: string` — Verse in Arabic
- `verseEnglish?: string` — English translation
- `surahName?: string` — Surah name
- `verseNumber?: string` — Verse number
- `contextTitle?: string` — Context section title
- `contextText?: string` — Context description
- `onReflect?: () => void` — Reflect button handler

**Features:**
- Large centered verse display with text-shadow (quran-text)
- Radial glow background effect
- Context/insight card with glassmorphism
- Decorative blur circles
- Reflection button with shine effect

---

#### **BreathingPage** (`pages/BreathingPage.tsx`)
Meditation/breathing exercise page with animated breathing circles and cycle guidance.

```tsx
import { BreathingPage } from '@/stitch-output/pages';

<BreathingPage
  verseQuran="هُوَ الَّذِي أَنزَلَ السَّكِينَةَ..."
  duration={300}
  currentTime={165}
  onClose={() => navigate('/')}
  showContextCard={true}
  contextVerse="هُوَ الَّذِي أَنزَلَ السَّكِينَةَ..."
/>
```

**Props:**
- `verseQuran?: string` — Verse for context (not displayed, used in card)
- `duration?: number` — Total session duration in seconds (default: 300)
- `currentTime?: number` — Starting time (default: 165)
- `onClose?: () => void` — Close button handler
- `showContextCard?: boolean` — Show context card on desktop (default: true)
- `contextVerse?: string` — Verse to display in context card

**Features:**
- Animated breathing circles (pulse animation with delays)
- 4-phase breathing cycle: شهيق (inhale) → احبس (hold) → زفير (exhale) → سكون (pause)
- Real-time progress bar and timer
- Keyboard-safe focus on meditation
- Desktop context card with verse
- Decorative right-side elements
- Automatic breathing text animation (8s cycle)

---

#### **JournalPage** (`pages/JournalPage.tsx`)
Writing/reflection page with textarea, word count, and save functionality.

```tsx
import { JournalPage } from '@/stitch-output/pages';

<JournalPage
  stepNumber={3}
  stepTitle="الخطوة الثالثة: اكتب"
  prompt="كيف تنطبق هذه الآية على حياتك اليوم؟"
  placeholder="ابدأ الكتابة هنا..."
  onSave={(content) => console.log(content)}
  onBack={() => navigate('/breathing')}
  initialContent=""
/>
```

**Props:**
- `stepNumber?: number` — Step number (default: 3)
- `stepTitle?: string` — Page title
- `prompt?: string` — Writing prompt/question
- `placeholder?: string` — Textarea placeholder text
- `onSave?: (content: string) => void` — Save handler
- `onBack?: () => void` — Back button handler
- `initialContent?: string` — Pre-filled content

**Features:**
- Custom textarea with serif font for Arabic text
- Real-time word count
- Save button with loading state
- Paper texture overlay
- Subtle line guide decoration
- Decorative blur circles
- RTL-optimized layout

---

## Design System

### Colors
All components use the Taamun design system colors:

```
bg: #15130f (surface-dim/background)
primary: #e6d4a4
on-surface: #e8e1d9
surface-container-low: #1e1b16
outline-variant: #4b463c
```

### Typography
- **Serif (Arabic/Quranic text):** Amiri
- **Body (UI labels):** Manrope
- **Font sizes:** Responsive (md: breakpoints)

### Effects
- **Glassmorphism:** `backdrop-filter: blur(20px)`
- **Glow shadows:** `shadow-[0_0_25px_rgba(...)]`
- **Text shadow:** `drop-shadow-[0_4px_20px_...]`

---

## Installation & Usage

### 1. Copy to Your Project
```bash
cp -r stitch-output/pages src/components/stitch/pages
cp -r stitch-output/components src/components/stitch/components
```

### 2. Import Components
```tsx
// pages/home.tsx
import { HomePage } from '@/components/stitch/pages';

export default function Home() {
  return <HomePage currentStep={1} />;
}
```

### 3. Add Required Fonts
Ensure your `layout.tsx` includes Google Fonts:

```tsx
// Already included in tailwind config, but verify in head:
<link
  href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Manrope:wght@200..800&display=swap"
  rel="stylesheet"
/>
```

### 4. Tailwind Configuration
Components require the color palette in your `tailwind.config.ts`:

```ts
colors: {
  "primary": "#e6d4a4",
  "on-surface": "#e8e1d9",
  "on-surface-variant": "#cdc6b7",
  "surface-container-low": "#1e1b16",
  "outline-variant": "#4b463c",
  // ... (all colors from the stitch configs)
}
```

---

## Key Implementation Details

### RTL/Arabic Support
- All components use `dir="rtl" lang="ar"`
- Flex layouts use `flex-row-reverse` for RTL
- Margin/padding are naturally RTL-aware with Tailwind
- Text alignment uses Tailwind's directional classes

### Animations
- **Breathing circles:** CSS `@keyframes pulse` (8s cycle)
- **Text fade:** CSS `@keyframes textFlow` (breathing guidance text)
- **Hover effects:** Tailwind transitions (`duration-300`, `duration-500`)
- **Shine effect:** Gradient translate animation

### Image Handling
- Uses Next.js `Image` component for optimization
- Placeholder paths: `/images/desert-bg.jpg`
- Replace with actual image URLs during integration
- All `<img>` tags converted to proper `<Image>` components with dimensions

### State Management
- **BreathingPage:** Uses `useState` for timer and breathing text
- **JournalPage:** Uses `useState` for content and word count
- **HomePage:** Uses `useState` for hover state
- All callbacks are optional props for flexibility

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

All components are responsive with mobile-first design:
- `md:` breakpoint for tablet (768px)
- `lg:` breakpoint for desktop (1024px)

---

## File Structure

```
stitch-output/
├── components/
│   ├── TopBar.tsx          # Header with menu/share/back
│   ├── BottomNav.tsx       # 4-tab bottom navigation
│   └── index.ts            # Component exports
├── pages/
│   ├── HomePage.tsx        # Landing with hero & journey
│   ├── VersePage.tsx       # Verse display & context
│   ├── BreathingPage.tsx   # Meditation with circles
│   ├── JournalPage.tsx     # Writing/reflection
│   └── index.ts            # Component exports
└── README.md               # This file
```

---

## Notes for Integration

1. **Images:** Replace placeholder paths with actual Supabase/CDN URLs
2. **Callbacks:** Connect handlers to your routing/state management
3. **Fonts:** Verify Google Fonts are loaded before components render
4. **Tailwind:** Ensure all color names from stitch configs are in your theme
5. **TypeScript:** All components are fully typed; extend props as needed
6. **Accessibility:** SVG icons have implicit labels; add `aria-label` if needed
7. **Performance:** Use `next/Image` and `next/Link` for optimization

---

## Production Checklist

- [ ] Replace placeholder image paths
- [ ] Connect navigation callbacks to routing
- [ ] Test in dark mode (all components use `dark` class)
- [ ] Verify fonts load on production domain
- [ ] Test RTL layout on mobile/tablet
- [ ] Connect save handlers to database
- [ ] Add error boundaries around page components
- [ ] Verify color palette in Tailwind theme
- [ ] Test breathing animation frame rate on mobile
- [ ] Implement proper focus management for a11y
