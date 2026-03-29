#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# تطبيق إعدادات التوجيه على OpenClaw
# يستخدم المسارات الحقيقية الموجودة على جهاز زياد
# ═══════════════════════════════════════════════════════════════

set -e

OPENCLAW_JSON="$HOME/.openclaw/openclaw.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "═══════════════════════════════════════════"
echo "  تطبيق إعدادات التوجيه — OpenClaw"
echo "═══════════════════════════════════════════"
echo ""

# ── الخطوة 1: نسخ SOUL.md للمسارات الصحيحة ──
echo "📝 نسخ ملفات SOUL.md..."

WORKSPACES=(
  "warda:$HOME/.openclaw/workspace/eid-skills/warda"
  "musakhar:$HOME/.openclaw/workspace/eid-skills/musakhar"
  "samraa:$HOME/.openclaw/workspace/eid-skills/samraa"
  "wolf:$HOME/.openclaw/workspace/eid-skills/wolf"
  "mustashar:$HOME/.openclaw/workspace/eid-skills/mustashar"
)

for entry in "${WORKSPACES[@]}"; do
  agent="${entry%%:*}"
  ws="${entry##*:}"

  src="$SCRIPT_DIR/workspace-$agent/SOUL.md"

  if [ -f "$src" ] && [ -d "$ws" ]; then
    cp "$src" "$ws/SOUL.md"
    echo "   ✅ $agent → $ws/SOUL.md"
  elif [ ! -f "$src" ]; then
    echo "   ⚠️  ما لقينا الملف: $src"
  elif [ ! -d "$ws" ]; then
    mkdir -p "$ws"
    cp "$src" "$ws/SOUL.md"
    echo "   ✅ $agent → أنشأنا المجلد ونسخنا SOUL.md"
  fi
done

echo ""

# ── الخطوة 2: تحديث bindings في openclaw.json ──
echo "🔧 تحديث bindings في openclaw.json..."

# نستخدم Python لأنه أكثر أماناً مع JSON
python3 << 'PYEOF'
import json
import shutil
from pathlib import Path

config_path = Path.home() / ".openclaw" / "openclaw.json"

# نسخة احتياطية
backup_path = config_path.with_suffix(".json.backup")
shutil.copy2(config_path, backup_path)
print(f"   📋 نسخة احتياطية: {backup_path}")

with open(config_path, "r") as f:
    config = json.load(f)

# تحديث bindings
config["bindings"] = [
    {
        "type": "route",
        "agentId": "warda",
        "match": {
            "channel": "whatsapp",
            "accountId": "default"
        }
    }
]

with open(config_path, "w") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print("   ✅ تم تحديث bindings → وردة هي الافتراضية على واتساب")
PYEOF

echo ""

# ── الخطوة 3: إعادة تشغيل الـ gateway ──
echo "🔄 إعادة تشغيل الـ gateway..."
openclaw gateway restart 2>/dev/null && echo "   ✅ الـ gateway أعاد التشغيل" || echo "   ⚠️  شغّل يدوياً: openclaw gateway restart"

echo ""

# ── الخطوة 4: التحقق ──
echo "📋 التحقق من الإعدادات..."
echo ""
echo "الـ bindings الجديدة:"
python3 -c "
import json;
from pathlib import Path;
c = json.load(open(Path.home()/'.openclaw'/'openclaw.json'));
for b in c.get('bindings', []):
    print(f\"   {b['agentId']} → {b['match']}\")
"

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ انتهينا!"
echo "═══════════════════════════════════════════"
echo ""
echo "  وردة الآن هي الافتراضية على واتساب"
echo "  أرسل رسالة تجريبية على واتساب وتأكد إن وردة ترد"
echo ""
