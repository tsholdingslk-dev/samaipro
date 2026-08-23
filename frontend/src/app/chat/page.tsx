"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  BrainCircuit, 
  Landmark, 
  Scale, 
  Star, 
  Globe, 
  UploadCloud, 
  Activity, 
  Database, 
  History,
  MessageSquare
} from "lucide-react";

export default function ChatDashboard() {
  const router = useRouter();

  const startSession = (mode: string) => {
    // In the future, we can pass the mode to the backend to set the system prompt
    router.push(`/chat/session?project=ts_brain_${Date.now()}&mode=${mode}`);
  };

  return (
    <div className="page-container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <BrainCircuit size={40} color="var(--primary)" />
            <h1 style={{ fontSize: "2.5rem", margin: 0, background: "linear-gradient(45deg, #fff, var(--primary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              TS-Brain AI
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "1.1rem", maxWidth: "600px" }}>
            Advanced self-learning intelligence engine optimized for Sri Lankan history, culture, administrative languages, and astrology.
          </p>
        </div>

        {/* Live Stats Widget */}
        <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px", padding: "1rem", display: "flex", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>System Status</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981", fontWeight: "600" }}>
              <Activity size={16} /> Online & Learning
            </div>
          </div>
          <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }}></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Knowledge Base</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#eab308", fontWeight: "600" }}>
              <Database size={16} /> 15,243 Indexed
            </div>
          </div>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        
        {/* Left Column: Modes & Upload */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", gridColumn: "1 / -1" }}>
          
          {/* Persona Modes */}
          <section>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BrainCircuit size={20} color="var(--primary)" /> Select Intelligence Mode
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
              
              <motion.div whileHover={{ y: -5 }} onClick={() => startSession('history')} className="glass-panel" style={{ cursor: "pointer", padding: "1.5rem", borderTop: "4px solid #f59e0b" }}>
                <Landmark size={28} color="#f59e0b" style={{ marginBottom: "1rem" }} />
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Historical & Cultural</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>Deep dive into 2000+ years of SL history, heritage, and archaeology.</p>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} onClick={() => startSession('admin')} className="glass-panel" style={{ cursor: "pointer", padding: "1.5rem", borderTop: "4px solid #3b82f6" }}>
                <Scale size={28} color="#3b82f6" style={{ marginBottom: "1rem" }} />
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Admin & Legal Translator</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>Precise translations for formal Sinhala, Tamil, and English legal formats.</p>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} onClick={() => startSession('astrology')} className="glass-panel" style={{ cursor: "pointer", padding: "1.5rem", borderTop: "4px solid #a855f7" }}>
                <Star size={28} color="#a855f7" style={{ marginBottom: "1rem" }} />
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Astrology & Panchangam</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>Planetary transits, horoscope analysis, and traditional predictions.</p>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} onClick={() => startSession('rag_search')} className="glass-panel" style={{ cursor: "pointer", padding: "1.5rem", borderTop: "4px solid #10b981" }}>
                <Globe size={28} color="#10b981" style={{ marginBottom: "1rem" }} />
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Live RAG Search</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>General intelligence, live news crossing, and document retrieval.</p>
              </motion.div>

            </div>
          </section>

          {/* Bottom Row: Feed Brain & History */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
            
            {/* Feed the Brain */}
            <section className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", borderStyle: "dashed", borderWidth: "2px", borderColor: "rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)" }}>
              <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "1rem", borderRadius: "50%", marginBottom: "1rem" }}>
                <UploadCloud size={32} color="#3b82f6" />
              </div>
              <h3 style={{ margin: "0 0 0.5rem 0" }}>Feed the Brain (Memory Vault)</h3>
              <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem 0", fontSize: "0.95rem" }}>
                Upload PDFs, Govt circulars, or documents to instantly index them into the TS-Brain RAG database for future analysis.
              </p>
              <button className="btn-primary" onClick={() => startSession('general')} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <UploadCloud size={18} /> Open Workspace & Upload
              </button>
            </section>

            {/* Recent History */}
            <section className="glass-panel" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", margin: "0 0 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <History size={20} color="var(--primary)" /> Recent Sessions
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { title: "Kandy Kingdom Treaty Analysis", time: "2 hours ago", type: "History" },
                  { title: "Circular 2024/05 Translation", time: "5 hours ago", type: "Admin" },
                  { title: "Guru Peyarchi Palangal 2026", time: "1 day ago", type: "Astrology" }
                ].map((item, i) => (
                  <div key={i} onClick={() => startSession('general')} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"} onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <MessageSquare size={16} color="var(--text-muted)" />
                      <div>
                        <div style={{ fontWeight: "500", fontSize: "0.95rem" }}>{item.title}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{item.type} mode</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{item.time}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <button onClick={() => startSession('general')} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.9rem", fontWeight: "500" }}>
                  View All History →
                </button>
              </div>
            </section>

          </div>

        </div>
      </div>
    </div>
  );
}
