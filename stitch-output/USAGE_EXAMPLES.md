# Stitch Components — Usage Examples

Complete examples for integrating Taamun stitch components into a Next.js App Router project.

## Quick Start

### 1. HomePage — Landing/Home Screen

```tsx
// app/page.tsx
'use client';

import { HomePage } from '@/components/stitch/pages';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <HomePage
      currentStep={1}
      totalSteps={5}
      verseArabic="أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ"
      verseSurah="سورة الرعد — الآية ٢٨"
      breathingDescription="خذ شهيقاً عميقاً لـ ٤ ثوانٍ، ثم احبسه لـ ٤ ثوانٍ، وأخرجه بهدوء. ركز على حضورك في هذه اللحظة المقدسة."
      onContinue={() => router.push('/verse')}
      userAvatarSrc="/images/user-avatar.jpg"
    />
  );
}
```

---

### 2. VersePage — Verse Display

```tsx
// app/verse/page.tsx
'use client';

import { VersePage } from '@/components/stitch/pages';
import { useRouter } from 'next/navigation';

export default function VersePage() {
  const router = useRouter();

  return (
    <VersePage
      verseArabic="أَلَمْ يَعْلَمْ بِأَنَّ اللَّهَ يَرَى"
      verseEnglish='"Does he not know that Allah sees?"'
      surahName="Surah Al-Alaq"
      verseNumber="Verse 14"
      contextTitle="سياق الآية"
      contextText="تذكير بعلم الله المحيط بكل شيء، دعوة للمراقبة الذاتية والخشية في السر والعلن. آية توقظ القلب وتبعث فيه هيبة الخالق."
      onReflect={() => router.push('/breathing')}
    />
  );
}
```

---

### 3. BreathingPage — Meditation Session

```tsx
// app/breathing/page.tsx
'use client';

import { BreathingPage } from '@/components/stitch/pages';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function BreathingSession() {
  const router = useRouter();
  const [sessionTime, setSessionTime] = useState(0);
  const SESSION_DURATION = 300; // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime((prev) => {
        if (prev >= SESSION_DURATION) {
          clearInterval(timer);
          return SESSION_DURATION;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <BreathingPage
      verseQuran="هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ"
      duration={SESSION_DURATION}
      currentTime={sessionTime}
      onClose={() => router.push('/journal')}
      showContextCard={true}
      contextVerse="هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ لِيَزْدَادُوا إِيمَانًا مَّعَ إِيمَانِهِمْ"
    />
  );
}
```

---

### 4. JournalPage — Writing/Reflection

```tsx
// app/journal/page.tsx
'use client';

import { JournalPage } from '@/components/stitch/pages';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function JournalEntry() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (content: string) => {
    setIsSaving(true);
    try {
      // Save to database
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          day: new Date().toISOString().split('T')[0],
          verse: 'أَلَمْ يَعْلَمْ بِأَنَّ اللَّهَ يَرَى',
        }),
      });

      if (response.ok) {
        console.log('Journal entry saved');
        router.push('/progress');
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <JournalPage
      stepNumber={3}
      stepTitle="الخطوة الثالثة: اكتب"
      prompt="كيف تنطبق هذه الآية على حياتك اليوم؟"
      placeholder="ابدأ الكتابة هنا بكل صدق وهدوء..."
      onSave={handleSave}
      onBack={() => router.back()}
      initialContent=""
    />
  );
}
```

---

## Advanced Patterns

### With Context/State Management

```tsx
// app/layout.tsx or context provider
'use client';

import { createContext, useState } from 'react';

export const JourneyContext = createContext({
  currentDay: 1,
  currentVerse: {},
  userProgress: {},
});

export function JourneyProvider({ children }) {
  const [currentDay, setCurrentDay] = useState(1);
  const [currentVerse, setCurrentVerse] = useState({
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    surah: 'سورة الرعد — الآية ٢٨',
  });

  return (
    <JourneyContext.Provider value={{ currentDay, currentVerse }}>
      {children}
    </JourneyContext.Provider>
  );
}
```

```tsx
// app/page.tsx (with context)
'use client';

import { HomePage } from '@/components/stitch/pages';
import { useRouter, useContext } from 'next/navigation';
import { JourneyContext } from '@/app/layout';

export default function Home() {
  const router = useRouter();
  const { currentDay, currentVerse } = useContext(JourneyContext);

  return (
    <HomePage
      currentStep={currentDay}
      totalSteps={28}
      verseArabic={currentVerse.arabic}
      verseSurah={currentVerse.surah}
      onContinue={() => router.push('/verse')}
    />
  );
}
```

---

### With Supabase Integration

```tsx
// lib/supabase-client.ts
'use client';

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

```tsx
// app/journal/page.tsx (with Supabase)
'use client';

import { JournalPage } from '@/components/stitch/pages';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { useUser } from '@supabase/auth-helpers-react';

export default function JournalEntry() {
  const router = useRouter();
  const user = useUser();

  const handleSave = async (content: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      const { error } = await supabase.from('journal_entries').insert([
        {
          user_id: user.id,
          content,
          day: new Date().toISOString().split('T')[0],
          verse_id: 'alaq-14',
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Update user progress
      await supabase
        .from('user_progress')
        .update({ current_step: 4 })
        .eq('user_id', user.id);

      router.push('/progress');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <JournalPage
      stepNumber={3}
      prompt="كيف تنطبق هذه الآية على حياتك اليوم؟"
      onSave={handleSave}
      onBack={() => router.back()}
    />
  );
}
```

---

### Dynamic Verse Loading

```tsx
// app/verse/page.tsx (with dynamic content)
'use client';

import { VersePage } from '@/components/stitch/pages';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Verse {
  id: string;
  arabic: string;
  english: string;
  surah: string;
  number: string;
  context: string;
}

// Mock data - replace with API call
const VERSES: Record<string, Verse> = {
  'alaq-14': {
    id: 'alaq-14',
    arabic: 'أَلَمْ يَعْلَمْ بِأَنَّ اللَّهَ يَرَى',
    english: '"Does he not know that Allah sees?"',
    surah: 'Surah Al-Alaq',
    number: 'Verse 14',
    context: 'تذكير بعلم الله المحيط بكل شيء...',
  },
};

export default function VersePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verseId = searchParams.get('id') || 'alaq-14';
  const [verse, setVerse] = useState<Verse | null>(null);

  useEffect(() => {
    // Fetch verse from API or database
    const fetchVerse = async () => {
      try {
        // const response = await fetch(`/api/verses/${verseId}`);
        // const data = await response.json();
        const data = VERSES[verseId];
        setVerse(data);
      } catch (error) {
        console.error('Failed to fetch verse:', error);
      }
    };

    fetchVerse();
  }, [verseId]);

  if (!verse) return <div>Loading...</div>;

  return (
    <VersePage
      verseArabic={verse.arabic}
      verseEnglish={verse.english}
      surahName={verse.surah}
      verseNumber={verse.number}
      contextText={verse.context}
      onReflect={() => router.push('/breathing')}
    />
  );
}
```

---

### With Navigation Animations

```tsx
// app/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <html dir="rtl" lang="ar">
      <body>
        <div
          className="transition-opacity duration-500"
          key={pathname} // Trigger animation on route change
        >
          {children}
        </div>
      </body>
    </html>
  );
}
```

---

### Progressive Session Tracking

```tsx
// app/breathing/page.tsx (with progress saving)
'use client';

import { BreathingPage } from '@/components/stitch/pages';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BreathingSession() {
  const router = useRouter();
  const [sessionTime, setSessionTime] = useState(0);
  const SESSION_DURATION = 300;

  useEffect(() => {
    // Save progress every 30 seconds
    const saveInterval = setInterval(async () => {
      if (sessionTime > 0 && sessionTime % 30 === 0) {
        try {
          await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              step: 2,
              duration: sessionTime,
              completed: false,
            }),
          });
        } catch (error) {
          console.error('Failed to save progress:', error);
        }
      }
    }, 1000);

    return () => clearInterval(saveInterval);
  }, [sessionTime]);

  const handleClose = async () => {
    // Mark breathing session as complete
    await fetch('/api/progress', {
      method: 'POST',
      body: JSON.stringify({
        step: 2,
        duration: sessionTime,
        completed: true,
      }),
    });

    router.push('/journal');
  };

  return (
    <BreathingPage
      duration={SESSION_DURATION}
      currentTime={sessionTime}
      onClose={handleClose}
    />
  );
}
```

---

## Styling Customization

### Override Colors

```tsx
// app/globals.css
@layer components {
  .taamun-primary {
    @apply bg-[#e6d4a4] text-[#3a2f0d];
  }

  .taamun-card {
    @apply bg-surface-container-low/40 backdrop-blur-sm border border-outline-variant/10 rounded-xl;
  }
}
```

```tsx
// Use in components
<div className="taamun-card p-6">
  <h3 className="taamun-primary">Custom Card</h3>
</div>
```

---

### Dark Mode Override

```tsx
// tailwind.config.ts
module.exports = {
  darkMode: 'class', // Already enabled
  // ...
};
```

All components automatically use dark mode (`dark:` prefix in Tailwind). To force light mode:

```tsx
<div className="light">
  <HomePage {...props} /> {/* Will use light colors */}
</div>
```

---

## Testing

### Unit Test Example (Jest + React Testing Library)

```tsx
// __tests__/HomePage.test.tsx
import { render, screen } from '@testing-library/react';
import { HomePage } from '@/components/stitch/pages';

describe('HomePage', () => {
  it('renders verse correctly', () => {
    render(
      <HomePage
        verseArabic="أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ"
        verseSurah="سورة الرعد — الآية ٢٨"
      />
    );

    expect(
      screen.getByText('أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ')
    ).toBeInTheDocument();
  });

  it('calls onContinue when button clicked', () => {
    const mockContinue = jest.fn();
    const { getByText } = render(<HomePage onContinue={mockContinue} />);

    getByText('واصل رحلتك').click();
    expect(mockContinue).toHaveBeenCalled();
  });
});
```

---

## Performance Tips

1. **Lazy load pages:** Use `next/dynamic` for route components
   ```tsx
   import dynamic from 'next/dynamic';
   const HomePage = dynamic(() => import('@/components/stitch/pages'));
   ```

2. **Optimize images:** Use responsive images with Next.js Image
   ```tsx
   <Image
     src="/images/desert-bg.jpg"
     alt="صحراء"
     fill
     priority
     sizes="(max-width: 768px) 100vw, 100vw"
   />
   ```

3. **Memoize components:** Prevent unnecessary re-renders
   ```tsx
   export const TopBar = memo(TopBarComponent);
   ```

4. **Debounce word counting:** In JournalPage
   ```tsx
   const [wordCount, setWordCount] = useState(0);
   const debouncedCount = useCallback(
     debounce((text) => {
       const words = text.trim().split(/\s+/).length;
       setWordCount(words);
     }, 300),
     []
   );
   ```

---

## Troubleshooting

### Animation not working
- Ensure Tailwind CSS is properly configured
- Check if CSS animations are enabled in browser DevTools
- Verify `@keyframes` are included in CSS

### Arabic text rendering issues
- Verify fonts are loaded: `curl https://fonts.googleapis.com/css2?family=Amiri`
- Check `lang="ar"` and `dir="rtl"` attributes
- Ensure font weights are correct (400, 700)

### Components not responding to clicks
- Ensure event handlers are connected (e.g., `onContinue`, `onSave`)
- Check if components are wrapped in `'use client'`
- Verify button event listeners are attached

---

For more details, see [README.md](./README.md).
