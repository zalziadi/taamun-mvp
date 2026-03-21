#!/usr/bin/env bash
# Daily Task Verification Script for Taamun / Team Dashboard
# يرسل حالة المهام وتقريرًا يوميًا إلى Dashboard API
#
# الاستخدام:
#   chmod +x scripts/daily-task-dashboard-report.sh
#   ./scripts/daily-task-dashboard-report.sh
#
# متطلبات: bash، curl، python3

set -euo pipefail

DASHBOARD_API="${DASHBOARD_API:-https://team-dashboard-murex-one.vercel.app/api/update}"

TASKS=(
  "1:إطلاق حملة العيد"
  "2:متابعة العملاء"
  "3:تحسين الصفحة"
  "4:كتابة محتوى تسويقي"
  "5:تحليل الأداء"
)

DONE_COUNT=0
BLOCKED_COUNT=0
TOTAL_COUNT=${#TASKS[@]}

send_json() {
  curl -sS -X POST "$DASHBOARD_API" \
    -H "Content-Type: application/json; charset=utf-8" \
    --data-binary "$1" || true
}

for TASK in "${TASKS[@]}"; do
  IFS=":" read -r TASK_ID TASK_TITLE <<< "$TASK"

  # TODO: ربط STATUS و OWNER بـ API أو ملف حالة حقيقي
  STATUS="${TASK_STATUS:-done}"
  OWNER="${TASK_OWNER:-مسخّر}"

  case "$STATUS" in
    done) DONE_COUNT=$((DONE_COUNT + 1)) ;;
    blocked) BLOCKED_COUNT=$((BLOCKED_COUNT + 1)) ;;
  esac

  export TASK_ID TASK_TITLE STATUS OWNER
  PAYLOAD="$(python3 << 'PY'
import json, os
print(json.dumps({
    "type": "task",
    "id": int(os.environ["TASK_ID"]),
    "status": os.environ["STATUS"],
    "owner": os.environ["OWNER"],
    "title": os.environ["TASK_TITLE"],
}, ensure_ascii=False))
PY
)"
  send_json "$PAYLOAD"
done

if (( TOTAL_COUNT > 0 )); then
  PROGRESS=$(( DONE_COUNT * 100 / TOTAL_COUNT ))
else
  PROGRESS=0
fi

export TOTAL_COUNT DONE_COUNT BLOCKED_COUNT PROGRESS
REPORT_PAYLOAD="$(python3 << 'PY'
import json, os
print(json.dumps({
    "type": "activity",
    "agent": "full-ai-operator",
    "action": "تقرير يومي للمهام",
    "activityType": "report",
    "summary": {
        "totalTasks": int(os.environ["TOTAL_COUNT"]),
        "doneTasks": int(os.environ["DONE_COUNT"]),
        "blockedTasks": int(os.environ["BLOCKED_COUNT"]),
        "progressPercent": int(os.environ["PROGRESS"]),
    },
}, ensure_ascii=False))
PY
)"

send_json "$REPORT_PAYLOAD"

echo "Daily report sent: $DONE_COUNT/$TOTAL_COUNT tasks done, $BLOCKED_COUNT blocked, progress ${PROGRESS}%"
