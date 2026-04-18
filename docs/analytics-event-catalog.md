# سجل أحداث تحليلات PostHog — v1.2

**المرجع:** `REQUIREMENTS.md` §ANALYTICS · `.planning/phases/06-posthog-event-instrumentation/06-CONTEXT.md` · `src/lib/analytics/events.ts`

> الأحداث الثمانية أدناه مُعرَّفة كـ `TypedEvent` في [`src/lib/analytics/events.ts`](../src/lib/analytics/events.ts).
> لا تُضاف أحداث جديدة بدون تحديث هذا السجل + الاتحاد المُميَّز (Discriminated Union) + اختبارات الأنماط المحظورة.
> هذا الملف هو العقد بين مراحل المشروع: كل مرحلة (7–11) تعرف تمامًا أين تُطلق حدثها دون إعادة استنباط القرار.

## الأحداث

| اسم الحدث                  | REQ          | المرحلة | موقع الإطلاق                                                         | الخصائص                                                     |
| -------------------------- | ------------ | ------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `day_complete`             | ANALYTICS-03 | 6       | `src/app/api/program/progress/route.ts` — POST                        | `day_number, cycle_number, tier`                             |
| `cycle_start`              | ANALYTICS-04 | 7       | `src/app/api/program/start-cycle/route.ts` — POST                     | `new_cycle_number, prior_cycle_days_completed, tier`         |
| `badge_unlock`             | ANALYTICS-05 | 8       | `src/app/api/badges/unlock/route.ts` — POST (route not yet created)   | `badge_code, day_number, cycle_number`                       |
| `renewal_prompted`         | ANALYTICS-06 | 9       | `src/components/RenewalBanner.tsx` — first render                     | `renewal_days_remaining, gateway, tier`                      |
| `referral_code_generated`  | ANALYTICS-07 | 10      | `src/app/api/referral/create/route.ts` — POST                         | `referral_code_prefix`                                       |
| `referral_code_redeemed`   | ANALYTICS-07 | 10      | `src/app/api/activate/route.ts` — on FRIEND-* success                 | `referral_code_prefix`                                       |
| `year_review_opened`       | ANALYTICS-08 | 11      | `src/app/year-in-review/page.tsx` — server component load             | `year_key, reflections_count`                                |
| `year_review_shared`       | ANALYTICS-08 | 11      | `src/app/api/year-in-review/share/route.ts` — POST                    | `year_key, reflections_count`                                |

## قواعد غير قابلة للتفاوض

1. كل إطلاق يمر عبر `emitEvent()` من [`src/lib/analytics/server.ts`](../src/lib/analytics/server.ts) — لا `posthog-node`، لا SDK جانبية.
2. `person_profiles: "never"` محفوظ في `initAnalytics()` داخل [`src/lib/analytics.ts`](../src/lib/analytics.ts) — ANALYTICS-11.
3. `capture_pageview: false` محفوظ — مكوّن `PageviewTracker.tsx` يتولّى ذلك يدويًا مع قائمة استثناءات.
4. القائمة البيضاء للخصائص مفروضة في طبقتين:
   - **وقت التشغيل:** `assertAllowedProperties()` يرفض أي مفتاح يطابق نمطًا محظورًا قبل أي استدعاء شبكة.
   - **وقت البناء:** قاعدة CI grep (Plan 06.06) تكسر الـ build عند أي ظهور لنمط محظور.
5. **الأنماط الممنوعة (٧):** `*_email`, `*_phone`, `reflection_*`, `verse_*`, `journal_*`, `message_*`, `prayer_*`.
6. **المفاتيح المسموح بها (القائمة البيضاء):** `day_number, cycle_number, new_cycle_number, prior_cycle_days_completed, milestone_code, badge_code, referral_code_prefix, renewal_days_remaining, gateway, tier, year_key, reflections_count`.
7. **صفر `track()` / `posthog.capture(`** داخل المسارات المقدّسة:
   - `src/app/day/**`
   - `src/app/reflection/**`
   - `src/app/book/**`
   - `src/app/program/day/**`
   - `src/app/api/guide/**` و `src/app/guide/**`
8. **صفر `track()`** داخل المكوّنات المقدّسة:
   - `DayExperience.tsx`
   - `ReflectionJournal.tsx`
   - `AwarenessMeter.tsx`
   - `BookQuote.tsx`
   - `VerseBlock.tsx`
   - `HiddenLayer.tsx`
   - `SilenceGate.tsx`
9. **لا تعقُّب جانبي:** صفر Session Recording، صفر Heatmaps، صفر Autocapture. مدّعمة بإعدادات لوحة PostHog (انظر قسم المؤسس أدناه).

## كيف يُضاف حدث جديد في المستقبل (checklist)

- [ ] أضِف متغيرًا جديدًا إلى `TypedEvent` في `src/lib/analytics/events.ts` مع JSDoc كامل: `@event-name`, `@req-id`, `@owning-phase`, `@future-call-site`.
- [ ] تأكّد أن كل مفتاح في `properties` يظهر في `ALLOWED_PROPERTY_KEYS` — وإلا أضِف المفتاح للقائمة البيضاء مع مبرر.
- [ ] أضف سطرًا جديدًا إلى الجدول أعلاه (اسم الحدث · REQ · المرحلة · موقع الإطلاق · الخصائص).
- [ ] أضف اختبارًا في `src/lib/analytics/events.test.ts` يتأكّد أن الخصائص لا تطابق أي نمط من `BANNED_PROPERTY_PATTERNS`.
- [ ] لا تُطلق الحدث من داخل مكوّن أو مسار في القائمة المقدسة (قاعدة #7 و#8 أعلاه).
- [ ] بعد الدمج، تحقّق من لوحة PostHog أن الحدث يصل وأن الخصائص مطابقة للعقد.

## مهام المؤسس اليدوية (PostHog Dashboard) — Pitfall #28

> هذه الإعدادات خارج الكود — تُضبط مرة واحدة في لوحة PostHog، وتُراجَع مع كل إصدار كبير.
> هذه طبقة دفاع ثانية: حتى لو انهار أحد الإعدادات في الكود، هذه الضوابط تمسك المشكلة.

- [ ] **تنبيه الحصة (Billing → Usage Alerts):** تنبيه عند **70%** + تنبيه عند **90%** من الحصة الشهرية المجانية (1M حدث/شهر).
  - الحساب المتوقع: 1,500 مشترك × ~10 أحداث/يوم × 30 يوم ≈ **450K/شهر** — تحت السقف لكن مع هامش ضيّق عند النمو.
  - إجراء عند 70%: راجِع الأحداث الأكثر إطلاقًا وحقّق إن كان هناك إطلاق غير متعمّد.
  - إجراء عند 90%: أوقِف الإطلاق من المسارات غير الحرجة فورًا عبر feature flag.
- [ ] **إيقاف Session Recording و Heatmaps** على مستوى المشروع (Project Settings → Recordings / Toolbar → OFF) — حتى لو انكسر إعداد في الكود، هذه الطبقة الثانية تمنع تسجيل جلسات الصفحات المقدّسة.
- [ ] **قفل Autocapture** على المشروع (Project Settings → Autocapture → OFF) — نحن نُطلق صراحةً عبر `emitEvent()` فقط، لا تلقائيًا. أي تسرّب من Autocapture سيلتقط نصوصًا من صفحات التأمل.
- [ ] **تعيين Retention للأحداث الحسّاسة** إلى **30 يومًا** (Data Management → Event Definitions → per-event retention):
  - `day_complete` و `cycle_start` → احتفاظ افتراضي (نحتاجها لتحليل الـ funnels ومعدّلات الإكمال).
  - بقية الأحداث الستّة → 30 يومًا (كافية لتحليل قصير المدى، تحترم NFR-07).
- [ ] **Data Pipelines / Exports:** لا توجد عمليات تصدير إلى أدوات خارجية (Segment, Amplitude, BigQuery, …). إن احتيج لذلك مستقبلاً، يمرّ عبر مراجعة خصوصية أولاً.
- [ ] **Team Access:** مقتصر على حسابَي المؤسس والمطوّر الرئيسي. لا صلاحية Viewer/Editor خارج ذلك.

تاريخ آخر مراجعة لمهام المؤسس: `[اكتبه عند أول ضبط]`
الشخص المسؤول: `[اسم المؤسس / المطوّر الرئيسي]`

---

## English summary (for contributors)

Eight typed events, all emitted **server-side** via `emitEvent()` from `src/lib/analytics/server.ts` — except `$pageview`, which is emitted client-side from `PageviewTracker.tsx` with a path-based exclusion list (no pageviews for reflection/book/day/guide routes).

Property names are drawn from a strict whitelist (`ALLOWED_PROPERTY_KEYS`) and enforced at **three** layers:

1. **Compile time** — TypeScript narrowing via `TypedEvent` discriminated union.
2. **Run time** — `assertAllowedProperties()` rejects any key matching one of the 7 banned regex patterns BEFORE the network fetch.
3. **Build time** — CI grep rule (Plan 06.06) fails the build on any banned property name appearing anywhere in the source tree.

Sacred paths (`/day`, `/reflection`, `/book`, `/program/day`, `/api/guide`) and sacred components (`DayExperience`, `ReflectionJournal`, `AwarenessMeter`, `BookQuote`, `VerseBlock`, `HiddenLayer`, `SilenceGate`) never call `track()`. DevTools Network tab on these pages must show **zero** requests to `posthog.com`.

Founder-side PostHog dashboard has additional manual safeguards (see Arabic section "مهام المؤسس اليدوية"): usage alerts at 70% and 90% of the free-tier monthly quota, Session Recording disabled, Heatmaps disabled, Autocapture disabled, and 30-day retention for non-funnel events.

See `src/lib/analytics/events.ts` for the discriminated union (each variant carries full JSDoc with `@future-call-site`) and `.planning/phases/06-posthog-event-instrumentation/06-CONTEXT.md` for the full policy.
