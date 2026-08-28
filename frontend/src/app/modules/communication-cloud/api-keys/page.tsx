"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Key, Trash2, Copy, Eye, EyeOff } from "lucide-react";

type APIKey = {
  id: string;
  key_code: string;
  name: string;
  key_type: string;
  environment: string;
  scopes: string | null;
  last_used: string | null;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
};

const mockKeys: APIKey[] = [
  { id: "1", key_code: "SAM-COMM-A1B2-C3D4", name: "Production Key", key_type: "public", environment: "production", scopes: "rtc,video,chat", last_used: "2026-08-27", expires_at: null, revoked: false, created_at: "2026-08-01" },
  { id: "2", key_code: "SAM-COMM-E5F6-G7H8", name: "Dev Key", key_type: "secret", environment: "development", scopes: "rtc,video", last_used: "2026-08-26", expires_at: null, revoked: false, created_at: "2026-08-10" },
];

export default function CommAPIKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>(mockKeys);
  const [showAdd, setShowAdd] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState({ name: "", key_type: "public", scopes: "rtc,video", environment: "development" });

  const createKey = () => {
    if (!newKey.name) return;
    const keyCode = `SAM-COMM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setKeys([...keys, { id: Date.now().toString(), key_code: keyCode, ...newKey, last_used: null, expires_at: null, revoked: false, created_at: new Date().toISOString() }]);
    setShowAdd(false);
    setNewKey({ name: "", key_type: "public", scopes: "rtc,video", environment: "development" });
  };

  const copyKey = (keyCode: string) => {
    navigator.clipboard.writeText(keyCode);
  };

  return (
    <div className="page-container" style={{ minHeight: "100vh", padding: "2rem", background: "linear-gradient(to bottom right, var(--bg-dark), #0f0f16)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", padding: "0.4rem 1rem", borderRadius: "2rem", fontSize: "0.9rem", fontWeight: "600", marginBottom: "1rem", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
              <Key size={16} />
              API Keys
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#fff", marginBottom: "0.5rem" }}>API Keys</h1>
            <p style={{ color: "var(--text-muted)" }}>Manage communication API keys and tokens</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(!showAdd)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
            <Plus size={18} /> Create API Key
          </motion.button>
        </div>

        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(25,25,35,0.4)" }}>
            <h3 style={{ color: "#fff", marginBottom: "1rem" }}>Create New API Key</h3>
            <div style={{ display: "grid", gap: "1rem", maxWidth: "500px" }}>
              <input placeholder="Key Name" value={newKey.name} onChange={(e) => setNewKey({ ...newKey, name: e.target.value })} style={inputStyle} />
              <select value={newKey.key_type} onChange={(e) => setNewKey({ ...newKey, key_type: e.target.value })} style={inputStyle}>
                <option value="public">Public</option>
                <option value="secret">Secret</option>
                <option value="server">Server</option>
                <option value="webhook">Webhook</option>
              </select>
              <select value={newKey.environment} onChange={(e) => setNewKey({ ...newKey, environment: e.target.value })} style={inputStyle}>
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
              <input placeholder="Scopes (comma separated)" value={newKey.scopes} onChange={(e) => setNewKey({ ...newKey, scopes: e.target.value })} style={inputStyle} />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={createKey} style={{ ...buttonStyle, background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                Create Key
              </motion.button>
            </div>
          </motion.div>
        )}

        <div style={{ display: "grid", gap: "1rem" }}>
          {keys.map((key, i) => (
            <motion.div key={key.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }} style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(25,25,35,0.4)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Key size={24} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <h3 style={{ color: "#fff", fontWeight: "600" }}>{key.name}</h3>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "6px", background: key.environment === "production" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)", color: key.environment === "production" ? "#ef4444" : "#3b82f6", fontWeight: "500" }}>
                      {key.environment}
                    </span>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "6px", background: "rgba(139,92,246,0.15)", color: "#8b5cf6", fontWeight: "500" }}>
                      {key.key_type}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <code style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.03)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                      {showSecrets[key.id] ? key.key_code : "SAM-COMM-****-****"}
                    </code>
                    <button onClick={() => setShowSecrets({ ...showSecrets, [key.id]: !showSecrets[key.id] })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                      {showSecrets[key.id] ? <EyeOff size={14} color="rgba(255,255,255,0.5)" /> : <Eye size={14} color="rgba(255,255,255,0.5)" />}
                    </button>
                    <button onClick={() => copyKey(key.key_code)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                      <Copy size={14} color="rgba(255,255,255,0.5)" />
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem" }}>
                    <span>Scopes: {key.scopes}</span>
                    {key.last_used && <span>Last used: {key.last_used}</span>}
                  </div>
                </div>
              </div>
              <button style={iconBtn}><Trash2 size={16} color="#ef4444" /></button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
  color: "#fff",
  fontSize: "0.95rem",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  borderRadius: "10px",
  border: "none",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
  fontSize: "0.95rem",
};

const iconBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "0.5rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
