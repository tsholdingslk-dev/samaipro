"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Code, MonitorPlay, Braces, Play, Download, Copy, Check, 
  Smartphone, ArrowLeft, RefreshCw, Layers, Sparkles, Terminal,
  Maximize2, Minimize2, ExternalLink, Globe
} from 'lucide-react';

const STARTER_TEMPLATES: Record<string, string> = {
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SAM AI Web App</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0d1117;
      color: #f0f6fc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 450px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h1 {
      margin: 0 0 10px;
      background: linear-gradient(135deg, #14b8a6, #3b82f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p { color: #8b949e; line-height: 1.5; }
    button {
      background: #14b8a6;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 15px;
      transition: transform 0.2s, background 0.2s;
    }
    button:hover { background: #0d9488; transform: scale(1.05); }
    #counter { font-size: 2rem; font-weight: bold; color: #38bdf8; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚡ SAM AI Web IDE</h1>
    <p>Live interactive browser-based development workspace.</p>
    <div id="counter">0</div>
    <button onclick="increment()">Click to Count</button>
  </div>

  <script>
    let count = 0;
    function increment() {
      count++;
      document.getElementById('counter').innerText = count;
    }
  </script>
</body>
</html>`,
  js: `// Interactive Canvas Animation
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

let particles = [];
for (let i = 0; i < 50; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    size: Math.random() * 4 + 2,
    color: '#14b8a6'
  });
}

function animate() {
  ctx.fillStyle = 'rgba(13, 17, 23, 0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  });
  
  requestAnimationFrame(animate);
}
animate();`,
  tailwind: `<!DOCTYPE html>
<html lang="en">
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
    <div class="inline-flex p-3 bg-teal-500/10 text-teal-400 rounded-xl mb-4">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    </div>
    <h2 class="text-2xl font-bold mb-2 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
      Tailwind CSS Ready
    </h2>
    <p class="text-slate-400 text-sm mb-6">
      Instant live preview with full utility classes and animations.
    </p>
    <div class="grid grid-cols-2 gap-3">
      <button class="bg-teal-500 hover:bg-teal-600 font-semibold py-2.5 px-4 rounded-lg transition-all text-sm">
        Primary Action
      </button>
      <button class="bg-slate-800 hover:bg-slate-700 font-semibold py-2.5 px-4 rounded-lg transition-all text-sm border border-slate-700">
        Secondary
      </button>
    </div>
  </div>
</body>
</html>`
};

export default function WebEditorIDE() {
  const [code, setCode] = useState(STARTER_TEMPLATES.html);
  const [activeTemplate, setActiveTemplate] = useState("html");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectTemplate = (type: string) => {
    setActiveTemplate(type);
    if (type === "html") setCode(STARTER_TEMPLATES.html);
    if (type === "tailwind") setCode(STARTER_TEMPLATES.tailwind);
    if (type === "js") {
      setCode(`<!DOCTYPE html><html><body style="margin:0;overflow:hidden;background:#0d1117"><script>\n${STARTER_TEMPLATES.js}\n</script></body></html>`);
    }
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#090a0f", color: "#f3f4f6", fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Top Header Navigation ── */}
      <header style={{ padding: "10px 20px", background: "rgba(15, 17, 26, 0.95)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/modules" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", padding: "6px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <ArrowLeft size={14} /> Modules
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #14b8a6, #0d9488)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Code size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                SAM Cloud Web Editor & Live IDE
                <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "12px", background: "rgba(20, 184, 166, 0.15)", border: "1px solid rgba(20, 184, 166, 0.3)", color: "#14b8a6", fontWeight: 600 }}>
                  ● Live Sandbox
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Launch Suite */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Link href="/modules/coding" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#10b981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", padding: "5px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600 }}>
            <Terminal size={14} /> AI Coder Studio
          </Link>
          <Link href="/modules/flutter-studio" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#3b82f6", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", padding: "5px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600 }}>
            <Smartphone size={14} /> Flutter AI Studio
          </Link>
        </div>
      </header>

      {/* ── Editor Toolbar ── */}
      <div style={{ padding: "8px 20px", background: "#0e1017", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        
        {/* Template Selectors */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginRight: "4px" }}>Templates:</span>
          {[
            { id: "html", label: "HTML5 + JS" },
            { id: "tailwind", label: "Tailwind CSS" },
            { id: "js", label: "Canvas JS" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t.id)}
              style={{
                background: activeTemplate === t.id ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.04)",
                border: activeTemplate === t.id ? "1px solid #14b8a6" : "1px solid rgba(255,255,255,0.08)",
                color: activeTemplate === t.id ? "#14b8a6" : "#9ca3af",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setPreviewKey(k => k + 1)}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#14b8a6", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
          >
            <Play size={13} fill="#fff" /> Run & Refresh
          </button>
          <button
            onClick={handleCopy}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db", padding: "6px 10px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}
            title="Copy Code"
          >
            {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db", padding: "6px 10px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}
            title="Download index.html"
          >
            <Download size={14} /> Download
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db", padding: "6px 8px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}
            title="Toggle Preview Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* ── Split IDE Workspace ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: isFullscreen ? "0 1fr" : "1fr 1fr", height: "calc(100vh - 105px)", overflow: "hidden" }}>
        
        {/* Left: Code Editor */}
        {!isFullscreen && (
          <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255, 255, 255, 0.08)", background: "#0c0e14", height: "100%" }}>
            <div style={{ padding: "6px 16px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.75rem", color: "#8b949e", display: "flex", justifyContent: "space-between" }}>
              <span>📝 index.html / Live Code Buffer</span>
              <span>UTF-8 · HTML/JS Mode</span>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Type HTML, CSS, JavaScript here..."
              spellCheck={false}
              style={{
                flex: 1,
                width: "100%",
                background: "transparent",
                color: "#e6edf3",
                border: "none",
                outline: "none",
                padding: "16px",
                fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
                fontSize: "0.88rem",
                lineHeight: 1.6,
                resize: "none",
                boxSizing: "border-box",
                tabSize: 2
              }}
            />
          </div>
        )}

        {/* Right: Live Interactive Canvas Frame */}
        <div style={{ display: "flex", flexDirection: "column", background: "#000", height: "100%", position: "relative" }}>
          <div style={{ padding: "6px 16px", background: "rgba(15, 17, 26, 0.9)", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: "0.75rem", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MonitorPlay size={14} color="#14b8a6" />
              <span style={{ fontWeight: 600, color: "#fff" }}>Interactive Live Sandbox Preview</span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "#10b981" }}>● Realtime DOM</span>
          </div>

          <iframe
            key={previewKey}
            srcDoc={code}
            title="Live Preview Sandbox"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            style={{
              flex: 1,
              width: "100%",
              height: "100%",
              border: "none",
              background: "#ffffff"
            }}
          />
        </div>

      </div>
    </div>
  );
}
