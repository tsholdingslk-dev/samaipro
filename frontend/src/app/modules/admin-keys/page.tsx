"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../utils/api";
import { KeyRound, ShieldAlert, Plus, Trash2, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

type AccessKey = {
  id: string;
  key_code: string;
  status: string;
  current_uses: number;
  max_uses: number;
  created_at: string;
  expires_at: string | null;
};

export default function AdminKeysPage() {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(0);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/auth/keys");
      setKeys(data);
    } catch (err) {
      console.error(err);
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
      
      await apiFetch("/auth/generate-key", {
        method: "POST",
        body: JSON.stringify({ max_uses: maxUses, expires_at })
      });
      fetchKeys();
    } catch (err) {
      alert("Failed to generate key. Ensure you are logged in as Admin.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: "3rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <ShieldAlert size={32} color="var(--primary)" />
          <div>
            <h1 style={{ fontSize: "2rem", margin: 0 }}>Admin: Access Keys</h1>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>Generate and manage dynamic access tokens</p>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Generate New Key</h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Max Uses (0 = unlimited)</label>
              <input type="number" min="0" value={maxUses} onChange={e => setMaxUses(parseInt(e.target.value) || 0)} className="input-field" style={{ width: "150px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Expires in Days (0 = never)</label>
              <input type="number" min="0" value={expiresInDays} onChange={e => setExpiresInDays(parseInt(e.target.value) || 0)} className="input-field" style={{ width: "150px" }} />
            </div>
            <button className="btn-primary" onClick={handleGenerate} disabled={generating} style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "46px" }}>
              <Plus size={18} /> {generating ? "Generating..." : "Generate Key"}
            </button>
          </div>
        </div>

        <h3>Active & Expired Keys</h3>
        {loading ? <p>Loading keys...</p> : (
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "1rem" }}>Key Code</th>
                  <th style={{ padding: "1rem" }}>Status</th>
                  <th style={{ padding: "1rem" }}>Uses</th>
                  <th style={{ padding: "1rem" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "1rem", fontWeight: "600", letterSpacing: "1px", color: "var(--primary)" }}>{k.key_code}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ 
                        padding: "0.25rem 0.75rem", 
                        borderRadius: "99px", 
                        fontSize: "0.85rem",
                        background: k.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: k.status === 'active' ? '#10b981' : '#ef4444'
                      }}>
                        {k.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>{k.current_uses} / {k.max_uses === 0 ? '∞' : k.max_uses}</td>
                    <td style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>{new Date(k.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No access keys generated yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
