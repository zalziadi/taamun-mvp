#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$HOME/Projects/taamun-mvp"
FLOWCHART="a_flowchart_infographic_in_arabic_illustrates_a_po.png"
METRICS_FILE="metrics.json"

# Status tracking
BUILD_STATUS="❌ Not run"
REPORT_STATUS="❌ Not run"
GIT_STATUS="❌ Not run"
SLACK_STATUS="❌ Not sent"

# 1️⃣ Check project folder
if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "❌ ERROR: Project directory '$PROJECT_DIR' does not exist." >&2
  exit 1
fi
cd "$PROJECT_DIR"
echo "✅ Project directory OK"

# 2️⃣ Python venv
if [[ ! -d "venv" ]]; then
  echo "⚙️ Creating Python virtual environment..."
  python3 -m venv venv
fi
source venv/bin/activate
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install requests
echo "✅ Python environment ready"

# 3️⃣ Build the project
echo "🚀 Building the project..."
if npm run build; then
  BUILD_STATUS="✅ Build succeeded"
else
  BUILD_STATUS="❌ Build failed"
fi

# 4️⃣ Generate metrics report
if [[ -f "$METRICS_FILE" ]]; then
  echo "📊 Running report generator..."
  python scripts/report_generator.py && REPORT_STATUS="✅ Report generated"
  
  # Send to Slack if webhook is defined
  if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
    echo "✉️ Sending report to Slack..."
    curl -s -X POST -H 'Content-type: application/json' \
      --data "$(jq -Rs . < "$METRICS_FILE")" \
      "$SLACK_WEBHOOK" && SLACK_STATUS="✅ Sent to Slack"
  else
    echo "🖥️ No SLACK_WEBHOOK – printing report:"
    cat "$METRICS_FILE"
    SLACK_STATUS="⚠️ Not sent – webhook missing"
  fi
else
  echo "⚠️ $METRICS_FILE missing – skipping report generation."
  REPORT_STATUS="⚠️ Report skipped"
fi

# 5️⃣ Commit & push the flowchart
if [[ -f "$FLOWCHART" ]]; then
  git add "$FLOWCHART"
  git commit -m "Add flowchart and daily report" || echo "🚨 Nothing to commit"
  git push origin main && GIT_STATUS="✅ Flowchart pushed"
else
  echo "⚠️ Flowchart missing – skipping Git steps"
  GIT_STATUS="⚠️ Skipped"
fi

# 6️⃣ Finish - Summary
echo
echo "📌 Pipeline Summary:"
echo "• Build: $BUILD_STATUS"
echo "• Report: $REPORT_STATUS"
echo "• Slack: $SLACK_STATUS"
echo "• Flowchart/Git: $GIT_STATUS"
echo "✅ Pipeline completed successfully"
