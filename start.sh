#!/bin/bash

# Start FastAPI backend
echo "Starting FastAPI backend on port 8000..."
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --log-level info &

# Wait for backend to be ready
echo "Waiting for backend to initialize..."
MAX_RETRIES=30
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
  if python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health')" >/dev/null 2>&1; then
    echo "Backend is UP!"
    break
  fi
  echo "Waiting... ($COUNT)"
  sleep 2
  COUNT=$((COUNT + 1))
done

# Start Next.js frontend on port 7860
echo "Starting Next.js frontend on port 7860..."
npm run start -- -p 7860
