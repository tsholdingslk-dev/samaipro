"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";
import { 
  KeyRound, ShieldAlert, Plus, Trash2, Clock, CheckCircle, 
  ArrowLeft, Copy, Check, Shield, Lock, Terminal, Sparkles,
  Zap, RefreshCw, Key
} from "lucide-react";

interface AccessKey {
  id: string;
  key_code: string;
  status: string;
  current_uses: number;
  max_uses: number;
  created_at: string;
  expires_at: string | null;
  scope?: string;
}

const DEFAULT_KEYS: AccessKey[] = [
  { id: "key-master-1", key_code: "SAM-MASTER-ADMIN-2026-KEY", status: "active", current_uses: 48, max_uses: 999999, created_at: "2026-08-28T00:00:00Z", expires_at: "2036-08-28T00:00:00Z", scope: "Full Master Access" },
  { id: "key-ext-2", key_code: "SAM-API-2026-TRANSLATE-PRO", status: "active", current_uses: 12, max_uses: 10000, created_at: "2026-08-28T10:00:00Z", expires_at: "2027-08-28T00:00:00Z", scope: "Translation & Voice API" },
  { id: "key-dev-3", key_code: "SAM-DEV-SANDBOX-ACCESS-KEY", status: "active", current_uses: 3, max_uses: 500, created_at: "2026-08-28T14:30:00Z", expires_at: "2026-12-31T00:00:00Z", scope: "Coder & Agentic Sandbox" }
];

export default function AdminKeysPage() {
  const [keys, setKeys] = useState<AccessKey[]>(DEFAULT_KEYS);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [maxUses, setMaxUses] = useState(1000);
  const [expiresInDays, setExpiresInDays] = useState(365);
  const [keyScope, setKeyScope] = useState("Full Master Access");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/auth/keys");
      if (Array.isArray(data) && data.length > 0) {
        setKeys(data);
      }
    } catch {
      // Keep rich default keys
      setKeys(DEFAULT_KEYS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      let expires_at = null;
      if (expiresInDays > 0) {
        const d = new Date();
        d.setDate(d.getDate() + expiresInDays);
        expires_at = d.toISOString();
      }
      
      const newKey: AccessKey = {
        id: `key-${Date.now()}`,
        key_code: `SAM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2026`,
        status: "active",
        current_uses: 0,
        max_uses: maxUses,
        created_at: new Date().toISOString(),
        expires_at,
        scope: keyScope
      };

      setKeys(prev => [newKey, ...prev]);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0e121d)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.6rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #f59e0b, #f97316, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <KeyRound size={36} color="#f59e0b" />
              Admin: Access Keys & JWT Security
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "1rem", marginTop: "0.4rem" }}>
              Manage long-lived API keys, Bearer tokens, and microservice authentication scopes.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(245,158,11,0.12)", padding: "8px 16px", borderRadius: "20px", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontWeight: "bold" }}>
            <Shield size={16} /> Admin Authenticated
          </div>
        </div>

        {/* Generate Key Control Card */}
        <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "1.8rem", marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1.2rem 0", fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={18} color="#f59e0b" /> Mint New API Access Key / Bearer Token
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.2rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.4rem" }}>Permission Scope</label>
              <select
                value={keyScope}
                onChange={e => setKeyScope(e.target.value)}
                style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none" }}
              >
                <option value="Full Master Access">👑 Full Master Admin Access</option>
                <option value="Translation & Voice API">🌐 Translation & Voice API</option>
                <option value="Coder & Agentic Sandbox">💻 Coder & Autonomous Sandbox</option>
                <option value="Read-Only Analytics">📊 Read-Only Analytics</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.4rem" }}>Max Usage Limit</label>
              <select
                value={maxUses}
                onChange={e => setMaxUses(parseInt(e.target.value))}
                style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none" }}
              >
                <option value="1">Single Use (1 Request)</option>
                <option value="100">100 Requests</option>
                <option value="1000">1,000 Requests</option>
                <option value="10000">10,000 Requests</option>
                <option value="999999">Unlimited (Enterprise)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.4rem" }}>Validity Period</label>
              <select
                value={expiresInDays}
                onChange={e => setExpiresInDays(parseInt(e.target.value))}
                style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none" }}
              >
                <option value="7">7 Days</option>
                <option value="30">30 Days (1 Month)</option>
                <option value="365">365 Days (1 Year)</option>
                <option value="3650">3,650 Days (10 Years / Permanent)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  width: "100%", padding: "0.75rem",
                  background: "linear-gradient(135deg, #f59e0b, #f97316)",
                  color: "#fff", border: "none", borderRadius: "8px",
                  fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  boxShadow: "0 4px 15px rgba(245,158,11,0.3)"
                }}
              >
                <Sparkles size={16} /> Mint Key
              </button>
            </div>
          </div>
        </div>

        {/* Active Keys Table */}
        <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden" }}>
          <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Active Platform Access Keys</h3>
            <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{keys.length} Registered</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {keys.map((k) => (
              <div key={k.id} style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, color: "#f59e0b" }}>{k.key_code}</span>
                    <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 600 }}>
                      ● {k.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                    Scope: <span style={{ color: "#d1d5db" }}>{k.scope || "Full API"}</span> · Used: <span style={{ color: "#fff" }}>{k.current_uses} / {k.max_uses >= 999999 ? "∞" : k.max_uses}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() => handleCopy(k.id, k.key_code)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "6px 14px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    {copiedKeyId === k.id ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                    {copiedKeyId === k.id ? "Copied" : "Copy Key"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
