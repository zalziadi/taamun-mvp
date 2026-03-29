#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# OpenClaw Multi-Agent Setup Script
# إعداد التوجيه متعدد الإيجنتات لمشاريع زياد
# ═══════════════════════════════════════════════════════════════
#
# الخطوات:
# 1. إنشاء workspaces لكل agent
# 2. نسخ SOUL.md لكل workspace
# 3. تحديث openclaw.json بالـ bindings
# 4. إعادة تشغيل الـ gateway
#
# تشغيل:
#   cd ~/path/to/openclaw-config
#   chmod +x setup.sh
#   ./setup.sh
# ═══════════════════════════════════════════════════════════════

set -e

OPENCLAW_DIR="$HOME/.openclaw"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "═══════════════════════════════════════════"
echo "  إعداد OpenClaw Multi-Agent Routing"
echo "═══════════════════════════════════════════"
echo ""

# ── الخطوة 1: إنشاء workspaces ──
echo "📁 إنشاء مجلدات العمل..."

AGENTS=("warda" "musakhar" "samraa" "wolf" "mustashar")

for agent in "${AGENTS[@]}"; do
    ws="$OPENCLAW_DIR/workspace-$agent"
    if [ ! -d "$ws" ]; then
        mkdir -p "$ws"
        echo "   ✅ أنشأنا: workspace-$agent"
    else
        echo "   ⏭️  موجود: workspace-$agent"
    fi
done

echo ""

# ── الخطوة 2: نسخ SOUL.md لكل workspace ──
echo "📝 نسخ ملفات SOUL.md..."

for agent in "${AGENTS[@]}"; do
    src="$SCRIPT_DIR/workspace-$agent/SOUL.md"
    dest="$OPENCLAW_DIR/workspace-$agent/SOUL.md"

    if [ -f "$src" ]; then
        cp "$src" "$dest"
        echo "   ✅ نسخنا SOUL.md → workspace-$agent"
    else
        echo "   ⚠️  ما لقينا: $src"
    fi
done

echo ""

# ── الخطوة 3: عرض التعليمات لتحديث openclaw.json ──
echo "═══════════════════════════════════════════"
echo "  ⚠️  الخطوة اليدوية — تحديث openclaw.json"
echo "═══════════════════════════════════════════"
echo ""
echo "افتح الملف:"
echo "  nano $OPENCLAW_DIR/openclaw.json"
echo ""
echo "وأضف الأقسام التالية (agents + bindings)."
echo "الملف الكامل موجود في:"
echo "  $SCRIPT_DIR/openclaw-bindings.json5"
echo ""
echo "أو شغّل الأمر التالي لفتح الملف مباشرة:"
echo "  code $OPENCLAW_DIR/openclaw.json"
echo ""

# ── الخطوة 4: إعادة تشغيل الـ gateway ──
echo "═══════════════════════════════════════════"
echo "  هل تريد إعادة تشغيل الـ gateway الآن؟"
echo "═══════════════════════════════════════════"
read -p "  (y/n): " restart

if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
    echo ""
    echo "🔄 إعادة تشغيل الـ gateway..."
    openclaw gateway restart 2>/dev/null || echo "   ⚠️  تأكد إن openclaw مثبّت في PATH"
    echo ""
    echo "📋 التحقق من الـ bindings..."
    openclaw agents list --bindings 2>/dev/null || echo "   ⚠️  شغّل الأمر يدوياً: openclaw agents list --bindings"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ انتهينا!"
echo "═══════════════════════════════════════════"
echo ""
echo "الخطوات المتبقية:"
echo "  1. حدّث openclaw.json بالـ agents و bindings"
echo "  2. شغّل: openclaw gateway restart"
echo "  3. تحقق: openclaw agents list --bindings"
echo "  4. أرسل رسالة تجريبية على واتساب وتأكد إن وردة ترد"
echo ""
