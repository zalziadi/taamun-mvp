#!/bin/zsh

# =============================
# Full OpenClow Pipeline v2
# =============================

PROJECT_DIR="$HOME/Projects/taamun-mvp"
TASKS_FILE="$PROJECT_DIR/openclow_tasks.json"
VENV_DIR="$PROJECT_DIR/venv"
BUILD_LOG="$PROJECT_DIR/openclow_build.log"

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

status_print() {
    echo -e "$1$2${NC}"
}

# -----------------------------
# Loop for continuous OpenClow
# -----------------------------
while true; do
    status_print $GREEN "✅ Project directory OK"

    # Activate Python environment
    if [ -f "$VENV_DIR/bin/activate" ]; then
        source "$VENV_DIR/bin/activate"
        status_print $GREEN "✅ Python environment ready"
    else
        status_print $RED "❌ Python venv not found at $VENV_DIR"
        exit 1
    fi

    # Check .next folder
    if [ ! -d "$PROJECT_DIR/.next" ]; then
        status_print $YELLOW "⚠️ .next folder missing, will build"
    fi

    # Build project
    status_print $GREEN "🚀 Building project..."
    cd "$PROJECT_DIR" || exit 1
    npm run build &> "$BUILD_LOG"
    BUILD_STATUS=$?

    if [ $BUILD_STATUS -ne 0 ]; then
        status_print $RED "❌ Build failed. Check $BUILD_LOG for details"
        cat "$BUILD_LOG"
        status_print $YELLOW "⏸ Pipeline paused until build issue is fixed"
        exit 1
    else
        status_print $GREEN "✅ Build succeeded"
    fi

    # Daily Launch Report (dummy example)
    status_print $GREEN "📊 Daily Launch Report"
    echo "• Active Users: 5"
    echo "• 7-Day Retention: 80%"
    echo "• Biggest Risk: Slow login on high load"
    echo "• Suggested Improvements: Optimize auth microservice, Add CDN caching"
    echo ""

    # Execute tasks if file exists
    if [ -f "$TASKS_FILE" ]; then
        status_print $GREEN "🔍 Executing OpenClow tasks from $TASKS_FILE"
        while read -r task; do
            # ضع هنا أي سكربت أو أمر لتنفيذ المهمة
            # مثال: python scripts/run_task.py "$task"
            status_print $GREEN "• Executing task: $task"
            sleep 1
        done < <(jq -r '.tasks[]' "$TASKS_FILE")
    else
        status_print $YELLOW "⚠️ No tasks file found, skipping task execution"
    fi

    status_print $GREEN "✅ Full OpenClow Pipeline completed"

    # Pause 5 minutes قبل الدورة التالية
    sleep 300
done
