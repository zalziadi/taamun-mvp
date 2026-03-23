# Stitch Components — Integration Checklist

Complete checklist for integrating Stitch components into the Taamun MVP.

## Setup & Installation

- [ ] Copy `/stitch-output/pages/` to `/src/components/stitch/pages/`
- [ ] Copy `/stitch-output/components/` to `/src/components/stitch/components/`
- [ ] Copy `design-tokens.ts` to `/src/lib/design-tokens.ts`
- [ ] Verify all TypeScript files compile: `npx tsc --noEmit`
- [ ] Run build: `npm run build`

## Tailwind Configuration

- [ ] Verify all colors from `design-tokens.ts` are in `tailwind.config.ts`
- [ ] Confirm `darkMode: 'class'` is enabled
- [ ] Check font families are extended: `Amiri`, `Manrope`, `Noto Serif`
- [ ] Verify custom border-radius values are configured
- [ ] Test dark mode: add `dark` class to `<html>`

## Font Loading

- [ ] Google Fonts linked in `layout.tsx` or `_document.tsx`:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Manrope:wght@200..800&display=swap" rel="stylesheet"/>
  ```
- [ ] Test font rendering in browser DevTools
- [ ] Verify Arabic text displays with correct script: "نص عربي"
- [ ] Check serif fonts render with Amiri (not system fallback)

## Component Integration

### TopBar
- [ ] Import: `import { TopBar } from '@/components/stitch/components'`
- [ ] Test menu button click handler
- [ ] Test back navigation
- [ ] Test share functionality
- [ ] Verify avatar displays correctly
- [ ] Check title displays in correct position (RTL)

### BottomNav
- [ ] Import: `import { BottomNav } from '@/components/stitch/components'`
- [ ] Fix link destinations (replace `#` with real routes)
- [ ] Test active tab styling
- [ ] Verify icon rendering
- [ ] Check mobile padding/spacing

### HomePage
- [ ] Create `/src/app/page.tsx` with HomePage
- [ ] Connect "واصل رحلتك" button to `/verse` route
- [ ] Replace desert background image path
- [ ] Load current verse from database/context
- [ ] Test 5-step journey visualization
- [ ] Verify breathing card content

### VersePage
- [ ] Create `/src/app/verse/page.tsx` with VersePage
- [ ] Connect share button (implement share dialog)
- [ ] Connect back button to previous page
- [ ] Connect "تأمل في الآية" button to `/breathing`
- [ ] Load verse from database
- [ ] Test radial glow effect

### BreathingPage
- [ ] Create `/src/app/breathing/page.tsx` with BreathingPage
- [ ] Implement timer logic (starts at 0, counts up)
- [ ] Test breathing animation cycles
- [ ] Verify close button returns to correct page
- [ ] Check context card displays correctly on desktop
- [ ] Test mobile layout (hide context card)
- [ ] Save session progress to database

### JournalPage
- [ ] Create `/src/app/journal/page.tsx` with JournalPage
- [ ] Connect save button to database API
- [ ] Implement word count functionality
- [ ] Test textarea input
- [ ] Connect back button
- [ ] Verify loading state during save
- [ ] Test form validation before save

## Routing & Navigation

- [ ] Set up route structure:
  ```
  /                 → HomePage
  /verse            → VersePage
  /breathing        → BreathingPage
  /journal          → JournalPage
  ```
- [ ] Update navigation links in components
- [ ] Test browser back/forward buttons
- [ ] Verify RTL layout on all routes
- [ ] Test mobile navigation

## Styling & Responsive Design

- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1024px+ width)
- [ ] Verify dark mode is persistent
- [ ] Check color contrast (WCAG AA)
- [ ] Test text scaling at different sizes
- [ ] Verify images scale responsively
- [ ] Test animations on throttled connection

## Images & Assets

- [ ] Replace `/images/desert-bg.jpg` placeholder
- [ ] Replace user avatar placeholder
- [ ] Verify all image paths are correct
- [ ] Test image loading on slow networks
- [ ] Check Next.js Image optimization is working
- [ ] Verify lazy loading for off-screen images

## Animations

- [ ] Test breathing circle pulse animation
- [ ] Verify text fade animation synchronizes
- [ ] Check hover button animations
- [ ] Test progress bar animation
- [ ] Verify no janky animations on mobile
- [ ] Check animation performance in DevTools

## State Management

- [ ] Connect HomePage to current verse state
- [ ] Implement session progress tracking
- [ ] Save journal entries to database
- [ ] Sync user progress across pages
- [ ] Test state persistence (LocalStorage/Supabase)
- [ ] Verify form data is not lost on navigation

## Database Integration

- [ ] Create Supabase tables for:
  - [ ] `verses` (Quranic content)
  - [ ] `journal_entries` (user writing)
  - [ ] `user_progress` (daily tracking)
  - [ ] `user_sessions` (breathing data)
- [ ] Implement Supabase client in components
- [ ] Test data loading/saving
- [ ] Verify error handling for DB failures
- [ ] Test real-time updates (if applicable)

## Accessibility

- [ ] Add `lang="ar"` to HTML element
- [ ] Verify `dir="rtl"` is set correctly
- [ ] Test keyboard navigation
- [ ] Check focus indicators on buttons
- [ ] Verify aria-labels on icon buttons
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Check color contrast ratios
- [ ] Test without CSS (markup still readable)

## Performance

- [ ] Check Lighthouse score (target: 90+)
- [ ] Verify Core Web Vitals:
  - [ ] LCP (Largest Contentful Paint)
  - [ ] FID (First Input Delay)
  - [ ] CLS (Cumulative Layout Shift)
- [ ] Use Next.js Image component (not `<img>`)
- [ ] Lazy load non-critical components
- [ ] Minimize JavaScript bundle
- [ ] Test performance on 4G connection

## Testing

### Unit Tests
- [ ] Test HomePage rendering with props
- [ ] Test VersePage verse display
- [ ] Test BreathingPage timer
- [ ] Test JournalPage word count
- [ ] Test TopBar navigation
- [ ] Test BottomNav routing

### Integration Tests
- [ ] Test complete user flow: Home → Verse → Breathing → Journal
- [ ] Test database save/load
- [ ] Test error scenarios
- [ ] Test offline functionality

### E2E Tests
- [ ] Test full journey on Chrome
- [ ] Test full journey on Safari
- [ ] Test full journey on mobile
- [ ] Test all buttons/links work
- [ ] Test form submissions

## Browser Compatibility

- [ ] Chrome/Edge 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] iOS Safari 14+
- [ ] Chrome Android (latest 2 versions)

## Security & Privacy

- [ ] No console.log() in production
- [ ] No hardcoded API keys
- [ ] Verify HTTPS on all requests
- [ ] Check no sensitive data in localStorage
- [ ] Test CORS headers
- [ ] Verify authentication is required where needed

## Production Deployment

- [ ] Set environment variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] Any other API keys
- [ ] Build locally: `npm run build`
- [ ] Test production build locally: `npm run start`
- [ ] Deploy to Vercel/hosting platform
- [ ] Verify deployment works
- [ ] Test all features in production
- [ ] Monitor error logs (Sentry/similar)
- [ ] Check analytics

## Post-Launch Monitoring

- [ ] Monitor error rates
- [ ] Check user session analytics
- [ ] Review performance metrics
- [ ] Collect user feedback
- [ ] Monitor database performance
- [ ] Check API response times
- [ ] Track conversion funnel (users completing all 4 steps)

## Documentation

- [ ] Update project README with stitch components
- [ ] Document any custom modifications
- [ ] Add JSDoc comments to custom hooks
- [ ] Create developer setup guide
- [ ] Document database schema
- [ ] Add API endpoint documentation

## Notes

### Known Limitations
- Material Design icons (used in HTML) converted to SVG
- Some animations disabled on prefers-reduced-motion
- Desktop-only features (context cards) hidden on mobile

### Future Enhancements
- [ ] Add animations for page transitions
- [ ] Implement multi-day verse tracking
- [ ] Add data export functionality
- [ ] Create admin panel for verse management
- [ ] Add social sharing with custom quote cards

### Troubleshooting Quick Links
- Arabic text not rendering? → Check font family in DevTools
- Animations not smooth? → Check browser performance settings
- Buttons not clickable? → Verify event handlers connected
- Images not loading? → Check image paths and Supabase URLs
- Dark mode not working? → Verify `dark` class on root element

---

**Last Updated:** 2026-03-23
**Status:** Ready for integration
**Estimated Time to Integration:** 2-3 hours
