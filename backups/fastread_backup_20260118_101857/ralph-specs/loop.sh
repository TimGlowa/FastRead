#!/bin/bash

# FastRead - Ralph Build Loop
# Usage: ./loop.sh [plan|build]
# Default: build

MODE=${1:-build}
MAX_ITERATIONS=10

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ "$MODE" = "plan" ]; then
    PROMPT_FILE="$SCRIPT_DIR/PROMPT_plan.md"
    echo "🔍 Running in PLANNING mode..."
else
    PROMPT_FILE="$SCRIPT_DIR/PROMPT_build.md"
    echo "🔨 Running in BUILD mode..."
fi

# Check if prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
    echo "❌ Error: $PROMPT_FILE not found"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Starting Ralph loop at $(date)"
echo "Max iterations: $MAX_ITERATIONS"
echo "Working directory: $PROJECT_DIR"
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ITERATION=1

while [ $ITERATION -le $MAX_ITERATIONS ]; do
    echo ""
    echo "🔄 Iteration $ITERATION of $MAX_ITERATIONS starting..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Run Claude with the prompt from the project directory
    cd "$PROJECT_DIR"
    claude --dangerously-skip-permissions -p "$(cat "$PROMPT_FILE")"

    EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
        echo "⚠️  Claude exited with code $EXIT_CODE"
        echo "Waiting 5 seconds before retry..."
        sleep 5
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Iteration $ITERATION of $MAX_ITERATIONS complete at $(date)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    ITERATION=$((ITERATION + 1))

    # Brief pause between iterations
    sleep 2
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏁 Ralph loop finished after $MAX_ITERATIONS iterations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
