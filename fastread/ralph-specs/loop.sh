#!/bin/bash

# FastRead - Ralph Build Loop
# Usage: ./loop.sh [plan|build]
# Default: build

MODE=${1:-build}

if [ "$MODE" = "plan" ]; then
    PROMPT_FILE="PROMPT_plan.md"
    echo "🔍 Running in PLANNING mode..."
else
    PROMPT_FILE="PROMPT_build.md"
    echo "🔨 Running in BUILD mode..."
fi

# Check if prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
    echo "❌ Error: $PROMPT_FILE not found"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Starting Ralph loop at $(date)"
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ITERATION=1

while true; do
    echo ""
    echo "🔄 Iteration $ITERATION starting..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Run Claude with the prompt
    # Adjust this command based on your Claude CLI setup
    cat "$PROMPT_FILE" | claude

    EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
        echo "⚠️  Claude exited with code $EXIT_CODE"
        echo "Waiting 5 seconds before retry..."
        sleep 5
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Iteration $ITERATION complete at $(date)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    ITERATION=$((ITERATION + 1))

    # Brief pause between iterations
    sleep 2
done
