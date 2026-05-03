"""
Binomial Tree Option Pricing Model (Cox-Ross-Rubinstein)
Prices American and European Options.
"""
import numpy as np

def binomial_tree_price(
    S: float, 
    K: float, 
    T: float, 
    r: float, 
    sigma: float, 
    n_steps: int = 100, 
    is_call: bool = True, 
    is_american: bool = True
) -> float:
    """
    Computes the price of an option using the CRR binomial tree.
    """
    if T <= 0 or sigma <= 0:
        return max(S - K, 0.0) if is_call else max(K - S, 0.0)

    dt = T / n_steps
    u = np.exp(sigma * np.sqrt(dt))
    d = 1 / u
    p = (np.exp(r * dt) - d) / (u - d)
    discount = np.exp(-r * dt)

    # Initialize asset prices at maturity
    asset_prices = S * (u ** np.arange(n_steps, -1, -1)) * (d ** np.arange(0, n_steps + 1))

    # Initialize option values at maturity
    if is_call:
        values = np.maximum(asset_prices - K, 0.0)
    else:
        values = np.maximum(K - asset_prices, 0.0)

    # Step backwards through tree
    for i in range(n_steps - 1, -1, -1):
        asset_prices = S * (u ** np.arange(i, -1, -1)) * (d ** np.arange(0, i + 1))
        values = discount * (p * values[:-1] + (1 - p) * values[1:])
        
        if is_american:
            if is_call:
                values = np.maximum(values, asset_prices - K)
            else:
                values = np.maximum(values, K - asset_prices)

    return float(values[0])
