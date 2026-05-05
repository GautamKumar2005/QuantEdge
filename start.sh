#!/bin/bash

# Start FastAPI backend in the background and log to a file
echo "Starting FastAPI backend..."
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# Wait for backend to start
sleep 5

# Start Next.js frontend on port 7860
echo "Starting Next.js frontend..."
npm run start -- -p 7860
