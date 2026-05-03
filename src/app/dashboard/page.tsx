"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ControlPanel, { PricingParams } from "@/components/ControlPanel";
import PriceSummary from "@/components/PriceSummary";
import GreeksPanel from "@/components/GreeksPanel";
import { PayoffChart, MCPathsChart, HistogramChart } from "@/components/Charts";
import MLAnalysisPanel from "@/components/MLAnalysisPanel";
import { fetchMarketData, priceOption } from "@/lib/api";

export default function DashboardPage() {
  const [result, setResult]       = useState<any>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [marketPrice, setMarketPrice] = useState<number | undefined>();

  // Pre-fetch market price when symbol changes
  async function handleSymbolFetch(symbol: string) {
    try {
      const d = await fetchMarketData(symbol);
      setMarketPrice(d.current_price);
    } catch {}
  }

  useEffect(() => { handleSymbolFetch("AAPL"); }, []);

  async function handleRun(params: PricingParams) {
    setLoading(true); setError(null);
    console.log("[QuantEdge] Running model with params:", params);
    try {
      const data = await priceOption(params);
      console.log("[QuantEdge] Result received:", data);
      setResult(data);
    } catch (e: any) {
      const msg = e?.message ?? "Unknown error";
      console.error("[QuantEdge] API error:", e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ padding: "24px 32px 0" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Options Pricing <span style={{ color: "var(--accent-cyan)" }}>Dashboard</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 4 }}>
            Black-Scholes & Monte Carlo pricing engine · Real-time Greeks · Live market data
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ margin: "16px 32px 0", padding: "12px 16px", borderRadius: 10,
            background: "rgba(255,69,96,0.1)", border: "1px solid rgba(255,69,96,0.3)", color: "#ff4560", fontSize: "0.82rem" }}>
            ⚠ {error} — Make sure the backend is running: <code style={{ fontFamily: "var(--font-mono)" }}>python -m backend.main</code>
          </div>
        )}

        {/* Responsive Flex layout */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: "20px 32px", alignItems: "start", justifyContent: "center" }}>

          {/* LEFT: Controls */}
          <div style={{ flex: "1 1 300px", maxWidth: 450, minWidth: 280 }}>
            <ControlPanel onSubmit={handleRun} loading={loading} currentPrice={marketPrice} />
          </div>

          {/* CENTER: Charts */}
          <div style={{ flex: "2 1 500px", minWidth: 320, display: "flex", flexDirection: "column", gap: 16 }}>
            <PriceSummary data={result} />

            {!result && !loading && (
              <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>📊</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Configure parameters and run the model
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 8 }}>
                  Payoff diagrams, Monte Carlo paths, and price distribution will appear here
                </div>
              </div>
            )}

            {loading && (
              <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
                <div className="spinner" style={{ width: 40, height: 40, margin: "0 auto 16px" }} />
                <div style={{ color: "var(--text-secondary)" }}>Running simulation...</div>
              </div>
            )}

            {result && (
              <>
                <MLAnalysisPanel data={result} />
                
                <div className="glass-card" style={{ padding: 20 }}>
                  <div className="section-title">📉 Payoff Diagram</div>
                  <PayoffChart data={result} />
                </div>

                {result.monte_carlo && (
                  <>
                    <div className="glass-card" style={{ padding: 20 }}>
                      <div className="section-title">🎲 Monte Carlo Paths</div>
                      <MCPathsChart data={result} />
                      {result.monte_carlo.final_prices_stats && (
                        <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap" }}>
                          {Object.entries(result.monte_carlo.final_prices_stats).map(([k, v]: any) => (
                            <div key={k} style={{ fontSize: "0.75rem" }}>
                              <span style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.65rem" }}>{k}: </span>
                              <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>${Number(v).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="glass-card" style={{ padding: 20 }}>
                      <div className="section-title">📊 Price Distribution</div>
                      <HistogramChart data={result} />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* RIGHT: Greeks */}
          <div style={{ flex: "1 1 300px", maxWidth: 450, minWidth: 280 }}>
            <GreeksPanel data={result} />
          </div>
        </div>
      </main>
    </>
  );
}
