"use client";

interface Props { data: any }

export default function MLAnalysisPanel({ data }: Props) {
  const ml = data?.ml_analysis;
  if (!ml) return null;

  // Determine color based on probability
  const prob = ml.success_probability;
  const probColor = prob > 70 ? "#00ff9d" : prob > 40 ? "#ffa500" : "#ff4560";

  return (
    <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", padding: "6px 12px", borderRadius: 8, fontSize: "1.1rem", fontWeight: 700 }}>
          🤖 AI Trade Analysis
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Powered by Random Forest & KMeans</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {/* Probability Score */}
        <div style={{ background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Success Probability</div>
          <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
            <span style={{ fontSize: "2.5rem", fontWeight: 800, color: probColor, lineHeight: 1 }}>{prob}%</span>
          </div>
          <div style={{ marginTop: 12, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${prob}%`, background: probColor, transition: "width 1s ease-out" }} />
          </div>
        </div>

        {/* Risk Cluster */}
        <div style={{ background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Risk Profile (K-Means)</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#00d2ff", marginTop: 4 }}>
            {ml.risk_cluster}
          </div>
        </div>
      </div>

      {/* AI Insights list */}
      <div>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>Algorithmic Insights:</div>
        <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {ml.insights.map((insight: string, i: number) => (
            <li key={i} style={{ display: "flex", gap: 10, fontSize: "0.85rem", color: "var(--text-secondary)", alignItems: "flex-start", background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: 8 }}>
              <span style={{ color: "#a855f7" }}>✨</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Feature Importances Mini-Bar */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Model Feature Importances</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Object.entries(ml.feature_importance).map(([k, v]: any) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{k}</div>
              <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
