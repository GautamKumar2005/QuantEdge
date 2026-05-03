"""
Greeks Computation
All sensitivities for European options via Black-Scholes closed-form.
"""
import numpy as np
from scipy.stats import norm
from typing import Dict
from .black_scholes import _d1_d2


def compute_greeks(S: float, K: float, T: float, r: float, sigma: float) -> Dict[str, float]:
    """
    Compute all option Greeks.
    Args:
        S: Current stock price
        K: Strike price
        T: Time to expiry (years)
        r: Risk-free rate
        sigma: Volatility
    Returns:
        dict with delta_call, delta_put, gamma, vega, theta_call, theta_put, rho_call, rho_put
    """
    if T <= 0 or sigma <= 0:
        return {
            "delta_call": 1.0 if S > K else 0.0,
            "delta_put": -1.0 if S < K else 0.0,
            "gamma": 0.0,
            "vega": 0.0,
            "theta_call": 0.0,
            "theta_put": 0.0,
            "rho_call": 0.0,
            "rho_put": 0.0,
        }

    d1, d2 = _d1_d2(S, K, T, r, sigma)
    sqrt_T = np.sqrt(T)
    discount = np.exp(-r * T)
    pdf_d1 = norm.pdf(d1)

    delta_call = norm.cdf(d1)
    delta_put  = delta_call - 1.0
    gamma      = pdf_d1 / (S * sigma * sqrt_T)
    vega       = S * pdf_d1 * sqrt_T / 100.0   # per 1% vol move

    # Theta (per calendar day)
    theta_call = (
        -(S * pdf_d1 * sigma) / (2 * sqrt_T)
        - r * K * discount * norm.cdf(d2)
    ) / 365.0

    theta_put = (
        -(S * pdf_d1 * sigma) / (2 * sqrt_T)
        + r * K * discount * norm.cdf(-d2)
    ) / 365.0

    rho_call = K * T * discount * norm.cdf(d2) / 100.0   # per 1% rate move
    rho_put  = -K * T * discount * norm.cdf(-d2) / 100.0

    return {
        "delta_call": round(float(delta_call), 4),
        "delta_put":  round(float(delta_put), 4),
        "gamma":      round(float(gamma), 6),
        "vega":       round(float(vega), 4),
        "theta_call": round(float(theta_call), 4),
        "theta_put":  round(float(theta_put), 4),
        "rho_call":   round(float(rho_call), 4),
        "rho_put":    round(float(rho_put), 4),
    }
