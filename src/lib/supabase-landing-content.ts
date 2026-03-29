import { supabase } from './supabaseClient';

/* ─────────────────────────────────────
   Types for dynamic landing content
   ───────────────────────────────────── */

export interface DailyVerse {
  arabic: string;
  translation: string;
  source: string;
}

export interface SocialVerse {
  arabic: string;
  translation: string;
  source: string | null;
}

export interface Domain {
  order_index: number;
  name_ar: string;
  name_en: string;
  icon_key: string;
}

export interface PageContent {
  section_key: string;
  content_ar: string;
  content_en: string | null;
}

export interface LandingContent {
  dailyVerse: DailyVerse | null;
  socialVerse: SocialVerse | null;
  domains: Domain[];
  sections: Record<string, string>;
}

/* ─────────────────────────────────────
   Load all landing content from Supabase
   Falls back gracefully — page works with defaults
   ───────────────────────────────────── */

export async function loadLandingContent(): Promise<LandingContent> {
  const result: LandingContent = {
    dailyVerse: null,
    socialVerse: null,
    domains: [],
    sections: {},
  };

  try {
    // 1. Daily verse
    const today = new Date().toISOString().split('T')[0];
    const { data: verse } = await supabase
      .from('daily_verse')
      .select('arabic, translation, source')
      .eq('active_date', today)
      .maybeSingle();

    if (verse) result.dailyVerse = verse;

    // 2. Random social verse
    const { data: socialVerses } = await supabase
      .from('social_verses')
      .select('arabic, translation, source')
      .eq('is_active', true);

    if (socialVerses?.length) {
      result.socialVerse =
        socialVerses[Math.floor(Math.random() * socialVerses.length)];
    }

    // 3. Nine domains
    const { data: domains } = await supabase
      .from('domains')
      .select('order_index, name_ar, name_en, icon_key')
      .order('order_index');

    if (domains?.length) result.domains = domains;

    // 4. Section texts
    const { data: content } = await supabase
      .from('page_content')
      .select('section_key, content_ar');

    if (content?.length) {
      content.forEach((c) => {
        result.sections[c.section_key] = c.content_ar;
      });
    }
  } catch (err) {
    console.error('Supabase landing content error:', err);
    // Fallback: page renders with hardcoded defaults
  }

  return result;
}
