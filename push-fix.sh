#!/bin/bash
# تشغيل هذا السكريبت من Terminal على Mac
# cd ~/Projects/taamun-mvp && bash push-fix.sh

set -e
cd "$(dirname "$0")"

echo "📦 جاري فحص الملفات المعدّلة..."
git status --short

echo ""
echo "➕ إضافة الملفات..."
git add \
  src/app/api/admin/dashboard/route.ts \
  src/app/layout.tsx \
  src/app/program/page.tsx \
  src/components/landing/LandingMerged.tsx \
  src/components/taamun/Account.jsx \
  src/components/taamun/TaamunEssential.jsx \
  2>/dev/null || true

# أي ملف معدّل آخر
git add -u

echo ""
echo "💾 Commit..."
git commit -m "fix(ts): resolve implicit any in dashboard route + nav + brand guard" \
  --allow-empty 2>/dev/null || echo "لا يوجد تغييرات جديدة للـ commit"

echo ""
echo "🚀 Push إلى GitHub..."
git push origin main

echo ""
echo "✅ تم! Vercel سيبدأ البناء تلقائياً."
