I’m afraid I can’t run the full sequence of shell commands for you—my sandbox environment doesn’t allow arbitrary `exec` calls.  
What I can do is give you a ready‑to‑run bash script (with all the steps you listed).  
Just copy‑paste it into a file, make it executable, and run it on your machine.

```bash
#!/usr/bin/env bash
set -euo pipefail

# ------------------------------------------------------------------
# 1️⃣  Check the project folder
# ------------------------------------------------------------------
PROJECT_DIR="$HOME/Projects/taamun-mvp"

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "❌ ERROR: Project directory '$PROJECT_DIR' does not exist." >&2
  exit 1
fi

cd "$PROJECT_DIR"

# ------------------------------------------------------------------
# 2️⃣  Python venv
# ------------------------------------------------------------------
if [[ ! -d "venv" ]]; then
  echo "⚙️  Creating Python virtual environment..."
  python3 -m venv venv
fi

echo "🔓 Activating virtualenv..."
# shellcheck disable=SC1091
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install requests

# ------------------------------------------------------------------
# 3️⃣  Build the project (Node)
# ------------------------------------------------------------------
echo "🚀 Building the project..."
npm run build

# ------------------------------------------------------------------
# 4️⃣  Generate metrics report
# ------------------------------------------------------------------
METRICS_FILE="metrics.json"
if [[ ! -f "$METRICS_FILE" ]]; then
  echo "⚠️  metrics.json not found – skipping report generation." >&2
else
  echo "📊 Running report generator..."
  python scripts/report_generator.py

  # Send to Slack if webhook is set
  if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
    echo "✉️  Sending report to Slack..."
    curl -X POST -H 'Content-type: application/json' \
      --data "$(jq -Rs . < metrics.json)" \
      "$SLACK_WEBHOOK"
  else
    echo "🖥️  No SLACK_WEBHOOK defined – printing report to terminal."
    cat metrics.json
  fi
fi

# ------------------------------------------------------------------
# 5️⃣  Commit & push the flowchart
# ------------------------------------------------------------------
FLOWCHART="a_flowchart_infographic_in_arabic_illustrates_a_po.png"

if [[ ! -f "$FLOWCHART" ]]; then
  echo "⚠️  Flowchart file '$FLOWCHART' missing – skipping Git steps." >&2
else
  echo "🔧 Adding flowchart to Git..."
  git add "$FLOWCHART"
  git commit -m "Add flowchart and daily report" || echo "🚨 Commit failed – maybe nothing changed."
  echo "📤 Pushing to origin/main..."
  git push origin main
fi

# ------------------------------------------------------------------
# 6️⃣  Finish
# ------------------------------------------------------------------
echo "✅ Pipeline completed successfully."

exit 0
```

### How to use

1. Save the above script to, e.g., `~/Projects/taamun-mvp/run_pipeline.sh`.  
2. Make it executable:  
   ```bash
   chmod +x ~/Projects/taamun-mvp/run_pipeline.sh
   ```
3. Run it:  
   ```bash
   ~/Projects/taamun-mvp/run_pipeline.sh
   ```

### What it does

- Checks for the project folder.  
- Creates/activates a Python virtualenv and installs `requests`.  
- Runs `npm run build`.  
- Generates a report (`scripts/report_generator.py`) if `metrics.json` exists.  
- Sends the report to Slack when `SLACK_WEBHOOK` env var is set; otherwise prints it.  
- Adds, commits, and pushes the flowchart image.  
- Prints status after each step and exits with a success message.

Feel free to tweak any paths, commands, or environment variables to match your exact setup. If you hit any errors, let me know the exact message and I can help debug.
