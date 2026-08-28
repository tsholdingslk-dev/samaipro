"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Video, Server, Calendar, Play, Key, BookOpen, Code } from "lucide-react";

type SubModule = {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
};

const subModules: SubModule[] = [
  { title: "Dashboard", description: "Overview of active calls, rooms, meetings, and provider health.", href: "/modules/communication-cloud", icon: Video, color: "#6366f1" },
  { title: "Providers", description: "Manage Agora, LiveKit, Jitsi, WebRTC adapters and routing.", href: "/modules/communication-cloud/providers", icon: Server, color: "#8b5cf6" },
  { title: "Rooms", description: "Create and manage video, audio, and group call rooms.", href: "/modules/communication-cloud/rooms", icon: Video, color: "#3b82f6" },
  { title: "Meetings", description: "Schedule Zoom-style meetings with recording and chat.", href: "/modules/communication-cloud/meetings", icon: Calendar, color: "#10b981" },
  { title: "Recordings", description: "View, download, and manage call and meeting recordings.", href: "/modules/communication-cloud/recordings", icon: Play, color: "#ef4444" },
  { title: "API Keys", description: "Generate and manage communication API keys and tokens.", href: "/modules/communication-cloud/api-keys", icon: Key, color: "#f59e0b" },
  { title: "Documentation", description: "API reference, SDK examples, and quick start guide.", href: "/docs", icon: BookOpen, color: "#14b8a6" },
  { title: "Playground", description: "Interactive API testing with code generation.", href: "/docs", icon: Code, color: "#ec4899" },
];

export default function CommunicationCloudPage() {
  return (
    <div className="page-container" style={{ minHeight: "100vh", padding: "2rem", background: "linear-gradient(to bottom right, var(--bg-dark), #0f0f16)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", padding: "0.4rem 1rem", borderRadius: "2rem", fontSize: "0.9rem", fontWeight: "600", marginBottom: "1rem", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
            SAM Unified Communication API
          </div>
          <h1 style={{ fontSize: "3rem", fontWeight: "700", marginBottom: "1rem", background: "linear-gradient(to right, #fff, #9ca3af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SAM Communication Cloud
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto" }}>
            One API. Multiple providers. Automatic routing and failover for all your realtime communication needs.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {subModules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <Link href={mod.href} key={mod.title} style={{ textDecoration: "none" }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02, boxShadow: `0 20px 40px -10px ${mod.color}40` }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "2rem",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    background: "rgba(25, 25, 35, 0.4)",
                    backdropFilter: "blur(10px)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ position: "absolute", top: 0, right: 0, width: "150px", height: "150px", background: `radial-gradient(circle, ${mod.color}15 0%, transparent 70%)`, transform: "translate(30%, -30%)", pointerEvents: "none" }} />

                  <div>
                    <div style={{
                      width: "60px", height: "60px", borderRadius: "16px",
                      background: `linear-gradient(135deg, ${mod.color}33, ${mod.color}11)`,
                      border: `1px solid ${mod.color}33`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: "1.5rem",
                      boxShadow: `0 8px 16px -4px ${mod.color}22`
                    }}>
                      <Icon size={28} color={mod.color} strokeWidth={1.5} />
                    </div>
                    <h3 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", color: "#fff", fontWeight: "600", letterSpacing: "-0.01em" }}>
                      {mod.title}
                    </h3>
                    <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                      {mod.description}
                    </p>
                  </div>

                  <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", color: mod.color, fontSize: "0.9rem", fontWeight: "600" }}>
                    Open
                    <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}> →</motion.span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
