const BASE = "/api/v1";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store", ...options });
  if (!res.ok) {
    const text = await res.text();
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(text)?.detail ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchMarketData(symbol: string) {
  return apiFetch(`/market/${symbol}`) as Promise<{
    symbol: string; current_price: number; historical_volatility: number;
  }>;
}

export async function priceOption(params: {
  symbol: string; strike: number; expiry_days: number;
  volatility: number | null; risk_free_rate: number;
  model: string; n_paths: number; is_american?: boolean;
}) {
  return apiFetch("/price", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, is_american: params.is_american ?? false }),
  });
}

export async function fetchImpliedVolatility(params: {
  symbol: string; strike: number; expiry_days: number;
  market_price: number; option_type: "call" | "put"; risk_free_rate: number;
}) {
  return apiFetch("/implied-volatility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function fetchGreeksSurface(symbol: string, strike: number, risk_free_rate: number) {
  const qs = new URLSearchParams({ symbol, strike: String(strike), risk_free_rate: String(risk_free_rate) });
  return apiFetch(`/greeks-surface?${qs}`);
}
