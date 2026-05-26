#!/bin/bash
set -e

echo "=== CU-ASK Tutorial 5 setup ==="
echo "Run this from tut/tut5/cu-ask/."
echo ""

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. Install Node.js first, then rerun this script."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required. Install Python first, then rerun this script."
  exit 1
fi

echo "[1/3] Creating Python virtual environment..."
python3 -m venv .venv

echo "[2/3] Installing backend dependencies..."
source .venv/bin/activate
python -m pip install -r backend/requirements.txt

echo "[3/3] Installing frontend dependencies..."
npm install

echo ""
echo "=== Setup complete ==="
echo "Start backend:"
echo "  source .venv/bin/activate"
echo "  python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
echo ""
echo "Start frontend in another terminal:"
echo "  npm run dev -- --host 127.0.0.1"
echo ""
echo "Then open:"
echo "  http://127.0.0.1:5173/"
