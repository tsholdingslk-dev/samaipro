"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Square, Download, Trash2, Clock, HardDrive } from "lucide-react";

type Recording = {
  id: string;
  recording_id: string;
  provider: string;
  status: string;
  duration: number;
  file_url: string | null;
  size_bytes: number;
  created_at: string;
};

const mockRecordings: Recording[] = [
  { id: "1", recording_id: "rec_8472_a", provider: "agora", status: "completed", duration: 1845, file_url: "https://storage.sam.ai/recordings/rec_8472_a.mp4", size_bytes: 524288000, created_at: "2026-08-27" },
  { id: "2", recording_id: "rec_9912_b", provider: "livekit", status: "processing", duration: 0, file_url: null, size_bytes: 0, created_at: "2026-08-27" },
];

export default function CommRecordingsPage() {
  const [recordings] = useState<Recording[]>(mockRecordings);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="page-container" style={{ minHeight: "100vh", padding: "2rem", background: "linear-gradient(to bottom right, var(--bg-dark), #0f0f16)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", padding: "0.4rem 1rem", borderRadius: "2rem", fontSize: "0.9rem", fontWeight: "600", marginBottom: "1rem", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
            <Play size={16} />
            Recordings
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#fff", marginBottom: "0.5rem" }}>Recordings</h1>
          <p style={{ color: "var(--text-muted)" }}>Manage room and meeting recordings</p>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          {recordings.map((rec, i) => (
            <motion.div key={rec.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }} style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(25,25,35,0.4)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: rec.status === "completed" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Play size={24} color={rec.status === "completed" ? "#ef4444" : "#f59e0b"} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <h3 style={{ color: "#fff", fontWeight: "600" }}>{rec.recording_id}</h3>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "6px", background: rec.status === "completed" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: rec.status === "completed" ? "#10b981" : "#f59e0b", fontWeight: "500" }}>
                      {rec.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><Clock size={14} /> {formatDuration(rec.duration)}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><HardDrive size={14} /> {formatBytes(rec.size_bytes)}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>{rec.provider}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {rec.file_url && (
                  <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={rec.file_url} target="_blank" rel="noopener noreferrer" style={{ ...actionBtn, background: "rgba(59,130,246,0.1)", textDecoration: "none" }} title="Download">
                    <Download size={16} color="#3b82f6" />
                  </motion.a>
                )}
                <button style={iconBtn}><Trash2 size={16} color="#ef4444" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  padding: "0.5rem",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
