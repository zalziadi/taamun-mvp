# docs/commands.md — الأوامر المسموحة

## أوامر التطوير

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل خادم التطوير (localhost:3000) |
| `npm run build` | بناء الإنتاج |
| `npm run start` | تشغيل خادم الإنتاج |
| `npx tsc --noEmit` | فحص TypeScript (لا يوجد سكربت مختصر) |
| `npm run lint` | فحص ESLint |
| `npm run verify` | بناء الإنتاج (`next build`) |
| `npm run guard:release` | التحقق الشامل: brand + runtime + metadata + tsc + build |

## التحقق قبل الدمج
```bash
npx tsc --noEmit && npm run build
```

## التحقق قبل الإطلاق
```bash
npm run guard:release
```
