"use client";

interface Props { data: any }

function PriceCard({ label, value, sub, color }: any) {
  return (
    <div style={{
      flex: 1, padding: "18px 20px", borderRadius: 12,
      background: "rgba(10,21,32,0.7)", border: `1px solid ${color}40`,
      boxShadow: `0 0 20px ${color}15`,
    }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "2rem", fontWeight: 700, color }}>
        {value !== undefined ? `$${Number(value).toFixed(2)}` : "—"}
      </div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function PriceSummary({ data }: Props) {
  if (!data) return null;
  const bs = data.black_scholes;
  const mc = data.monte_carlo;
  const bt = data.binomial_tree;
  const primary = bs ?? bt ?? mc;

  const buildSub = () => {
    let parts = [];
    if (bs) parts.push(`BS: $${bs.call_price}`);
    if (bt) parts.push(`BT: $${bt.call_price}`);
    if (mc) parts.push(`MC: $${mc.call_price}`);
    return parts.length > 1 ? parts.join(' · ') : undefined;
  };
  const buildSubPut = () => {
    let parts = [];
    if (bs) parts.push(`BS: $${bs.put_price}`);
    if (bt) parts.push(`BT: $${bt.put_price}`);
    if (mc) parts.push(`MC: $${mc.put_price}`);
    return parts.length > 1 ? parts.join(' · ') : undefined;
  };

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div className="section-title">💵 Option Prices</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <PriceCard label="Call Price" value={primary?.call_price} color="#00ff9d" sub={buildSub()} />
        <PriceCard label="Put Price" value={primary?.put_price} color="#ff4560" sub={buildSubPut()} />
        <PriceCard label="Intrinsic (Call)" value={bs?.intrinsic_call} color="#00d2ff" sub="Max(S-K, 0)" />
        <PriceCard label="Intrinsic (Put)" value={bs?.intrinsic_put} color="#a855f7" sub="Max(K-S, 0)" />
      </div>

      {/* Model badges */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {bs && <span className="model-badge bs">● Black-Scholes</span>}
        {bt && <span className="model-badge mc" style={{ background: "rgba(255, 165, 0, 0.15)", borderColor: "rgba(255, 165, 0, 0.35)", color: "var(--accent-amber)" }}>
          ● Binomial Tree {bt.is_american ? "(American)" : "(European)"}
        </span>}
        {mc && <span className="model-badge mc">● Monte Carlo ({mc.n_paths?.toLocaleString()} paths · {mc.engine})</span>}
      </div>

      {/* Market info */}
      <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          ["Symbol", data.symbol],
          ["Spot", `$${data.current_price}`],
          ["Strike", `$${data.strike}`],
          ["Expiry", `${data.expiry_days}d`],
          ["Vol", data.volatility != null ? `${(data.volatility * 100).toFixed(1)}%` : "Auto"],
          ["Rate", `${(data.risk_free_rate * 100).toFixed(1)}%`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 6, fontSize: "0.75rem" }}>
            <span style={{ color: "var(--text-muted)" }}>{k}:</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
