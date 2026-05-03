#!/bin/bash

# Start FastAPI backend in the background
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &

# Start Next.js frontend on port 7860
npm run start -- -p 7860
