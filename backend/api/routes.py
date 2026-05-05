"""FastAPI routes for the Options Pricing & Greeks Dashboard."""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Literal
import yfinance as yf
import numpy as np

from ..models.black_scholes import bs_price, payoff_diagram
from ..models.greeks import compute_greeks
from ..models.monte_carlo import run_simulation
from ..models.binomial_tree import binomial_tree_price
from ..models.ml_analyzer import analyze_trade

router = APIRouter()


# ─────────────────────────────────────────────
# REQUEST / RESPONSE SCHEMAS
# ─────────────────────────────────────────────

class PricingRequest(BaseModel):
    symbol: str = Field("AAPL", description="Stock ticker symbol")
    strike: float = Field(150.0, gt=0, description="Strike price")
    expiry_days: int = Field(30, ge=1, le=1095, description="Days to expiry")
    volatility: Optional[float] = Field(None, ge=0.01, le=5.0, description="Override volatility (annualized). If None, auto-compute from Yahoo.")
    risk_free_rate: float = Field(0.05, ge=0, le=1, description="Risk-free rate (annualized)")
    model: Literal["black_scholes", "monte_carlo", "binomial", "both", "all"] = "all"
    n_paths: int = Field(10000, ge=1000, le=100000000000000, description="Monte Carlo paths")
    is_american: bool = Field(False, description="Use American option pricing (only affects Binomial model)")


class GreeksResponse(BaseModel):
    delta_call: float
    delta_put:  float
    gamma:      float
    vega:       float
    theta_call: float
    theta_put:  float
    rho_call:   float
    rho_put:    float


# ─────────────────────────────────────────────
# HELPER: Fetch live stock data
# ─────────────────────────────────────────────

def _fetch_market_data(symbol: str):
    """Returns (current_price, hist_volatility_annualized)."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="3mo")
        if hist.empty:
            raise ValueError(f"No data for {symbol}")
        closes = hist["Close"].values
        current_price = float(closes[-1])
        log_returns = np.diff(np.log(closes))
        vol = float(np.std(log_returns) * np.sqrt(252))
        return current_price, vol
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Market data error: {e}")


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/health")
def health():
    return {"status": "ok", "service": "quant-api"}


@router.get("/market/{symbol}")
def get_market_data(symbol: str):
    """Fetch current price and historical volatility for a symbol."""
    price, vol = _fetch_market_data(symbol.upper())
    return {
        "symbol": symbol.upper(),
        "current_price": round(price, 2),
        "historical_volatility": round(vol, 4),
    }


@router.post("/price")
def price_option(req: PricingRequest):
    """
    Main endpoint: prices an option using BS and/or Monte Carlo.
    Returns prices, Greeks, payoff diagram, and (optionally) MC paths.
    """
    try:
        symbol = req.symbol.upper()
        T = req.expiry_days / 365.0
        r = req.risk_free_rate

        # Get market data
        current_price, hist_vol = _fetch_market_data(symbol)
        S = current_price
        sigma = req.volatility if req.volatility is not None else hist_vol
        K = req.strike

        result: dict = {
            "symbol": symbol,
            "current_price": round(S, 2),
            "strike": K,
            "expiry_days": req.expiry_days,
            "volatility": round(sigma, 4),
            "risk_free_rate": r,
            "T": round(T, 6),
        }

        # ── Greeks (always computed via BS) ──
        greeks = compute_greeks(S, K, T, r, sigma)
        result["greeks"] = greeks

        # ── ML AI Analysis ──
        result["ml_analysis"] = analyze_trade(
            delta=greeks["delta_call"],
            gamma=greeks["gamma"],
            vega=greeks["vega"],
            theta=greeks["theta_call"],
            vol=sigma,
            dte=req.expiry_days
        )

        # ── Payoff diagram ──
        result["payoff"] = payoff_diagram(K, T, r, sigma)

        # ── Black-Scholes prices ──
        if req.model in ("black_scholes", "both", "all"):
            bs = bs_price(S, K, T, r, sigma)
            result["black_scholes"] = bs

        # ── Monte Carlo ──
        if req.model in ("monte_carlo", "both", "all"):
            mc = run_simulation(S, K, T, r, sigma, n_paths=req.n_paths)
            result["monte_carlo"] = mc

        # ── Binomial Tree ──
        if req.model in ("binomial", "all"):
            call_price = binomial_tree_price(S, K, T, r, sigma, is_call=True, is_american=req.is_american)
            put_price = binomial_tree_price(S, K, T, r, sigma, is_call=False, is_american=req.is_american)
            result["binomial_tree"] = {
                "call_price": round(float(call_price), 4),
                "put_price":  round(float(put_price), 4),
                "steps": 100,
                "is_american": req.is_american
            }

        return result
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))


class IVRequest(BaseModel):
    symbol: str
    strike: float
    expiry_days: int
    market_price: float
    option_type: Literal["call", "put"] = "call"
    risk_free_rate: float = 0.05

@router.post("/implied-volatility")
def get_implied_volatility(req: IVRequest):
    """Calculate implied volatility given a market price."""
    current_price, _ = _fetch_market_data(req.symbol.upper())
    T = req.expiry_days / 365.0
    iv = implied_volatility(
        market_price=req.market_price,
        S=current_price,
        K=req.strike,
        T=T,
        r=req.risk_free_rate,
        option_type=req.option_type
    )
    return {
        "symbol": req.symbol.upper(),
        "market_price": req.market_price,
        "implied_volatility": round(iv, 4)
    }

@router.get("/greeks-surface")
def greeks_surface(
    symbol: str = Query("AAPL"),
    strike: float = Query(150.0),
    risk_free_rate: float = Query(0.05),
    volatility: Optional[float] = Query(None),
):
    """
    Returns delta vs time-to-expiry surface data (for the /risk page).
    """
    _, hist_vol = _fetch_market_data(symbol.upper())
    S = _fetch_market_data(symbol.upper())[0]
    sigma = volatility or hist_vol
    K = strike

    expiries = list(range(5, 366, 5))   # 5 to 365 days
    vols = [round(v, 2) for v in np.arange(0.10, 0.91, 0.10)]

    # Greeks surface over expiry × vol
    surface_delta = []
    surface_gamma = []
    surface_vega = []
    surface_theta = []

    for exp in expiries:
        row_d, row_g, row_v, row_t = [], [], [], []
        for vol in vols:
            g = compute_greeks(S, K, exp / 365.0, risk_free_rate, vol)
            row_d.append(round(g["delta_call"], 4))
            row_g.append(round(g["gamma"], 6))
            row_v.append(round(g["vega"], 4))
            row_t.append(round(g["theta_call"], 4))
        surface_delta.append(row_d)
        surface_gamma.append(row_g)
        surface_vega.append(row_v)
        surface_theta.append(row_t)

    return {
        "expiries": expiries,
        "vols": vols,
        "delta_surface": surface_delta,
        "gamma_surface": surface_gamma,
        "vega_surface": surface_vega,
        "theta_surface": surface_theta,
    }
