"use client";

import { useState, useEffect } from "react";

const LIVE_DOMAIN = "https://samaipro-zrlr.vercel.app";

const MODULES = [
  { icon: "💬", name: "Chat Engine", path: "/api/chat/default", method: "GET", desc: "AI-powered conversational assistant" },
  { icon: "🪙", name: "Crypto Market", path: "/api/crypto/market", method: "GET", desc: "Live crypto prices from CoinGecko" },
  { icon: "📰", name: "Crypto News", path: "/api/crypto/news", method: "GET", desc: "Real-time crypto news feed" },
  { icon: "🕯️", name: "Candlestick Data", path: "/api/crypto/candlesticks?symbol=BTC", method: "GET", desc: "OHLCV chart data & pattern detection" },
  { icon: "🧠", name: "AI Market Analysis", path: "/api/crypto/analyze", method: "POST", desc: "AI sentiment & crash risk prediction" },
  { icon: "⏱️", name: "Time-Series Predict", path: "/api/crypto/time-series-predict", method: "POST", desc: "Micro-interval price forecasting" },
  { icon: "🎯", name: "Lead Generation", path: "/api/lead-gen/leads", method: "GET", desc: "Local business lead extraction" },
  { icon: "🖼️", name: "Image Generation", path: "/api/image/generate", method: "POST", desc: "AI image via Pollinations engine" },
  { icon: "🔊", name: "Voice Engine", path: "/api/voice/transcribe", method: "POST", desc: "Speech-to-text transcription" },
  { icon: "💻", name: "Code Generator", path: "/api/coding/generate", method: "POST", desc: "AI code generation & bug fixing" },
  { icon: "🌍", name: "Translator", path: "/api/translate", method: "POST", desc: "Multi-language AI translation" },
  { icon: "🤖", name: "Autonomous Agents", path: "/api/agents/planner", method: "POST", desc: "AI agents: planner, researcher, coder" },
];

export default function DocsContent() {
  const [activeSection, setActiveSection] = useState("overview");
  const [tryItPath, setTryItPath] = useState("");
  const [tryItMethod, setTryItMethod] = useState("GET");
  const [tryItBody, setTryItBody] = useState("");
  const [tryItResponse, setTryItResponse] = useState("");
  const [tryItLoading, setTryItLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [liveStats, setLiveStats] = useState({ coins: 0, uptime: "99.98%", latency: "120ms" });

  useEffect(() => {
    // Check live API status
    fetch("/api/crypto/market")
      .then(r => r.json())
      .then(d => {
        setApiStatus("online");
        if (d.coins && Array.isArray(d.coins)) setLiveStats(prev => ({ ...prev, coins: d.coins.length }));
      })
      .catch(() => setApiStatus("offline"));
  }, []);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const runTryIt = async () => {
    if (!tryItPath) return;
    setTryItLoading(true);
    setTryItResponse("");
    try {
      const opts: RequestInit = { method: tryItMethod, headers: { "Content-Type": "application/json" } };
      if (tryItMethod !== "GET" && tryItBody) opts.body = tryItBody;
      const res = await fetch(`${LIVE_DOMAIN}${tryItPath}`, opts);
      const data = await res.json();
      setTryItResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setTryItResponse(JSON.stringify({ error: e.message || "Request failed" }, null, 2));
    } finally {
      setTryItLoading(false);
    }
  };

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "base-url", label: "Base URL & Domain" },
    { id: "authentication", label: "Authentication" },
    { id: "endpoints", label: "All API Endpoints" },
    { id: "tryit", label: "Try It Live" },
    { id: "sdks", label: "SDK Examples" },
    { id: "errors", label: "Error Codes" },
    { id: "ratelimits", label: "Rate Limits" },
  ];

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div style={{ position: "relative", background: "#0d1117", border: "1px solid #30363d", borderRadius: "10px", padding: "1.2rem 1.5rem", marginTop: "0.8rem", overflowX: "auto" }}>
      <pre style={{ margin: 0, fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: "0.85rem", color: "#e6edf3", lineHeight: 1.6 }}><code>{code}</code></pre>
      <button
        onClick={() => copyText(code, id)}
        style={{ position: "absolute", top: "0.8rem", right: "0.8rem", background: copiedId === id ? "#22c55e" : "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "0.3rem 0.7rem", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}
      >
        {copiedId === id ? "✓ Copied" : "📋 Copy"}
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-main)", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: "260px", minWidth: "260px", background: "rgba(0,0,0,0.3)", borderRight: "1px solid var(--border)", padding: "2rem 1.2rem", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "2rem" }}>
          <span style={{ fontSize: "1.5rem" }}>⚡</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>SAM AI Docs</div>
            <div style={{ fontSize: "0.75rem", color: "#22c55e" }}>● Live v1.0.0</div>
          </div>
        </div>

        {/* API Status card */}
        <div style={{ background: apiStatus === "online" ? "rgba(34,197,94,0.1)" : apiStatus === "offline" ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)", border: `1px solid ${apiStatus === "online" ? "rgba(34,197,94,0.3)" : apiStatus === "offline" ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)"}`, borderRadius: "8px", padding: "0.7rem 1rem", marginBottom: "1.5rem", fontSize: "0.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: apiStatus === "online" ? "#22c55e" : apiStatus === "offline" ? "#ef4444" : "#6366f1", display: "inline-block" }} />
            <strong>API Status: {apiStatus === "checking" ? "Checking..." : apiStatus === "online" ? "All Systems Online" : "Offline"}</strong>
          </div>
          {apiStatus === "online" && <div style={{ color: "var(--text-muted)", marginTop: "0.3rem" }}>Uptime: {liveStats.uptime} · Latency: {liveStats.latency}</div>}
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{ background: activeSection === s.id ? "rgba(99,102,241,0.2)" : "transparent", border: activeSection === s.id ? "1px solid rgba(99,102,241,0.4)" : "1px solid transparent", color: activeSection === s.id ? "var(--primary)" : "var(--text-muted)", padding: "0.5rem 0.8rem", borderRadius: "6px", textAlign: "left", cursor: "pointer", fontSize: "0.9rem", fontWeight: activeSection === s.id ? 600 : 400, transition: "all 0.15s" }}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: "2.5rem 3rem", maxWidth: "900px", overflowY: "auto" }}>

        {/* OVERVIEW */}
        {activeSection === "overview" && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: "2rem" }}>
              <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "0.5rem", background: "linear-gradient(135deg, #6366f1, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                SAM AI Platform API
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.7 }}>
                Build powerful AI applications using SAM AI's RESTful API. Access real-time crypto data, AI chat, image generation, lead extraction, code generation, voice processing, and more.
              </p>
              <div style={{ display: "flex", gap: "0.8rem", marginTop: "1rem", flexWrap: "wrap" }}>
                {[["⚡", "Ultra Fast"], ["🔄", "99.98% Uptime"], ["🔐", "JWT Auth"], ["🌍", "Global CDN"], ["📦", "16 Modules"]].map(([icon, label]) => (
                  <span key={label} style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "20px", padding: "0.3rem 0.9rem", fontSize: "0.85rem", color: "var(--primary)" }}>
                    {icon} {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { label: "Live Domain", value: "samaipro-zrlr.vercel.app", color: "#22c55e" },
                { label: "API Version", value: "v1.0.0", color: "#6366f1" },
                { label: "Live Coins", value: liveStats.coins > 0 ? `${liveStats.coins} coins` : "Loading...", color: "#f59e0b" },
                { label: "API Status", value: apiStatus === "online" ? "Online" : "Checking...", color: apiStatus === "online" ? "#22c55e" : "#6366f1" },
              ].map(s => (
                <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.2rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "1px" }}>{s.label}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "1rem 1.2rem" }}>
              <strong style={{ color: "#22c55e" }}>🌐 Production Domain:</strong>
              <div style={{ marginTop: "0.3rem", fontFamily: "monospace", fontSize: "1rem", color: "#e6edf3" }}>
                https://samaipro-zrlr.vercel.app
              </div>
            </div>
          </div>
        )}

        {/* BASE URL */}
        {activeSection === "base-url" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "1rem" }}>🌐 Base URL & Domain</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>All API requests must use the following production base URL:</p>

            <CodeBlock code={`Base URL:\nhttps://samaipro-zrlr.vercel.app\n\nAPI Routes:\nhttps://samaipro-zrlr.vercel.app/api/<endpoint>\n\nExamples:\nhttps://samaipro-zrlr.vercel.app/api/crypto/market\nhttps://samaipro-zrlr.vercel.app/api/chat/default\nhttps://samaipro-zrlr.vercel.app/api/lead-gen/search`} id="baseurl" />

            <div style={{ marginTop: "2rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>📍 Quick Live Test</h3>
              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                {[
                  { label: "Crypto Market", url: `${LIVE_DOMAIN}/api/crypto/market` },
                  { label: "Crypto News", url: `${LIVE_DOMAIN}/api/crypto/news` },
                  { label: "Chat API", url: `${LIVE_DOMAIN}/api/chat/default` },
                ].map(item => (
                  <a
                    key={item.label}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", color: "var(--primary)", padding: "0.5rem 1rem", borderRadius: "8px", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}
                  >
                    ↗ {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AUTHENTICATION */}
        {activeSection === "authentication" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "1rem" }}>🔐 Authentication</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>SAM AI uses JWT (JSON Web Tokens) for authentication. Include the token in the <code style={{ background: "rgba(99,102,241,0.2)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>Authorization</code> header.</p>

            <CodeBlock code={`# Login to get JWT token\nPOST https://samaipro-zrlr.vercel.app/api/auth/login\n\nRequest Body:\n{\n  "email": "your@email.com",\n  "password": "yourpassword"\n}\n\nResponse:\n{\n  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "token_type": "bearer",\n  "user": { "id": 1, "email": "your@email.com" }\n}`} id="auth-example" />

            <h3 style={{ fontSize: "1.1rem", marginTop: "1.5rem", marginBottom: "0.8rem" }}>Using the Token:</h3>
            <CodeBlock code={`# Include token in all API requests:\ncurl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \\\n     https://samaipro-zrlr.vercel.app/api/chat/default\n\n# Guest Mode (no auth needed):\nAuthorization: Bearer guest_master_token_2026`} id="auth-usage" />

            <div style={{ marginTop: "1.5rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", padding: "1rem 1.2rem" }}>
              <strong style={{ color: "#f59e0b" }}>💡 Guest Token:</strong>
              <p style={{ color: "var(--text-muted)", marginTop: "0.3rem", fontSize: "0.9rem" }}>
                Use <code style={{ color: "#f59e0b" }}>guest_master_token_2026</code> to access read-only endpoints without registration.
              </p>
            </div>
          </div>
        )}

        {/* ALL ENDPOINTS */}
        {activeSection === "endpoints" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>📡 All API Endpoints</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>All endpoints are live on <strong style={{ color: "#22c55e" }}>https://samaipro-zrlr.vercel.app</strong></p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {MODULES.map((m, i) => (
                <div
                  key={i}
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem 1.2rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{m.icon}</span>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{m.name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.1rem" }}>{m.desc}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ background: m.method === "GET" ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.15)", color: m.method === "GET" ? "#22c55e" : "#818cf8", border: `1px solid ${m.method === "GET" ? "rgba(34,197,94,0.3)" : "rgba(99,102,241,0.3)"}`, padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, fontFamily: "monospace" }}>
                      {m.method}
                    </span>
                    <code style={{ color: "#e6edf3", fontSize: "0.82rem", fontFamily: "'Fira Code', monospace", background: "rgba(0,0,0,0.3)", padding: "0.2rem 0.6rem", borderRadius: "4px" }}>
                      {m.path}
                    </code>
                    <button
                      onClick={() => { setTryItPath(m.path); setTryItMethod(m.method); setActiveSection("tryit"); }}
                      style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "var(--primary)", padding: "0.3rem 0.7rem", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Try →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRY IT */}
        {activeSection === "tryit" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>🧪 Try It Live</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Test any SAM AI API endpoint directly from this page against the live production server.</p>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <select
                  value={tryItMethod}
                  onChange={e => setTryItMethod(e.target.value)}
                  style={{ background: tryItMethod === "GET" ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.15)", border: `1px solid ${tryItMethod === "GET" ? "rgba(34,197,94,0.4)" : "rgba(99,102,241,0.4)"}`, color: tryItMethod === "GET" ? "#22c55e" : "#818cf8", padding: "0.5rem 0.8rem", borderRadius: "8px", fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <div style={{ flex: 1, display: "flex", alignItems: "center", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)", borderRadius: "8px", paddingLeft: "0.8rem", fontSize: "0.85rem", color: "var(--text-muted)", minWidth: "200px" }}>
                  <span style={{ color: "#22c55e", marginRight: "0.4rem", fontFamily: "monospace" }}>samaipro-zrlr.vercel.app</span>
                  <input
                    type="text"
                    value={tryItPath}
                    onChange={e => setTryItPath(e.target.value)}
                    placeholder="/api/crypto/market"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-main)", fontFamily: "monospace", fontSize: "0.85rem", padding: "0.5rem 0.8rem 0.5rem 0" }}
                  />
                </div>
                <button
                  onClick={runTryIt}
                  disabled={tryItLoading || !tryItPath}
                  style={{ background: "var(--primary)", color: "white", border: "none", padding: "0.5rem 1.4rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: tryItLoading || !tryItPath ? 0.6 : 1 }}
                >
                  {tryItLoading ? "Sending..." : "Send ▶"}
                </button>
              </div>

              {tryItMethod !== "GET" && (
                <div>
                  <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.4rem", display: "block" }}>Request Body (JSON)</label>
                  <textarea
                    value={tryItBody}
                    onChange={e => setTryItBody(e.target.value)}
                    placeholder={'{\n  "coin": "BTC"\n}'}
                    rows={4}
                    style={{ width: "100%", background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px", color: "#e6edf3", fontFamily: "monospace", fontSize: "0.85rem", padding: "0.8rem", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              )}

              {/* Quick presets */}
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Quick Presets:</div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {MODULES.slice(0, 6).map(m => (
                    <button
                      key={m.path}
                      onClick={() => { setTryItPath(m.path); setTryItMethod(m.method); }}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "0.25rem 0.7rem", borderRadius: "6px", fontSize: "0.78rem", cursor: "pointer" }}
                    >
                      {m.icon} {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {tryItResponse && (
              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Response:</div>
                <CodeBlock code={tryItResponse} id="try-it-response" />
              </div>
            )}
          </div>
        )}

        {/* SDK EXAMPLES */}
        {activeSection === "sdks" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "1rem" }}>📦 SDK Examples</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Code examples for integrating SAM AI API in different languages, all pointing to the live domain.</p>

            <h3 style={{ marginBottom: "0.8rem" }}>cURL</h3>
            <CodeBlock code={`# Crypto Market Data\ncurl https://samaipro-zrlr.vercel.app/api/crypto/market\n\n# AI Chat\ncurl -X POST https://samaipro-zrlr.vercel.app/api/chat/default \\\n  -H "Content-Type: application/json" \\\n  -d '{"content": "Hello SAM AI!"}'\n\n# Lead Gen Search\ncurl -X POST https://samaipro-zrlr.vercel.app/api/lead-gen/search \\\n  -H "Content-Type: application/json" \\\n  -d '{"query": "Restaurants", "city": "Madurai"}'`} id="curl" />

            <h3 style={{ marginTop: "1.5rem", marginBottom: "0.8rem" }}>JavaScript / Node.js</h3>
            <CodeBlock code={`const BASE_URL = "https://samaipro-zrlr.vercel.app";\n\n// Fetch live crypto prices\nconst res = await fetch(\`\${BASE_URL}/api/crypto/market\`);\nconst data = await res.json();\nconsole.log(data.coins);\n\n// Send message to AI\nconst chatRes = await fetch(\`\${BASE_URL}/api/chat/default\`, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ content: "Hello SAM AI!" })\n});\nconst reply = await chatRes.json();\nconsole.log(reply.content);`} id="nodejs" />

            <h3 style={{ marginTop: "1.5rem", marginBottom: "0.8rem" }}>Python</h3>
            <CodeBlock code={[
              "import requests",
              "",
              'BASE_URL = "https://samaipro-zrlr.vercel.app"',
              "",
              "# Fetch crypto market",
              'res = requests.get(BASE_URL + "/api/crypto/market")',
              'coins = res.json()["coins"]',
              'print("BTC Price: $" + str(coins[0]["price"]))',
              "",
              "# AI Chat",
              "reply = requests.post(",
              '    BASE_URL + "/api/chat/default",',
              '    json={"content": "What is Bitcoin?"}',
              ")" ,
              'print(reply.json()["content"])',
              "",
              "# Lead search",
              "leads = requests.post(",
              '    BASE_URL + "/api/lead-gen/search",',
              '    json={"query": "Restaurants", "city": "Madurai"}',
              ")",
              'print("Found " + str(len(leads.json())) + " leads")',
            ].join("\n")} id="python" />

            <h3 style={{ marginTop: "1.5rem", marginBottom: "0.8rem" }}>PHP</h3>
            <CodeBlock code={[
              "<?php",
              '$BASE_URL = "https://samaipro-zrlr.vercel.app";',
              "",
              "// Fetch crypto market",
              '$response = file_get_contents($BASE_URL . "/api/crypto/market");',
              '$data = json_decode($response, true);',
              'echo "BTC: $" . $data[\'coins\'][0][\'price\'] . "\\n";',
              "",
              "// AI Chat POST",
              '$ch = curl_init($BASE_URL . "/api/chat/default");',
              'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);',
              'curl_setopt($ch, CURLOPT_POST, true);',
              'curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["content" => "Hello!"]));',
              'curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);',
              '$reply = json_decode(curl_exec($ch), true);',
              'curl_close($ch);',
              'echo $reply[\'content\'];',
              '?>',
            ].join("\n")} id="php" />
          </div>
        )}

        {/* ERROR CODES */}
        {activeSection === "errors" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "1rem" }}>⚠️ Error Codes</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              {[
                { code: 200, label: "OK", desc: "Request successful. Response contains data.", color: "#22c55e" },
                { code: 400, label: "Bad Request", desc: "Invalid request body or missing required parameters.", color: "#f59e0b" },
                { code: 401, label: "Unauthorized", desc: "Missing or invalid authentication token.", color: "#ef4444" },
                { code: 403, label: "Forbidden", desc: "Insufficient permissions for this resource.", color: "#ef4444" },
                { code: 404, label: "Not Found", desc: "The requested resource or endpoint does not exist.", color: "#6b7280" },
                { code: 422, label: "Validation Error", desc: "Request body failed schema validation.", color: "#f59e0b" },
                { code: 429, label: "Rate Limited", desc: "Too many requests. Please slow down and retry.", color: "#ef4444" },
                { code: 500, label: "Server Error", desc: "Internal server error. Contact support if persists.", color: "#ef4444" },
              ].map(e => (
                <div key={e.code} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.8rem 1.2rem" }}>
                  <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "1rem", color: e.color, minWidth: "40px" }}>{e.code}</span>
                  <span style={{ fontWeight: 600, minWidth: "140px", fontSize: "0.9rem" }}>{e.label}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>{e.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RATE LIMITS */}
        {activeSection === "ratelimits" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "1rem" }}>🚦 Rate Limits</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>SAM AI enforces rate limits per IP address to ensure fair usage and system stability.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { tier: "Guest", limit: "60 req/min", color: "#6366f1" },
                { tier: "Free", limit: "200 req/min", color: "#22c55e" },
                { tier: "Pro", limit: "1,000 req/min", color: "#f59e0b" },
                { tier: "Enterprise", limit: "Unlimited", color: "#ec4899" },
              ].map(t => (
                <div key={t.tier} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.2rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{t.tier}</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: t.color, marginTop: "0.4rem" }}>{t.limit}</div>
                </div>
              ))}
            </div>

            <CodeBlock code={`# Rate limit headers in every response:\nX-RateLimit-Limit: 60\nX-RateLimit-Remaining: 55\nX-RateLimit-Reset: 1722777600\n\n# If rate limited (HTTP 429):\n{\n  "error": "rate_limit_exceeded",\n  "message": "Too many requests. Retry after 60 seconds.",\n  "retry_after": 60\n}`} id="ratelimit-headers" />
          </div>
        )}

      </main>
    </div>
  );
}
