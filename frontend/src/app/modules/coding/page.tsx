"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Tab = "generate" | "fix" | "samaicoder" | "api_connect";

type ExecResult = {
  stdout?: string;
  stderr?: string;
  error?: string;
  engine?: string;
  success?: boolean;
};

type SamaicoderStatus = {
  status: "active" | "offline";
  service: string;
  port: number;
  message?: string;
};

export default function CodingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Code Generator & Live Executor state
  const [genPrompt, setGenPrompt] = useState("");
  const [genLanguage, setGenLanguage] = useState("python");
  const [genFramework, setGenFramework] = useState("");
  const [editableCode, setEditableCode] = useState(
    '# Write or generate Python code here\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        print(a, end=" ")\n        a, b = b, a + b\n    print()\n\nfibonacci(10)'
  );

  // Live Execution state
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<ExecResult | null>(null);

  // Bug Fixer state
  const [fixCode, setFixCode] = useState("");
  const [fixErrorMsg, setFixErrorMsg] = useState("");
  const [fixLanguage, setFixLanguage] = useState("python");
  const [fixedCode, setFixedCode] = useState("");
  const [fixExplanation, setFixExplanation] = useState("");

  // samaicoder Bridge state
  const [samaicoderStatus, setSamaicoderStatus] = useState<SamaicoderStatus | null>(null);
  const [checkingSamaicoder, setCheckingSamaicoder] = useState(false);

  // API Connect & Deploy state
  const [apiDesc, setApiDesc] = useState("Tavily AI Search & Groq LLM integration");
  const [apiLanguage, setApiLanguage] = useState("python");
  const [apiGuide, setApiGuide] = useState("");

  // Check samaicoder health status
  const checkSamaicoderStatus = async () => {
    setCheckingSamaicoder(true);
    try {
      const res = await fetch("http://localhost:8000/coding/samaicoder/status");
      const data = await res.json();
      setSamaicoderStatus(data);
    } catch (err) {
      setSamaicoderStatus({
        status: "offline",
        service: "samaicoder (SamForge AI)",
        port: 3210,
        message: "samaicoder agent service is offline."
      });
    } finally {
      setCheckingSamaicoder(false);
    }
  };

  useEffect(() => {
    checkSamaicoderStatus();
  }, []);

  // Handle Code Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genPrompt.trim()) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("prompt", genPrompt);
      formData.append("language", genLanguage);
      formData.append("framework", genFramework || "");

      const res = await fetch("http://localhost:8000/coding/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.code) {
        setEditableCode(data.code);
      } else {
        setError(data.detail || "Code generation failed.");
      }
    } catch (err: any) {
      setError(err.message || "Code generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Live Execution
  const handleExecute = async () => {
    if (!editableCode.trim()) return;

    setExecuting(true);
    setExecResult(null);

    try {
      const formData = new FormData();
      formData.append("code", editableCode);
      formData.append("language", genLanguage);

      const res = await fetch("http://localhost:8000/coding/execute", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setExecResult(data);
    } catch (err: any) {
      setExecResult({
        error: `Execution failed: ${err.message}`,
        success: false
      });
    } finally {
      setExecuting(false);
    }
  };

  // Handle Bug Fixer
  const handleFixCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixCode.trim()) return;

    setLoading(true);
    setError("");
    setFixedCode("");
    setFixExplanation("");

    try {
      const formData = new FormData();
      formData.append("code", fixCode);
      formData.append("error", fixErrorMsg || "");
      formData.append("language", fixLanguage);

      const res = await fetch("http://localhost:8000/coding/fix", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.fixed_code) {
        setFixedCode(data.fixed_code);
        setFixExplanation(data.explanation || "Bug resolved successfully.");
      } else {
        setError("Failed to generate code fix.");
      }
    } catch (err: any) {
      setError(err.message || "Bug fix failed.");
    } finally {
      setLoading(false);
    }
  };

  // Handle API Connect Help
  const handleApiConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiGuide("");

    try {
      const formData = new FormData();
      formData.append("description", apiDesc);
      formData.append("language", apiLanguage);

      const res = await fetch("http://localhost:8000/coding/api-connect", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setApiGuide(data.guide || "No guide returned.");
    } catch (err: any) {
      setError(err.message || "API connect guide failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: "1.5rem" }}>
      <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "2.2rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
            💻 SAM AI Agentic Coder Studio
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            AI Code Generation, Live Sandbox Execution, Bug Refactoring & samaicoder Integration
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { key: "generate", label: "💻 Code Studio & Live Executor" },
            { key: "fix", label: "🔧 Bug Fixer & Auto-Refactor" },
            { key: "samaicoder", label: "🤖 samaicoder Agent Workspace" },
            { key: "api_connect", label: "🔌 API Connect & Templates" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as Tab)}
              className="btn-primary"
              style={{
                background: activeTab === t.key ? "var(--primary)" : "transparent",
                border: `2px solid var(--primary)`,
                color: activeTab === t.key ? "white" : "var(--primary)",
                padding: "0.5rem 1.2rem",
                fontSize: "0.9rem",
                borderRadius: "20px"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: CODE GENERATOR & LIVE EXECUTOR */}
        {activeTab === "generate" && (
          <div>
            <form onSubmit={handleGenerate} style={{ marginBottom: "1.2rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                    What do you want to build or code?
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Write a Python script to scrape live crypto prices using Tavily"
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Language</label>
                  <select className="input-field" value={genLanguage} onChange={(e) => setGenLanguage(e.target.value)}>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript / Node.js</option>
                    <option value="typescript">TypeScript</option>
                    <option value="html">HTML5 / CSS</option>
                    <option value="php">PHP</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Framework (Optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. FastAPI / Next.js"
                    value={genFramework}
                    onChange={(e) => setGenFramework(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Generating Code via AI Hub..." : "🤖 Generate Code with AI"}
              </button>
            </form>

            {/* Code Editor & Execution Console Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {/* Code Editor */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: "bold", fontSize: "0.9rem" }}>📝 Code Editor ({genLanguage.toUpperCase()}):</span>
                  <button
                    onClick={handleExecute}
                    className="btn-primary"
                    disabled={executing || !editableCode.trim()}
                    style={{ padding: "0.3rem 0.9rem", fontSize: "0.85rem", background: "#10b981" }}
                  >
                    {executing ? "Running..." : "⚡ RUN CODE"}
                  </button>
                </div>
                <textarea
                  value={editableCode}
                  onChange={(e) => setEditableCode(e.target.value)}
                  style={{
                    width: "100%",
                    height: "320px",
                    background: "#0f172a",
                    color: "#f8fafc",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    lineHeight: "1.5",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Terminal Execution Console */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: "bold", fontSize: "0.9rem" }}>💻 Terminal Execution Output:</span>
                  {execResult && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Engine: {execResult.engine}</span>
                  )}
                </div>
                
                <div style={{
                  width: "100%",
                  height: "320px",
                  background: "#020617",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "1rem",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  overflowY: "auto",
                  color: "#38bdf8"
                }}>
                  {executing ? (
                    <div style={{ color: "#eab308" }}>⏳ Executing code in isolated sandbox...</div>
                  ) : execResult ? (
                    <div>
                      {execResult.stdout && (
                        <div style={{ color: "#4ade80", whiteSpace: "pre-wrap", marginBottom: "0.5rem" }}>
                          {execResult.stdout}
                        </div>
                      )}
                      {execResult.stderr && (
                        <div style={{ color: "#fb7185", whiteSpace: "pre-wrap", marginBottom: "0.5rem" }}>
                          {execResult.stderr}
                        </div>
                      )}
                      {execResult.error && (
                        <div style={{ color: "#f43f5e", whiteSpace: "pre-wrap" }}>
                          ❌ Error: {execResult.error}
                        </div>
                      )}
                      {!execResult.stdout && !execResult.stderr && !execResult.error && (
                        <div style={{ color: "#94a3b8" }}>Execution completed cleanly with no output.</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: "#64748b" }}>
                      Click "⚡ RUN CODE" to execute Python script live in the terminal.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUG FIXER & AUTO-REFACTOR */}
        {activeTab === "fix" && (
          <div>
            <form onSubmit={handleFixCode} style={{ marginBottom: "1.2rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                    Paste Broken Code:
                  </label>
                  <textarea
                    rows={8}
                    className="input-field"
                    style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    placeholder="e.g. def calculate(): return x + y"
                    value={fixCode}
                    onChange={(e) => setFixCode(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                    Error Message / Stack Trace (Optional):
                  </label>
                  <textarea
                    rows={8}
                    className="input-field"
                    style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    placeholder="e.g. NameError: name 'x' is not defined"
                    value={fixErrorMsg}
                    onChange={(e) => setFixErrorMsg(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Debugging Code with AI..." : "🔧 Auto-Fix & Refactor Code"}
              </button>
            </form>

            {/* Fixed Code Output */}
            {fixedCode && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", color: "#34d399", marginBottom: "0.5rem" }}>✅ Corrected Code:</h3>
                  <textarea
                    readOnly
                    value={fixedCode}
                    style={{
                      width: "100%",
                      height: "220px",
                      background: "#0f172a",
                      color: "#4ade80",
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                      padding: "1rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border)"
                    }}
                  />
                </div>

                <div>
                  <h3 style={{ fontSize: "1rem", color: "var(--primary)", marginBottom: "0.5rem" }}>💡 AI Fix Explanation:</h3>
                  <div style={{
                    padding: "1rem",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    height: "220px",
                    overflowY: "auto",
                    lineHeight: "1.6",
                    fontSize: "0.9rem"
                  }}>
                    {fixExplanation}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: samaicoder AGENT WORKSPACE */}
        {activeTab === "samaicoder" && (
          <div>
            <div style={{
              padding: "1.2rem",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              marginBottom: "1.5rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", color: "var(--text-main)" }}>🤖 samaicoder (SamForge AI Platform) Bridge</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Connect to local `samaicoder` monorepo agent service at `http://localhost:3210`
                  </p>
                </div>
                <button onClick={checkSamaicoderStatus} className="btn-secondary" style={{ fontSize: "0.85rem" }}>
                  {checkingSamaicoder ? "Checking..." : "🔄 Refresh Status"}
                </button>
              </div>

              {samaicoderStatus && (
                <div style={{
                  padding: "1rem",
                  borderRadius: "10px",
                  background: samaicoderStatus.status === "active" ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                  border: `1px solid ${samaicoderStatus.status === "active" ? "#10b981" : "#f43f5e"}`
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{samaicoderStatus.status === "active" ? "🟢" : "🔴"}</span>
                    <strong>Status: {samaicoderStatus.status.toUpperCase()}</strong>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {samaicoderStatus.status === "active" ? (
                      <div>
                        ✅ `samaicoder` Fastify Agent Backend is running on port 3210. Multi-file project tasks and agent orchestrations are ready.
                      </div>
                    ) : (
                      <div>
                        ⚠️ {samaicoderStatus.message}
                        <div style={{ marginTop: "0.5rem", background: "black", padding: "0.5rem", borderRadius: "5px", fontFamily: "monospace" }}>
                          cd c:\Users\ASUS\Desktop\xampp\htdocs\samaicoder && pnpm dev:backend
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: API CONNECT & TEMPLATES */}
        {activeTab === "api_connect" && (
          <div>
            <form onSubmit={handleApiConnect} style={{ marginBottom: "1.2rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                    What API or service do you want to integrate?
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Connect Tavily AI Search + Groq Llama 3.3 in Python"
                    value={apiDesc}
                    onChange={(e) => setApiDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Language</label>
                  <select className="input-field" value={apiLanguage} onChange={(e) => setApiLanguage(e.target.value)}>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript / Node.js</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Generating Integration Template..." : "🔌 Get API Integration Template"}
              </button>
            </form>

            {apiGuide && (
              <div style={{
                padding: "1.2rem",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                lineHeight: "1.6",
                fontSize: "0.9rem"
              }}>
                {apiGuide.split("\n").map((line, idx) => (
                  <div key={idx} style={{ marginBottom: "0.2rem" }}>{line}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <Link href="/modules" style={{ color: "var(--primary)", textDecoration: "none" }}>
            ← Back to Modules
          </Link>
        </div>

      </div>
    </div>
  );
}
