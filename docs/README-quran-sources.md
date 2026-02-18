# مصادر quran_ayahs.json الموثوقة

## الشكل المطلوب

```json
[
  { "surah": 1, "ayah": 1, "text_ar": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "page": 1, "juz": 1, "hizb": 1 },
  { "surah": 1, "ayah": 2, "text_ar": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",  "page": 1, "juz": 1, "hizb": 1 }
]
```

الحقول المطلوبة: `surah`, `ayah`, `text_ar`  
الحقول الاختيارية: `page`, `juz`, `hizb`

## مصادر مقترحة

- https://github.com/risan/quran-json
- https://tanzil.net/download/
- https://api.alquran.cloud/v1/quran/quran-uthmani

## التشغيل

```bash
# 1) Seed
node --loader ts-node/esm scripts/seed-quran.ts quran_ayahs.json

# 2) Verify
node --loader ts-node/esm scripts/verify-quran.ts
```

النتيجة المتوقعة:

```bash
✅ Verification passed — ready to run.
```
