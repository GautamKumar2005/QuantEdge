"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/compare",   label: "Model Compare" },
  { href: "/risk",      label: "Risk Surface" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 32px",
      background: "rgba(5,10,15,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(30,80,130,0.3)",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, #00d2ff, #007eaf)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px rgba(0,210,255,0.4)",
          fontSize: "1rem", fontWeight: 800, color: "#fff",
        }}>Q</div>
        <span style={{ fontWeight: 700, fontSize: "1rem", color: "#e2eaf4", letterSpacing: "0.02em" }}>
          Quant<span style={{ color: "#00d2ff" }}>Edge</span>
        </span>
        <span style={{
          fontSize: "0.62rem", padding: "2px 8px", borderRadius: 20,
          background: "rgba(0,255,157,0.1)", border: "1px solid rgba(0,255,157,0.3)",
          color: "#00ff9d", fontWeight: 600, letterSpacing: "0.08em",
        }}>LIVE</span>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 4 }}>
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link ${pathname?.startsWith(href) ? "active" : ""}`}
          >
            {label}
          </Link>
        ))}
      </div>

    </nav>
  );
}
