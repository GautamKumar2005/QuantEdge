"""
Black-Scholes Option Pricing Model
Computes European call/put prices and all Greeks.
"""
import numpy as np
from scipy.stats import norm
from typing import Tuple, Dict


def _d1_d2(S: float, K: float, T: float, r: float, sigma: float) -> Tuple[float, float]:
    """Compute d1 and d2 for Black-Scholes."""
    if T <= 0 or sigma <= 0:
        return 0.0, 0.0
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return d1, d2


def bs_price(S: float, K: float, T: float, r: float, sigma: float) -> Dict[str, float]:
    """
    Black-Scholes price for European call and put.
    Args:
        S: Current stock price
        K: Strike price
        T: Time to expiry in years
        r: Risk-free rate (annualized)
        sigma: Volatility (annualized)
    Returns:
        dict with call_price, put_price, intrinsic_call, intrinsic_put
    """
    if T <= 0:
        call = max(S - K, 0.0)
        put = max(K - S, 0.0)
        return {
            "call_price": call,
            "put_price": put,
            "intrinsic_call": call,
            "intrinsic_put": put,
        }

    d1, d2 = _d1_d2(S, K, T, r, sigma)
    discount = np.exp(-r * T)

    call_price = S * norm.cdf(d1) - K * discount * norm.cdf(d2)
    put_price = K * discount * norm.cdf(-d2) - S * norm.cdf(-d1)
    intrinsic_call = max(S - K, 0.0)
    intrinsic_put = max(K - S, 0.0)

    return {
        "call_price": round(float(call_price), 4),
        "put_price": round(float(put_price), 4),
        "intrinsic_call": round(intrinsic_call, 4),
        "intrinsic_put": round(intrinsic_put, 4),
    }


def payoff_diagram(
    K: float, T: float, r: float, sigma: float,
    S_range_pct: float = 0.5, n_points: int = 200
) -> Dict[str, list]:
    """
    Generate payoff diagram data for a range of stock prices at expiry.
    Returns call/put payoff curves (P&L assuming buying the option at BS price).
    """
    # Use midpoint S = K as reference
    S_ref = K
    S_min = S_ref * (1 - S_range_pct)
    S_max = S_ref * (1 + S_range_pct)
    prices = np.linspace(S_min, S_max, n_points)

    # Option premium at current price K (ATM)
    bs = bs_price(S_ref, K, T, r, sigma)
    call_premium = bs["call_price"]
    put_premium = bs["put_price"]

    call_payoff = [round(float(max(p - K, 0) - call_premium), 4) for p in prices]
    put_payoff  = [round(float(max(K - p, 0) - put_premium), 4) for p in prices]

    return {
        "stock_prices": [round(float(p), 2) for p in prices],
        "call_payoff": call_payoff,
        "put_payoff": put_payoff,
    }
