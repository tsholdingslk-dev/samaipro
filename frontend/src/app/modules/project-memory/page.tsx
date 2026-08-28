"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";
import { 
  FolderGit2, Plus, Search, Database, Layers, ArrowLeft, 
  CheckCircle2, Clock, Trash2, ExternalLink, HardDrive, 
  Sparkles, FileCode, Shield, RefreshCw
} from "lucide-react";

interface ProjectMemory {
  id: string;
  name: string;
  description: string;
  vectorCount: number;
  tokensUsed: string;
  updatedAt: string;
  tags: string[];
}

const DEFAULT_PROJECTS: ProjectMemory[] = [
  { id: "default", name: "General Workspace", description: "Default persistent memory storage for cross-module chat sessions, code snippets, and active translations.", vectorCount: 3420, tokensUsed: "128k", updatedAt: "Just now", tags: ["Chat", "Translations", "Universal"] },
  { id: "samaipro-core", name: "SAM AI Core System", description: "Full repository codebase, backend FastAPI schemas, Next.js routes, and multi-model failover matrix.", vectorCount: 8950, tokensUsed: "450k", updatedAt: "10 mins ago", tags: ["Next.js", "FastAPI", "Production"] },
  { id: "crypto-bot", name: "Crypto Portfolio Tracker", description: "Live WebSocket ticker hooks, CoinGecko API contracts, risk predictor algorithms.", vectorCount: 1240, tokensUsed: "64k", updatedAt: "2 hours ago", tags: ["Crypto", "Finance", "WebSockets"] },
];

export default function ProjectMemoryPage() {
  const [projects, setProjects] = useState<ProjectMemory[]>(DEFAULT_PROJECTS);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTag, setNewTag] = useState("Web Dev");

  const handleCreateProject = () => {
    if (!newName.trim()) return;
    const newEntry: ProjectMemory = {
      id: `proj-${Date.now()}`,
      name: newName,
      description: newDesc || "Custom structured project memory workspace.",
      vectorCount: 1,
      tokensUsed: "0k",
      updatedAt: "Just now",
      tags: [newTag]
    };
    setProjects([newEntry, ...projects]);
    setShowAddModal(false);
    setNewName("");
    setNewDesc("");
  };

  const filtered = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0c111e)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.6rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #38bdf8, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <FolderGit2 size={36} color="#38bdf8" />
              Project Memory & Vector Store
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "1rem", marginTop: "0.4rem" }}>
              Persistent contextual embeddings, multi-session memory caches & project document repositories.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #38bdf8, #6366f1)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 15px rgba(56,189,248,0.3)" }}
          >
            <Plus size={16} /> New Project Workspace
          </button>
        </div>

        {/* Search & Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "10px 16px" }}>
            <Search size={18} color="#9ca3af" style={{ marginRight: "10px" }} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search workspaces by name, memory keywords or tags..."
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "0.95rem" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "10px 20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase" }}>Workspaces</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#38bdf8" }}>{projects.length} Active</div>
            </div>
            <div style={{ height: "30px", width: "1px", background: "rgba(255,255,255,0.1)" }}></div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase" }}>Indexed Vectors</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10b981" }}>13.6k Total</div>
            </div>
          </div>
        </div>

        {/* Project Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                background: "rgba(25, 25, 38, 0.6)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                borderRadius: "18px",
                padding: "1.6rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Database size={20} color="#38bdf8" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{p.name}</h3>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>ID: {p.id}</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: "0.88rem", color: "#d1d5db", lineHeight: 1.5, marginBottom: "1.2rem" }}>
                  {p.description}
                </p>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "1.2rem" }}>
                  {p.tags.map((t, idx) => (
                    <span key={idx} style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#a5b4fc" }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
                <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                  <span style={{ color: "#38bdf8", fontWeight: 600 }}>{p.vectorCount.toLocaleString()}</span> vectors · {p.updatedAt}
                </div>

                <Link
                  href={`/chat/${p.id}`}
                  style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.06)", color: "#fff", padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <ExternalLink size={13} /> Open Chat
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: New Project */}
        {showAddModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 100 }}>
            <div style={{ background: "#0e121d", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", maxWidth: "500px", width: "100%", padding: "2rem", color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Create New Project Memory</h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Project / Workspace Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. E-Commerce PayHere Integration"
                    style={{ width: "100%", background: "#05060a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.7rem", color: "#fff", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Description & Purpose</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={3}
                    placeholder="What context and files will this workspace store?"
                    style={{ width: "100%", background: "#05060a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.7rem", color: "#fff", outline: "none", resize: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                  <button
                    onClick={handleCreateProject}
                    style={{ flex: 1, background: "linear-gradient(135deg, #38bdf8, #6366f1)", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Initialize Workspace
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
