"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";
import { 
  Bot, Brain, Search, Code, TrendingUp, FileText, 
  Play, Sparkles, Check, Copy, ArrowLeft, Clock, 
  CheckCircle2, Layers, Cpu, Users
} from "lucide-react";

type AgentInfo = {
  name: string;
  icon: any;
  color: string;
  description: string;
  tools: string[];
};

type ExecutionResult = {
  task_id: string;
  status: string;
  result: string;
  agent_used: string;
  steps_completed: string[];
  execution_time: number;
  mode: string;
  plan?: string[];
};

const DEFAULT_AGENTS: AgentInfo[] = [
  {
    name: "Planner Agent",
    icon: Brain,
    color: "#8b5cf6",
    description: "Breaks down complex multi-step goals into clear, actionable milestone sequences.",
    tools: ["task_decomposition", "prioritization", "architecture_mapping"]
  },
  {
    name: "Deep Researcher",
    icon: Search,
    color: "#3b82f6",
    description: "Searches documentation, web data, and technical specifications to extract key insights.",
    tools: ["web_search", "document_analysis", "data_synthesis"]
  },
  {
    name: "Senior Coder",
    icon: Code,
    color: "#10b981",
    description: "Generates, reviews, refactors, and fixes code across Python, TypeScript, React, and PHP.",
    tools: ["code_gen", "bug_fixing", "sandbox_eval", "security_audit"]
  },
  {
    name: "Business Analyst",
    icon: TrendingUp,
    color: "#f59e0b",
    description: "Conducts market competitor analysis, pricing model recommendations, and financial forecasts.",
    tools: ["market_research", "financial_metrics", "swot_analysis"]
  },
  {
    name: "Content Creator",
    icon: FileText,
    color: "#ec4899",
    description: "Writes viral social media posts, marketing campaign scripts, and technical documentation.",
    tools: ["seo_writing", "scriptwriting", "copywriting", "multilingual"]
  },
  {
    name: "AI Council",
    icon: Users,
    color: "#06b6d4",
    description: "Multi-agent peer debate between Architect, Security Critic, and Product Strategist.",
    tools: ["adversarial_critique", "consensus_voting", "security_review"]
  }
];

export default function AgentsPage() {
  const [task, setTask] = useState("");
  const [context, setContext] = useState("");
  const [usePlanning, setUsePlanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState("");
  const [agents, setAgents] = useState<AgentInfo[]>(DEFAULT_AGENTS);
  const [history, setHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  const loadAgents = async () => {
    try {
      const data = await apiFetch("/agents/available");
      if (data && data.agents && Array.isArray(data.agents) && data.agents.length > 0) {
        // Keep merged rich list
        const updated = DEFAULT_AGENTS.map(def => {
          const match = data.agents.find((a: string) => a.toLowerCase().includes(def.name.toLowerCase().split(' ')[0]));
          return match ? { ...def, isLive: true } : def;
        });
        setAgents(updated);
      }
    } catch {
      // Use rich default agents fallback
      setAgents(DEFAULT_AGENTS);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await apiFetch("/agents/history");
      if (data && data.history) {
        setHistory(data.history || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAgents();
    loadHistory();
  }, []);

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("task", task);
      formData.append("context", context);
      formData.append("use_planning", String(usePlanning));

      const data = await apiFetch("/agents/run", {
        method: "POST",
        body: formData,
      });

      setResult(data as ExecutionResult);
      loadHistory();
    } catch (err: any) {
      setError(err.message || "Agent execution failed. Please check network/auth.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!result?.result) return;
    navigator.clipboard.writeText(result.result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setPresetPrompt = (p: string) => {
    setTask(p);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0d121c)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        
        {/* Top Header */}
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.8rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
            <ArrowLeft size={14} /> Back to Modules
          </Link>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #a78bfa, #c084fc, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            <Bot size={36} color="#a78bfa" />
            Autonomous AI Agents
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "1.05rem", marginTop: "0.4rem" }}>
            Give SAM AI a high-level goal. It plans, delegates across specialized agents, and executes results.
          </p>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "1rem", color: "#ef4444", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        {/* Main Card */}
        <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "2rem", marginBottom: "2rem" }}>
          
          {/* Quick Presets */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.5rem" }}>Quick Ideas:</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                "Create a YouTube marketing plan for my AI app",
                "Write a Python web scraper for crypto news",
                "Analyze market competitors for SaaS Lead Gen tool",
                "Build a React auth login component with JWT tokens"
              ].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPresetPrompt(p)}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#d1d5db", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", cursor: "pointer" }}
                >
                  💡 {p}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRun} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <label style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Goal / Task</label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g., Create a YouTube marketing plan for my AI app"
                rows={3}
                required
                style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0.9rem", color: "#fff", fontSize: "0.95rem", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "block", marginBottom: "0.4rem" }}>Context (Optional JSON / Specs)</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder='e.g., {"language": "python", "framework": "react", "audience": "developers"}'
                rows={2}
                style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0.7rem", color: "#fff", fontSize: "0.85rem", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <input
                type="checkbox"
                id="planner-chk"
                checked={usePlanning}
                onChange={(e) => setUsePlanning(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#8b5cf6", cursor: "pointer" }}
              />
              <label htmlFor="planner-chk" style={{ fontSize: "0.88rem", color: "#e5e7eb", cursor: "pointer" }}>
                Enable Planner Agent Decomposition
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading || !task.trim()}
              style={{ width: "100%", padding: "0.9rem", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "1rem", fontWeight: 700, cursor: (loading || !task.trim()) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 15px rgba(139,92,246,0.3)" }}
            >
              {loading ? <><Sparkles className="animate-spin" size={18} /> Running Agents...</> : <><Play size={18} fill="#fff" /> Run Agent Task</>}
            </button>
          </form>

          {/* Execution Result */}
          {result && (
            <div style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(16, 185, 129, 0.08)", borderRadius: "16px", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CheckCircle2 size={20} color="#10b981" />
                  <span style={{ color: "#10b981", fontWeight: 700 }}>Status: {result.status || "Completed"}</span>
                  <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>· Agent: {result.agent_used || "Planner + Executor"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "#9ca3af", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={13} /> {result.execution_time ? `${result.execution_time.toFixed(2)}s` : "< 1.5s"}
                  </span>
                  <button
                    onClick={handleCopyResult}
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy Result"}
                  </button>
                </div>
              </div>

              {result.plan && Array.isArray(result.plan) && result.plan.length > 0 && (
                <div style={{ marginBottom: "1.2rem", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "10px" }}>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#c084fc" }}>📋 Deconstructed Plan:</h4>
                  <ol style={{ paddingLeft: "1.2rem", margin: 0, color: "#d1d5db", fontSize: "0.86rem", lineHeight: 1.6 }}>
                    {result.plan.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "#fff" }}>Output & Result:</h4>
                <div style={{ padding: "1.2rem", background: "#05060a", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "0.9rem", color: "#e5e7eb" }}>
                  {result.result}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Available Agents Section ── */}
        <div>
          <h3 style={{ marginBottom: "1.2rem", fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={20} color="#8b5cf6" /> Available Autonomous Agents
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.2rem" }}>
            {agents.map((agent) => {
              const Icon = agent.icon || Bot;
              return (
                <div key={agent.name} style={{
                  padding: "1.4rem",
                  background: "rgba(25, 25, 38, 0.5)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.8rem" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `rgba(255,255,255,0.06)`, border: `1px solid ${agent.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={18} color={agent.color} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{agent.name}</h4>
                        <span style={{ fontSize: "0.7rem", color: "#10b981" }}>● Ready for tasks</span>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.84rem", color: "#9ca3af", lineHeight: 1.5, marginBottom: "1rem" }}>
                      {agent.description}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {agent.tools.map((tool) => (
                      <span key={tool} style={{
                        padding: "0.2rem 0.6rem",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        color: "#a78bfa",
                        fontFamily: "monospace"
                      }}>
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
