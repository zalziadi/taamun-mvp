# docs/commands.md — الأوامر المسموحة

## أوامر التطوير

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل خادم التطوير (localhost:3000) |
| `npm run build` | بناء الإنتاج |
| `npm run start` | تشغيل خادم الإنتاج |
| `npm run typecheck` | فحص TypeScript (`tsc --noEmit`) |
| `npm run lint` | فحص ESLint |
| `npm run verify` | التحقق الكامل: typecheck + build |

## التحقق قبل الدمج
```bash
npm run verify
```
