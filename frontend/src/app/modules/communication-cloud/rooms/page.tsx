"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Video, Clock, Users, Trash2 } from "lucide-react";

type Room = {
  id: string;
  room_id: string;
  room_type: string;
  name: string;
  max_participants: number;
  record: boolean;
  status: string;
  created_at: string;
};

const mockRooms: Room[] = [
  { id: "1", room_id: "sam_room_8472", room_type: "video", name: "Team Standup", max_participants: 12, record: true, status: "active", created_at: "2026-08-27" },
  { id: "2", room_id: "sam_room_9912", room_type: "video", name: "Client Demo", max_participants: 5, record: false, status: "active", created_at: "2026-08-26" },
  { id: "3", room_id: "sam_room_1024", room_type: "audio", name: "Podcast Recording", max_participants: 3, record: true, status: "ended", created_at: "2026-08-25" },
];

export default function CommRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [showAdd, setShowAdd] = useState(false);
  const [newRoom, setNewRoom] = useState({ room_id: "", room_type: "video", name: "", max_participants: 10 });

  const createRoom = () => {
    if (!newRoom.room_id) return;
    setRooms([...rooms, { id: Date.now().toString(), ...newRoom, record: false, status: "active", created_at: new Date().toISOString() }]);
    setShowAdd(false);
    setNewRoom({ room_id: "", room_type: "video", name: "", max_participants: 10 });
  };

  return (
    <div className="page-container" style={{ minHeight: "100vh", padding: "2rem", background: "linear-gradient(to bottom right, var(--bg-dark), #0f0f16)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", padding: "0.4rem 1rem", borderRadius: "2rem", fontSize: "0.9rem", fontWeight: "600", marginBottom: "1rem", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
              <Video size={16} />
              Video & Rooms
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#fff", marginBottom: "0.5rem" }}>Communication Rooms</h1>
            <p style={{ color: "var(--text-muted)" }}>Manage video, audio, and group call rooms</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(!showAdd)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
            <Plus size={18} /> Create Room
          </motion.button>
        </div>

        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(25,25,35,0.4)" }}>
            <h3 style={{ color: "#fff", marginBottom: "1rem" }}>Create New Room</h3>
            <div style={{ display: "grid", gap: "1rem", maxWidth: "500px" }}>
              <input placeholder="Room ID" value={newRoom.room_id} onChange={(e) => setNewRoom({ ...newRoom, room_id: e.target.value })} style={inputStyle} />
              <input placeholder="Room Name" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} style={inputStyle} />
              <select value={newRoom.room_type} onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })} style={inputStyle}>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="group">Group Call</option>
              </select>
              <input type="number" placeholder="Max Participants" value={newRoom.max_participants} onChange={(e) => setNewRoom({ ...newRoom, max_participants: parseInt(e.target.value) || 10 })} style={inputStyle} />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={createRoom} style={{ ...buttonStyle, background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                Create Room
              </motion.button>
            </div>
          </motion.div>
        )}

        <div style={{ display: "grid", gap: "1rem" }}>
          {rooms.map((room, i) => (
            <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }} style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(25,25,35,0.4)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: room.room_type === "video" ? "rgba(59,130,246,0.1)" : "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Video size={24} color={room.room_type === "video" ? "#3b82f6" : "#10b981"} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <h3 style={{ color: "#fff", fontWeight: "600" }}>{room.name || room.room_id}</h3>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "6px", background: room.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: room.status === "active" ? "#10b981" : "#f59e0b", fontWeight: "500" }}>
                      {room.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><Video size={14} /> {room.room_type}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><Users size={14} /> {room.max_participants}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><Clock size={14} /> {room.created_at}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {room.record && <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "6px", background: "rgba(239,68,68,0.15)", color: "#ef4444", fontWeight: "500" }}>Recording</span>}
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
