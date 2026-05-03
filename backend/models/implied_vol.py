"""
Implied Volatility Solver using Newton-Raphson method.
"""
import numpy as np
from .black_scholes import bs_price
from .greeks import compute_greeks

def implied_volatility(
    market_price: float, 
    S: float, 
    K: float, 
    T: float, 
    r: float, 
    option_type: str = "call", 
    tol: float = 1e-5, 
    max_iter: int = 100
) -> float:
    """
    Computes the implied volatility of a European option using Newton-Raphson.
    """
    if T <= 0 or market_price <= 0:
        return 0.0

    # Start with an initial guess (e.g., Brenner and Subrahmanyam 1988 estimate)
    sigma = np.sqrt(2 * np.pi / T) * (market_price / S)
    if sigma <= 0 or np.isnan(sigma):
        sigma = 0.5 # fallback guess

    for i in range(max_iter):
        bs = bs_price(S, K, T, r, sigma)
        price = bs["call_price"] if option_type.lower() == "call" else bs["put_price"]
        
        diff = price - market_price
        if abs(diff) < tol:
            return float(sigma)
            
        greeks = compute_greeks(S, K, T, r, sigma)
        vega = greeks["vega"]
        
        # Vega is scaled by 100 in our greeks.py (representing 1% change), so we use the unscaled vega:
        # Actually we need partial derivative wrt sigma, so unscaled vega is vega * 100
        vega_unscaled = vega * 100 
        
        if vega_unscaled < 1e-8:
            # If vega is too small, gradient is flat, fallback to a numerical or binary search
            break
            
        sigma = sigma - diff / vega_unscaled
        
        # Prevent sigma from going negative or too large
        if sigma <= 0.001:
            sigma = 0.001
        elif sigma > 5.0:
            sigma = 5.0

    return float(sigma)
