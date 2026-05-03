"use client";

interface Props { data: any }

function GreekRow({ symbol, name, value, bar, color }: any) {
  const pct = Math.min(Math.abs(bar) * 100, 100);
  return (
    <div className="greek-row">
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
        <span className="greek-symbol">{symbol}</span>
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{name}</div>
          <div className="greek-name">{getGreekDesc(name)}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="greek-bar">
          <div className="greek-bar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="greek-value" style={{ color, minWidth: 64, textAlign: "right" }}>
          {typeof value === "number" ? value.toFixed(4) : "--"}
        </span>
        <span style={{ fontSize: "0.8rem" }}>{value > 0 ? "↑" : "↓"}</span>
      </div>
    </div>
  );
}

function getGreekDesc(name: string) {
  const map: Record<string, string> = {
    Delta: "Price sensitivity", Gamma: "Curvature risk",
    Vega: "Vol sensitivity", Theta: "Time decay",
    Rho: "Rate sensitivity",
  };
  return map[name] ?? "";
}

export default function GreeksPanel({ data }: Props) {
  const g = data?.greeks;
  if (!g) return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div className="section-title">📌 Greeks Dashboard</div>
      <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: "0.85rem" }}>
        Run a model to see Greeks
      </div>
    </div>
  );

  const rows = [
    { symbol: "Δ", name: "Delta", value: g.delta_call, bar: g.delta_call, color: "#00d2ff" },
    { symbol: "Γ", name: "Gamma", value: g.gamma,      bar: g.gamma * 10, color: "#a855f7" },
    { symbol: "ν", name: "Vega",  value: g.vega,       bar: g.vega / 20,  color: "#ffa500" },
    { symbol: "Θ", name: "Theta", value: g.theta_call, bar: Math.abs(g.theta_call) * 10, color: "#ff4560" },
    { symbol: "ρ", name: "Rho",   value: g.rho_call,   bar: g.rho_call / 5, color: "#00ff9d" },
  ];

  return (
    <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="section-title">📌 Greeks Dashboard</div>
      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: -8 }}>Call option sensitivities</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(r => <GreekRow key={r.name} {...r} />)}
      </div>

      {/* Put Delta */}
      <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(10,21,32,0.4)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Put Greeks</div>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Δ Put</div>
            <div style={{ fontFamily: "var(--font-mono)", color: "#ff4560", fontWeight: 600 }}>{g.delta_put.toFixed(4)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Θ Put</div>
            <div style={{ fontFamily: "var(--font-mono)", color: "#ffa500", fontWeight: 600 }}>{g.theta_put.toFixed(4)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>ρ Put</div>
            <div style={{ fontFamily: "var(--font-mono)", color: "#a855f7", fontWeight: 600 }}>{g.rho_put.toFixed(4)}</div>
          </div>
        </div>
      </div>

      {/* Vol & expiry info */}
      {data.volatility && (
        <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(0,210,255,0.05)", border: "1px solid rgba(0,210,255,0.15)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          σ = <span style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>{(data.volatility * 100).toFixed(1)}%</span>
          &nbsp;·&nbsp; T = <span style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>{data.expiry_days}d</span>
          &nbsp;·&nbsp; r = <span style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>{(data.risk_free_rate * 100).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
