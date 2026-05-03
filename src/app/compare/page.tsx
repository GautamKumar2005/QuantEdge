"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { ComparisonChart, PayoffChart } from "@/components/Charts";
import { priceOption } from "@/lib/api";

const PRESETS = [
  { symbol: "AAPL", strike: 180, expiry_days: 30, label: "AAPL 30d" },
  { symbol: "TSLA", strike: 250, expiry_days: 60, label: "TSLA 60d" },
  { symbol: "NVDA", strike: 900, expiry_days: 14, label: "NVDA 14d" },
  { symbol: "SPY",  strike: 520, expiry_days: 90, label: "SPY  90d" },
];

export default function ComparePage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive]   = useState(0);

  async function runAll() {
    setLoading(true); setResults([]);
    const out = await Promise.all(
      PRESETS.map(p => priceOption({ ...p, volatility: null, risk_free_rate: 0.05, model: "both", n_paths: 10000 }).catch(() => null))
    );
    setResults(out.filter(Boolean));
    setLoading(false);
  }

  const current = results[active];

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, padding: "80px 32px 32px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
          Model <span style={{ color: "var(--accent-purple)" }}>Comparison</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 24 }}>
          Black-Scholes vs Monte Carlo across multiple tickers and maturities
        </p>

        <button className="btn-primary" onClick={runAll} disabled={loading}
          style={{ marginBottom: 24 }}>
          {loading ? <><span className="spinner" /> Running all models...</> : "⚡ Run All Presets"}
        </button>

        {results.length > 0 && (
          <>
            {/* Preset tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {results.map((r, i) => (
                <button key={i} onClick={() => setActive(i)}
                  style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid", cursor: "pointer",
                    background: active === i ? "rgba(168,85,247,0.15)" : "rgba(10,21,32,0.6)",
                    borderColor: active === i ? "var(--accent-purple)" : "var(--border)",
                    color: active === i ? "var(--accent-purple)" : "var(--text-secondary)",
                    fontSize: "0.82rem", fontWeight: 600 }}>
                  {PRESETS[i]?.label ?? `Result ${i + 1}`}
                </button>
              ))}
            </div>

            {current && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Comparison bar */}
                <div className="glass-card" style={{ padding: 20 }}>
                  <div className="section-title">📊 BS vs Monte Carlo</div>
                  <ComparisonChart data={current} />
                </div>

                {/* Payoff */}
                <div className="glass-card" style={{ padding: 20 }}>
                  <div className="section-title">📉 Payoff at Expiry</div>
                  <PayoffChart data={current} />
                </div>

                {/* Table */}
                <div className="glass-card" style={{ padding: 20, gridColumn: "span 2" }}>
                  <div className="section-title">📋 Price Summary Table</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.83rem" }}>
                    <thead>
                      <tr style={{ color: "var(--text-muted)", textAlign: "left" }}>
                        {["Metric", "Black-Scholes", "Monte Carlo", "Diff"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.08em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Call Price", current.black_scholes?.call_price, current.monte_carlo?.call_price],
                        ["Put Price",  current.black_scholes?.put_price,  current.monte_carlo?.put_price],
                        ["Spot Price", current.current_price, current.current_price],
                        ["Strike",     current.strike, current.strike],
                        ["Volatility (σ)", (current.volatility * 100).toFixed(2) + "%", (current.volatility * 100).toFixed(2) + "%"],
                      ].map(([label, bs, mc]) => {
                        const diff = typeof bs === "number" && typeof mc === "number" ? (mc - bs).toFixed(4) : "--";
                        return (
                          <tr key={String(label)} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{label}</td>
                            <td style={{ padding: "10px 12px", color: "var(--accent-purple)" }}>{typeof bs === "number" ? `$${bs}` : bs}</td>
                            <td style={{ padding: "10px 12px", color: "var(--accent-cyan)" }}>{typeof mc === "number" ? `$${mc}` : mc}</td>
                            <td style={{ padding: "10px 12px", color: typeof diff === "string" ? "var(--text-muted)" : Number(diff) > 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                              {typeof diff === "string" ? diff : `${Number(diff) > 0 ? "+" : ""}${diff}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && results.length === 0 && (
          <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>⚡</div>
            <div style={{ color: "var(--text-secondary)" }}>Click "Run All Presets" to compare models across multiple assets</div>
          </div>
        )}
      </main>
    </>
  );
}
