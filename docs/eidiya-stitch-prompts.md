# Stitch Design Prompts — عيدية تمعّن

جاهزة للنسخ واللصق في [stitch.withgoogle.com](https://stitch.withgoogle.com)

---

## البرومبت ١: صفحة هبوط العيدية (Landing Page)

### Desktop Version

```
IDEA: A single-page landing page for "عيدية تمعّن" (Taamun Eidiya) — an Eid gift package for a Quranic contemplation app. The page should convince visitors to buy it for themselves or gift it to someone they love. RTL Arabic layout.

THEME: "Desert Sanctuary" — very dark background (#15130f), gold/tan accents (#c9b88a, #e6d4a4), cream text (#e8e1d9). Spiritual, calm, premium feel. Serif Arabic headings (like Amiri font). Minimal, breathing whitespace. No clutter. Think: luxury spiritual product, not a tech app.

CONTENT (all in Arabic, RTL):

SECTION 1 — Hero (full viewport height, centered):
- Small badge at top: "عرض العيد — لفترة محدودة"
- Main headline (large serif): "عيدية تمعّن"
- Subheadline: "٢٨ يوماً تُضيء مدينتك الداخلية"
- Short description: "رحلة يومية مع القرآن — من الظلّ إلى الهبة إلى أعلى احتمال فيك"
- Price display: "٨٢ ريال" with strikethrough "٢٨٠ ريال" and a note "لمدة ٣ أشهر"
- Two CTA buttons side by side:
  - Primary gold button: "اشتري لنفسك"
  - Secondary outlined button: "أهدِها لمن تحب"
- Subtle animated glow behind the price

SECTION 2 — What You Get (3 cards in a row):
- Card 1: Icon of a crescent moon. Title: "رحلة ٢٨ يوماً". Description: "آية يومية + سؤال عميق + تمرين تأملي + طبقة مخفية لا تظهر إلا لمن أكمل اليوم"
- Card 2: Icon of a city skyline gradually lighting up. Title: "مدينتك تُضاء". Description: "خريطة بصرية تتحول من الظلام إلى النور مع تقدمك — ترى رحلتك تتشكل أمامك"
- Card 3: Icon of a journal/book. Title: "يوميات التأمل". Description: "دفتر شخصي يحفظ تأملاتك تلقائياً — وثّق رحلتك واقرأها لاحقاً"
Cards should have dark background (#1e1b16), subtle gold border, rounded corners.

SECTION 3 — The Journey (vertical timeline, 4 steps):
- Step 1: "الظلّ" — "تبدأ بسؤال يكشف ما لا تراه عن نفسك"
- Step 2: "الإدراك" — "تتدبّر الآية بعمق وترى الطبقة المخفية"
- Step 3: "الهبة" — "تكتشف ما أودعه الله فيك من كنوز"
- Step 4: "أعلى احتمال" — "ترى مدينتك مكتملة — وتعرف من أنت حقاً"
Timeline uses gold dots and thin gold connecting line. Each step has a subtle glow when visible.

SECTION 4 — Gift Section (centered, emotional):
- Headline: "أجمل عيدية تُعطيها: باب للمعنى"
- Description: "اختر شخصاً تحبه. سيحصل على رابط خاص + بطاقة عيدية رقمية باسمك. رحلة تبدأ بهدية وتنتهي بتحوّل."
- Single CTA: "أهدِ عيدية تمعّن"
- Background: slightly lighter (#1e1b16) to distinguish from other sections

SECTION 5 — FAQ (3 collapsible questions):
- "هل أحتاج خبرة تقنية؟" → "لا. كل يوم صفحة واحدة: آية، سؤال، تمرين. أبسط من أي تطبيق."
- "ما الفرق عن الباقة الكاملة؟" → "العيدية تفتح ٧٠٪ من التجربة. بعد الرحلة يمكنك الترقية لباقة ٨٢٠ للتجربة الكاملة مع مسح الآية والكتاب."
- "كم مدة الصلاحية؟" → "٣ أشهر كاملة. ابدأ متى شئت، أعد يوماً فاتك، خذ وقتك."

SECTION 6 — Final CTA (centered, minimal):
- Verse in decorative serif: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ"
- Price reminder: "٨٢ ريال — ٣ أشهر"
- Two buttons again: "ابدأ رحلتك" / "أهدِها"
- Small footer: "تمعّن — رحلة اكتشاف المعنى بلغة القرآن"
```

### Mobile Version

```
Same content as the desktop version above, but optimized for mobile (375px width):
- Hero: stack elements vertically, smaller headline (28px), buttons full-width stacked
- Cards: single column stack instead of 3-column
- Timeline: keep vertical, slightly smaller text
- Gift section: full width
- FAQ: full width accordion
- Final CTA: full width buttons stacked
- All padding reduced, but maintain breathing space
- Touch-friendly tap targets (min 44px)
```

---

## البرومبت ٢: صفحة التسجيل والإهداء (Registration/Gift Flow)

```
IDEA: A registration and gift flow page for "عيدية تمعّن" — two tabs: "لنفسي" (For Me) and "هدية" (Gift). Clean form with email-based magic link authentication. RTL Arabic layout.

THEME: Same "Desert Sanctuary" theme — dark (#15130f), gold (#c9b88a), cream text (#e8e1d9). Calm, focused, minimal. One action per screen.

CONTENT (all in Arabic, RTL):

TOP: Small back arrow + "عيدية تمعّن" title + price "٨٢ ريال"

TAB SWITCHER: Two tabs, pill-shaped, gold active state:
- Tab 1 (active by default): "لنفسي"
- Tab 2: "هدية لشخص آخر"

--- TAB 1: "لنفسي" ---

Step 1 (Email entry):
- Headline: "ابدأ رحلتك"
- Subtext: "أدخل بريدك الإلكتروني وسنرسل لك رابط الدخول"
- Email input field (LTR direction inside RTL page, placeholder: "example@email.com")
- Button: "أرسل رابط الدخول" (gold, full width)
- Small note below: "لا حاجة لكلمة مرور — رابط سحري يصلك بالبريد"

Step 2 (Confirmation — shown after email submit):
- Icon: envelope with gold check
- Text: "تم إرسال رابط الدخول إلى بريدك"
- Subtext: "افتح بريدك واضغط على الرابط لتفعيل عيديتك"
- Small link: "لم يصل؟ أعد الإرسال"

--- TAB 2: "هدية لشخص آخر" ---

Step 1 (Gift form):
- Headline: "أهدِ رحلة المعنى"
- Two input fields:
  - "بريدك الإلكتروني" (your email, LTR input)
  - "بريد من تهديه" (recipient email, LTR input)
- Optional text area: "رسالة شخصية (اختياري)" with placeholder "عيدية مباركة! هذه رحلة مميزة مع القرآن..."
- Gold full-width button: "أرسل العيدية"
- Note: "سيحصل على بطاقة عيدية رقمية + رابط تفعيل"

Step 2 (Gift sent confirmation):
- Icon: gift box with gold ribbon and sparkle
- Headline: "تم إرسال العيدية!"
- Subtext: "سيحصل [recipient] على بطاقة عيدية رقمية مع رابط التفعيل"
- Preview of the digital gift card (small, decorative):
  - Dark card with gold border
  - "عيدية تمعّن" in serif
  - "من: [sender name]"
  - "رسالة: [personal message]"
  - Small QR code or button "ابدأ رحلتك"
- Button: "أرسل عيدية أخرى" (secondary)
- Link: "ارجع للصفحة الرئيسية"

BOTTOM: Order summary always visible as a sticky bar:
- "عيدية تمعّن — ٨٢ ريال — ٣ أشهر"
- Subtle gold border top
```

---

## البرومبت ٣: بطاقة العيدية الرقمية (Gift Card Preview)

```
IDEA: A digital Eid gift card for "عيدية تمعّن" — sent to the recipient via email. This is the card they see when they receive the gift. RTL Arabic.

THEME: Dark and premium. Background: deep dark (#15130f) with subtle golden geometric Islamic pattern overlay (very low opacity, 5-8%). Gold accents (#c9b88a). Serif Arabic text. Feels like receiving a luxury gift, not a discount coupon.

CONTENT:
- Top: small "تمعّن" logo/wordmark in gold
- Center: Large decorative text "عيدية مباركة" in serif (Amiri-style)
- Below: "من: أحمد" (sender name, in gold)
- Personal message in cream text: "هذه رحلة مميزة مع القرآن — أتمنى تستمتع فيها"
- Divider: thin gold line with a small diamond shape in center
- Description: "٢٨ يوماً من التمعّن القرآني — من الظلّ إلى أعلى احتمال"
- Big CTA button: "ابدأ رحلتك" (gold, rounded)
- Bottom: "صالحة لمدة ٣ أشهر" in small muted text
- Very bottom: "تمعّن — رحلة اكتشاف المعنى بلغة القرآن"

Dimensions: 600x900px (vertical, email-friendly)
```

---

## ملاحظات لسمرا

### ترتيب التنفيذ المقترح:
1. ابدئي بالبرومبت ١ (صفحة الهبوط — Desktop) على Stitch
2. جرّبي ٢-٣ تكرارات حتى يعجبك الشكل
3. انتقلي للبرومبت ٢ (صفحة التسجيل)
4. أخيراً البرومبت ٣ (بطاقة العيدية)

### نصائح Stitch:
- إذا طلع التصميم بالإنجليزي، أضيفي في أول البرومبت: "IMPORTANT: All text must be in Arabic. RTL layout."
- إذا الألوان ما طلعت صح، حددي الـ hex codes مباشرة
- لتعديل جزء واحد بدون تغيير الباقي، استخدمي: "Keep everything the same but change [X] to [Y]"
- صدّري كـ HTML بعد الانتهاء عشان نحوّله لكود Next.js

### Design Tokens (للرجوع السريع):
| العنصر | اللون |
|--------|-------|
| الخلفية | `#15130f` |
| السطح | `#1e1b16` |
| الذهبي الأساسي | `#c9b88a` |
| الذهبي الفاتح | `#e6d4a4` |
| النص | `#e8e1d9` |
| النص الثانوي | `#cdc6b7` |
| الحدود | `#4b463c` |
