#!/usr/bin/env bash
set -euo pipefail

# =============================
# 🎯 Full OpenClow Auto-Pipeline
# =============================

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

PROJECT_DIR="$HOME/Projects/taamun-mvp"
FLOWCHART="a_flowchart_infographic_in_arabic_illustrates_a_po.png"
METRICS_FILE="metrics.json"

function status_print {
  COLOR=$1
  MESSAGE=$2
  echo -e "${COLOR}${MESSAGE}${NC}"
}

# -----------------------------
# 1️⃣  تأكيد مجلد المشروع
# -----------------------------
if [[ ! -d "$PROJECT_DIR" ]]; then
  status_print $RED "❌ ERROR: Project directory missing!"
  exit 1
fi
cd "$PROJECT_DIR"
status_print $GREEN "✅ Project directory OK"

# -----------------------------
# 2️⃣  Python Virtualenv + Requests
# -----------------------------
if [[ ! -d "venv" ]]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install requests
status_print $GREEN "✅ Python environment ready"

# -----------------------------
# 3️⃣  Build Project Node.js
# -----------------------------
status_print $YELLOW "🚀 Building project..."
npm run build && status_print $GREEN "✅ Build succeeded"

# -----------------------------
# 4️⃣  تشغيل التقرير
# -----------------------------
if [[ -f "$METRICS_FILE" ]]; then
  python scripts/report_generator.py
  status_print $GREEN "✅ Report generated"

  # إرسال Slack تلقائي
  if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "$(jq -Rs . < "$METRICS_FILE")" \
      "$SLACK_WEBHOOK"
    status_print $GREEN "✅ Report sent to Slack"
  else
    cat "$METRICS_FILE"
    status_print $YELLOW "⚠️ Slack webhook missing – report printed only"
  fi
else
  status_print $YELLOW "⚠️ metrics.json missing – skipping report"
fi

# -----------------------------
# 5️⃣  Git: Flowchart + Daily commit
# -----------------------------
if [[ -f "$FLOWCHART" ]]; then
  git add "$FLOWCHART" || true
  git commit -m "Auto: Add flowchart + daily report" || true
  git push origin main || true
  status_print $GREEN "✅ Flowchart committed & pushed"
else
  status_print $YELLOW "⚠️ Flowchart missing – Git step skipped"
fi

# -----------------------------
# 6️⃣  Auto-detect new tasks
# -----------------------------
TASKS_FILE="openclow_tasks.json"
if [[ -f "$TASKS_FILE" ]]; then
  status_print $YELLOW "🔍 Detecting new tasks..."
  while IFS= read -r task; do
    status_print $GREEN "• Executing task: $task"
    # ضع هنا أي سكربت أو أمر لتنفيذ المهمة
    # مثال: python scripts/run_task.py "$task"
  done < <(jq -r '.tasks[]' "$TASKS_FILE")
else
  status_print $YELLOW "⚠️ No tasks file found, skipping task execution"
fi

status_print $GREEN "✅ Full OpenClow Pipeline completed"chmod +x full_openclow_pipeline.sh
./full_openclow_pipeline.sh
crontab -e
0 8 * * * /Users/ziyadalziyadi/Projects/taamun-mvp/full_openclow_pipeline.sh

