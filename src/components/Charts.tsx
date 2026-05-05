"use client";
import dynamic from "next/dynamic";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, AreaChart, Area, ReferenceLine } from "recharts";

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
  const chartData = stock_prices.map((price: number, i: number) => ({
    price: Number(price.toFixed(2)),
    Call: Number(call_payoff[i].toFixed(2)),
    Put: Number(put_payoff[i].toFixed(2))
  }));

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,80,130,0.2)" vertical={false} />
          <XAxis dataKey="price" stroke="#7b9ab7" tick={{ fill: "#7b9ab7", fontSize: 11 }} />
          <YAxis stroke="#7b9ab7" tick={{ fill: "#7b9ab7", fontSize: 11 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: "rgba(10,21,32,0.9)", border: "1px solid var(--border)", borderRadius: 8, color: "#e2eaf4" }}
            itemStyle={{ fontSize: "0.85rem" }}
          />
          <Legend wrapperStyle={{ fontSize: "0.85rem", color: "#7b9ab7" }} />
          <ReferenceLine x={data.strike} stroke="rgba(0,210,255,0.5)" strokeDasharray="3 3" label={{ position: 'top', value: 'Strike', fill: 'rgba(0,210,255,0.5)', fontSize: 10 }} />
          <Area type="monotone" dataKey="Call" name="Call P&L" stroke="#00ff9d" fill="rgba(0,255,157,0.1)" strokeWidth={2} />
          <Area type="monotone" dataKey="Put" name="Put P&L" stroke="#ff4560" fill="rgba(255,69,96,0.1)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Monte Carlo Paths ──────────────────────── */
export function MCPathsChart({ data }: Props) {
  if (!data?.monte_carlo?.paths) return null;
  const paths: number[][] = data.monte_carlo.paths.slice(0, 200);
  const n_steps = paths[0].length;
  const x = Array.from({ length: n_steps }, (_, i) => i);

  const traces: any[] = paths.map((path, i) => ({
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
  const bt = data.binomial_tree;

  const chartData = [
    { name: "Call Price", BS: Number(bs.call_price.toFixed(3)), MC: Number(mc.call_price.toFixed(3)), BT: bt ? Number(bt.call_price.toFixed(3)) : undefined },
    { name: "Put Price", BS: Number(bs.put_price.toFixed(3)), MC: Number(mc.put_price.toFixed(3)), BT: bt ? Number(bt.put_price.toFixed(3)) : undefined },
  ];

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,80,130,0.2)" vertical={false} />
          <XAxis dataKey="name" stroke="#7b9ab7" tick={{ fill: "#7b9ab7", fontSize: 12 }} />
          <YAxis stroke="#7b9ab7" tick={{ fill: "#7b9ab7", fontSize: 11 }} />
          <Tooltip 
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{ backgroundColor: "rgba(10,21,32,0.9)", border: "1px solid var(--border)", borderRadius: 8, color: "#e2eaf4" }}
            formatter={(val: number) => `$${val.toFixed(3)}`}
          />
          <Legend wrapperStyle={{ fontSize: "0.85rem", color: "#7b9ab7", paddingTop: 10 }} />
          <Bar dataKey="BS" name="Black-Scholes" fill="rgba(168,85,247,0.8)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="MC" name="Monte Carlo" fill="rgba(0,210,255,0.8)" radius={[4, 4, 0, 0]} />
          {bt && <Bar dataKey="BT" name="Binomial Tree" fill="rgba(255,165,0,0.8)" radius={[4, 4, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
