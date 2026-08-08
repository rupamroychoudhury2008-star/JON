#!/usr/bin/env bash
# Jon Continuous Voice Assistant Launcher (Bash / Git Bash / WSL)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
elif [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

echo "============================================================"
echo "     JON VOICE ASSISTANT — CONTINUOUS WAKE WORD LISTENER"
echo "  Listening for wake words ('Jon', 'Hey Jon', 'Yo Jon')..."
echo "  Press Ctrl+C to stop listening at any time."
echo "============================================================"

while true; do
    python main.py --voice
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo "[Voice loop restarted after exit code $EXIT_CODE...]"
        sleep 2
    fi
done
