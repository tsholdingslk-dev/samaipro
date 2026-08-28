"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Server, Trash2, RefreshCw, Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import AdminGate from "../../../../components/AdminGate";

type Provider = {
  id: string;
  provider_id: string;
  name: string;
  category: string;
  priority: number;
  enabled: boolean;
  health_status: string;
  capabilities: string;
  configuration: string;
  created_at: string;
};

const mockProviders: Provider[] = [
  { id: "1", provider_id: "agora", name: "Agora", category: "rtc", priority: 1, enabled: true, health_status: "healthy", capabilities: JSON.stringify({ video_call: true, audio_call: true, group_call: true, screen_share: true, recording: true, live_streaming: true, max_participants: 1000 }), configuration: "{}", created_at: "2026-08-01" },
  { id: "2", provider_id: "livekit", name: "LiveKit", category: "rtc", priority: 2, enabled: true, health_status: "healthy", capabilities: JSON.stringify({ video_call: true, audio_call: true, group_call: true, screen_share: true, recording: true, max_participants: 200 }), configuration: "{}", created_at: "2026-08-01" },
  { id: "3", provider_id: "jitsi", name: "Jitsi", category: "rtc", priority: 3, enabled: true, health_status: "healthy", capabilities: JSON.stringify({ video_call: true, audio_call: true, group_call: true, screen_share: true, max_participants: 100 }), configuration: "{}", created_at: "2026-08-01" },
  { id: "4", provider_id: "webrtc", name: "WebRTC", category: "rtc", priority: 100, enabled: true, health_status: "unknown", capabilities: JSON.stringify({ video_call: true, audio_call: true, group_call: true, screen_share: true, max_participants: 10 }), configuration: "{}", created_at: "2026-08-01" },
];

export default function CommProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>(mockProviders);
  const [showAdd, setShowAdd] = useState(false);
  const [newProvider, setNewProvider] = useState({ provider_id: "", name: "", category: "rtc", priority: 1 });

  const toggleProvider = (id: string) => {
    setProviders(providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const deleteProvider = (id: string) => {
    setProviders(providers.filter(p => p.id !== id));
  };

  return (
    <AdminGate onValidSession={() => {}}>
      <div className="page-container" style={{ minHeight: "100vh", padding: "2rem", background: "linear-gradient(to bottom right, var(--bg-dark), #0f0f16)" }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", padding: "0.4rem 1rem", borderRadius: "2rem", fontSize: "0.9rem", fontWeight: "600", marginBottom: "1rem", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                <Server size={16} />
                Provider Registry
              </div>
              <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#fff", marginBottom: "0.5rem" }}>Communication Providers</h1>
              <p style={{ color: "var(--text-muted)" }}>Manage RTC providers, credentials, and routing priorities</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdd(!showAdd)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
                padding: "0.75rem 1.5rem", borderRadius: "12px", border: "none", cursor: "pointer",
                fontWeight: "600", fontSize: "0.95rem",
              }}
            >
              <Plus size={18} /> Add Provider
            </motion.button>
          </div>

          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(25,25,35,0.4)" }}>
              <h3 style={{ color: "#fff", marginBottom: "1rem" }}>Add New Provider</h3>
              <div style={{ display: "grid", gap: "1rem", maxWidth: "500px" }}>
                <input
                  placeholder="Provider ID (e.g. agora, livekit)"
                  value={newProvider.provider_id}
                  onChange={(e) => setNewProvider({ ...newProvider, provider_id: e.target.value })}
                  style={inputStyle}
                />
                <input
                  placeholder="Display Name"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Priority (lower = higher priority)"
                  value={newProvider.priority}
                  onChange={(e) => setNewProvider({ ...newProvider, priority: parseInt(e.target.value) || 1 })}
                  style={inputStyle}
                />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { if (newProvider.provider_id && newProvider.name) { setProviders([...providers, { id: Date.now().toString(), ...newProvider, enabled: true, health_status: "unknown", capabilities: "{}", configuration: "{}", created_at: new Date().toISOString() }]); setShowAdd(false); setNewProvider({ provider_id: "", name: "", category: "rtc", priority: 1 }); } }} style={{ ...buttonStyle, background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  Save Provider
                </motion.button>
              </div>
            </motion.div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {providers.map((provider, i) => {
              const caps = JSON.parse(provider.capabilities || "{}");
              return (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    background: "rgba(25, 25, 35, 0.4)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Server size={24} color="#818cf8" />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                          <h3 style={{ color: "#fff", fontWeight: "600", fontSize: "1.1rem" }}>{provider.name}</h3>
                          <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "6px", background: provider.enabled ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: provider.enabled ? "#10b981" : "#ef4444", fontWeight: "500" }}>
                            {provider.enabled ? "Enabled" : "Disabled"}
                          </span>
                          <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "6px", background: provider.health_status === "healthy" ? "rgba(16,185,129,0.15)" : provider.health_status === "unknown" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)", color: provider.health_status === "healthy" ? "#10b981" : provider.health_status === "unknown" ? "#f59e0b" : "#ef4444", fontWeight: "500" }}>
                            {provider.health_status}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                          {Object.entries(caps).filter(([k, v]) => v).map(([k]) => (
                            <span key={k} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", padding: "0.15rem 0.5rem", borderRadius: "4px", background: "rgba(255,255,255,0.03)" }}>{k.replace(/_/g, " ")}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Priority: {provider.priority}</span>
                      <button onClick={() => toggleProvider(provider.id)} style={iconButtonStyle}>
                        <RefreshCw size={16} color={provider.enabled ? "#f59e0b" : "#10b981"} />
                      </button>
                      <button onClick={() => deleteProvider(provider.id)} style={iconButtonStyle}>
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AdminGate>
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

const iconButtonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "0.5rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
