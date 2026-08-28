"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, Globe, ExternalLink, RefreshCw, 
  ArrowLeft, Terminal, Moon, Compass, Sun, Shield
} from "lucide-react";

export default function AstrologyStudio() {
  const [serviceUrl, setServiceUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("samai_astrology_url") || process.env.NEXT_PUBLIC_ASTROLOGY_URL || "http://localhost:3001";
    }
    return "http://localhost:3001";
  });

  const [customInput, setCustomInput] = useState(serviceUrl);
  const [iframeKey, setIframeKey] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isLive, setIsLive] = useState<boolean | null>(null);

  const checkHealth = async (urlToCheck: string) => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch(urlToCheck, { mode: "no-cors", signal: controller.signal });
      clearTimeout(timeoutId);
      setIsLive(true);
    } catch {
      setIsLive(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth(serviceUrl);
  }, [serviceUrl]);

  const handleApplyUrl = (url: string) => {
    const formatted = url.trim();
    if (formatted) {
      setServiceUrl(formatted);
      setCustomInput(formatted);
      if (typeof window !== "undefined") {
        localStorage.setItem("samai_astrology_url", formatted);
      }
      setIframeKey(k => k + 1);
    }
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0a0b10", color: "#f3f4f6", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Top Header Navigation ── */}
      <header style={{ padding: "10px 20px", background: "rgba(15, 17, 26, 0.95)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/modules" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", padding: "6px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <ArrowLeft size={14} /> Back
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                Astrology Engine (Enterprise)
                <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "12px", background: isLive ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)", border: `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`, color: isLive ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>
                  {isChecking ? "Checking..." : isLive ? "● Online" : "○ Offline / Standby"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* URL Selector & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "2px 8px" }}>
            <Globe size={14} color="#9ca3af" style={{ marginRight: "6px" }} />
            <input 
              type="text" 
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="http://localhost:3001 or https://your-astrology.vercel.app"
              style={{ background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: "0.82rem", width: "240px", fontFamily: "monospace" }}
              onKeyDown={e => { if (e.key === "Enter") handleApplyUrl(customInput); }}
            />
            <button 
              onClick={() => handleApplyUrl(customInput)}
              style={{ background: "var(--primary)", border: "none", color: "#fff", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", marginLeft: "4px" }}
            >
              Connect
            </button>
          </div>

          <div style={{ display: "flex", gap: "4px" }}>
            <button 
              onClick={() => { handleApplyUrl("http://localhost:3001"); }}
              style={{ background: serviceUrl.includes("localhost") ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db", padding: "5px 10px", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer" }}
              title="Set to Local Microservice (Port 3001)"
            >
              Local (3001)
            </button>
            <button 
              onClick={() => { setIframeKey(k => k + 1); checkHealth(serviceUrl); }}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db", padding: "5px 8px", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center" }}
              title="Reload Frame"
            >
              <RefreshCw size={12} className={isChecking ? "animate-spin" : ""} />
            </button>
            <a 
              href={serviceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db", padding: "5px 8px", borderRadius: "6px", fontSize: "0.75rem", textDecoration: "none", display: "flex", alignItems: "center" }}
              title="Open in new tab"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Content View ── */}
      <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", background: "#050608" }}>
        <div style={{ flex: 1, position: "relative", width: "100%", height: "calc(100vh - 58px)" }}>
          <iframe 
            key={iframeKey}
            src={serviceUrl} 
            style={{ width: "100%", height: "100%", border: "none", background: "#0c0d14" }}
            title="Astrology Studio"
            allow="fullscreen"
          />

          {/* Smart Overlay Fallback banner when not running locally */}
          {isLive === false && serviceUrl.includes("localhost") && (
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 11, 16, 0.96)",
              backdropFilter: "blur(8px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
              zIndex: 10
            }}>
              <div style={{ maxWidth: "680px", width: "100%", textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                  <Sparkles size={32} color="#8b5cf6" />
                </div>

                <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.8rem", color: "#fff" }}>
                  Astrology Engine Standby
                </h2>
                <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                  Astrology Engine runs as an independent Next.js microservice. You can run it locally on your computer or connect to a live cloud deployment.
                </p>

                {/* Option 1: Start Locally */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1.2rem", textAlign: "left", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#8b5cf6", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                    <Terminal size={16} /> Option 1: Run Local Microservice (Port 3001)
                  </div>
                  <div style={{ background: "#000", padding: "0.8rem 1rem", borderRadius: "8px", fontFamily: "monospace", fontSize: "0.82rem", color: "#e5e7eb", overflowX: "auto" }}>
                    cd super_app_projects/methjothisa && npm run dev -- -p 3001
                  </div>
                </div>

                {/* Option 2: Deploy to Cloud */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1.2rem", textAlign: "left", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#6366f1", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                    <Globe size={16} /> Option 2: Connect Deployed Cloud URL
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#9ca3af", marginBottom: "0.8rem" }}>
                    Deploy <code style={{ color: "#818cf8" }}>super_app_projects/methjothisa</code> to Vercel/Railway and paste the URL in the bar above.
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={() => {
                        const url = prompt("Enter your deployed Astrology URL:", "https://");
                        if (url) handleApplyUrl(url);
                      }}
                      style={{ background: "#8b5cf6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      Set Live Cloud URL
                    </button>
                    <button 
                      onClick={() => checkHealth(serviceUrl)}
                      style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer" }}
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>

                {/* Feature Highlights Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.8rem", textAlign: "left" }}>
                  {[
                    { icon: Sun, title: "Birth Charts (Kundli)", desc: "Vedic Rasi & Navamsha analysis" },
                    { icon: Moon, title: "Dasha & Transit", desc: "Planetary period forecasting" },
                    { icon: Compass, title: "Compatibility Engine", desc: "Porutham & Match calculation" },
                  ].map((feat, i) => (
                    <div key={i} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "0.8rem" }}>
                      <feat.icon size={16} color="#8b5cf6" style={{ marginBottom: "0.3rem" }} />
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e5e7eb" }}>{feat.title}</div>
                      <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{feat.desc}</div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
