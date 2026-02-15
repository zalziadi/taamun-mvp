# docs/release-checklist.md — قائمة التحقق للإطلاق

## قبل الإطلاق

- [ ] 1. تشغيل `npm run dev` — الخادم يعمل على localhost:3000
- [ ] 2. تشغيل `npm run verify` — typecheck + build ينجحان
- [ ] 3. فتح `/` — الصفحة الرئيسية تظهر (ابدأ اليوم / شاهد التقدم / اشتراك)
- [ ] 4. فتح `/day` — صفحة اليوم تعرض آية + أسئلة + chips
- [ ] 5. اختيار مرحلة + حفظ — يظهر "تم حفظ جلسة اليوم ✅"
- [ ] 6. إعادة تحميل `/day` — القفل يعمل، لا يظهر زر الحفظ
- [ ] 7. فتح `/progress` — الشبكة + ملخص + insight
- [ ] 8. فتح `/subscribe` — السعر 280 + زر واتساب + تحميل الكتيّب
- [ ] 8b. فتح `/book` — صفحة الكتيّب تعرض رابط التحميل
- [ ] 9. نسخ الكتيّب: `cp ~/Downloads/City_of_Meaning_Quran_AR_EN_v0.pdf public/book/`
- [ ] 10. تحديث `WHATSAPP_NUMBER` في `src/app/subscribe/page.tsx`
- [ ] 11. تحديث `RAMADAN_START_DATE_UTC` في `src/lib/ramadan-28.ts`
- [ ] 12. التأكد من RTL — الاتجاه من اليمين (html dir="rtl" lang="ar")
- [ ] 13. التأكد من الخلفية الداكنة — `#0B0F14`
- [ ] 14. Admin Reset — `localStorage.setItem("taamun.admin","1")` يظهر زر Reset في التقدم
- [ ] 15. Reset يمسح التقدم — بعد Reset تختفي البيانات وتحدث الواجهة
- [ ] 16. كود صالح يفعّل مرة واحدة — TAAMUN-001 يعمل، ثم إعادة الاستخدام تعرض "مستخدم مسبقًا"
- [ ] 17. الأدمن — `/admin?admin=<KEY>` تفتح لوحة الأدمن (يجب تطابق KEY مع NEXT_PUBLIC_ADMIN_KEY)
- [ ] 18. الأدمن ينسخ رابط التفعيل — في /admin/codes زر "نسخ رابط التفعيل" بجانب كل كود
- [ ] 19. Deploy — رفع البناء إلى الاستضافة (Vercel / Netlify / غيرها)

## Vercel Environment Variables

- `NEXT_PUBLIC_APP_ORIGIN=<production-domain>` — **مطلوب للإنتاج.** ضع رابط التطبيق الكامل (مثل `https://taamun-mvp.vercel.app`) لضمان أن روابط التفعيل ورسائل واتساب تستخدم النطاق الصحيح وليس localhost أو placeholder.
- `NEXT_PUBLIC_ADMIN_KEY=<your-secret>` — مفتاح سري للوصول إلى لوحة الأدمن.
- رابط الأدمن: `/admin?admin=<key>`

### Ayah Scan (خطة 820)

- `GOOGLE_CLOUD_PROJECT_ID` — معرف مشروع Google Cloud
- `GOOGLE_CLOUD_CLIENT_EMAIL` — بريد حساب الخدمة (Service Account)
- `GOOGLE_CLOUD_PRIVATE_KEY` — المفتاح الخاص (استبدل `\\n` بأسطر حقيقية عند اللزوم)

**ملاحظة:** هذه المتغيرات سريّة ولا تُستخدم مع NEXT_PUBLIC_
