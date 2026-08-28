"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Users, Play, Square, Trash2 } from "lucide-react";

type Meeting = {
  id: string;
  meeting_id: string;
  title: string;
  status: string;
  participant_count: number;
  max_participants: number;
  record: boolean;
  created_at: string;
};

const mockMeetings: Meeting[] = [
  { id: "1", meeting_id: "sam_meet_001", title: "Weekly All-Hands", status: "scheduled", participant_count: 0, max_participants: 100, record: true, created_at: "2026-08-27" },
  { id: "2", meeting_id: "sam_meet_002", title: "Product Review", status: "active", participant_count: 8, max_participants: 20, record: false, created_at: "2026-08-27" },
];

export default function CommMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [showAdd, setShowAdd] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ meeting_id: "", title: "", max_participants: 50, password: "", record: false });

  const createMeeting = () => {
    if (!newMeeting.meeting_id || !newMeeting.title) return;
    setMeetings([...meetings, { id: Date.now().toString(), ...newMeeting, status: "scheduled", participant_count: 0, created_at: new Date().toISOString() }]);
    setShowAdd(false);
    setNewMeeting({ meeting_id: "", title: "", max_participants: 50, password: "", record: false });
  };

  return (
    <div className="page-container" style={{ minHeight: "100vh", padding: "2rem", background: "linear-gradient(to bottom right, var(--bg-dark), #0f0f16)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", padding: "0.4rem 1rem", borderRadius: "2rem", fontSize: "0.9rem", fontWeight: "600", marginBottom: "1rem", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
              <Calendar size={16} />
              Zoom-Style Meetings
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#fff", marginBottom: "0.5rem" }}>Meetings</h1>
            <p style={{ color: "var(--text-muted)" }}>Schedule, manage, and join video meetings</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(!showAdd)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
            <Plus size={18} /> Schedule Meeting
          </motion.button>
        </div>

        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(25,25,35,0.4)" }}>
            <h3 style={{ color: "#fff", marginBottom: "1rem" }}>Schedule New Meeting</h3>
            <div style={{ display: "grid", gap: "1rem", maxWidth: "500px" }}>
              <input placeholder="Meeting ID" value={newMeeting.meeting_id} onChange={(e) => setNewMeeting({ ...newMeeting, meeting_id: e.target.value })} style={inputStyle} />
              <input placeholder="Title" value={newMeeting.title} onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })} style={inputStyle} />
              <input type="password" placeholder="Password (optional)" value={newMeeting.password} onChange={(e) => setNewMeeting({ ...newMeeting, password: e.target.value })} style={inputStyle} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="checkbox" id="record" checked={newMeeting.record} onChange={(e) => setNewMeeting({ ...newMeeting, record: e.target.checked })} />
                <label htmlFor="record" style={{ color: "#fff", fontSize: "0.95rem" }}>Enable recording</label>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={createMeeting} style={{ ...buttonStyle, background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                Schedule Meeting
              </motion.button>
            </div>
          </motion.div>
        )}

        <div style={{ display: "grid", gap: "1rem" }}>
          {meetings.map((meeting, i) => (
            <motion.div key={meeting.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }} style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(25,25,35,0.4)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Calendar size={24} color="#8b5cf6" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <h3 style={{ color: "#fff", fontWeight: "600" }}>{meeting.title}</h3>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "6px", background: meeting.status === "active" ? "rgba(16,185,129,0.15)" : meeting.status === "scheduled" ? "rgba(59,130,246,0.15)" : "rgba(245,158,11,0.15)", color: meeting.status === "active" ? "#10b981" : meeting.status === "scheduled" ? "#3b82f6" : "#f59e0b", fontWeight: "500" }}>
                      {meeting.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><Users size={14} /> {meeting.participant_count}/{meeting.max_participants}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>ID: {meeting.meeting_id}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>{meeting.created_at}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {meeting.status === "scheduled" && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ ...actionBtn, background: "rgba(16,185,129,0.1)" }}><Play size={16} color="#10b981" /></motion.button>
                )}
                {meeting.status === "active" && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ ...actionBtn, background: "rgba(239,68,68,0.1)" }}><Square size={16} color="#ef4444" /></motion.button>
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
