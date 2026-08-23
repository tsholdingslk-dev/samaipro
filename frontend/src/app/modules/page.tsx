"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  MessageSquare, Briefcase, TrendingUp, Cpu, 
  Terminal, Image as ImageIcon, Mic, FileText, 
  Share2, Brain, Newspaper, BookOpen, MonitorPlay, 
  Network, KeyRound, Database, Activity 
} from "lucide-react";

type Module = {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
};

const modules: Module[] = [
  { id: "chat", title: "AI Chat Workspace", description: "Core conversational AI workspace with multi-file analysis & memory.", icon: MessageSquare, href: "/chat", color: "#3b82f6" },
  { id: "lead-gen", title: "Lead Generation", description: "Extract local business leads, auto-create demo sites & WhatsApp proposals.", icon: Briefcase, href: "/modules/lead-gen", color: "#ec4899" },
  { id: "crypto", title: "Crypto Market Research", description: "Real-time prices, 24h gainers/losers, crash risk prediction & AI coin research.", icon: TrendingUp, href: "/modules/crypto", color: "#f59e0b" },
  { id: "agents", title: "Autonomous AI Agents", description: "Plan, research, code, and execute multi-step tasks automatically.", icon: Cpu, href: "/modules/agents", color: "#8b5cf6" },
  { id: "coding", title: "SAM Coder Studio", description: "Generate code, explain logic, fix bugs, and execute live in the sandbox.", icon: Terminal, href: "/modules/coding", color: "#10b981" },
  { id: "image", title: "AI Image Studio", description: "Generate prompts, edit images, resize, apply filters, and overlays.", icon: ImageIcon, href: "/modules/image", color: "#a855f7" },
  { id: "voice", title: "Voice Workspace", description: "Transcribe audio files, voice commands, and text-to-speech support.", icon: Mic, href: "/modules/voice", color: "#f97316" },
  { id: "pdf-translate", title: "PDF & Translation Engine", description: "Extract text from PDFs. Translate between Tamil, Sinhala, English.", icon: FileText, href: "/modules/pdf-translate", color: "#06b6d4" },
  { id: "media", title: "Media & Content Studio", description: "Social media prompts, image/video generation prompts, resize guides.", icon: Share2, href: "/modules/media", color: "#ef4444" },
  { id: "learning", title: "Self Learning AI Brain", description: "SAM AI learns from your feedback and adapts to your personal style.", icon: Brain, href: "/modules/learning", color: "#10b981" },
  { id: "social-news", title: "NewsFlash Elite Editor", description: "Create viral, fact-checked Facebook posts and analyze reference images.", icon: Newspaper, href: "/modules/social-news", color: "#3b82f6" },
  { id: "docs", title: "API Documentation", description: "Complete API reference with endpoints, SDK examples, and live Try-It runner.", icon: BookOpen, href: "/docs", color: "#6366f1" },
  { id: "demo", title: "Instant Web Preview", description: "Instant client website preview studio with live appointment booking.", icon: MonitorPlay, href: "/demo/default", color: "#14b8a6" },
  { id: "api-hub", title: "Multi-API Provider Hub", description: "Auto-failover AI model rotator across Gemini, Groq, OpenRouter & Pollinations.", icon: Network, href: "/modules/api-hub", color: "#3b82f6" },
  { id: "auto-integrator", title: "Auto API Integrator", description: "Dynamically test and register new AI API keys without touching backend code.", icon: KeyRound, href: "/modules/auto-integrator", color: "#eab308" },
  { id: "project-memory", title: "Project Memory Storage", description: "Persistent workspace memory for files, code snippets, and logs.", icon: Database, href: "/modules/project-memory", color: "#64748b" },
  { id: "ai-intelligence", title: "24/7 System Intelligence", description: "AI market monitoring, performance diagnostics, and automated admin digests.", icon: Activity, href: "/modules/ai-intelligence", color: "#f43f5e" }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ModulesPage() {
  const router = useRouter();

  return (
    <div className="page-container" style={{ minHeight: "100vh", padding: "4rem 2rem", background: "linear-gradient(to bottom right, var(--bg-dark), #0f0f16)" }}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ display: "inline-block", background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", padding: "0.4rem 1rem", borderRadius: "2rem", fontSize: "0.9rem", fontWeight: "600", marginBottom: "1rem", border: "1px solid rgba(99, 102, 241, 0.2)" }}
          >
            SAM AI v2.0 Platform
          </motion.div>
          <h1 style={{ fontSize: "3rem", fontWeight: "700", marginBottom: "1rem", background: "linear-gradient(to right, #fff, #9ca3af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SAM AI 16 Core Modules
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto" }}>
            Explore the intelligent ecosystem powering your ultimate workflow.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem"
          }}
        >
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link href={mod.href} key={mod.id} style={{ textDecoration: "none" }}>
                <motion.div
                  variants={itemVariants}
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
                    overflow: "hidden"
                  }}
                >
                  <div style={{ position: "absolute", top: 0, right: 0, width: "150px", height: "150px", background: `radial-gradient(circle, ${mod.color}15 0%, transparent 70%)`, transform: "translate(30%, -30%)", pointerEvents: "none" }} />
                  
                  <div>
                    <div style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "16px",
                      background: `linear-gradient(135deg, ${mod.color}33, ${mod.color}11)`,
                      border: `1px solid ${mod.color}33`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.5rem",
                      boxShadow: `0 8px 16px -4px ${mod.color}22`
                    }}>
                      <Icon size={28} color={mod.color} strokeWidth={1.5} />
                    </div>
                    <h3 style={{
                      fontSize: "1.25rem",
                      marginBottom: "0.75rem",
                      color: "#fff",
                      fontWeight: "600",
                      letterSpacing: "-0.01em"
                    }}>
                      {mod.title}
                    </h3>
                    <p style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: "0.95rem",
                      lineHeight: "1.6"
                    }}>
                      {mod.description}
                    </p>
                  </div>

                  <div style={{
                    marginTop: "2rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: mod.color,
                    fontSize: "0.9rem",
                    fontWeight: "600"
                  }}>
                    Open Module 
                    <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                      →
                    </motion.span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1, duration: 0.8 }}
          style={{ marginTop: "4rem", textAlign: "center" }}
        >
          <Link href="/chat" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "0.75rem 1.5rem",
            borderRadius: "99px",
            color: "#fff",
            textDecoration: "none",
            fontWeight: "500",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
          >
            <MessageSquare size={18} />
            Back to Chat Workspace
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
