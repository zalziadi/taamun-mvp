# Release Checklist

- Run guards and full verification: `npm run guard:release`
- Run database migrations: `npx supabase db push`
- Seed Quran data if needed (if not already present)
- Verify core endpoints:
  - `/api/ramadan/day`
  - `/api/ramadan/save`
  - `/api/ramadan/progress`
  - `/api/ramadan/history`
  - `/api/ramadan/insight`
- Verify `/og.png` renders correctly in production

## 10-minute manual flow

1. Open landing and click WhatsApp CTA, then verify message includes plan, transfer receipt instructions, login note, and Ramadan fixed end line.
2. Open activation link with code (`/activate?code=...`) and verify login is required.
3. Complete login, activate code, and verify success state shows the correct end date label.
4. Click "ابدأ اليوم الأول" and confirm it opens the canonical Day 1 route.
5. Write answers, save, refresh, and verify answers persist.
6. Open `/progress` and verify completion updates correctly.
7. Open `/api/history` (or history UI if available) and verify data exists.
8. Open `/account` and verify plan, status, end date, and WhatsApp support link.
9. Test invalid code and verify message: "الكود غير صالح".
10. Test after Ramadan end and verify message: "انتهت فترة تفعيل باقة رمضان."
