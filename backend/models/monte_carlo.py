"""
Monte Carlo Option Pricing
Geometric Brownian Motion simulation for stock price paths.
Routes to C++ engine for N >= 100_000, else uses NumPy.
"""
import numpy as np
import subprocess
import json
import os
from typing import Dict, Any

# Path to compiled C++ engine (adjust if needed)
extension = ".exe" if os.name == "nt" else ""
CPP_ENGINE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "cpp_engine", f"monte_carlo_engine{extension}")


def _python_mc(S: float, K: float, T: float, r: float, sigma: float,
               n_paths: int, n_steps: int) -> Dict[str, Any]:
    """Numpy-based Monte Carlo simulation."""
    dt = T / n_steps
    Z = np.random.standard_normal((n_paths, n_steps))
    # GBM: S(t+dt) = S(t) * exp((r - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z)
    increments = (r - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z
    log_paths = np.cumsum(increments, axis=1)
    paths = S * np.exp(np.concatenate([np.zeros((n_paths, 1)), log_paths], axis=1))

    final_prices = paths[:, -1]
    call_payoffs = np.maximum(final_prices - K, 0)
    put_payoffs  = np.maximum(K - final_prices, 0)

    discount = np.exp(-r * T)
    call_price = discount * np.mean(call_payoffs)
    put_price  = discount * np.mean(put_payoffs)

    # For visualization: sample 500 paths maximum
    vis_n = min(500, n_paths)
    if n_paths > 500000:
        # Cap Python engine at 500k to prevent OOM
        raise ValueError(f"Python engine cannot handle {n_paths} paths. C++ engine missing or failed.")

    idx = np.random.choice(n_paths, vis_n, replace=False)
    sampled_paths = paths[idx].tolist()

    # Histogram of final prices
    hist, bin_edges = np.histogram(final_prices, bins=60, density=True)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2

    return {
        "call_price": round(float(call_price), 4),
        "put_price":  round(float(put_price), 4),
        "paths": [[round(v, 2) for v in path] for path in sampled_paths],
        "histogram": {
            "prices": [round(float(v), 2) for v in bin_centers],
            "density": [round(float(v), 6) for v in hist],
        },
        "final_prices_stats": {
            "mean":   round(float(np.mean(final_prices)), 2),
            "std":    round(float(np.std(final_prices)), 2),
            "p5":     round(float(np.percentile(final_prices, 5)), 2),
            "p95":    round(float(np.percentile(final_prices, 95)), 2),
        },
        "n_paths": n_paths,
        "engine": "python",
    }


def _cpp_mc(S: float, K: float, T: float, r: float, sigma: float,
            n_paths: int, n_steps: int) -> Dict[str, Any]:
    """Call C++ engine via subprocess."""
    if not os.path.exists(CPP_ENGINE_PATH):
        # Fallback to Python if not compiled
        return _python_mc(S, K, T, r, sigma, n_paths, n_steps)

    args = [
        CPP_ENGINE_PATH,
        str(S), str(K), str(T), str(r), str(sigma),
        str(n_paths), str(n_steps)
    ]
    try:
        # Increase timeout for large simulations
        result = subprocess.run(args, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            return _python_mc(S, K, T, r, sigma, n_paths, n_steps)
        data = json.loads(result.stdout)
        data["engine"] = "cpp"
        return data
    except subprocess.TimeoutExpired:
        return {"error": "Computation timed out. Try fewer paths.", "engine": "cpp"}
    except Exception as e:
        return {"error": str(e), "engine": "cpp"}


def run_simulation(S: float, K: float, T: float, r: float, sigma: float,
                   n_paths: int = 10000, n_steps: int = 252) -> Dict[str, Any]:
    """
    Main entry point: selects engine based on n_paths.
    Uses C++ for >= 100_000 paths, Python otherwise.
    """
    n_paths = max(1000, min(n_paths, 100_000_000_000_000))
    n_steps = max(50, min(n_steps, 504))

    if n_paths >= 100_000 and os.path.exists(CPP_ENGINE_PATH):
        return _cpp_mc(S, K, T, r, sigma, n_paths, n_steps)
    return _python_mc(S, K, T, r, sigma, n_paths, n_steps)
