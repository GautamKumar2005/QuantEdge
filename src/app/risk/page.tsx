"use client";
import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";
import { fetchGreeksSurface } from "@/lib/api";

const Plot = dynamic(() => 
  import("react-plotly.js/factory").then((mod) => {
    const Plotly = require("plotly.js-dist-min");
    return mod.default(Plotly);
  }), 
  { ssr: false }
);

const LAYOUT_BASE = {
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { family: "JetBrains Mono, monospace", color: "#7b9ab7", size: 10 },
  margin: { l: 40, r: 20, t: 40, b: 60 },
};

const GREEKS = [
  { id: "delta", name: "Delta (Δ)", surfaceKey: "delta_surface", colorscale: [["0","#ff4560"],["0.5","#ffa500"],["1","#00ff9d"]], desc: "Sensitivity to stock price changes" },
  { id: "gamma", name: "Gamma (Γ)", surfaceKey: "gamma_surface", colorscale: "Viridis", desc: "Rate of change of Delta (Curvature Risk)" },
  { id: "vega",  name: "Vega (ν)",  surfaceKey: "vega_surface",  colorscale: "Plasma",  desc: "Sensitivity to volatility changes" },
  { id: "theta", name: "Theta (Θ)", surfaceKey: "theta_surface", colorscale: "Inferno", desc: "Time decay per day" },
];

export default function RiskPage() {
  const [surface, setSurface] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol]   = useState("AAPL");
  const [strike, setStrike]   = useState(150);
  const [selectedGreekId, setSelectedGreekId] = useState("delta");

  async function load() {
    setLoading(true);
    try { setSurface(await fetchGreeksSurface(symbol, strike, 0.05)); }
    catch (e) { console.error("Error loading surface", e); }
    setLoading(false);
  }

  const selectedGreek = GREEKS.find(g => g.id === selectedGreekId)!;

  // Calculate detailed stats dynamically
  const stats = useMemo(() => {
    if (!surface) return null;
    const zData = surface[selectedGreek.surfaceKey];
    if (!zData) return null; // Safe guard against stale backend responses

    let maxVal = -Infinity;
    let minVal = Infinity;
    let maxExp = 0, maxVol = 0;
    
    for (let i = 0; i < zData.length; i++) {
      if (!zData[i]) continue;
      for (let j = 0; j < zData[i].length; j++) {
        const v = zData[i][j];
        if (v > maxVal) { maxVal = v; maxExp = surface.expiries[i]; maxVol = surface.vols[j]; }
        if (v < minVal) { minVal = v; }
      }
    }
    
    return { maxVal, minVal, maxExp, maxVol };
  }, [surface, selectedGreek]);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, padding: "80px 32px 32px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
          Risk <span style={{ color: "var(--accent-red)" }}>Surface</span> Analytics
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 24 }}>
          Multi-dimensional Greek analysis across time-to-expiry and implied volatility
        </p>

        {/* Controls */}
        <div className="glass-card" style={{ display: "flex", flexWrap: "wrap", gap: 20, padding: 20, marginBottom: 24, alignItems: "flex-end" }}>
          <div>
            <label className="field-label">Symbol</label>
            <select className="select-field" style={{ width: 140 }} value={symbol} onChange={e => setSymbol(e.target.value)}>
              {["AAPL","TSLA","NVDA","SPY","MSFT"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Strike ($)</label>
            <input type="number" className="input-field" style={{ width: 140 }} value={strike} onChange={e => setStrike(+e.target.value)} />
          </div>
          <div>
            <label className="field-label">Analyze Greek</label>
            <select className="select-field" style={{ width: 160 }} value={selectedGreekId} onChange={e => setSelectedGreekId(e.target.value)}>
              {GREEKS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={load} disabled={loading} style={{ minWidth: 200 }}>
            {loading ? <><span className="spinner" /> Computing Grid...</> : "🗺 Generate Surface"}
          </button>
        </div>

        {surface && stats && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "start" }}>
            
            {/* LEFT COLUMN: Insights & Stats */}
            <div style={{ flex: "1 1 300px", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 8 }}>
                  {selectedGreek.name} Insights
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 20 }}>
                  {selectedGreek.desc}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ padding: 12, borderRadius: 8, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Peak Exposure</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ff4560" }}>{stats.maxVal.toFixed(4)}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
                      Occurs at <span style={{ color: "var(--text-primary)" }}>{stats.maxExp} days</span> expiry 
                      with <span style={{ color: "var(--text-primary)" }}>{stats.maxVol * 100}%</span> Volatility
                    </div>
                  </div>

                  <div style={{ padding: 12, borderRadius: 8, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Minimum Exposure</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "#00d2ff" }}>{stats.minVal.toFixed(4)}</div>
                  </div>
                </div>
              </div>

              {/* 2D Slice */}
              <div className="glass-card" style={{ padding: 20 }}>
                <div className="section-title">📉 {selectedGreek.name} vs Expiry (σ=30%)</div>
                <Plot
                  data={[{
                    x: surface.expiries,
                    y: surface[selectedGreek.surfaceKey].map((row: number[]) => row[2] ?? 0),
                    type: "scatter", mode: "lines+markers",
                    line: { color: "#00d2ff", width: 2.5 },
                    marker: { color: "#00d2ff", size: 4 },
                  } as any]}
                  layout={{
                    ...LAYOUT_BASE,
                    margin: { l: 40, r: 10, t: 10, b: 40 },
                    xaxis: { title: "Days to Expiry", gridcolor: "rgba(30,80,130,0.2)" },
                    yaxis: { gridcolor: "rgba(30,80,130,0.2)" },
                  } as any}
                  useResizeHandler={true}
                  config={{ displayModeBar: false, responsive: true }}
                  style={{ width: "100%", height: 200 }}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: 3D Surface & Heatmap */}
            <div style={{ flex: "2 1 600px", display: "flex", flexDirection: "column", gap: 24 }}>
              
              <div className="glass-card" style={{ padding: 24 }}>
                <div className="section-title">📊 3D {selectedGreek.name} Surface</div>
                <Plot
                  data={[{
                    z: surface[selectedGreek.surfaceKey], x: surface.vols, y: surface.expiries,
                    type: "surface",
                    colorscale: selectedGreek.colorscale,
                    contours: { z: { show: true, usecolormap: true, project: { z: true } } },
                  } as any]}
                  layout={{
                    ...LAYOUT_BASE,
                    scene: {
                      xaxis: { title: "Volatility", color: "#7b9ab7", gridcolor: "rgba(30,80,130,0.3)" },
                      yaxis: { title: "Days to Expiry", color: "#7b9ab7", gridcolor: "rgba(30,80,130,0.3)" },
                      zaxis: { title: selectedGreek.name, color: "#7b9ab7", gridcolor: "rgba(30,80,130,0.3)" },
                      bgcolor: "rgba(0,0,0,0)",
                    },
                    margin: { l: 0, r: 0, t: 0, b: 0 },
                  } as any}
                  useResizeHandler={true}
                  config={{ displayModeBar: false, responsive: true }}
                  style={{ width: "100%", height: 500 }}
                />
              </div>

            </div>
          </div>
        )}

        {!surface && !loading && (
          <div className="glass-card" style={{ padding: 80, textAlign: "center", marginTop: 24 }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🧭</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)" }}>Explore Volatility Dynamics</div>
            <div style={{ color: "var(--text-secondary)", marginTop: 8 }}>Select an option strike and generate the surface to identify critical risk zones.</div>
          </div>
        )}
      </main>
    </>
  );
}
