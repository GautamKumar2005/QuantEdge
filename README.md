---
title: QuantEdge
emoji: 📈
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# QuantEdge — Options Pricing & Greeks Dashboard

A full-stack quant finance platform: Black-Scholes + Monte Carlo pricing, real-time Greeks, Bloomberg Terminal-style UI.

## Architecture

```
quant/
├── backend/                  # Python FastAPI
│   ├── main.py
│   ├── api/routes.py
│   └── models/
│       ├── black_scholes.py
│       ├── greeks.py
│       └── monte_carlo.py
├── cpp_engine/
│   └── monte_carlo.cpp       # High-perf C++ (100K+ paths)
└── src/                      # Next.js 15 frontend
    ├── app/dashboard/        # Main trading interface
    ├── app/compare/          # BS vs MC comparison
    └── app/risk/             # 3D Greeks surface
```

## Quick Start

**Backend:**
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

**Frontend:**
```bash
npm run dev
```
UI: http://localhost:3000

**C++ Engine (optional, for 100K+ paths):**
```bash
cd cpp_engine
g++ -O3 -std=c++17 -o monte_carlo_engine.exe monte_carlo.cpp
```
