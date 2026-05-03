"use client";
import dynamic from "next/dynamic";

// Use plotly factory with minimal dist to avoid huge bundle size and Turbopack issues
const Plot = dynamic(() => 
  import("react-plotly.js/factory").then((mod) => {
    const Plotly = require("plotly.js-dist-min");
    return mod.default(Plotly);
  }), 
  { ssr: false }
);

interface Props { data: any }

const LAYOUT_BASE = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor:  "rgba(0,0,0,0)",
  font: { family: "JetBrains Mono, monospace", color: "#7b9ab7", size: 11 },
  xaxis: { gridcolor: "rgba(30,80,130,0.2)", zerolinecolor: "rgba(30,80,130,0.3)" },
  yaxis: { gridcolor: "rgba(30,80,130,0.2)", zerolinecolor: "rgba(30,80,130,0.3)" },
  margin: { l: 50, r: 20, t: 30, b: 50 },
  legend: { bgcolor: "rgba(0,0,0,0)", font: { color: "#7b9ab7" } },
};

/* ── Payoff Diagram ────────────────────────── */
export function PayoffChart({ data }: Props) {
  if (!data?.payoff) return null;
  const { stock_prices, call_payoff, put_payoff } = data.payoff;
  const traces = [
    { x: stock_prices, y: call_payoff, name: "Call P&L", type: "scatter", mode: "lines",
      line: { color: "#00ff9d", width: 2.5 }, fill: "tozeroy", fillcolor: "rgba(0,255,157,0.06)" },
    { x: stock_prices, y: put_payoff, name: "Put P&L", type: "scatter", mode: "lines",
      line: { color: "#ff4560", width: 2.5 }, fill: "tozeroy", fillcolor: "rgba(255,69,96,0.06)" },
    { x: [data.strike, data.strike], y: [Math.min(...call_payoff, ...put_payoff), Math.max(...call_payoff, ...put_payoff)],
      name: "Strike", type: "scatter", mode: "lines",
      line: { color: "rgba(0,210,255,0.5)", width: 1.5, dash: "dash" } },
  ];
  return (
    <Plot data={traces as any}
      layout={{ ...LAYOUT_BASE, title: { text: "Payoff Diagram at Expiry", font: { color: "#e2eaf4", size: 13 } } } as any}
      useResizeHandler={true}
      config={{ displayModeBar: false, responsive: true }} style={{ width: "100%", height: 300 }} />
  );
}

/* ── Monte Carlo Paths ──────────────────────── */
export function MCPathsChart({ data }: Props) {
  if (!data?.monte_carlo?.paths) return null;
  const paths: number[][] = data.monte_carlo.paths.slice(0, 200);
  const n_steps = paths[0].length;
  const x = Array.from({ length: n_steps }, (_, i) => i);

  const traces = paths.map((path, i) => ({
    x, y: path, type: "scatter", mode: "lines",
    line: { color: `rgba(0,210,255,${0.04 + (i / paths.length) * 0.08})`, width: 0.8 },
    showlegend: false, hoverinfo: "skip",
  }));

  // Mean path (approximate: just the last values)
  const meanPath = x.map(step => {
    const vals = paths.map(p => p[step] ?? 0);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  traces.push({
    x, y: meanPath, type: "scatter", mode: "lines",
    line: { color: "#00ff9d", width: 2.5 } as any,
    name: "Expected Path", showlegend: true, hoverinfo: "y" as any,
  });

  return (
    <Plot data={traces as any}
      layout={{ ...LAYOUT_BASE, title: { text: `Monte Carlo Paths (${paths.length} shown)`, font: { color: "#e2eaf4", size: 13 } } } as any}
      useResizeHandler={true}
      config={{ displayModeBar: false, responsive: true }} style={{ width: "100%", height: 300 }} />
  );
}

/* ── Price Distribution Histogram ───────────── */
export function HistogramChart({ data }: Props) {
  const mc = data?.monte_carlo;
  if (!mc?.histogram) return null;
  const { prices, density } = mc.histogram;
  const stats = mc.final_prices_stats;

  const traces: any[] = [
    { x: prices, y: density, type: "bar", name: "Price Distribution",
      marker: { color: prices.map((p: number) => p >= data.strike ? "rgba(0,255,157,0.7)" : "rgba(255,69,96,0.7)") },
      width: (prices[1] - prices[0]) * 0.9 },
    { x: [data.strike, data.strike], y: [0, Math.max(...density)],
      type: "scatter", mode: "lines", name: "Strike",
      line: { color: "#00d2ff", width: 2, dash: "dash" } },
  ];
  if (stats) {
    traces.push(
      { x: [stats.mean, stats.mean], y: [0, Math.max(...density) * 0.7],
        type: "scatter", mode: "lines", name: `Mean $${stats.mean}`,
        line: { color: "#ffa500", width: 1.5, dash: "dot" } },
    );
  }

  return (
    <Plot data={traces}
      layout={{ ...LAYOUT_BASE, barmode: "overlay",
        title: { text: "Final Price Distribution", font: { color: "#e2eaf4", size: 13 } } } as any}
      useResizeHandler={true}
      config={{ displayModeBar: false, responsive: true }} style={{ width: "100%", height: 300 }} />
  );
}

/* ── Comparison Bar ─────────────────────────── */
export function ComparisonChart({ data }: Props) {
  if (!data?.black_scholes || !data?.monte_carlo) return null;
  const bs = data.black_scholes;
  const mc = data.monte_carlo;

  const traces: any[] = [
    { x: ["Call", "Put"], y: [bs.call_price, bs.put_price],
      name: "Black-Scholes", type: "bar",
      marker: { color: ["rgba(168,85,247,0.8)", "rgba(168,85,247,0.5)"] },
      text: [`$${bs.call_price}`, `$${bs.put_price}`], textposition: "auto" },
    { x: ["Call", "Put"], y: [mc.call_price, mc.put_price],
      name: "Monte Carlo", type: "bar",
      marker: { color: ["rgba(0,210,255,0.8)", "rgba(0,210,255,0.5)"] },
      text: [`$${mc.call_price}`, `$${mc.put_price}`], textposition: "auto" },
  ];

  return (
    <Plot data={traces}
      layout={{ ...LAYOUT_BASE, barmode: "group",
        title: { text: "Model Comparison: BS vs Monte Carlo", font: { color: "#e2eaf4", size: 13 } } } as any}
      useResizeHandler={true}
      config={{ displayModeBar: false, responsive: true }} style={{ width: "100%", height: 280 }} />
  );
}
