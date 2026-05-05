"use client";
import { useState } from "react";

const SYMBOLS = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "META", "GOOGL", "SPY"];

interface Props {
  onSubmit: (params: PricingParams) => void;
  loading: boolean;
  currentPrice?: number;
}

export interface PricingParams {
  symbol: string;
  strike: number;
  expiry_days: number;
  volatility: number | null;
  risk_free_rate: number;
  model: "black_scholes" | "monte_carlo" | "binomial" | "both" | "all";
  n_paths: number;
  is_american: boolean;
}

export default function ControlPanel({ onSubmit, loading, currentPrice }: Props) {
  const [params, setParams] = useState<PricingParams>({
    symbol: "AAPL", strike: 150, expiry_days: 30,
    volatility: null, risk_free_rate: 0.05, model: "all", n_paths: 10000, is_american: false,
  });
  const [autoVol, setAutoVol] = useState(true);

  const set = (k: keyof PricingParams, v: any) => setParams(p => ({ ...p, [k]: v }));

  return (
    <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="section-title">⚙ Parameters</div>

      {/* Symbol */}
      <div>
        <label className="field-label">Stock Symbol</label>
        <select className="select-field" value={params.symbol} onChange={e => set("symbol", e.target.value)}>
          {SYMBOLS.map(s => <option key={s}>{s}</option>)}
        </select>
        {currentPrice && (
          <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-green)" }}>
            Market: ${currentPrice.toFixed(2)}
          </div>
        )}
      </div>

      {/* Strike */}
      <div>
        <label className="field-label">Strike Price ($)</label>
        <input type="number" className="input-field" value={params.strike}
          onChange={e => set("strike", parseFloat(e.target.value) || 0)} />
      </div>

      {/* Expiry */}
      <div>
        <label className="field-label">Days to Expiry</label>
        <input type="range" min={1} max={365} value={params.expiry_days}
          onChange={e => set("expiry_days", parseInt(e.target.value))}
          style={{ width: "100%", accentColor: "var(--accent-cyan)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
          <span>1d</span><span style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{params.expiry_days}d</span><span>365d</span>
        </div>
      </div>

      {/* Volatility */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label className="field-label" style={{ margin: 0 }}>Volatility (σ)</label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.72rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={autoVol} onChange={e => { setAutoVol(e.target.checked); if (e.target.checked) set("volatility", null); }} />
            Auto (Historical)
          </label>
        </div>
        {!autoVol && (
          <input type="number" className="input-field" step={0.01} min={0.01} max={5}
            placeholder="e.g. 0.30" value={params.volatility ?? ""}
            onChange={e => set("volatility", parseFloat(e.target.value) || null)} />
        )}
      </div>

      {/* Risk-free rate */}
      <div>
        <label className="field-label">Risk-Free Rate</label>
        <input type="number" className="input-field" step={0.001} min={0} max={1}
          value={params.risk_free_rate} onChange={e => set("risk_free_rate", parseFloat(e.target.value) || 0)} />
      </div>

      {/* Model */}
      <div>
        <label className="field-label">Pricing Model</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["black_scholes", "monte_carlo", "binomial", "all"] as const).map(m => (
            <button type="button" key={m} onClick={() => set("model", m)}
              style={{
                flex: 1, padding: "8px 6px", borderRadius: 8, border: "1px solid",
                fontSize: "0.65rem", fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em",
                background: params.model === m ? "rgba(0,210,255,0.15)" : "rgba(10,21,32,0.6)",
                borderColor: params.model === m ? "var(--accent-cyan)" : "var(--border)",
                color: params.model === m ? "var(--accent-cyan)" : "var(--text-secondary)",
                minWidth: "40%"
              }}>
              {m === "black_scholes" ? "BLACK-SCHOLES" : m === "monte_carlo" ? "MONTE CARLO" : m === "binomial" ? "BINOMIAL TREE" : "ALL MODELS"}
            </button>
          ))}
        </div>
      </div>

      {/* American Option Toggle (Binomial only) */}
      {(params.model === "binomial" || params.model === "all" || params.model === "both") && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" id="american" checked={params.is_american} 
            onChange={e => set("is_american", e.target.checked)} 
            style={{ accentColor: "var(--accent-purple)", width: 16, height: 16 }} />
          <label htmlFor="american" className="field-label" style={{ margin: 0, cursor: "pointer" }}>
            American Style Option (Early Exercise)
          </label>
        </div>
      )}

      {/* MC Paths */}
      {(params.model === "monte_carlo" || params.model === "all" || params.model === "both") && (
        <div>
          <label className="field-label">MC Paths: {params.n_paths.toLocaleString()}</label>
          <input type="number" className="input-field" min={1000} value={params.n_paths}
            onChange={e => set("n_paths", parseInt(e.target.value) || 1000)} />
          <input type="range" min={1000} max={10000000} step={10000} value={Math.min(params.n_paths, 10000000)}
            onChange={e => set("n_paths", parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent-purple)", marginTop: 8 }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
            <span>1K</span><span>10M+ (Type above for more)</span>
          </div>
        </div>
      )}

      {/* Submit */}
      <button type="button" className="btn-primary" onClick={() => onSubmit(params)} disabled={loading}
        style={{ marginTop: 8, width: "100%", justifyContent: "center" }}>
        {loading ? <><span className="spinner" /> Running Model...</> : "▶ Run Pricing Model"}
      </button>
    </div>
  );
}
